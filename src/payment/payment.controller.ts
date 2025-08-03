import { Request, Response } from "express";
import Stripe from "stripe";
import {
  createCheckoutSessionService,
  createPaymentRecordService,
  getAllPaymentsService,
  getPaymentByIdService,
  getPaymentsByAppointmentService,
  updatePaymentStatusService,
  checkPaymentStatusByAppointmentIdService
} from "./payment.service";
import { getAppointmentByIdService } from "../appointment/appointment.service";
import { initiateMpesaStkPushService } from "./payment.service";

//------------------MPESA-----------------

interface CallbackRequest extends Request<{ appointmentId: string }> {}

function convertMpesaDate(mpesaDate: number): Date {
  const dateStr = mpesaDate.toString();
  const year = parseInt(dateStr.substring(0, 4));
  const month = parseInt(dateStr.substring(4, 6)) - 1;
  const day = parseInt(dateStr.substring(6, 8));
  const hour = parseInt(dateStr.substring(8, 10));
  const minute = parseInt(dateStr.substring(10, 12));
  const second = parseInt(dateStr.substring(12, 14));
  return new Date(Date.UTC(year, month, day, hour, minute, second));
}

// Trigger M-Pesa STK Push
export const initiateMpesaPaymentController = async (req: Request, res: Response) => {
  try {
    const { appointmentId, phone } = req.body;
    if (!appointmentId || !phone) {
      return res.status(400).json({ message: "appointmentId and phone are required" });
    }

    // Mark payment as "Pending" before STK push
    await createPaymentRecordService({
      appointmentId,
      amount: '0',
      paymentMethod: "M-Pesa",
      paymentStatus: "Pending",
      transactionId: "",
      paymentDate: new Date(),
    });

    const result = await initiateMpesaStkPushService(appointmentId, phone);
    console.log("STK Push Initiated Successfully:", result);

    return res.status(200).json({ message: "STK Push initiated", data: result });
  } catch (error: any) {
    console.error("M-PESA STK Push Error:");
    if (error.response) {
      // Axios error with response from M-Pesa
      console.error("Error Status:", error.response.status);
      console.error("Error Data:", error.response.data);
      console.error("Error Headers:", error.response.headers);
    } else {
      // Any other kind of error (network, logic, etc.)
      console.error("Error Message:", error.message);
    }

    return res.status(500).json({ error: error.message });
  }
};

export const mpesaCallbackController = async (req: CallbackRequest, res: Response) => {
  const appointmentId = parseInt(req.params.appointmentId, 10);

  if (isNaN(appointmentId)) {
    return res.status(400).json({ message: "Invalid appointment ID" });
  }

  try {
    console.log("M-PESA Callback Received");
    const body = req.body;
    console.log("Callback Raw Body:", JSON.stringify(body, null, 2));

    const callback = body?.Body?.stkCallback;

    if (!callback) {
      console.warn("Invalid callback format: 'stkCallback' not found");
      return res.status(400).json({ message: "Invalid callback format" });
    }

    const resultCode = callback?.ResultCode;
    const metadataItems = callback?.CallbackMetadata?.Item as { Name: string; Value: any }[] || [];

    console.log("Parsed Callback:", { resultCode, metadataItems });

    const transactionId = metadataItems.find(item => item.Name === "MpesaReceiptNumber")?.Value;
    const amount = metadataItems.find(item => item.Name === "Amount")?.Value;
    const dateVal = metadataItems.find(item => item.Name === "TransactionDate")?.Value;

    if (resultCode === 0) {
      if (!transactionId) {
        return res.status(400).json({ message: "Missing transaction ID in callback" });
      }

      console.log("Payment Success Detected");
      console.log("Transaction ID:", transactionId);
      console.log("Amount:", amount);

      await updatePaymentStatusService({
        appointmentId,
        transactionId,
        amount: Number(amount).toFixed(2),
        paymentStatus: "Paid",
        paymentDate: convertMpesaDate(dateVal),
      });

      console.log("Payment status updated in DB (Success)");
    } else {
      console.warn("M-PESA payment failed or cancelled");
      console.warn("ResultCode:", resultCode);

      await updatePaymentStatusService({
        appointmentId,
        paymentStatus: "Failed",
        paymentDate: new Date(),
      });

      console.log("Payment status updated in DB (Failure)");
    }

    return res.status(200).json({ message: "Callback received" });
  } catch (error: any) {
    console.error("M-PESA Callback Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};


//--------------------------STRIPE------------------------

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
      console.log(`Here is the appointment ID --->>>${appointmentId}`)
      const amountPaid = (session.amount_total || 0) / 100; // KES is 0-decimal currency
      console.log(`Here is the amount_total --->>>${session.amount_total }`)
      const transactionId = session.payment_intent as string;
      console.log(`Here is the payment_intent --->>>${session.payment_intent}`)

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
        paymentMethod: "Stripe",
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

//----------------------------------------------------------------

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

// Check Payment Status by Appointment ID
export const checkPaymentStatusByAppointmentIdController = async (req: Request, res: Response) => {
  try {
    const appointmentId = parseInt(req.params.appointmentId);
    if (isNaN(appointmentId)) {
      return res.status(400).json({ message: "Invalid appointment ID" });
    }

    const isPaid = await checkPaymentStatusByAppointmentIdService(appointmentId);
    
    return res.status(200).json({ data: isPaid });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};