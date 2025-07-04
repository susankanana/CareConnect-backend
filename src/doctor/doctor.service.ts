import { sql } from "drizzle-orm";
import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { TIDoctor, DoctorsTable, TSDoctor, UsersTable} from "../drizzle/schema";

// get all doctors
export const getDoctorsService = async () => {
  const doctors = await db
    .select({
      user: UsersTable,
      doctor: DoctorsTable
    })
    .from(DoctorsTable)
    .innerJoin(UsersTable, eq(UsersTable.userId, DoctorsTable.doctorId));

  return doctors; // returns array of { user, doctor }
};

// Get doctor by id
export const getDoctorByIdService = async (id: number) => {
  const result = await db
    .select({
      user: UsersTable,
      doctor: DoctorsTable
    })
    .from(DoctorsTable)
    .innerJoin(UsersTable, eq(UsersTable.userId, DoctorsTable.doctorId))
    .where(eq(DoctorsTable.doctorId, id));

  return result.length ? result[0] : null;
};

// Get doctor by specialization
export const getDoctorBySpecializationService = async (specialization: string) => {
  const results = await db
    .select({
      user: UsersTable,
      doctor: DoctorsTable
    })
    .from(DoctorsTable)
    .innerJoin(UsersTable, eq(UsersTable.userId, DoctorsTable.doctorId))
    .where(eq(DoctorsTable.specialization, specialization));

  return results;
};