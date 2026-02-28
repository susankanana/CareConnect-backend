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
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.DEBUG);
import * as Sentry from "@sentry/node";
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { SimpleSpanProcessor } from '@opentelemetry/sdk-trace-base';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  sendDefaultPii: true,
  tracesSampleRate: 1.0,
  
  // This is the official "bridge" for Sentry 10+
  openTelemetrySpanProcessors: [
    new SimpleSpanProcessor(
      new OTLPTraceExporter({
        url: 'https://otlp-http.us5.datadoghq.com/v1/traces',
        headers: {
          'DD-API-KEY': process.env.DD_API_KEY || '',
        },
      })
    ),
  ],
});