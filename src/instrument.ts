// import 'dotenv/config';
// import * as Sentry from "@sentry/node";

// Sentry.init({
//   dsn: process.env.SENTRY_DSN,
//   // Setting this option to true will send default PII data to Sentry.
//   sendDefaultPii: true,
//   // Ensure tracesSampleRate is set for performance monitoring
//   tracesSampleRate: 1.0,
// });

import 'dotenv/config';
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import * as Sentry from '@sentry/node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,

  // 1. THIS IS THE FIX FOR OLD SENTRY INSIGHTS
  // Without this, Sentry 10 ignores all your Express routes.
  integrations: [Sentry.expressIntegration()],

  openTelemetrySpanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: 'https://api.us5.datadoghq.com/api/v2/otlp',
        headers: {
          'DD-API-KEY': process.env.DD_API_KEY || '',
          // This header is the 'Missing Step' for many agentless setups
          'dd-protocol': 'otlp',
        },
      })
    ),
  ],
});
