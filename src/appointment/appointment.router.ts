import { Express } from "express";
import {
  createAppointmentController,
  getAppointmentsController,
  getAppointmentByIdController,
  getAppointmentsByUserIdController,
  getAppointmentsByDoctorIdController,
  getAppointmentsByStatusController,
  updateAppointmentController,
  deleteAppointmentController,
  getDetailedAppointmentsController,
  updateAppointmentStatusController
} from "./appointment.controller";

import {
  adminRoleAuth,
  bothRoleAuth,
  userRoleAuth,
  doctorRoleAuth
} from "../middleware/bearerAuth";

const appointment = (app: Express) => {
  // Create an appointment (user only)
  app.route("/appointment/register").post(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await createAppointmentController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get all appointments (admin only)
  app.route("/appointments").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getAppointmentsController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get detailed appointments (admin only)
  app.route("/appointments/detailed").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getDetailedAppointmentsController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get appointment by ID (admin or doctor)
  app.route("/appointment/:id").get(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await getAppointmentByIdController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get appointments by user ID (user only)
  app.route("/appointments/user/:userId").get(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await getAppointmentsByUserIdController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get appointments by doctor ID (doctor only)
  app.route("/appointments/doctor/:doctorId").get(
    doctorRoleAuth,
    async (req, res, next) => {
      try {
        await getAppointmentsByDoctorIdController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get appointments by status (admin only)
  app.route("/appointments/status/:status").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getAppointmentsByStatusController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Update appointment (admin or doctor)
  app.route("/appointment/:id").put(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await updateAppointmentController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Update appointment status (admin or doctor)
  app.route("/appointment/status/:id").patch(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await updateAppointmentStatusController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete appointment (admin only)
  app.route("/appointment/:id").delete(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await deleteAppointmentController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );
};

export default appointment;
