import {
  createUserService,
  verifyUserService,
  userLoginService,
  getUsersService,
  getUserByIdService,
  getUserByEmailService,
  updateUserService,
  deleteUserService
} from "../../src/auth/auth.service";
import db from "../../src/drizzle/db";
import { UsersTable, TIUser, TSUser, TSUserLoginInput } from "../../src/drizzle/schema";

jest.mock("../../src/drizzle/db", () => ({
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  query: {
    UsersTable: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    }
  },
  select: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Auth Service", () => {
  describe("createUserService", () => {
    it("should insert a user and return the created user", async () => {
      const user: TIUser = {
        firstName: "Erica",
        lastName: "Nyaikamba",
        email: "erikapanda@gmail.com",
        password: "pass123",
        role: "user"
      };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValueOnce([{ userId: 1, ...user }])
        })
      });

      const result = await createUserService(user);
      expect(result.firstName).toBe("Erica");
    });
  });

  describe("verifyUserService", () => {
    it("should update user verification status", async () => {
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValueOnce([{}])
        })
      });

      await verifyUserService("erikapanda@gmail.com");
      expect(db.update).toHaveBeenCalledWith(UsersTable);
    });
  });

  describe("userLoginService", () => {
    it("should return a user on successful login", async () => {
      const foundUser: TSUser = {
        userId: 3,
        firstName: "Kansy",
        lastName: "Sue",
        email: "kansy841@gmail.com",
        password: "hashed_password",
        role: "user",
        isVerified: true,
        contactPhone: null,
        address: null,
        image_url: "",
        verificationCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.query.UsersTable.findFirst as jest.Mock).mockResolvedValueOnce(foundUser);

      const loginInput: TSUserLoginInput = {
        email: "kansy841@gmail.com",
        password: "pass123"
      };

      const result = await userLoginService(loginInput);
      expect(result).toEqual(foundUser);
    });
  });

  describe("getUsersService", () => {
    it("should return all users", async () => {
      const users: TSUser[] = [
        {
          userId: 1,
          firstName: "Kansy",
          lastName: "Sue",
          email: "kansy@example.com",
          password: "hashed_password",
          role: "admin",
          isVerified: true,
          contactPhone: null,
          address: null,
          image_url: "",
          verificationCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      (db.query.UsersTable.findMany as jest.Mock).mockResolvedValueOnce(users);

      const result = await getUsersService();
      expect(result).toEqual(users);
    });
  });

  describe("getUserByIdService", () => {
    it("should return a user by ID", async () => {
      const user: TSUser = {
        userId: 1,
        firstName: "Susan",
        lastName: "Kanana",
        email: "susan@example.com",
        password: "hashed",
        role: "user",
        isVerified: true,
        contactPhone: null,
        address: null,
        image_url: "",
        verificationCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.query.UsersTable.findFirst as jest.Mock).mockResolvedValueOnce(user);

      const result = await getUserByIdService(1);
      expect(result).toEqual(user);
    });
  });

  describe("getUserByEmailService", () => {
    it("should return a user by email", async () => {
      const user: TSUser = {
        userId: 1,
        firstName: "Susan",
        lastName: "Kanana",
        email: "susan@example.com",
        password: "hashed",
        role: "user",
        isVerified: true,
        contactPhone: null,
        address: null,
        image_url: "",
        verificationCode: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (db.query.UsersTable.findFirst as jest.Mock).mockResolvedValueOnce(user);

      const result = await getUserByEmailService("susan@example.com");
      expect(result).toEqual(user);
    });
  });

  describe("updateUserService", () => {
    it("should update a user and return a success message", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValueOnce([{ userId: 1, role: "user" }])
        })
      });

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValueOnce([{ userId: 1, role: "user" }]) })
        })
      });

      const result = await updateUserService(1, {
        firstName: "Susan",
        lastName: "Kanana",
        email: "suzzannekans@gmail.com",
        password: "pass123",
        role: "user"
      } as TIUser);

      expect(result).toBe("User updated successfully");
    });
  });

  describe("deleteUserService", () => {
    it("should delete a user and return a success message", async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValueOnce([{}]) })
      });

      const result = await deleteUserService(1);
      expect(result).toBe("User deleted successfully");
    });
  });
});
