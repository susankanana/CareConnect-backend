import { Express } from "express";
import {
  createServiceController,
  getAllServicesController,
  getServiceByIdController,
  updateServiceController,
  deleteServiceController,
} from "./service.controller";

import {
  adminRoleAuth,
  bothRoleAuth,
} from "../middleware/bearerAuth";

const service = (app: Express) => {
  // Create a new service (admin or doctor)
  app.route("/service/register").post(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await createServiceController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get all services (public route)
  app.route("/services").get(
    async (req, res, next) => {
      try {
        await getAllServicesController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Get service by ID (admin only)
  app.route("/service/:id").get(
    adminRoleAuth,
    async (req, res, next) => {
      try {
        await getServiceByIdController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Update a service (admin or doctor)
  app.route("/service/:id").put(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await updateServiceController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );

  // Delete a service (admin or doctor)
  app.route("/service/:id").delete(
    bothRoleAuth,
    async (req, res, next) => {
      try {
        await deleteServiceController(req, res);
      } catch (error) {
        next(error);
      }
    }
  );
};

export default service;
