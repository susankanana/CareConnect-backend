import {
  createPrescriptionService,
  getPrescriptionsService,
  getPrescriptionByIdService,
  getPrescriptionsByPatientIdService,
  getPrescriptionsByDoctorIdService,
  updatePrescriptionService,
  deletePrescriptionService
} from "../../src/prescription/prescription.service";

import db from "../../src/drizzle/db";
import { PrescriptionsTable, AppointmentsTable, TIPrescription } from "../../src/drizzle/schema";

jest.mock("../../src/drizzle/db", () => ({
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  select: jest.fn(),
  query: {
    AppointmentsTable: {
      findFirst: jest.fn()
    },
    PrescriptionsTable: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    }
  }
}));

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Prescription Service", () => {
  it("should insert a prescription and update appointment total", async () => {
    const prescription: TIPrescription = {
      appointmentId: 1,
      doctorId: 2,
      patientId: 3,
      notes: "Test prescription",
      amount: "200.00",
    };

    const inserted = { prescriptionId: 1, ...prescription };

    const mockAppointment = {
      appointmentId: 1,
      totalAmount: "500.00",
    };

    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValueOnce([ inserted ]),
      }),
    });

    (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue(mockAppointment);

    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockResolvedValueOnce("updated"),
      }),
    });

    const result = await createPrescriptionService(prescription);

    expect(db.insert).toHaveBeenCalledWith(PrescriptionsTable);
    expect(db.update).toHaveBeenCalledWith(AppointmentsTable);
    expect(result).toEqual(inserted);
  });

  it("should get all prescriptions", async () => {
  const mockPrescription = {
    prescriptionId: 1,
    appointmentId: 101,
    doctorId: 2,
    patientId: 3,
    notes: "Take twice daily after meals",
    amount: "450.00",
    createdAt: new Date("2025-07-01T10:00:00Z"),
    updatedAt: new Date("2025-07-01T10:00:00Z")
  };

  const mockFrom = jest.fn().mockResolvedValue([mockPrescription]);
  (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

  const result = await getPrescriptionsService();

  expect(db.select).toHaveBeenCalled();
  expect(mockFrom).toHaveBeenCalledWith(PrescriptionsTable);
  expect(result).toEqual([mockPrescription]);
});


  it("should get prescription by ID", async () => {
  const mockPrescription = {
    prescriptionId: 1,
    appointmentId: 10,
    doctorId: 2,
    patientId: 3,
    notes: "Take once daily",
    amount: "500.00",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  (db.query.PrescriptionsTable.findFirst as jest.Mock).mockResolvedValue(mockPrescription);

  const result = await getPrescriptionByIdService(1);
  expect(result).toEqual(mockPrescription);
});

it("should get prescriptions by patient ID", async () => {
  const mockPrescriptions = [
    {
      prescriptionId: 1,
      appointmentId: 10,
      doctorId: 2,
      patientId: 3,
      notes: "Take after meals",
      amount: "300.00",
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      prescriptionId: 2,
      appointmentId: 12,
      doctorId: 4,
      patientId: 3,
      notes: "Use twice daily",
      amount: "450.00",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  (db.query.PrescriptionsTable.findMany as jest.Mock).mockResolvedValue(mockPrescriptions);

  const result = await getPrescriptionsByPatientIdService(3);
  expect(result).toEqual(mockPrescriptions);
});

it("should get prescriptions by doctor ID", async () => {
  const mockPrescriptions = [
    {
      prescriptionId: 5,
      appointmentId: 22,
      doctorId: 2,
      patientId: 7,
      notes: "Apply twice daily",
      amount: "200.00",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  (db.query.PrescriptionsTable.findMany as jest.Mock).mockResolvedValue(mockPrescriptions);

  const result = await getPrescriptionsByDoctorIdService(2);
  expect(result).toEqual(mockPrescriptions);
});


  it("should update a prescription and adjust appointment total", async () => {
    const existingPrescription = {
      prescriptionId: 1,
      appointmentId: 1,
      doctorId: 2,
      patientId: 3,
      notes: "Old",
      amount: "150.00",
    };

    const newPrescription = {
      appointmentId: 1,
      doctorId: 2,
      patientId: 3,
      notes: "Updated",
      amount: "250.00",
    };

    const currentAppointment = {
      appointmentId: 1,
      totalAmount: "650.00",
    };

    (db.query.PrescriptionsTable.findFirst as jest.Mock).mockResolvedValue(existingPrescription);
    (db.query.AppointmentsTable.findFirst as jest.Mock).mockResolvedValue(currentAppointment);

    const mockUpdateReturning = jest.fn().mockResolvedValue([{}]);
    const mockUpdateSet = jest.fn().mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: mockUpdateReturning }),
    });
    (db.update as jest.Mock).mockReturnValue({ set: mockUpdateSet });

    const result = await updatePrescriptionService(1, newPrescription);

    expect(db.update).toHaveBeenCalledWith(PrescriptionsTable);

    expect(db.update).toHaveBeenCalledWith(AppointmentsTable);

    expect(result).toBe("Prescription updated successfully");
  });

  it("should delete a prescription", async () => {
    const prescription = {
      prescrptionID: 1,
      appointmentId: 1,
      doctorId: 2,
      patientId: 3,
      notes: "Test prescription",
      amount: "200.00",
    };
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnValue({
        returning: jest.fn().mockResolvedValueOnce([{prescription}])
      }) 
    });

    const result = await deletePrescriptionService(1);
    expect(result).toEqual({ prescription });
  });
});
