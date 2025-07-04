import { Request, Response } from "express";
import {
  createPrescriptionService,
  getPrescriptionsService,
  getPrescriptionByIdService,
  getPrescriptionsByPatientIdService,
  getPrescriptionsByDoctorIdService,
  updatePrescriptionService,
  deletePrescriptionService,
} from "./prescription.service";

// Create prescription controller
export const createPrescriptionController = async (req: Request, res: Response) => {
  try {
    const prescription = req.body;
    const created = await createPrescriptionService(prescription);
    if (!created) {
      return res.status(400).json({ message: "Prescription could not be created" });
    }
    return res.status(201).json({ data: created, message: "Prescription created successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all prescriptions controller
export const getPrescriptionsController = async (_req: Request, res: Response) => {
  try {
    const prescriptions = await getPrescriptionsService();
    if (!prescriptions || prescriptions.length === 0) {
      return res.status(404).json({ message: "No prescriptions found" });
    }
    return res.status(200).json({ data: prescriptions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get prescription by ID controller
export const getPrescriptionByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const prescription = await getPrescriptionByIdService(id);
    if (!prescription) return res.status(404).json({ message: "Prescription not found" });

    return res.status(200).json({ data: prescription });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get prescriptions by Patient ID controller
export const getPrescriptionsByPatientIdController = async (req: Request, res: Response) => {
  try {
    const patientId = parseInt(req.params.patientId);
    if (isNaN(patientId)) return res.status(400).json({ message: "Invalid patient ID" });

    const prescriptions = await getPrescriptionsByPatientIdService(patientId);
    return res.status(200).json({ data: prescriptions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get prescriptions by Doctor ID controller
export const getPrescriptionsByDoctorIdController = async (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(doctorId)) return res.status(400).json({ message: "Invalid doctor ID" });

    const prescriptions = await getPrescriptionsByDoctorIdService(doctorId);
    return res.status(200).json({ data: prescriptions });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update prescription controller
export const updatePrescriptionController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const existing = await getPrescriptionByIdService(id);
    if (!existing) return res.status(404).json({ message: "Prescription not found" });

    const updated = await updatePrescriptionService(id, req.body);
    return res.status(200).json({ message: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete prescription controller
export const deletePrescriptionController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const existing = await getPrescriptionByIdService(id);
    if (!existing) return res.status(404).json({ message: "Prescription not found" });

    const deleted = await deletePrescriptionService(id);
    return res.status(204).json({ message: "Prescription deleted successfully", data: deleted });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
