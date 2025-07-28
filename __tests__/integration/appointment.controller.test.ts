import request from "supertest";
import app from "../../src";
import db from "../../src/drizzle/db";
import bcrypt from "bcryptjs";
import { UsersTable, DoctorsTable, AppointmentsTable } from "../../src/drizzle/schema";
import { eq } from 'drizzle-orm';
import user from "../../src/auth/auth.router";

// Auth tokens
let adminToken: string;
let doctorToken: string;
let customerToken: string;

// Entity IDs
let doctorId: number;
let userId: number;
let appointmentId: number;

const adminUser = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@hospital.com",
  password: "Admin123",
  role: "admin" as const,
  isVerified: true,
};

const doctorUser = {
  firstName: "Doc",
  lastName: "Tor",
  email: "doctor@hospital.com",
  password: "Doctor123",
  role: "doctor" as const,
  isVerified: true,
};

const customerUser = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@hospital.com",
  password: "Jane123",
  role: "user" as const,
  isVerified: true,
};

const testDoctorProfile = {
  specialization: "Testology",
  availableDays: ["Monday", "Wednesday"],
};

beforeAll(async () => {
  // Create users and doctor
  const [admin] = await db.insert(UsersTable).values({
    ...adminUser,
    password: bcrypt.hashSync(adminUser.password, 10),
  }).returning();

  const [doctor] = await db.insert(UsersTable).values({
    ...doctorUser,
    password: bcrypt.hashSync(doctorUser.password, 10),
  }).returning();
  doctorId = doctor.userId;

  await db.insert(DoctorsTable).values({
    doctorId: doctor.userId,
    specialization: testDoctorProfile.specialization,
    availableDays: testDoctorProfile.availableDays,
  });


  const [customer] = await db.insert(UsersTable).values({
    ...customerUser,
    password: bcrypt.hashSync(customerUser.password, 10),
  }).returning();
  userId = customer.userId;

  // Login users
  const adminLogin = await request(app).post("/auth/login").send({
    email: adminUser.email, password: adminUser.password,
  });
  adminToken = adminLogin.body.token;

  const doctorLogin = await request(app).post("/auth/login").send({
    email: doctorUser.email, password: doctorUser.password,
  });
  doctorToken = doctorLogin.body.token;

  const customerLogin = await request(app).post("/auth/login").send({
    email: customerUser.email, password: customerUser.password,
  });
  customerToken = customerLogin.body.token;
});

afterAll(async () => {
  await db.delete(UsersTable).where(eq(UsersTable.email, customerUser.email));
  await db.delete(UsersTable).where(eq(UsersTable.email, adminUser.email));
  await db.delete(UsersTable).where(eq(UsersTable.email, doctorUser.email));
  // await db.delete(AppointmentsTable).where(eq(AppointmentsTable.userId, userId));
  await db.delete(DoctorsTable).where(eq(DoctorsTable.specialization, testDoctorProfile.specialization));
});

describe("Appointment Controller Integration Tests", () => {
  it("should allow a user to create an appointment", async () => {
    const res = await request(app)
      .post("/appointment/register")
      .set("Authorization", `Bearer ${customerToken}`)
      .send({
        userId,
        doctorId,
        appointmentDate: "2025-07-14", //Monday
        timeSlot: "10:00:00",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("appointmentId");
    appointmentId = res.body.data.appointmentId;
  });

  it("should get all appointments (admin only)", async () => {
    const res = await request(app)
      .get("/appointments")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get appointment by ID (admin/doctor)", async () => {
    const res = await request(app)
      .get(`/appointment/${appointmentId}`)
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("appointmentId", appointmentId);
  });

  it("should return 400 for invalid ID", async () => {
    const res = await request(app)
      .get("/appointment/invalid-id")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(400);
  });

  it("should return 404 for non-existent appointment", async () => {
    const res = await request(app)
      .get("/appointment/99999")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(404);
  });

  it("should get appointments by doctor ID", async () => {
    const res = await request(app)
      .get(`/appointments/doctor/${doctorId}`)
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should get appointments by user ID", async () => {
    const res = await request(app)
      .get(`/appointments/user/${userId}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should get appointments by status", async () => {
    const res = await request(app)
      .get("/appointments/status/Pending")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should update appointment", async () => {
    const res = await request(app)
      .put(`/appointment/${appointmentId}`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({
        appointmentDate: "2025-07-22",
        timeSlot: "14:00:00",
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBeDefined();
  });

  it("should update appointment status", async () => {
    const res = await request(app)
      .patch(`/appointment/status/${appointmentId}`)
      .set("Authorization", `Bearer ${doctorToken}`)
      .send({ status: "Confirmed" });

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("Status updated");
  });

  it("should delete appointment (admin only)", async () => {
    const res = await request(app)
      .delete(`/appointment/${appointmentId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(204);
  });
});
