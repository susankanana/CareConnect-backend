import request from "supertest";
import app from "../../src";
import db from "../../src/drizzle/db";
import bcrypt from "bcryptjs";
import { UsersTable, DoctorsTable, AppointmentsTable, PaymentsTable } from "../../src/drizzle/schema";
import { eq, or } from 'drizzle-orm';

let adminToken: string;
let userToken: string;
let appointmentId: number;
let paymentId: number;
let doctorId: number;

const adminUser = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@pay.com",
  password: "Admin123",
  role: "admin" as const,
  isVerified: true,
};

const normalUser = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@pay.com",
  password: "Jane123",
  role: "user" as const,
  isVerified: true,
};

const doctorUser = {
  firstName: "Doc",
  lastName: "Tor",
  email: "doc@pay.com",
  password: "Doc123",
  role: "doctor" as const,
  isVerified: true,
};

const testDoctorProfile = {
  specialization: "Dermatology",
  availableDays: ["Monday", "Tuesday"],
};

describe("Payment Controller Integration Tests", () => {
  beforeAll(async () => {
    const [admin] = await db.insert(UsersTable).values({
      ...adminUser,
      password: bcrypt.hashSync(adminUser.password, 10),
    }).returning();

    const [user] = await db.insert(UsersTable).values({
      ...normalUser,
      password: bcrypt.hashSync(normalUser.password, 10),
    }).returning();

    const [doctor] = await db.insert(UsersTable).values({
      ...doctorUser,
      password: bcrypt.hashSync(doctorUser.password, 10),
    }).returning();
    doctorId = doctor.userId;

    await db.insert(DoctorsTable).values({
      doctorId,
      specialization: testDoctorProfile.specialization,
      availableDays: testDoctorProfile.availableDays,
    });

    const adminLogin = await request(app)
      .post("/auth/login")
      .send({ email: adminUser.email, password: adminUser.password });
    adminToken = adminLogin.body.token;

    const userLogin = await request(app)
      .post("/auth/login")
      .send({ email: normalUser.email, password: normalUser.password });
    userToken = userLogin.body.token;

    const [appointment] = await db.insert(AppointmentsTable).values({
      userId: user.userId,
      doctorId,
      appointmentDate: "2025-07-14",
      timeSlot: "10:00:00",
      appointmentStatus: "Confirmed"
    }).returning();
    appointmentId = appointment.appointmentId;

    const [payment] = await db.insert(PaymentsTable).values({
      appointmentId,
      amount: "2000.00",
      paymentStatus: "Pending",
      transactionId: "test-transaction-123",
      paymentDate: new Date(),
    }).returning();
    paymentId = payment.paymentId;
  });

  afterAll(async () => {
    await db.delete(PaymentsTable).where(eq(PaymentsTable.paymentId, paymentId));;
    await db.delete(AppointmentsTable)
    .where(
      eq(AppointmentsTable.doctorId, doctorId)
    );

    await db.delete(DoctorsTable).where(eq(DoctorsTable.doctorId, doctorId));
    await db.delete(UsersTable).where(eq(UsersTable.email, normalUser.email));
    await db.delete(UsersTable).where(eq(UsersTable.email, adminUser.email));
    await db.delete(UsersTable).where(eq(UsersTable.email, doctorUser.email));
  });

  it("should get all payments (admin only)", async () => {
    const res = await request(app)
      .get("/payments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("should get payment by ID", async () => {
    const res = await request(app)
      .get(`/payment/${paymentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.paymentId).toBe(paymentId);
  });

  it("should get payments by appointment ID", async () => {
    const res = await request(app)
      .get(`/payments/appointment/${appointmentId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data[0].appointmentId).toBe(appointmentId);
  });

  it("should update payment status (admin only)", async () => {
    const res = await request(app)
      .patch(`/payment/status/${paymentId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Paid" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Payment status updated");
  });
});