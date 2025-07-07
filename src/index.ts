import './types/global.types';
import express from 'express';
import user from './auth/auth.router';
import doctor from './doctor/doctor.router';
import appointment from './appointment/appointment.router';
import prescription from './prescription/prescription.router';
import complaint from './complaint/complaint.router';
import payment from './payment/payment.router';
import { stripeWebhookController } from './payment/payment.controller'; 

const app = express();

// Stripe webhook needs raw body. So whenever a request is made to /payment/webhook, parse the request body as raw bytes, not as JSON
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

app.use(express.json()); //used to parse JSON bodies
app.use("/images", express.static("images"));

// routes
user(app);
doctor(app);
appointment(app);
prescription(app);
complaint(app);
payment(app);


app.get('/', (req, res) => {
    res.send('Hello, World!');
})

app.listen(8081, () => {
    console.log('Server is running on http://localhost:8081');
}) 