import { Request, Response } from "express";
import {
  createAppointmentService,
  getAppointmentsService,
  getAppointmentByIdService,
  getAppointmentsByUserIdService,
  getAppointmentsByDoctorIdService,
  getAppointmentsByStatusService,
  getDetailedAppointmentsService,
  updateAppointmentService,
  updateAppointmentStatusService,
  deleteAppointmentService,
} from "./appointment.service";

// Create appointment
export const createAppointmentController = async (req: Request, res: Response) => {
  try {
    const appointment = req.body;
    const created = await createAppointmentService(appointment);
    if (!created) {
      return res.status(400).json({ message: "Appointment could not be created" });
    }
    return res.status(201).json({ data: created, message: "Appointment created successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all appointments
export const getAppointmentsController = async (req: Request, res: Response) => {
  try {
    const appointments = await getAppointmentsService();
    return res.status(200).json({ data: appointments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get appointment by ID
export const getAppointmentByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const appointment = await getAppointmentByIdService(id);
    if (!appointment) return res.status(404).json({ message: "Appointment not found" });
    return res.status(200).json({ data: appointment });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get appointments by user (patient) ID
export const getAppointmentsByUserIdController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid User ID" });

    const appointments = await getAppointmentsByUserIdService(userId);
    return res.status(200).json({ data: appointments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get appointments by doctor ID
export const getAppointmentsByDoctorIdController = async (req: Request, res: Response) => {
  try {
    const doctorId = parseInt(req.params.doctorId);
    if (isNaN(doctorId)) return res.status(400).json({ message: "Invalid Doctor ID" });

    const appointments = await getAppointmentsByDoctorIdService(doctorId);
    return res.status(200).json({ data: appointments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get appointments by status
export const getAppointmentsByStatusController = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const appointments = await getAppointmentsByStatusService(status);
    return res.status(200).json({ data: appointments });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get detailed appointments with joins
export const getDetailedAppointmentsController = async (req: Request, res: Response) => {
  try {
    const detailed = await getDetailedAppointmentsService();
    return res.status(200).json({ data: detailed });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update appointment
export const updateAppointmentController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const appointment = req.body;
    const updated = await updateAppointmentService(id, appointment);
    return res.status(200).json({ message: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update appointment status
export const updateAppointmentStatusController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;

    if (!["Pending", "Confirmed", "Cancelled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    // Check if appointment exists first
    const appointment = await getAppointmentByIdService(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (!req.user) {
       return res.status(401).json({ message: "Unauthorized" });
     }

    const role = req.user.role; //defined in global.types.ts
    const userId = req.user.id; //defined in global.types.ts

    // Role-based logic
    if (status === "Confirmed" && role !== "doctor" && role !== "admin") {
      return res.status(403).json({
        message: "Only doctors or admins can confirm appointments",
      });
    }

    if (status === "Cancelled") {
      // Only patient or admin can cancel
      const isPatient = appointment.userId === userId;
      if (!isPatient && role !== "admin") {
        return res.status(403).json({
          message: "Only the patient or an admin can cancel this appointment",
        });
      }
    }

    const updated = await updateAppointmentStatusService(id, status as any);
    return res.status(200).json({ message: "Status updated", data: updated });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};


// Delete appointment
export const deleteAppointmentController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const deleted = await deleteAppointmentService(id);
    if (!deleted) return res.status(404).json({ message: "Appointment not found" });

    return res.status(204).json({ message: "Appointment deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
