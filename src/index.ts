import 'dotenv/config';
// 1. DATADOG FIRST (Must be absolute top for auto-instrumentation)
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
const { Resource } = require('@opentelemetry/resources');

// Use the new package for attributes to avoid deprecation warnings
import {
  ATTR_SERVICE_NAME,
  SEMRESATTRS_DEPLOYMENT_ENVIRONMENT,
} from '@opentelemetry/semantic-conventions';

const api_key: string = process.env.DD_API_KEY || '';

const sdk = new NodeSDK({
  resource: new Resource({
    [ATTR_SERVICE_NAME]: process.env.DD_SERVICE || 'careconnect-backend',
    [SEMRESATTRS_DEPLOYMENT_ENVIRONMENT]: process.env.DD_ENV || 'production',
  }),
  traceExporter: new OTLPTraceExporter({
    url: process.env.DD_TRACE_AGENT_URL,
    headers: {
      'dd-api-key': api_key,
    },
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

try {
  sdk.start();
  console.log('OpenTelemetry SDK started successfully');
} catch (error) {
  console.error('Error starting OpenTelemetry SDK', error);
}
process.on('SIGTERM', async () => {
  await sdk.shutdown();
  console.log('OpenTelemetry SDK shut down gracefully');
  process.exit(0);
});

// 2. SENTRY SECOND
// MUST be the first import. Why js even though the file is ts?
// Since you are using "module": "NodeNext", TypeScript requires you to import
// using the extension that will exist in the final build. i.e instrument.js
import './instrument.js';
import './types/global.types';
import express from 'express';
import cors from 'cors';
import * as Sentry from '@sentry/node';

import user from './auth/auth.router';
import doctor from './doctor/doctor.router';
import appointment from './appointment/appointment.router';
import prescription from './prescription/prescription.router';
import complaint from './complaint/complaint.router';
import payment from './payment/payment.router';
import aiAssistant from './gemini/geminiAI.router';
import { stripeWebhookController } from './payment/payment.controller';
import service from './service/service.router';

const initializeApp = () => {
  const app = express();

  // Stripe webhook must come before express.json()
  app.post(
    '/payment/webhook',
    express.raw({ type: 'application/json' }),
    async (req, res, next) => {
      try {
        await stripeWebhookController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // General middlewares
  app.use(express.json()); // Used to parse JSON bodies
  app.use(
    cors({
      origin: [
        'http://localhost:5173', // for local dev
        'https://care-connect-frontend.vercel.app', // main production domain
        'https://care-connect-frontend-git-master-susan-kananas-projects.vercel.app', // Vercel preview link
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    })
  );
  app.use('/images', express.static('images'));

  // Routes
  user(app);
  doctor(app);
  appointment(app);
  prescription(app);
  complaint(app);
  payment(app);
  service(app);

  aiAssistant(app); //aiAssistant function is a route configurator that takes your Express app instance (app) as an argument and then sets up a new route on it.

  app.get('/', (_req, res) => {
    res.send('Hello, World!');
  });

  // --- SENTRY VERIFICATION ROUTE ---
  app.get('/debug-sentry', (req, res) => {
    throw new Error('My first Sentry error!');
  });

  // --- SENTRY ERROR HANDLING (MUST be after routes) ---
  // Sentry needs to be registered here to catch errors from the routes above
  Sentry.setupExpressErrorHandler(app);

  // Custom fallthrough error handler
  app.use((err: any, req: any, res: any, next: any) => {
    // Log the error ID to the console local debugging
    console.error(`[Sentry Error ID]: ${res.sentry}`);

    res.status(500).json({
      success: false,
      message: 'Oops! Something went wrong on our end.',
      instruction: 'Please try again in a few moments or contact support if the issue persists.',
      errorId: res.sentry, // Giving the user a reference ID makes them feel "heard"
    });
  });

  return app;
};

const app = initializeApp();
export default app;
