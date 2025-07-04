import { Express } from "express";
import {
  createComplaintController,
  getComplaintsController,
  getComplaintByIdController,
  getComplaintsByUserIdController,
  getComplaintsByStatusController,
  updateComplaintController,
  updateComplaintStatusController,
  deleteComplaintController,
} from "./complaint.controller";

import {
  adminRoleAuth,
  userRoleAuth,
  allRoleAuth
} from "../middleware/bearerAuth";

const complaint = (app: Express) => {
  // Create complaint (user only)
  app.route("/complaint/register").post(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await createComplaintController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get all complaints (admin only)
  app.route("/complaints").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getComplaintsController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get complaint by ID (admin, doctor, user)
  app.route("/complaint/:id").get(
    allRoleAuth,
    async (req, res, next) => {
      try {
        await getComplaintByIdController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get complaints by user ID (user only)
  app.route("/complaints/user/:userId").get(
    userRoleAuth,
    async (req, res, next) => {
      try {
        await getComplaintsByUserIdController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Get complaints by status (admin only)
  app.route("/complaints/status/:status").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getComplaintsByStatusController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

  // Update complaint (admin only)
  app.route("/complaint/:id").put(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await updateComplaintController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );

   // Update complaint status (admin only)
  app.route("/complaint/status/:id").patch(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await updateComplaintStatusController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete complaint (admin only)
  app.route("/complaint/:id").delete(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await deleteComplaintController(req, res);
      } catch (error: any) {
        next(error);
      }
    }
  );
};

export default complaint;
