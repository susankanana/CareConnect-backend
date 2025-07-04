import { Request, Response } from "express";
import {
  createComplaintService,
  getComplaintsService,
  getComplaintByIdService,
  getComplaintsByUserIdService,
  getComplaintsByStatusService,
  updateComplaintService,
  updateComplaintStatusService,
  deleteComplaintService,
} from "./complaint.service";

// Create a new complaint
export const createComplaintController = async (req: Request, res: Response) => {
  try {
    const complaint = req.body;
    const created = await createComplaintService(complaint);

    if (!created) {
      return res.status(400).json({ message: "Complaint could not be created" });
    }

    return res.status(201).json({ data: created, message: "Complaint created successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all complaints
export const getComplaintsController = async (_req: Request, res: Response) => {
  try {
    const complaints = await getComplaintsService();

    if (!complaints || complaints.length === 0) {
      return res.status(404).json({ message: "No complaints found" });
    }

    return res.status(200).json({ data: complaints });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get complaint by ID
export const getComplaintByIdController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const complaint = await getComplaintByIdService(id);
    if (!complaint) return res.status(404).json({ message: "Complaint not found" });

    return res.status(200).json({ data: complaint });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get complaints by user ID
export const getComplaintsByUserIdController = async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    if (isNaN(userId)) return res.status(400).json({ message: "Invalid user ID" });

    const complaints = await getComplaintsByUserIdService(userId);
    return res.status(200).json({ data: complaints });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Get complaints by status
export const getComplaintsByStatusController = async (req: Request, res: Response) => {
  try {
    const { status } = req.params;
    const complaints = await getComplaintsByStatusService(status);

    return res.status(200).json({ data: complaints });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update complaint by ID
export const updateComplaintController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const existing = await getComplaintByIdService(id);
    if (!existing) return res.status(404).json({ message: "Complaint not found" });

    const updated = await updateComplaintService(id, req.body);
    return res.status(200).json({ message: updated });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Update complaint status
const validComplaintStatuses = ["Open", "In Progress", "Resolved", "Closed"];

export const updateComplaintStatusController = async (req: Request, res: Response) => {
  try {
    const complaintId = parseInt(req.params.id);
    const { status } = req.body;

    // Validate status
    if (!validComplaintStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid complaint status value" });
    }

    // Check if complaint exists
    const complaint = await getComplaintByIdService(complaintId);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    // Ensure the user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const role = req.user.role;

    // Only admins can update complaint status
    if (role !== "admin") {
      return res.status(403).json({
        message: "Only admins can update complaint statuses",
      });
    }

    // Update status
    const updated = await updateComplaintStatusService(complaintId, status as any);
    return res.status(200).json({ message: "Complaint status updated", data: updated });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};

// Delete complaint by ID
export const deleteComplaintController = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });

    const existing = await getComplaintByIdService(id);
    if (!existing) return res.status(404).json({ message: "Complaint not found" });

    await deleteComplaintService(id);
    return res.status(204).json({ message: "Complaint deleted successfully" });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
};
