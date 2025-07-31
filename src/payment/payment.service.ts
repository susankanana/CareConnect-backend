import { eq } from "drizzle-orm";
import Stripe from "stripe";
import db from "../drizzle/db";
import { PaymentsTable, TIPayment, AppointmentsTable } from "../drizzle/schema";

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Create a Stripe Checkout Session
export const createCheckoutSessionService = async (appointmentId: number) => {
  // Fetch the correct appointment
  const appointment = await db.query.AppointmentsTable.findFirst({
    where: eq(AppointmentsTable.appointmentId, appointmentId),
  });

  if (!appointment) throw new Error("Appointment not found");

  const amount =  Number(appointment.totalAmount);
  if (!amount || amount <= 0) throw new Error("Invalid appointment amount");

  // Create session with correct amount
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "kes",
          product_data: {
            name: "Hospital Appointment",
            images: ["https://images.pexels.com/photos/5207102/pexels-photo-5207102.jpeg"]
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      appointmentId: appointmentId.toString(),
    },
    success_url: `${process.env.CLIENT_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/payment-cancelled`,
  });

  return session.url;
};


// Save payment record (after successful webhook or frontend confirmation)
export const createPaymentRecordService = async (payment: TIPayment) => {
  const [created] = await db.insert(PaymentsTable).values(payment).returning();
  return created;
};

// Get all payments
export const getAllPaymentsService = async () => {
  return await db.select().from(PaymentsTable);
};

// Get payment by ID
export const getPaymentByIdService = async (paymentId: number) => {
  const payment = await db.query.PaymentsTable.findFirst({
    where: eq(PaymentsTable.paymentId, paymentId),
  });
  return payment;
};

// Get payments by appointment ID
export const getPaymentsByAppointmentService = async (appointmentId: number) => {
  return await db.query.PaymentsTable.findMany({
    where: eq(PaymentsTable.appointmentId, appointmentId),
  });
};

// Update payment status (e.g., after confirmation via webhook)
export const updatePaymentStatusService = async (
  paymentId: number,
  status: string
) => {
  const [updated] = await db
    .update(PaymentsTable)
    .set({ paymentStatus: status })
    .where(eq(PaymentsTable.paymentId, paymentId))
    .returning();

  if (!updated) {
    throw new Error("Payment not found or status update failed.");
  }

  return updated;
};
