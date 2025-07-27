import { Request, Response } from "express";
import {
  assignServicesToDoctor,
  getServicesForDoctor,
  getDoctorsForService,
} from "./doctor_service.service";

// Assign services to a doctor
export const assignServicesController = async (req: Request, res: Response) => {
  const { doctorId, serviceIds } = req.body;

  if (!doctorId || !Array.isArray(serviceIds)) {
    return res.status(400).json({ message: "doctorId and serviceIds (array) are required." });
  }

  try {
    await assignServicesToDoctor(doctorId, serviceIds);
    res.status(200).json({ message: "Services assigned successfully." });
  } catch (error) {
    console.error("Error assigning services:", error);
    res.status(500).json({ message: "Failed to assign services to doctor." });
  }
};

// Get all services offered by a doctor
export const getDoctorServicesController = async (req: Request, res: Response) => {
  const doctorId = Number(req.params.doctorId);

  if (isNaN(doctorId)) {
    return res.status(400).json({ message: "Invalid doctorId." });
  }

  try {
    const services = await getServicesForDoctor(doctorId);
    res.status(200).json({data: services});
  } catch (error) {
    console.error("Error fetching services for doctor:", error);
    res.status(500).json({ message: "Failed to fetch services for doctor." });
  }
};

// Get all doctors that offer a specific service
export const getDoctorsForServiceController = async (req: Request, res: Response) => {
  const serviceId = Number(req.params.serviceId);

  if (isNaN(serviceId)) {
    return res.status(400).json({ message: "Invalid serviceId." });
  }

  try {
    const doctors = await getDoctorsForService(serviceId);
    res.status(200).json({data: doctors});
  } catch (error) {
    console.error("Error fetching doctors for service:", error);
    res.status(500).json({ message: "Failed to fetch doctors for service." });
  }
};
