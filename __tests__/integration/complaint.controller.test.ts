import request from "supertest";
import app from "../../src";
import db from "../../src/drizzle/db";
import bcrypt from "bcryptjs";
import { UsersTable, ComplaintsTable } from "../../src/drizzle/schema";

let adminToken: string;
let userToken: string;
let complaintId: number;
let userId: number;

const adminUser = {
  firstName: "Admin",
  lastName: "User",
  email: "admin@doc.com",
  password: "Admin123",
  role: "admin" as const,
  isVerified: true,
};

const normalUser = {
  firstName: "Jane",
  lastName: "Doe",
  email: "jane@doc.com",
  password: "Jane123",
  role: "user" as const,
  isVerified: true,
};

beforeAll(async () => {
  await db.delete(ComplaintsTable);
  await db.delete(UsersTable);

  const [admin] = await db.insert(UsersTable).values({
    ...adminUser,
    password: bcrypt.hashSync(adminUser.password, 10),
  }).returning();

  const [user] = await db.insert(UsersTable).values({
    ...normalUser,
    password: bcrypt.hashSync(normalUser.password, 10),
  }).returning();

  userId = user.userId;

  const adminLogin = await request(app)
    .post("/auth/login")
    .send({ email: adminUser.email, password: adminUser.password });
  adminToken = adminLogin.body.token;

  const userLogin = await request(app)
    .post("/auth/login")
    .send({ email: normalUser.email, password: normalUser.password });
  userToken = userLogin.body.token;
});

afterAll(async () => {
  await db.delete(ComplaintsTable);
  await db.delete(UsersTable);
});

describe("Complaint Controller Integration Tests", () => {
  it("should create a complaint", async () => {
    const res = await request(app)
      .post("/complaint/register")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        userId,
        subject: "Late appointment",
        description: "The doctor was late by 30 minutes",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.data).toHaveProperty("complaintId");
    complaintId = res.body.data.complaintId;
  });

  it("should get all complaints (admin only)", async () => {
    const res = await request(app)
      .get("/complaints")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it("should get complaint by ID", async () => {
    const res = await request(app)
      .get(`/complaint/${complaintId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.complaintId).toBe(complaintId);
  });

  it("should get complaints by user ID", async () => {
    const res = await request(app)
      .get(`/complaints/user/${userId}`)
      .set("Authorization", `Bearer ${userToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should get complaints by status (admin only)", async () => {
    const res = await request(app)
      .get("/complaints/status/Open")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(200);
  });

  it("should update complaint (admin only)", async () => {
    const res = await request(app)
      .put(`/complaint/${complaintId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        subject: "Updated subject",
        description: "Updated description"
      });

    expect(res.statusCode).toBe(200);
  });

  it("should update complaint status (admin only)", async () => {
    const res = await request(app)
      .patch(`/complaint/status/${complaintId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "Resolved" });

    expect(res.statusCode).toBe(200);
    expect(res.body.data.complaintId).toBe(complaintId);
  });

  it("should delete complaint (admin only)", async () => {
    const res = await request(app)
      .delete(`/complaint/${complaintId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.statusCode).toBe(204);
  });
});
