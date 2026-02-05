import { z } from "zod";

export interface User {
  id: string;
  pin: string;
  preferredCurrency: "INR" | "USD";
  createdAt: string;
}

export interface Tracker {
  id: string;
  userId: string;
  name: string;
  currency: "INR" | "USD";
  createdAt: string;
}

export interface Expense {
  id: string;
  trackerId: string;
  amount: number;
  category: string;
  description: string;
  date: string;
  createdAt: string;
}

export const insertUserSchema = z.object({
  pin: z.string().length(4).regex(/^\d{4}$/, "PIN must be exactly 4 digits"),
  preferredCurrency: z.enum(["INR", "USD"]).default("USD"),
});

export const insertTrackerSchema = z.object({
  name: z.string().min(1, "Tracker name is required").max(50),
  currency: z.enum(["INR", "USD"]),
});

export const insertExpenseSchema = z.object({
  trackerId: z.string().min(1),
  amount: z.number().positive("Amount must be positive"),
  category: z.string().min(1, "Category is required").max(50),
  description: z.string().max(200).optional().default(""),
  date: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertTracker = z.infer<typeof insertTrackerSchema>;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export const currencies = {
  INR: { symbol: "₹", name: "Indian Rupees" },
  USD: { symbol: "$", name: "US Dollars" },
} as const;
