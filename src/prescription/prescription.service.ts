import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { PrescriptionsTable, TIPrescription, AppointmentsTable } from "../drizzle/schema";

// Create a prescription
export const createPrescriptionService = async (prescription: TIPrescription) => {
  const { appointmentId, amount } = prescription;

  // Insert prescription
  const [created] = await db.insert(PrescriptionsTable).values(prescription).returning();

  // Fetch current appointment total
  const appointment = await db.query.AppointmentsTable.findFirst({
    where: eq(AppointmentsTable.appointmentId, appointmentId)
  });

  if (!appointment) {
    throw new Error("Related appointment not found.");
  }

  const currentTotal = parseFloat(appointment.totalAmount || "0");
  const newTotal = currentTotal + parseFloat(amount);

  // Update appointment with new total
  await db.update(AppointmentsTable)
    .set({ totalAmount: newTotal.toFixed(2) })
    .where(eq(AppointmentsTable.appointmentId, appointmentId));

  return created;
};


// Get all prescriptions
export const getPrescriptionsService = async () => {
  const prescriptions = await db.select().from(PrescriptionsTable);
  return prescriptions;
};

// Get prescription by ID
export const getPrescriptionByIdService = async (id: number) => {
  const prescription = await db.query.PrescriptionsTable.findFirst({
    where: eq(PrescriptionsTable.prescriptionId, id),
  });
  return prescription;
};

// Get prescriptions by Patient ID
export const getPrescriptionsByPatientIdService = async (patientId: number) => {
  const prescriptions = await db.query.PrescriptionsTable.findMany({
    where: eq(PrescriptionsTable.patientId, patientId),
  });
  return prescriptions;
};

// Get prescriptions by Doctor ID
export const getPrescriptionsByDoctorIdService = async (doctorId: number) => {
  const prescriptions = await db.query.PrescriptionsTable.findMany({
    where: eq(PrescriptionsTable.doctorId, doctorId),
  });
  return prescriptions;
};

// Update prescription
export const updatePrescriptionService = async (id: number, data: TIPrescription) => {
  // Fetch the existing prescription to get old amount and appointmentId
  const existing = await db.query.PrescriptionsTable.findFirst({
    where: eq(PrescriptionsTable.prescriptionId, id)
  });

  if (!existing) {
    throw new Error("Prescription not found.");
  }

  const oldAmount = parseFloat(existing.amount || "0");
  const newAmount = parseFloat(data.amount || "0");
  const appointmentId = existing.appointmentId;

  // Update the prescription
  await db
    .update(PrescriptionsTable)
    .set(data)
    .where(eq(PrescriptionsTable.prescriptionId, id))
    .returning();

  // Fetch current appointment total
  const appointment = await db.query.AppointmentsTable.findFirst({
    where: eq(AppointmentsTable.appointmentId, appointmentId)
  });

  if (!appointment) {
    throw new Error("Associated appointment not found.");
  }

  const currentTotal = parseFloat(appointment.totalAmount || "0");

  // Adjust total with the difference
  const difference = newAmount - oldAmount;
  const updatedTotal = currentTotal + difference;

  // Update appointment totalAmount
  await db.update(AppointmentsTable)
    .set({ totalAmount: updatedTotal.toFixed(2) })
    .where(eq(AppointmentsTable.appointmentId, appointmentId));

  return "Prescription updated successfully";
};

// Delete prescription
export const deletePrescriptionService = async (id: number) => {
  const deleted = await db
    .delete(PrescriptionsTable)
    .where(eq(PrescriptionsTable.prescriptionId, id))
    .returning();
  return deleted[0];
};
