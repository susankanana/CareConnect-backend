import { Request, Response } from 'express';
import {getDoctorsService, getDoctorByIdService, getDoctorBySpecializationService} from './doctor.service';

// get doctor by id
export const getDoctorByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ message: "Invalid ID" });
    }

    const doctor = await getDoctorByIdService(id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    return res.status(200).json({ data: doctor });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// get all doctors controller
export const getDoctorsController = async (req: Request, res: Response) => {
    try {
        const doctors = await getDoctorsService()
        if (!doctors || doctors.length === 0) {
            return res.status(404).json({ message: "No doctors found" });
        }
        return res.status(200).json({ data: doctors });

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}

//get doctor by specialization
export const getDoctorBySpecializationController = async (req: Request, res: Response) => {
  try {
    const specialization = req.params.specialization?.trim();

    if (!specialization || specialization.trim() === "") {
      return res.status(400).json({ message: "Specialization is required" });
    }

    const doctors = await getDoctorBySpecializationService(specialization.trim());

    if (!doctors.length) {
      return res.status(404).json({ message: "No doctors found for this specialization" });
    }

    return res.status(200).json({ data: doctors });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};