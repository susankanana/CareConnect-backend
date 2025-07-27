import { eq } from "drizzle-orm";
import db from "../drizzle/db";
import { ServicesTable, TIService } from "../drizzle/schema";

// Create a new service
export const createService = async (service: TIService) => {
  const [created] = await db.insert(ServicesTable).values(service).returning();
  return created;
};

// Get all services
export const getAllServices = async () => {
  const services = await db.select().from(ServicesTable);
  return services;
};

// Get service by ID
export const getServiceById = async (id: number) => {
  const service = await db.query.ServicesTable.findFirst({
    where: eq(ServicesTable.serviceId, id),
  });
  return service;
};

// Update service
export const updateService = async (id: number, data: Partial<TIService>) => {
  const [updated] = await db
    .update(ServicesTable)
    .set(data)
    .where(eq(ServicesTable.serviceId, id))
    .returning();
  return updated;
};

// Delete service
export const deleteService = async (id: number) => {
  const [deleted] = await db
    .delete(ServicesTable)
    .where(eq(ServicesTable.serviceId, id))
    .returning();
  return deleted;
};
