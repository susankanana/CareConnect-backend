import 'dotenv/config';
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Setting this option to true will send default PII data to Sentry.
  sendDefaultPii: true,
  // Ensure tracesSampleRate is set for performance monitoring
  tracesSampleRate: 1.0, 
});