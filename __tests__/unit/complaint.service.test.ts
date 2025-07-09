import {
  createComplaintService,
  getComplaintsService,
  getComplaintByIdService,
  getComplaintsByUserIdService,
  getComplaintsByStatusService,
  updateComplaintService,
  updateComplaintStatusService,
  deleteComplaintService
} from "../../src/complaint/complaint.service";
import db from "../../src/drizzle/db";
import { ComplaintsTable, TIComplaint } from "../../src/drizzle/schema";

jest.mock("../../src/drizzle/db", () => ({
  query: {
    ComplaintsTable: {
      findFirst: jest.fn(),
      findMany: jest.fn()
    }
  },
  insert: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  select: jest.fn()
}));

describe("Complaint Service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should create a new complaint", async () => {
    const complaint: TIComplaint = {
      userId: 1,
      relatedAppointmentId: 2,
      subject: "Issue with appointment",
      description: "Doctor was late",
      status: "Open"
    };

    const inserted = { complaintId: 1, ...complaint };

    const mockReturning = jest.fn().mockResolvedValue([ inserted ]);
    const mockValues = jest.fn().mockReturnValue({ returning: mockReturning });
    (db.insert as jest.Mock).mockReturnValue({ values: mockValues });

    const result = await createComplaintService(complaint);

    expect(db.insert).toHaveBeenCalledWith(ComplaintsTable);
    expect(result).toEqual(inserted);
  });

  it("should get complaint by ID", async () => {
  const mockComplaint = {
    complaintId: 1,
    userId: 5,
    relatedAppointmentId: 2,
    subject: "Wrong diagnosis",
    description: "Doctor was inattentive and gave the wrong meds",
    status: "Open",
    createdAt: new Date(),
    updatedAt: new Date()
  };

  (db.query.ComplaintsTable.findFirst as jest.Mock).mockResolvedValue(mockComplaint);

  const result = await getComplaintByIdService(1);

  expect(db.query.ComplaintsTable.findFirst).toHaveBeenCalled();
  expect(result).toEqual(mockComplaint);
});

it("should get complaints by user ID", async () => {
  const mockComplaints = [
    {
      complaintId: 1,
      userId: 5,
      relatedAppointmentId: 2,
      subject: "Wrong diagnosis",
      description: "Doctor was inattentive and gave the wrong meds",
      status: "Open",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  (db.query.ComplaintsTable.findMany as jest.Mock).mockResolvedValue(mockComplaints);

  const result = await getComplaintsByUserIdService(5);

  expect(db.query.ComplaintsTable.findMany).toHaveBeenCalled();
  expect(result).toEqual(mockComplaints);
});

it("should get complaints by status", async () => {
  const mockComplaints = [
    {
      complaintId: 1,
      userId: 5,
      relatedAppointmentId: 2,
      subject: "Wrong diagnosis",
      description: "Doctor was inattentive and gave the wrong meds",
      status: "Open",
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  (db.query.ComplaintsTable.findMany as jest.Mock).mockResolvedValue(mockComplaints);

  const result = await getComplaintsByStatusService("Open");

  expect(db.query.ComplaintsTable.findMany).toHaveBeenCalled();
  expect(result).toEqual(mockComplaints);
});

it("should get all complaints", async () => {
    const mockComplaints = [
      {
        complaintId: 1,
        userId: 5,
        relatedAppointmentId: 2,
        subject: "Wrong diagnosis",
        description: "Doctor was inattentive",
        status: "Open",
        createdAt: new Date("2025-07-08T10:00:00Z"),
        updatedAt: new Date("2025-07-08T10:00:00Z")
      },
      {
        complaintId: 2,
        userId: 6,
        relatedAppointmentId: null,
        subject: "Long wait time",
        description: "Waited over 2 hours",
        status: "Resolved",
        createdAt: new Date("2025-07-07T09:00:00Z"),
        updatedAt: new Date("2025-07-08T11:00:00Z")
      }
    ];

    (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockResolvedValue(mockComplaints)});
    const result = await getComplaintsService();

    expect(db.select).toHaveBeenCalled();
    expect(result).toEqual(mockComplaints);
  });

  it("should update a complaint", async () => {
    const mockReturning = jest.fn().mockResolvedValue([{}]);
    const mockSet = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mockReturning }) });
    (db.update as jest.Mock).mockReturnValue({ set: mockSet });

    const result = await updateComplaintService(1, { description: "Updated description" });

    expect(db.update).toHaveBeenCalledWith(ComplaintsTable);
    expect(result).toBe("Complaint updated successfully");
  });

  it("should update complaint status", async () => {
    const mockReturning = jest.fn().mockResolvedValue([{ complaintId: 1, status: "Resolved" }]);
    const mockSet = jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ returning: mockReturning }) });
    (db.update as jest.Mock).mockReturnValue({ set: mockSet });

    const result = await updateComplaintStatusService(1, "Resolved");

    expect(db.update).toHaveBeenCalledWith(ComplaintsTable);
    expect(result).toEqual({ complaintId: 1, status: "Resolved" });
  });

  it("should delete a complaint", async () => {
    const complaint = {
    complaintId: 1,
    userId: 5,
    relatedAppointmentId: 2,
    subject: "Wrong diagnosis",
    description: "Doctor was inattentive and gave the wrong meds",
    status: "Open",
    createdAt: new Date(),
    updatedAt: new Date()
  };
    const mockReturning = jest.fn().mockResolvedValue([{ complaint }]);
    const mockWhere = jest.fn().mockReturnValue({ returning: mockReturning });
    (db.delete as jest.Mock).mockReturnValue({ where: mockWhere });

    const result = await deleteComplaintService(1);

    expect(db.delete).toHaveBeenCalledWith(ComplaintsTable);
    expect(result).toEqual({ complaint });
  });
});
