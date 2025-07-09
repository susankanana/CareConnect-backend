import {
  getDoctorsService,
  getDoctorByIdService,
  getDoctorBySpecializationService
} from "../../src/doctor/doctor.service";
import db from "../../src/drizzle/db";

jest.mock("../../src/drizzle/db", () => ({
  select: jest.fn(),
  from: jest.fn(),
  innerJoin: jest.fn(),
  where: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Doctor Service", () => {
  describe("getDoctorsService", () => {
    it("should return all doctors with user info", async () => {
      const data = [
        {
          user: {
            userId: 1,
            firstName: "Jane",
            lastName: "Doe",
            email: "jane@clinic.com",
            password: "hashed",
            role: "doctor",
            isVerified: true,
            contactPhone: null,
            address: null,
            image_url: "",
            verificationCode: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          doctor: {
            doctorId: 1,
            specialization: "Dermatology",
            availableDays: ["Monday", "Wednesday"],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockResolvedValueOnce(data)
        })
      });

      const result = await getDoctorsService();
      expect(result).toEqual(data);
    });
  });

  describe("getDoctorByIdService", () => {
    it("should return doctor details by ID", async () => {
      const doctorInfo = {
        user: {
          userId: 2,
          firstName: "John",
          lastName: "Smith",
          email: "john@hospital.com",
          password: "hashed",
          role: "doctor",
          isVerified: true,
          contactPhone: null,
          address: null,
          image_url: "",
          verificationCode: null,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        doctor: {
          doctorId: 2,
          specialization: "Pediatrics",
          availableDays: ["Tuesday"],
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValueOnce([doctorInfo])
          })
        })
      });

      const result = await getDoctorByIdService(2);
      expect(result).toEqual(doctorInfo);
    });

    it("should return null if doctor not found", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValueOnce([])
          })
        })
      });

      const result = await getDoctorByIdService(999);
      expect(result).toBeNull();
    });
  });

  describe("getDoctorBySpecializationService", () => {
    it("should return doctors by specialization", async () => {
      const data = [
        {
          user: {
            userId: 4,
            firstName: "Anna",
            lastName: "Lee",
            email: "anna@clinic.com",
            password: "hashed",
            role: "doctor",
            isVerified: true,
            contactPhone: null,
            address: null,
            image_url: "",
            verificationCode: null,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          doctor: {
            doctorId: 4,
            specialization: "Cardiology",
            availableDays: ["Monday"],
            createdAt: new Date(),
            updatedAt: new Date()
          }
        }
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValueOnce(data)
          })
        })
      });

      const result = await getDoctorBySpecializationService("Cardiology");
      expect(result).toEqual(data);
    });
  });
});
