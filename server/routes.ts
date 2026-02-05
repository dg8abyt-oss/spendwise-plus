import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertTrackerSchema, insertExpenseSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  app.post("/api/auth/register", async (req, res) => {
    try {
      const data = insertUserSchema.parse(req.body);
      const existing = await storage.getUserByPin(data.pin);
      if (existing) {
        return res.status(400).json({ message: "This PIN is already in use" });
      }
      const user = await storage.createUser(data);
      res.json({ user });
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { pin } = req.body;
      if (!pin || typeof pin !== "string" || pin.length !== 4) {
        return res.status(400).json({ message: "Invalid PIN format" });
      }
      const user = await storage.getUserByPin(pin);
      if (!user) {
        return res.status(401).json({ message: "Invalid PIN" });
      }
      res.json({ user });
    } catch (err) {
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.get("/api/trackers", async (req, res) => {
    try {
      const userId = req.query.userId as string;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      const trackers = await storage.getTrackersByUserId(userId);
      res.json(trackers);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch trackers" });
    }
  });

  app.post("/api/trackers", async (req, res) => {
    try {
      const { userId, ...trackerData } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID required" });
      }
      const data = insertTrackerSchema.parse(trackerData);
      const tracker = await storage.createTracker(userId, data);
      res.json(tracker);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create tracker" });
    }
  });

  app.delete("/api/trackers/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteTracker(id);
      if (!deleted) {
        return res.status(404).json({ message: "Tracker not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete tracker" });
    }
  });

  app.get("/api/expenses", async (req, res) => {
    try {
      const trackerId = req.query.trackerId as string;
      if (!trackerId) {
        return res.status(400).json({ message: "Tracker ID required" });
      }
      const expenses = await storage.getExpensesByTrackerId(trackerId);
      res.json(expenses);
    } catch (err) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.post("/api/expenses", async (req, res) => {
    try {
      const data = insertExpenseSchema.parse(req.body);
      const tracker = await storage.getTrackerById(data.trackerId);
      if (!tracker) {
        return res.status(404).json({ message: "Tracker not found" });
      }
      const expense = await storage.createExpense(data);
      res.json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteExpense(id);
      if (!deleted) {
        return res.status(404).json({ message: "Expense not found" });
      }
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ message: "Failed to delete expense" });
    }
  });

  return httpServer;
}
