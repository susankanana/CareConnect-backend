import './types/global.types';
import express from 'express';
import cors from 'cors';

import user from './auth/auth.router';
import doctor from './doctor/doctor.router';
import appointment from './appointment/appointment.router';
import prescription from './prescription/prescription.router';
import complaint from './complaint/complaint.router';
import payment from './payment/payment.router';
import { stripeWebhookController } from './payment/payment.controller';

const initializeApp = () => {
  const app = express();

  // Stripe webhook must come before express.json()
  app.post(
    "/payment/webhook",
    express.raw({ type: "application/json" }),
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
  app.use(cors({
   origin: [
    "http://localhost:5173", // for local dev
    "https://care-connect-frontend.vercel.app", // main production domain
    "https://care-connect-frontend-git-master-susan-kananas-projects.vercel.app" // Vercel preview link
  ],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"]
  }));
  app.use("/images", express.static("images"));

  // Routes
  user(app);
  doctor(app);
  appointment(app);
  prescription(app);
  complaint(app);
  payment(app);

  app.get('/', (_req, res) => {
    res.send('Hello, World!');
  });

  return app;
};

const app = initializeApp();
export default app;
