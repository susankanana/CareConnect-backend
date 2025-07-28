import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../../src';
import db from '../../src/drizzle/db';
import { UsersTable } from '../../src/drizzle/schema';
import { eq } from 'drizzle-orm';

let userId: number;
const testUser = {
  firstName: "Auth",
  lastName: "User",
  email: "authuser@test.com",
  password: "securePass123",
  role: "user",
  isVerified: true
};

beforeAll(async () => {
  const [user] = await db.insert(UsersTable).values({
    firstName: testUser.firstName,
    lastName: testUser.lastName,
    email: testUser.email,
    password: bcrypt.hashSync(testUser.password, 10),
    role: testUser.role as 'user' | 'admin',
    isVerified: testUser.isVerified,
  }).returning();
  userId = user.userId;
});

afterAll(async () => {
  await db.delete(UsersTable).where(eq(UsersTable.email, testUser.email));
});


describe("Auth Controller - User CRUD", () => {
  it("Should get all users", async () => {
    const res = await request(app).get("/users");
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  it("Should get user by ID", async () => {
    const res = await request(app).get(`/user/${userId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.data).toHaveProperty("userId", userId);
  });

  it("Should update a user", async () => {
    const update = {
      firstName: "Updated",
      lastName: "Name",
      role: "admin"
    };
    const res = await request(app)
      .put(`/user/${userId}`)
      .send(update);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe("User updated successfully");
  });

  it("Should delete a user", async () => {
    const [newUser] = await db.insert(UsersTable).values({
      firstName: "Delete",
      lastName: "User",
      email: "delete@test.com",
      password: bcrypt.hashSync("deletepass", 10),
      role: "user",
      isVerified: true,
    }).returning();

    const res = await request(app).delete(`/user/${newUser.userId}`);
    expect(res.statusCode).toBe(204);
  });

  // NEGATIVE TESTS
  it("Should fail getting user with invalid ID", async () => {
    const res = await request(app).get("/user/invalid-id");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("Invalid ID");
  });

  it("Should fail updating non-existent user", async () => {
    const res = await request(app).put("/user/99999").send({ firstName: "Ghost" });
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });

  it("Should fail deleting non-existent user", async () => {
    const res = await request(app).delete("/user/99999");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toBe("User not found");
  });
});
