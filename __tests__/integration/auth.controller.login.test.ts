import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src';
import db from '../../src/drizzle/db';
import { UsersTable } from '../../src/drizzle/schema';
import { eq } from 'drizzle-orm';

const testUser = {
  firstName: "Login",
  lastName: "Tester",
  email: "logintester@gmail.com",
  password: "loginpass123"
};

beforeEach(async () => {
  await db.delete(UsersTable).where(eq(UsersTable.email, testUser.email));
  await db.insert(UsersTable).values({
    ...testUser,
    password: bcrypt.hashSync(testUser.password, 10),
    isVerified: true
  });
});

afterEach(async () => {
  await db.delete(UsersTable).where(eq(UsersTable.email, testUser.email));
});

describe("POST /auth/login", () => {
  it("should authenticate a user and return a token", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toEqual(
      expect.objectContaining({
        user_id: expect.any(Number),
        first_name: testUser.firstName,
        last_name: testUser.lastName,
        email: testUser.email,
        isVerified: true
      })
    );
  });

  it("should fail with wrong password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: testUser.email,
        password: "incorrectpassword"
      });

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ message: "Invalid credentials" });
  });

  it("should fail with non-existent user", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: "nonexistent@mail.com",
        password: "somepass"
      });

    expect(res.statusCode).toBe(404);
    expect(res.body).toEqual({ message: "User not found" });
  });

  it("should fail with missing email", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        password: testUser.password
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "Email is required and must be a non-empty string." });
  });

  it("should fail with missing password", async () => {
    const res = await request(app)
      .post("/auth/login")
      .send({
        email: testUser.email
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ message: "Password is required and must be a non-empty string." });
  });
});
