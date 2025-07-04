import { and, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import db from "../drizzle/db";
import { AppointmentsTable, TIAppointment, UsersTable, DoctorsTable  } from "../drizzle/schema";

// Helper to get day name from date (e.g. "Monday")
function getDayName(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { weekday: "long" });
}

// Create an appointment
export const createAppointmentService = async (appointment: TIAppointment) => {
  const { doctorId, appointmentDate, timeSlot } = appointment;

  // Check if doctor is available
  const doctor = await db.query.DoctorsTable.findFirst({
    where: eq(DoctorsTable.doctorId, doctorId),
  });

  if (!doctor) {
    throw new Error("Doctor not found");
  }

  const bookingDay = getDayName(appointmentDate); // e.g. "Tuesday"
  const availableDays = doctor.availableDays || [];

  const isAvailable = availableDays.some(
    (day) => day.toLowerCase() === bookingDay.toLowerCase() //returns true if at least 1 match
  );

  if (!isAvailable) {
    throw new Error(
      `Doctor is not available on ${bookingDay}. Available days: ${availableDays.join(", ")}`
    );
  }

  // Check for conflicting appointment
  const existing = await db.query.AppointmentsTable.findFirst({
    where: and(
      eq(AppointmentsTable.doctorId, doctorId),
      eq(AppointmentsTable.appointmentDate, appointmentDate),
      eq(AppointmentsTable.timeSlot, timeSlot)
    )
  });

  if (existing) {
    throw new Error("This time slot is already booked for the selected doctor.");
  }

  // Add default consultation fee & insert
  const consultationFee = "1000.00";

  const appointmentWithFee = {
    ...appointment,
    totalAmount: consultationFee
  };

  const [created] = await db.insert(AppointmentsTable).values(appointmentWithFee).returning();
  return created;
};


// Get all appointments
export const getAppointmentsService = async () => {
  const appointments = await db.select().from(AppointmentsTable);
  return appointments;
};

// Get appointment by ID
export const getAppointmentByIdService = async (id: number) => {
  const appointment = await db.query.AppointmentsTable.findFirst({
    where: eq(AppointmentsTable.appointmentId, id),
  });
  return appointment;
};

// Get appointments by User ID (Patient)
export const getAppointmentsByUserIdService = async (userId: number) => {
  const doctorUser = alias(UsersTable, "doctorUser"); //alias is used to rename UsersTable to doctorUser to avoid conflict while joining users table for the second time to access doctors
  const result = await db
    .select({
      appointmentId: AppointmentsTable.appointmentId,
      appointmentDate: AppointmentsTable.appointmentDate,
      timeSlot: AppointmentsTable.timeSlot,
      status: AppointmentsTable.appointmentStatus,
      totalAmount: AppointmentsTable.totalAmount,
      patient: {
        name: UsersTable.firstName,
        lastName: UsersTable.lastName
      },
      doctor: {
        id: DoctorsTable.doctorId,
        name: doctorUser.firstName,
        lastName: doctorUser.lastName,
        specialization: DoctorsTable.specialization
      }
    })
    .from(AppointmentsTable)
    .leftJoin(UsersTable, eq(AppointmentsTable.userId, UsersTable.userId))
    .leftJoin(DoctorsTable, eq(AppointmentsTable.doctorId, DoctorsTable.doctorId))
    .leftJoin(doctorUser, eq(DoctorsTable.doctorId, doctorUser.userId))
    .where(eq(AppointmentsTable.userId, userId));

  return result;
};

// Get appointments by Doctor ID
export const getAppointmentsByDoctorIdService = async (doctorId: number) => {
  const appointments = await db.query.AppointmentsTable.findMany({
    where: eq(AppointmentsTable.doctorId, doctorId),
  });
  return appointments;
};

//Get appointments by status
export const getAppointmentsByStatusService = async (status: string) => {
  const appointments = await db.query.AppointmentsTable.findMany({
    where: eq(AppointmentsTable.appointmentStatus, status as any),
  });
  return appointments;
};

//Get detailed appointment with doctor and patient details
export const getDetailedAppointmentsService = async () => {
  const result = await db
    .select({
      appointmentId: AppointmentsTable.appointmentId,
      appointmentDate: AppointmentsTable.appointmentDate,
      timeSlot: AppointmentsTable.timeSlot,
      status: AppointmentsTable.appointmentStatus,
      totalAmount: AppointmentsTable.totalAmount,
      patient: {
        id: UsersTable.userId,
        name: UsersTable.firstName,
        lastName: UsersTable.lastName,
        email: UsersTable.email
      },
      doctor: {
        id: DoctorsTable.doctorId,
        specialization: DoctorsTable.specialization
      }
    })
    .from(AppointmentsTable)
    .leftJoin(UsersTable, eq(AppointmentsTable.userId, UsersTable.userId))
    .leftJoin(DoctorsTable, eq(AppointmentsTable.doctorId, DoctorsTable.doctorId));

  return result;
};

//Update appointment status
export const updateAppointmentStatusService = async (appointmentId: number, status: "Pending" | "Confirmed" | "Cancelled") => {
  const [updated] = await db
    .update(AppointmentsTable)
    .set({ appointmentStatus: status })
    .where(eq(AppointmentsTable.appointmentId, appointmentId))
    .returning();

  return updated;
};

// Update an appointment
export const updateAppointmentService = async (id: number, appointment: TIAppointment) => {
  await db.update(AppointmentsTable).set(appointment).where(eq(AppointmentsTable.appointmentId, id)).returning();
  return "Appointment updated successfully";
};

// Delete an appointment
export const deleteAppointmentService = async (id: number) => {
  const deleted = await db.delete(AppointmentsTable).where(eq(AppointmentsTable.appointmentId, id)).returning();
  return deleted[0];
};
