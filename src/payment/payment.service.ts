import { eq } from "drizzle-orm";
import Stripe from "stripe";
import db from "../drizzle/db";
import { PaymentsTable, TIPayment, AppointmentsTable } from "../drizzle/schema";
import axios from "axios"; //used with mpesa

//----------------------------MPESA---------------------

const mpesaBaseUrl = "https://sandbox.safaricom.co.ke";
const consumerKey = process.env.MPESA_CONSUMER_KEY!;
const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
const shortCode = process.env.MPESA_SHORTCODE!; // e.g., 174379 (sandbox)
const passkey = process.env.MPESA_PASSKEY!;
const callbackUrl = `${process.env.SERVER_URL}/api/payment/mpesa/callback`;

const getMpesaAccessToken = async () => {
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString("base64");
  const res = await axios.get(`${mpesaBaseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${auth}`,
    },
  });
  return res.data.access_token;
};

export const initiateMpesaStkPushService = async (appointmentId: number, phone: string) => {

  console.log("🛠 initiateMpesaStkPushService CALLED");

  try{
    const appointment = await db.query.AppointmentsTable.findFirst({
    where: eq(AppointmentsTable.appointmentId, appointmentId),
    });

    if (!appointment) throw new Error("Appointment not found");
    const amount = Number(appointment.totalAmount);
    if (!amount || amount <= 0) throw new Error("Invalid amount");

    const token = await getMpesaAccessToken();
    console.log("🔐 Got Access Token");

    const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14);
    const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString("base64");

    const payload = {
      BusinessShortCode: shortCode,
      Password: password,
      Timestamp: timestamp,
      TransactionType: "CustomerPayBillOnline",
      Amount: 1,  //should pass amount but I'll use 1sh for testing
      PartyA: phone,
      PartyB: shortCode,
      PhoneNumber: phone,
      CallBackURL: callbackUrl,
      AccountReference: `CareConnect-${appointmentId}`,
      TransactionDesc: "CareConnect Appointment Payment",
    };
    console.log("🚀 STK Payload:", payload);
    const response = await axios.post(
      `${mpesaBaseUrl}/mpesa/stkpush/v1/processrequest`,
      payload,
      {
        headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        },
      }
    );
  
    console.log("✅ STK Push Response:", response.data);
    return response.data;
  } catch (error: any) {
      console.error("🔥 STK Push Failed:", error?.response?.data || error.message);
    throw error;
  }
};

//-----------------------STRIPE---------------------------------

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

//----------------------------------------------------------------------

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

export const updatePaymentStatusService = async ({
  appointmentId,
  transactionId,
  amount,
  paymentStatus,
  paymentDate,
}: {
  appointmentId: number;
  transactionId?: string;
  amount?: string;
  paymentStatus: "Paid" | "Failed";
  paymentDate: Date;
}) => {
  await db.update(PaymentsTable)
    .set({
      transactionId,
      amount,
      paymentStatus,
      paymentDate,
    })
    .where(eq(PaymentsTable.appointmentId, appointmentId));
};
