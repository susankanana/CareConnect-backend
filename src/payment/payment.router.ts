import { Express } from "express";
import {
  createCheckoutSessionController,
  getAllPaymentsController,
  getPaymentByIdController,
  getPaymentsByAppointmentController,
  updatePaymentStatusController
} from "./payment.controller";

import {
  adminRoleAuth,
  userRoleAuth,
  allRoleAuth
} from "../middleware/bearerAuth";

const payment = (app: Express) => {
  // Create Stripe Checkout Session (user only)
  app.route("/payment/checkout-session").post(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await createCheckoutSessionController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Stripe webhook (no auth, uses raw body middleware)
  // A webhook is a URL that Stripe sends event data (like checkout.session.completed) to. It uses an HTTP POST request to your server when an event happens.
//   app.post( 
//     "/payment/webhook",
//     express.raw({ type: "application/json" }),
//     async (req, res, next) => {
//       try {
//         await stripeWebhookController(req, res);
//       } catch (error: any) {
//         next(error);
//       }
//     }
//   );

  // Get all payments (admin only)
  app.route("/payments").get(
    allRoleAuth,
    async (req, res, next) => {
      try {
        await getAllPaymentsController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get payment by ID (admin, doctor, user)
  app.route("/payment/:id").get(
    allRoleAuth,
    async (req, res, next) => {
      try {
        await getPaymentByIdController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get payments by appointment ID (user only)
  app.route("/payments/appointment/:appointmentId").get(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await getPaymentsByAppointmentController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Update payment status (admin only)
  app.route("/payment/status/:id").patch(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await updatePaymentStatusController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );
};

export default payment;
