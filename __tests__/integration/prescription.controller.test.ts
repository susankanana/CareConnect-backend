import request from "supertest";
import app from "../../src";
import db from "../../src/drizzle/db";
import bcrypt from "bcryptjs";
import { UsersTable, DoctorsTable, AppointmentsTable, PrescriptionsTable } from "../../src/drizzle/schema";

// Auth tokens
let adminToken: string;
let doctorToken: string;
let patientToken: string;

// Entity IDs
let prescriptionId: number;
let appointmentId: number;
let doctorId: number;
let patientId: number;

const adminUser = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@doc.com",
  password: "Admin123",
  role: "admin" as const,
  isVerified: true,
};

const doctorUser = {
  firstName: "Doc",
  lastName: "Tor",
  email: "doctor@doc.com",
  password: "Doctor123",
  role: "doctor" as const,
  isVerified: true,
};

const patientUser = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@doc.com",
  password: "Jane123",
  role: "user" as const,
  isVerified: true,
};

const testDoctorProfile = {
  specialization: "Cardiology",
  availableDays: ["Monday", "Wednesday"],
};

beforeAll(async () => {
  await db.delete(PrescriptionsTable);
  await db.delete(AppointmentsTable);
  await db.delete(DoctorsTable);
  await db.delete(UsersTable);

  const [admin] = await db.insert(UsersTable).values({
    ...adminUser,
    password: bcrypt.hashSync(adminUser.password, 10),
  }).returning();

  const [doctor] = await db.insert(UsersTable).values({
    ...doctorUser,
    password: bcrypt.hashSync(doctorUser.password, 10),
  }).returning();
  doctorId = doctor.userId;

  const [user] = await db.insert(UsersTable).values({
    ...patientUser,
    password: bcrypt.hashSync(patientUser.password, 10),
  }).returning();
  patientId = user.userId;

  await db.insert(DoctorsTable).values({
    doctorId: doctor.userId,
    specialization: testDoctorProfile.specialization,
    availableDays: testDoctorProfile.availableDays,
  });

  const adminLogin = await request(app)
    .post("/auth/login")
    .send({ email: adminUser.email, password: adminUser.password });
  adminToken = adminLogin.body.token;

  const doctorLogin = await request(app)
    .post("/auth/login")
    .send({ email: doctorUser.email, password: doctorUser.password });
  doctorToken = doctorLogin.body.token;

  const customerLogin = await request(app)
    .post("/auth/login")
    .send({ email: patientUser.email, password: patientUser.password });
  patientToken = customerLogin.body.token;

  const appointmentRes = await request(app)
    .post("/appointment/register")
    .set("Authorization", `Bearer ${patientToken}`)
    .send({
      userId: patientId,
      doctorId: doctorId,
      appointmentDate: "2025-07-14",
      timeSlot: "10:00:00"
    });

  appointmentId = appointmentRes.body.data.appointmentId;
});

afterAll(async () => {
  await db.delete(PrescriptionsTable);
  await db.delete(AppointmentsTable);
  await db.delete(DoctorsTable);
  await db.delete(UsersTable);
});

describe("Prescription Controller Integration Tests", () => {
  it("should create a prescription", async () => {
    const res = await request(app)
      .post("/prescription/register")
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        appointmentId,
        doctorId,
        patientId,
        notes: "Take one daily",
        amount: "1200.00"
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("prescriptionId");
    prescriptionId = res.body.data.prescriptionId;
  });

  it("should get all prescriptions (admin only)", async () => {
    const res = await request(app)
      .get("/prescriptions")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get prescription by ID (admin only)", async () => {
    const res = await request(app)
      .get(`/prescription/${prescriptionId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.prescriptionId).toBe(prescriptionId);
  });

  it("should get prescriptions by patient ID (user only)", async () => {
    const res = await request(app)
      .get(`/prescriptions/patient/${patientId}`)
      .set("Authorization", `Bearer ${patientToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should get prescriptions by doctor ID (doctor only)", async () => {
    const res = await request(app)
      .get(`/prescriptions/doctor/${doctorId}`)
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should update prescription", async () => {
    const res = await request(app)
      .put(`/prescription/${prescriptionId}`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        notes: "Updated notes",
        amount: "1500.00"
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it("should delete prescription (admin only)", async () => {
    const res = await request(app)
      .delete(`/prescription/${prescriptionId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(204);
  });
});
