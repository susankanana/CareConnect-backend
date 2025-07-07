import { Request, Response } from "express";
import Stripe from "stripe";
import {
  createCheckoutSessionService,
  createPaymentRecordService,
  getAllPaymentsService,
  getPaymentByIdService,
  getPaymentsByAppointmentService,
  updatePaymentStatusService
} from "./payment.service";
import { getAppointmentByIdService } from "../appointment/appointment.service";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Stripe Webhook
export const stripeWebhookController = async (req: Request, res: Response) => {
  try {
    const sig = req.headers["stripe-signature"]!;
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;

      const appointmentId = parseInt(session.metadata?.appointmentId || "0");
      const amountPaid = (session.amount_total || 0) / 100; // KES is 0-decimal currency
      const transactionId = session.payment_intent as string;

      // Fetch the appointment to verify expected amount
      const appointment = await getAppointmentByIdService(appointmentId);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      const expectedAmount = Number(appointment.totalAmount);
      if (isNaN(expectedAmount) || expectedAmount <= 0) {
        return res.status(400).json({ message: "Invalid expected amount for appointment" });
      }

      // Verify amount paid matches the expected appointment amount
      if (amountPaid !== expectedAmount) {
        return res.status(400).json({
          message: `Payment amount mismatch. Expected ${expectedAmount}, received ${amountPaid}`,
        });
      }

      // Save the payment
      await createPaymentRecordService({
        appointmentId,
        amount: amountPaid.toFixed(2),
        paymentStatus: "Paid",
        transactionId,
        paymentDate: new Date(),
      });

      console.log("Payment saved to DB for appointment:", appointmentId);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error.message);
    return res.status(400).json({ error: "Webhook Error: " + error.message });
  }
};


// Create Stripe Checkout Session
export const createCheckoutSessionController = async (req: Request, res: Response) => {
  try {
    const { appointmentId } = req.body;

    if (!appointmentId) {
      return res.status(400).json({ message: "appointmentId is required" });
    }

    const url = await createCheckoutSessionService(appointmentId);
    return res.status(200).json({ url });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


// Get All Payments
export const getAllPaymentsController = async (_req: Request, res: Response) => {
  try {
    const payments = await getAllPaymentsService();

    if (!payments || payments.length === 0) {
      return res.status(404).json({ message: "No payments found" });
    }

    return res.status(200).json({ data: payments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get Payment by ID
export const getPaymentByIdController = async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    if (isNaN(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const payment = await getPaymentByIdService(paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    return res.status(200).json({ data: payment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get Payments by Appointment ID
export const getPaymentsByAppointmentController = async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const payments = await getPaymentsByAppointmentService(appointmentId);
    return res.status(200).json({ data: payments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update Payment Status
export const updatePaymentStatusController = async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { status } = req.body;

    if (!status || typeof status !== "string") {
      return res.status(400).json({ message: "Invalid or missing status" });
    }

    if (isNaN(paymentId)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const updated = await updatePaymentStatusService(paymentId, status);
    return res.status(200).json({ message: "Payment status updated", data: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
