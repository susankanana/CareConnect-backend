import { relations } from "drizzle-orm";
import { pgEnum, boolean, integer, pgTable, serial, text, timestamp, varchar, date, time, numeric, real } from "drizzle-orm/pg-core";

// Enums
export const RoleEnum = pgEnum("role", ["user", "admin", "doctor"]);
export const AppointmentStatusEnum = pgEnum("appointment_status", ["Pending", "Confirmed", "Cancelled"]);
export const ComplaintStatusEnum = pgEnum("complaint_status", ["Open", "In Progress", "Resolved", "Closed"]);

// Users Table
export const UsersTable = pgTable("users", {
  userId: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  email: varchar("email", { length: 100 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  contactPhone: varchar("contact_phone", { length: 20 }),
  address: varchar("address", { length: 255 }),
  role: RoleEnum("role").default("user"),
  image_url: varchar("image_url", { length: 255 }).default("https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"),
  isVerified: boolean("is_verified").default(false),
  verificationCode: varchar("verification_code", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Doctors Table
export const DoctorsTable = pgTable("doctors", {
  doctorId: integer("doctor_id").primaryKey().references(() => UsersTable.userId, { onDelete: "cascade" }),
  specialization: varchar("specialization", { length: 100 }).notNull(),
  availableDays: text("available_days").array(),
  rating: real("rating").default(4.5),
  experience: integer("experience"),
  patients: integer("patients"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Appointments Table
export const AppointmentsTable = pgTable("appointments", {
  appointmentId: serial("appointment_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => UsersTable.userId, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").notNull().references(() => DoctorsTable.doctorId),
  appointmentDate: date("appointment_date").notNull(),
  timeSlot: time("time_slot").notNull(),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }),
  appointmentStatus: AppointmentStatusEnum("appointment_status").default("Pending"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Prescriptions Table
export const PrescriptionsTable = pgTable("prescriptions", {
  prescriptionId: serial("prescription_id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => AppointmentsTable.appointmentId, { onDelete: "cascade" }),
  doctorId: integer("doctor_id").notNull().references(() => DoctorsTable.doctorId),
  patientId: integer("patient_id").notNull().references(() => UsersTable.userId),
  notes: text("notes").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Payments Table
export const PaymentsTable = pgTable("payments", {
  paymentId: serial("payment_id").primaryKey(),
  appointmentId: integer("appointment_id").notNull().references(() => AppointmentsTable.appointmentId, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 100 }),
  paymentDate: timestamp("payment_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Complaints Table
export const ComplaintsTable = pgTable("complaints", {
  complaintId: serial("complaint_id").primaryKey(),
  userId: integer("user_id").notNull().references(() => UsersTable.userId, { onDelete: "cascade" }),
  relatedAppointmentId: integer("related_appointment_id").references(() => AppointmentsTable.appointmentId, { onDelete: "cascade" }),
  subject: varchar("subject", { length: 100 }).notNull(),
  description: text("description").notNull(),
  status: ComplaintStatusEnum("complaint_status").default("Open"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

//RELATIONSHIPS

// UsersTable Relationships - 1 user can have many appointments, prescriptions, complaints
export const UserRelations = relations(UsersTable, ({ many }) => ({
  appointments: many(AppointmentsTable),
  prescriptions: many(PrescriptionsTable),
  complaints: many(ComplaintsTable)
}));

// DoctorsTable Relationships - 1 doctor (user) can have many appointments and prescriptions
export const DoctorRelations = relations(DoctorsTable, ({ one, many }) => ({
  user: one(UsersTable, {
    fields: [DoctorsTable.doctorId],
    references: [UsersTable.userId]
  }),
  appointments: many(AppointmentsTable),
  prescriptions: many(PrescriptionsTable)
}));

// AppointmentsTable Relationships - 1 appointment belongs to 1 user and 1 doctor, can have 1 payment and 1 prescription
export const AppointmentRelations = relations(AppointmentsTable, ({ one, many }) => ({
  user: one(UsersTable, {
    fields: [AppointmentsTable.userId],
    references: [UsersTable.userId]
  }),
  doctor: one(DoctorsTable, {
    fields: [AppointmentsTable.doctorId],
    references: [DoctorsTable.doctorId]
  }),
  payments: many(PaymentsTable),
  prescriptions: many(PrescriptionsTable)
}));

// PrescriptionsTable Relationships - 1 prescription belongs to 1 appointment, 1 doctor, and 1 patient
export const PrescriptionRelations = relations(PrescriptionsTable, ({ one }) => ({
  appointment: one(AppointmentsTable, {
    fields: [PrescriptionsTable.appointmentId],
    references: [AppointmentsTable.appointmentId]
  }),
  doctor: one(DoctorsTable, {
    fields: [PrescriptionsTable.doctorId],
    references: [DoctorsTable.doctorId]
  }),
  patient: one(UsersTable, {
    fields: [PrescriptionsTable.patientId],
    references: [UsersTable.userId]
  })
}));

// PaymentsTable Relationships - 1 payment belongs to 1 appointment
export const PaymentRelations = relations(PaymentsTable, ({ one }) => ({
  appointment: one(AppointmentsTable, {
    fields: [PaymentsTable.appointmentId],
    references: [AppointmentsTable.appointmentId]
  })
}));

// ComplaintsTable Relationships - 1 complaint belongs to 1 user and optionally to 1 appointment
export const ComplaintRelations = relations(ComplaintsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [ComplaintsTable.userId],
    references: [UsersTable.userId]
  }),
  appointment: one(AppointmentsTable, {
    fields: [ComplaintsTable.relatedAppointmentId],
    references: [AppointmentsTable.appointmentId]
  })
}));


// Export Types
// export type TIUser = typeof UsersTable.$inferInsert;
export type TIUser = typeof UsersTable.$inferInsert & {
  specialization?: string;
  availableDays?: string[];
  experience?: number;
  patients?: number;
  rating?: number;
};

export type TSUser = typeof UsersTable.$inferSelect;
// New type specifically for the login service input
export type TSUserLoginInput = {
    email: string;
    password: string;
};
export type TIDoctor = typeof DoctorsTable.$inferInsert;
export type TSDoctor = typeof DoctorsTable.$inferSelect;
export type TIAppointment = typeof AppointmentsTable.$inferInsert;
export type TSAppointment = typeof AppointmentsTable.$inferSelect;
export type TIPrescription = typeof PrescriptionsTable.$inferInsert;
export type TSPrescription = typeof PrescriptionsTable.$inferSelect;
export type TIPayment = typeof PaymentsTable.$inferInsert;
export type TSPayment = typeof PaymentsTable.$inferSelect;
export type TIComplaint = typeof ComplaintsTable.$inferInsert;
export type TSComplaint = typeof ComplaintsTable.$inferSelect;
export type Role = "user" | "admin" | "doctor";