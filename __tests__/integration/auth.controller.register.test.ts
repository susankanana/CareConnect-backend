import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src';
import db from '../../src/drizzle/db';
import { UsersTable, PrescriptionsTable } from '../../src/drizzle/schema';

const testUser = {
  firstName: "Register",
  lastName: "Tester",
  email: "registertester@gmail.com",
  password: "testpassword123"
};

beforeEach(async () => {
  await db.delete(PrescriptionsTable);
  await db.delete(UsersTable);
});

describe("POST /auth/register", () => {
  it("should register a new user successfully", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        ...testUser,
        password: bcrypt.hashSync(testUser.password, 10)
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("message", "User created. Verification code sent to email.");
  });

  it("should not register a user with an existing email", async () => {
  // First registration
  await request(app).post("/auth/register").send({
    ...testUser,
    password: bcrypt.hashSync(testUser.password, 10)
  });

  // Second attempt with the same email
  const res = await request(app).post("/auth/register").send({
    ...testUser,
    password: bcrypt.hashSync(testUser.password, 10)
  });

  expect(res.statusCode).toBe(500);
  expect(res.body).toHaveProperty("error");
});

  it("should not register a user with missing fields", async () => {
    const res = await request(app)
      .post("/auth/register")
      .send({
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email
        // password is missing
      });

    expect(res.statusCode).toBe(500);
    expect(res.body).toHaveProperty("error");
  });
});
