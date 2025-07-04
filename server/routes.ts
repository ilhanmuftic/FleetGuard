import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertVehicleRequestSchema } from "@shared/schema";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const approveRequestSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  requestId: z.number(),
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In production, use proper session management
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(409).json({ message: "User already exists" });
      }

      const user = await storage.createUser(userData);
      const { password: _, ...userWithoutPassword } = user;
      res.status(201).json({ user: userWithoutPassword });
    } catch (error) {
      res.status(400).json({ message: "Invalid request data" });
    }
  });

  // Vehicle routes
  app.get("/api/vehicles", async (req, res) => {
    try {
      const vehicles = await storage.getAllVehicles();
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicles" });
    }
  });

  app.get("/api/vehicles/available", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ message: "Start date and end date are required" });
      }

      const start = new Date(startDate as string);
      const end = new Date(endDate as string);
      
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return res.status(400).json({ message: "Invalid date format" });
      }

      const vehicles = await storage.getAvailableVehicles(start, end);
      res.json(vehicles);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch available vehicles" });
    }
  });

  // Request routes
  app.get("/api/requests", async (req, res) => {
    try {
      const { userId, status } = req.query;

      let requests;
      if (userId) {
        requests = await storage.getUserRequests(Number(userId));
      } else if (status === "pending") {
        requests = await storage.getPendingRequests();
      } else {
        requests = await storage.getAllRequests();
      }

      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch requests" });
    }
  });

  app.post("/api/requests", async (req, res) => {
    try {
      const requestData = insertVehicleRequestSchema.parse(req.body);
      
      // Validate dates
      const startDate = new Date(requestData.startDate);
      const endDate = new Date(requestData.endDate);
      
      if (startDate >= endDate) {
        return res.status(400).json({ message: "End date must be after start date" });
      }

      if (startDate < new Date()) {
        return res.status(400).json({ message: "Start date cannot be in the past" });
      }

      // Check vehicle availability
      const availableVehicles = await storage.getAvailableVehicles(startDate, endDate);
      const isVehicleAvailable = availableVehicles.some(v => v.id === requestData.vehicleId);
      
      if (!isVehicleAvailable) {
        return res.status(409).json({ message: "Vehicle is not available for the selected dates" });
      }

      const request = await storage.createRequest(requestData);
      res.status(201).json(request);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create request" });
    }
  });

  app.patch("/api/requests/:id/status", async (req, res) => {
    try {
      const requestId = Number(req.params.id);
      const { status } = approveRequestSchema.parse({ 
        ...req.body, 
        requestId 
      });

      let accessCode: string | undefined;
      if (status === "approved") {
        // Generate 4-digit access code
        accessCode = Math.floor(1000 + Math.random() * 9000).toString();
      }

      // In a real app, get admin ID from session
      const adminId = 1; // Temporary for demo

      const updatedRequest = await storage.updateRequestStatus(
        requestId, 
        status, 
        adminId, 
        accessCode
      );

      // Get full request details
      const requestWithDetails = await storage.getRequest(requestId);
      
      res.json(requestWithDetails);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data" });
      }
      res.status(500).json({ message: "Failed to update request status" });
    }
  });

  // Dashboard stats
  app.get("/api/stats/vehicles", async (req, res) => {
    try {
      const stats = await storage.getVehicleStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch vehicle stats" });
    }
  });

  app.get("/api/stats/pending-requests", async (req, res) => {
    try {
      const count = await storage.getPendingRequestsCount();
      res.json({ count });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch pending requests count" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
