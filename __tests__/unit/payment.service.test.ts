// Define the mock function for Stripe session creation
export const createMockSession = jest.fn();

// Properly mock Stripe before importing it
jest.mock("stripe", () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: createMockSession
      }
    }
  }));
});

import {
  createCheckoutSessionService,
  createPaymentRecordService,
  getAllPaymentsService,
  getPaymentByIdService,
  getPaymentsByAppointmentService,
  updatePaymentStatusService
} from "../../src/payment/payment.service";

import db from "../../src/drizzle/db";
import { PaymentsTable } from "../../src/drizzle/schema";

// Mock environment variables
process.env.STRIPE_SECRET_KEY = "sk_test_123";
process.env.CLIENT_URL = "http://localhost:3000";

jest.mock("../../src/drizzle/db", () => ({
  query: {
    AppointmentsTable: { findFirst: jest.fn() },
    PaymentsTable: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    }
  },
  insert: jest.fn(),
  update: jest.fn(),
  select: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Payment Service", () => {
  it("should create a Stripe checkout session", async () => {
    const mockAppointment = {
      appointmentId: 1,
      totalAmount: "3000.00"
    };

    (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue(mockAppointment);
    createMockSession.mockResolvedValue({ url: "https://stripe.com/session/123" });

    const url = await createCheckoutSessionService(1);

    expect(db.query.AppointmentsTable.findFirst).toHaveBeenCalledWith({
      where: expect.anything()
    });
    expect(createMockSession).toHaveBeenCalled();
    expect(url).toBe("https://stripe.com/session/123");
  });

  it("should throw if appointment not found", async () => {
    (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue(null);
    await expect(createCheckoutSessionService(99)).rejects.toThrow("Appointment not found");
  });

  it("should throw if appointment has invalid amount", async () => {
    (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue({
      appointmentId: 1,
      totalAmount: "0.00"
    });
    await expect(createCheckoutSessionService(1)).rejects.toThrow("Invalid appointment amount");
  });

  it("should create a payment record", async () => {
    const payment = {
      appointmentId: 1,
      amount: "3000.00",
      paymentStatus: "Paid",
      transactionId: "txn_123"
    };

    const inserted = { paymentId: 1, ...payment };
    const mockReturning = jest.fn().mockResolvedValue([inserted]);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as jest.Mock).mockReturnValue({ values: mockValues });

    const result = await createPaymentRecordService(payment);

    expect(db.insert).toHaveBeenCalledWith(PaymentsTable);
    expect(result).toEqual(inserted);
  });

  it("should get all payments", async () => {
    const mockPayments = [
      {
        paymentId: 1,
        appointmentId: 5,
        amount: "2000.00",
        paymentStatus: "Paid",
        transactionId: "txn_abc123",
        paymentDate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockResolvedValue(mockPayments)
    });

    const result = await getAllPaymentsService();
    expect(result).toEqual(mockPayments);
  });

  it("should get payment by ID", async () => {
    const mockPayment = {
      paymentId: 1,
      appointmentId: 5,
      amount: "1500.00",
      paymentStatus: "Paid",
      transactionId: "txn_xyz456",
      paymentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    (db.query.PaymentsTable.findFirst as jest.Mock).mockResolvedValue(mockPayment);

    const result = await getPaymentByIdService(1);
    expect(result).toEqual(mockPayment);
  });

  it("should get payments by appointment ID", async () => {
    const mockPayments = [
      {
        paymentId: 2,
        appointmentId: 3,
        amount: "1000.00",
        paymentStatus: "Pending",
        transactionId: "txn_pending789",
        paymentDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    (db.query.PaymentsTable.findMany as jest.Mock).mockResolvedValue(mockPayments);

    const result = await getPaymentsByAppointmentService(3);
    expect(result).toEqual(mockPayments);
  });

  it("should update payment status", async () => {
    const updated = {
      paymentId: 1,
      appointmentId: 5,
      amount: "1500.00",
      paymentStatus: "Paid",
      transactionId: "txn_xyz456",
      paymentDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const mockReturning = jest.fn().mockResolvedValue([updated]);
    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    (db.update as jest.Mock).mockReturnValue({ set: mockSet });

    const result = await updatePaymentStatusService(1, "Paid");

    expect(db.update).toHaveBeenCalledWith(PaymentsTable);
    expect(result).toEqual(updated);
  });

  it("should throw if payment status update fails", async () => {
    const mockReturning = jest.fn().mockResolvedValue([]);
    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    const mockSet = jest.fn().mockReturnValue({ where: mockWhere });
    (db.update as jest.Mock).mockReturnValue({ set: mockSet });

    await expect(updatePaymentStatusService(999, "Paid")).rejects.toThrow("Payment not found or status update failed.");
  });
});
