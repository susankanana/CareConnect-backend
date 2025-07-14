import request from "supertest";
import app from "../../src";
import db from "../../src/drizzle/db";
import bcrypt from "bcryptjs";
import { UsersTable, DoctorsTable } from "../../src/drizzle/schema";

let adminToken: string;
let doctorToken: string;
let customerToken: string;
let doctorId: number;

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

const customerUser = {
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
  await db.delete(DoctorsTable);
  await db.delete(UsersTable);

  // Create admin
  await db
    .insert(UsersTable)
    .values({
      ...adminUser,
      password: bcrypt.hashSync(adminUser.password, 10),
    })
    .returning();

  // Create doctor
  const [doctor] = await db
    .insert(UsersTable)
    .values({
      ...doctorUser,
      password: bcrypt.hashSync(doctorUser.password, 10),
    })
    .returning();
  doctorId = doctor.userId;

  await db.insert(DoctorsTable).values({
    doctorId: doctor.userId,
    specialization: testDoctorProfile.specialization,
    availableDays: testDoctorProfile.availableDays,
  });

  // Create customer
  await db.insert(UsersTable).values({
    ...customerUser,
    password: bcrypt.hashSync(customerUser.password, 10),
  });

  // Login and get tokens
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
    .send({ email: customerUser.email, password: customerUser.password });
  customerToken = customerLogin.body.token;
});

afterAll(async () => {
  await db.delete(DoctorsTable);
  await db.delete(UsersTable);
});

describe("Doctor Controller Integration Tests", () => {
  it("should fetch all doctors", async () => {
    const res = await request(app)
      .get("/doctors")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0].doctor).toHaveProperty("specialization", testDoctorProfile.specialization);
  });

  it("should get doctor by ID", async () => {
    const res = await request(app)
      .get(`/doctor/${doctorId}`)
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.doctor).toHaveProperty("doctorId", doctorId);
    expect(res.body.data.doctor).toHaveProperty("specialization", testDoctorProfile.specialization);
  });

  it("should return 400 for invalid ID format", async () => {
    const res = await request(app)
      .get("/doctor/invalid-id")
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid ID");
  });

  it("should return 404 if doctor by ID not found", async () => {
    const res = await request(app)
      .get("/doctor/99999")
      .set("Authorization", `Bearer ${doctorToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("Doctor not found");
  });

  it("should get doctor by specialization", async () => {
    const res = await request(app)
      .get(`/doctors/specialization/${testDoctorProfile.specialization}`)
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data[0].doctor).toHaveProperty("specialization", testDoctorProfile.specialization);
  });

  it("should return 404 if specialization param is empty", async () => {
    const res = await request(app)
      .get("/doctors/specialization/")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(404);
  });

  it("should return 404 if no doctor matches specialization", async () => {
    const res = await request(app)
      .get("/doctors/specialization/Neurology")
      .set("Authorization", `Bearer ${customerToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("No doctors found for this specialization");
  });
});
