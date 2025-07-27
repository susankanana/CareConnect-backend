import db from "../drizzle/db";
import { DoctorServicesTable, ServicesTable, DoctorsTable} from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const assignServicesToDoctor = async (doctorId: number, serviceIds: number[]) => {
  // Remove any existing associations first (optional but common)
  await db.delete(DoctorServicesTable).where(eq(DoctorServicesTable.doctorId, doctorId));

  // Insert new associations
  const values = serviceIds.map((serviceId) => ({ doctorId, serviceId }));
  await db.insert(DoctorServicesTable).values(values);
};

export const getServicesForDoctor = async (doctorId: number) => {
  const result = await db
    .select({
      serviceId: ServicesTable.serviceId,
      title: ServicesTable.title,
      description: ServicesTable.description,
      features: ServicesTable.features,
    })
    .from(DoctorServicesTable)
    .innerJoin(ServicesTable, eq(DoctorServicesTable.serviceId, ServicesTable.serviceId))
    .where(eq(DoctorServicesTable.doctorId, doctorId));

  return result;
};

export const getDoctorsForService = async (serviceId: number) => {
  const result = await db
    .select({
      doctorId: DoctorsTable.doctorId,
      specialization: DoctorsTable.specialization,
      experience: DoctorsTable.experience,
      rating: DoctorsTable.rating,
      patients: DoctorsTable.patients,
    })
    .from(DoctorServicesTable)
    .innerJoin(DoctorsTable, eq(DoctorServicesTable.doctorId, DoctorsTable.doctorId))
    .where(eq(DoctorServicesTable.serviceId, serviceId));

  return result;
};
