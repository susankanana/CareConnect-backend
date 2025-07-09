import {
  createAppointmentService,
  getAppointmentsService,
  getAppointmentByIdService,
  getAppointmentsByUserIdService,
  getAppointmentsByDoctorIdService,
  getAppointmentsByStatusService,
  getDetailedAppointmentsService,
  updateAppointmentStatusService,
  updateAppointmentService,
  deleteAppointmentService
} from "../../src/appointment/appointment.service";
import db from "../../src/drizzle/db";
import { AppointmentsTable } from "../../src/drizzle/schema";

jest.mock("../../src/drizzle/db", () => ({
  query: {
    DoctorsTable: {
      findFirst: jest.fn()
    },
    AppointmentsTable: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    }
  },
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  select: jest.fn()
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Appointment Service", () => {
  describe("createAppointmentService", () => {
    it("should create an appointment if doctor is available and no conflict", async () => {
      const appointment = {
        userId: 1,
        doctorId: 2,
        appointmentDate: "2025-07-10",
        timeSlot: "10:00:00"
      };

      const doctor = {
        doctorId: 2,
        specialization: "Cardiology",
        availableDays: ["Thursday"]
      };

      (db.query.DoctorsTable.findFirst as jest.Mock).mockResolvedValue(doctor);
      (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue(null);
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValueOnce([{ appointment }])
        })
      });

      const result = await createAppointmentService(appointment);
      expect(result).toEqual({ appointment });
    });

    it("should throw if doctor is not available that day", async () => {
      const appointment = {
        userId: 1,
        doctorId: 2,
        appointmentDate: "2025-07-11",
        timeSlot: "10:00:00"
      };

      const doctor = {
        doctorId: 2,
        specialization: "Cardiology",
        availableDays: ["Monday"]
      };

      (db.query.DoctorsTable.findFirst as jest.Mock).mockResolvedValue(doctor);

      await expect(createAppointmentService(appointment)).rejects.toThrow("Doctor is not available");
    });

    it("should throw if time slot is already booked", async () => {
      const appointment = {
        userId: 1,
        doctorId: 2,
        appointmentDate: "2025-07-10",
        timeSlot: "10:00:00"
      };

      const doctor = {
        doctorId: 2,
        specialization: "Cardiology",
        availableDays: ["Thursday"]
      };

      (db.query.DoctorsTable.findFirst as jest.Mock).mockResolvedValue(doctor);
      (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue({ appointmentId: 1 });

      await expect(createAppointmentService(appointment)).rejects.toThrow("already booked");
    });
  });

  it("should get all appointments", async () => {
  const mockAppointments = [
    {
      appointmentId: 1,
      userId: 10,
      doctorId: 20,
      appointmentDate: new Date("2025-07-12"),
      timeSlot: "10:00:00",
      totalAmount: "6500.00",
      appointmentStatus: "Pending",
      createdAt: new Date("2025-07-01T10:00:00Z"),
      updatedAt: new Date("2025-07-01T10:00:00Z")
    }
  ];

  const mockFrom = jest.fn().mockResolvedValue(mockAppointments);
  (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

  const result = await getAppointmentsService();

  expect(db.select).toHaveBeenCalled();
  expect(mockFrom).toHaveBeenCalledWith(AppointmentsTable);
  expect(result).toEqual(mockAppointments);
  });


  it("should get appointment by ID", async () => {
  const mockAppointment = {
    appointmentId: 1,
    userId: 10,
    doctorId: 20,
    appointmentDate: new Date("2025-07-12"),
    timeSlot: "10:00:00",
    totalAmount: "6500.00",
    appointmentStatus: "Pending",
    createdAt: new Date("2025-07-01T10:00:00Z"),
    updatedAt: new Date("2025-07-01T10:00:00Z")
  };

  (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue(mockAppointment);

  const result = await getAppointmentByIdService(1);

  expect(db.query.AppointmentsTable.findFirst).toHaveBeenCalledWith({
    where: expect.anything()
  });
  expect(result).toEqual(mockAppointment);
});


  it("should get appointments by user ID", async () => {
    const mockData = [
      {
        appointmentId: 1,
        appointmentDate: "2025-07-10",
        timeSlot: "10:00:00",
        status: "Confirmed",
        totalAmount: "6500.00",
        patient: {
          name: "Jane",
          lastName: "Doe"
        },
        doctor: {
          id: 2,
          name: "John",
          lastName: "Smith",
          specialization: "Cardiology"
        }
      }
    ];

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockReturnValue({
            leftJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockData)
            })
          })
        })
      })
    });
    const result = await getAppointmentsByUserIdService(1);
    expect(result).toEqual(mockData);
  });

  it("should get appointments by doctor ID", async () => {
  const mockAppointments = [
    {
      appointmentId: 1,
      userId: 3,
      doctorId: 2,
      appointmentDate: "2025-07-10",
      timeSlot: "10:00:00",
      totalAmount: "6500.00",
      appointmentStatus: "Confirmed",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  (db.query.AppointmentsTable.findMany as jest.Mock).mockResolvedValue(mockAppointments);

  const result = await getAppointmentsByDoctorIdService(2);
  expect(result).toEqual(mockAppointments);
});

it("should get appointments by status", async () => {
  const mockAppointments = [
    {
      appointmentId: 2,
      userId: 4,
      doctorId: 1,
      appointmentDate: "2025-07-12",
      timeSlot: "14:00:00",
      totalAmount: "6500.00",
      appointmentStatus: "Pending",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  (db.query.AppointmentsTable.findMany as jest.Mock).mockResolvedValue(mockAppointments);

  const result = await getAppointmentsByStatusService("Pending");
  expect(result).toEqual(mockAppointments);
});

  it("should get detailed appointments", async () => {
    const mockDetailedAppointments = [
      {
        appointmentId: 1,
        appointmentDate: "2025-07-10",
        timeSlot: "10:00:00",
        status: "Confirmed",
        totalAmount: "6500.00",
        patient: {
          id: 10,
          name: "Jane",
          lastName: "Doe",
          email: "jane@example.com"
        },
        doctor: {
          id: 5,
          specialization: "Dermatology"
        }
      }
    ];

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        leftJoin: jest.fn().mockReturnValue({
          leftJoin: jest.fn().mockResolvedValue(mockDetailedAppointments)
        })
      })
    });

    const result = await getDetailedAppointmentsService();
    expect(result).toEqual(mockDetailedAppointments);
  });

  it("should update appointment status", async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValueOnce([
            { appointmentId: 1, appointmentStatus: "Confirmed" }
          ])
        })
      })
    });
    const result = await updateAppointmentStatusService(1, "Confirmed");
    expect(result).toEqual({ appointmentId: 1, appointmentStatus: "Confirmed" });
  });

  it("should update appointment", async () => {
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValueOnce([{}])
        })
      })
    });
    const result = await updateAppointmentService(1, {
      userId: 1,
      doctorId: 2,
      appointmentDate: "2025-07-10",
      timeSlot: "11:00:00"
    });
    expect(result).toBe("Appointment updated successfully");
  });

  it("should delete appointment", async () => {
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValueOnce([{ appointmentId: 1 }])
      })
    });
    const result = await deleteAppointmentService(1);
    expect(result).toEqual({ appointmentId: 1 });
  });
});
