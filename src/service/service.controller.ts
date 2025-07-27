// service.controller.ts
import { Request, Response } from "express";
import {
  createService,
  getAllServices,
  getServiceById,
  updateService,
  deleteService,
} from "./service.service";

// Create a new service
export const createServiceController = async (req: Request, res: Response) => {
  try {
    const newService = await createService(req.body);
    return res.status(201).json({ message: "Service created successfully", data: newService });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all services
export const getAllServicesController = async (_req: Request, res: Response) => {
  try {
    const services = await getAllServices();
    return res.status(200).json({ data: services });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get a single service by ID
export const getServiceByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid service ID" });

    const service = await getServiceById(id);
    if (!service) return res.status(404).json({ message: "Service not found" });

    return res.status(200).json({ data: service });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update service
export const updateServiceController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid service ID" });

    const updated = await updateService(id, req.body);
    return res.status(200).json({ message: "Service updated successfully", data: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete service
export const deleteServiceController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid service ID" });

    const deleted = await deleteService(id);
    return res.status(200).json({ message: "Service deleted successfully", data: deleted });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
