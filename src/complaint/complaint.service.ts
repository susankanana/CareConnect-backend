import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { ComplaintsTable, TIComplaint } from "../drizzle/schema";

// Create a new complaint
export const createComplaintService = async (complaint: TIComplaint) => {
  const [created] = await db
    .insert(ComplaintsTable)
    .values(complaint)
    .returning();
  return created;
};

// Get all complaints
export const getComplaintsService = async () => {
  const complaints = await db.select().from(ComplaintsTable);
  return complaints;
};

// Get complaint by ID
export const getComplaintByIdService = async (id: number) => {
  const complaint = await db.query.ComplaintsTable.findFirst({
    where: eq(ComplaintsTable.complaintId, id),
  });
  return complaint;
};

// Get complaints by User ID
export const getComplaintsByUserIdService = async (userId: number) => {
  const complaints = await db.query.ComplaintsTable.findMany({
    where: eq(ComplaintsTable.userId, userId),
  });
  return complaints;
};

// Get complaints by status
export const getComplaintsByStatusService = async (status: string) => {
  const complaints = await db.query.ComplaintsTable.findMany({
    where: eq(ComplaintsTable.status, status as any),
  });
  return complaints;
};

// Update a complaint
export const updateComplaintService = async (
  id: number,
  complaint: Partial<TIComplaint>
) => {
  await db
    .update(ComplaintsTable)
    .set(complaint)
    .where(eq(ComplaintsTable.complaintId, id))
    .returning();
  return "Complaint updated successfully";
};

// Update complaint status
export const updateComplaintStatusService = async (
  complaintId: number,
  status: "Open" | "In Progress" | "Resolved" | "Closed"
) => {
  const [updated] = await db
    .update(ComplaintsTable)
    .set({ status })
    .where(eq(ComplaintsTable.complaintId, complaintId))
    .returning();

  if (!updated) {
    throw new Error("Complaint not found or update failed.");
  }

  return updated;
};

// Delete a complaint
export const deleteComplaintService = async (id: number) => {
  const [deleted] = await db
    .delete(ComplaintsTable)
    .where(eq(ComplaintsTable.complaintId, id))
    .returning();
  return deleted;
};
