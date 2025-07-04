import { Express } from "express";
import {
  createPrescriptionController,
  getPrescriptionsController,
  getPrescriptionByIdController,
  getPrescriptionsByPatientIdController,
  getPrescriptionsByDoctorIdController,
  updatePrescriptionController,
  deletePrescriptionController,
} from "./prescription.controller";

import {
  adminRoleAuth,
  userRoleAuth,
  bothRoleAuth,
} from "../middleware/bearerAuth";

const prescription = (app: Express) => {
  // Create a prescription (doctor or admin only)
  app.route("/prescription/register").post(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await createPrescriptionController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all prescriptions (admin only)
  app.route("/prescriptions").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getPrescriptionsController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get prescription by ID (admin only)
  app.route("/prescription/:id").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getPrescriptionByIdController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get prescriptions by patient ID (user only)
  app.route("/prescriptions/patient/:patientId").get(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await getPrescriptionsByPatientIdController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get prescriptions by doctor ID (doctor or admin only)
  app.route("/prescriptions/doctor/:doctorId").get(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await getPrescriptionsByDoctorIdController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Update prescription (doctor or admin only)
  app.route("/prescription/:id").put(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await updatePrescriptionController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete prescription (admin only)
  app.route("/prescription/:id").delete(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await deletePrescriptionController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
};

export default prescription;
