import { Express } from "express";
import { getDoctorsController, getDoctorByIdController, getDoctorBySpecializationController } from "./doctor.controller";

import {
  bothRoleAuth,
  allRoleAuth,
  userRoleAuth
} from "../middleware/bearerAuth";

const doctor = (app: Express) => {
  // Get all doctors (all roles: admin, doctor, user allowed)
  app.route("/doctors").get(
    allRoleAuth,
    async (req, res, next) => {
      try {
        await getDoctorsController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get doctor by ID (all roles: admin, doctor, user allowed)
  app.route("/doctor/:id").get(
    allRoleAuth,
    async (req, res, next) => {
      try {
        await getDoctorByIdController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get doctor by specialization (only user allowed)
  app.route("/doctors/specialization/:specialization").get(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await getDoctorBySpecializationController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
};

export default doctor;
