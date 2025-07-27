import { Express } from "express";
import {
  assignServicesController,
  getDoctorServicesController,
  getDoctorsForServiceController,
} from "./doctor_service.controller";
import { bothRoleAuth } from "../middleware/bearerAuth";

const doctorServiceRoutes = (app: Express) => {
  // Assign services to a doctor (admin or doctor)
  app.route("/doctor-services/assign").post(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await assignServicesController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all services offered by a specific doctor (public)
  app.route("/doctor-services/doctor/:doctorId").get(
    async (req, res, next) => {
      try {
        await getDoctorServicesController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all doctors who offer a specific service (public)
  app.route("/doctor-services/service/:serviceId").get(
    async (req, res, next) => {
      try {
        await getDoctorsForServiceController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
};

export default doctorServiceRoutes;
