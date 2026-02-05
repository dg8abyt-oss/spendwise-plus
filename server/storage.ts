import type { User, Tracker, Expense, InsertUser, InsertTracker, InsertExpense } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

interface DataStore {
  users: User[];
  trackers: Tracker[];
  expenses: Expense[];
}

const DATA_FILE = path.join(process.cwd(), "data.json");

function loadData(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("Error loading data file:", err);
  }
  return { users: [], trackers: [], expenses: [] };
}

function saveData(data: DataStore): void {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Error saving data file:", err);
  }
}

export interface IStorage {
  getUserByPin(pin: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  getTrackersByUserId(userId: string): Promise<Tracker[]>;
  getTrackerById(id: string): Promise<Tracker | undefined>;
  createTracker(userId: string, tracker: InsertTracker): Promise<Tracker>;
  deleteTracker(id: string): Promise<boolean>;
  
  getExpensesByTrackerId(trackerId: string): Promise<Expense[]>;
  getExpenseById(id: string): Promise<Expense | undefined>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  deleteExpense(id: string): Promise<boolean>;
}

export class JsonStorage implements IStorage {
  private data: DataStore;

  constructor() {
    this.data = loadData();
  }

  private save(): void {
    saveData(this.data);
  }

  async getUserByPin(pin: string): Promise<User | undefined> {
    return this.data.users.find((u) => u.pin === pin);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = {
      id: randomUUID(),
      pin: insertUser.pin,
      preferredCurrency: insertUser.preferredCurrency || "USD",
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(user);
    this.save();
    return user;
  }

  async getTrackersByUserId(userId: string): Promise<Tracker[]> {
    return this.data.trackers.filter((t) => t.userId === userId);
  }

  async getTrackerById(id: string): Promise<Tracker | undefined> {
    return this.data.trackers.find((t) => t.id === id);
  }

  async createTracker(userId: string, insertTracker: InsertTracker): Promise<Tracker> {
    const tracker: Tracker = {
      id: randomUUID(),
      userId,
      name: insertTracker.name,
      currency: insertTracker.currency,
      createdAt: new Date().toISOString(),
    };
    this.data.trackers.push(tracker);
    this.save();
    return tracker;
  }

  async deleteTracker(id: string): Promise<boolean> {
    const index = this.data.trackers.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.data.trackers.splice(index, 1);
    this.data.expenses = this.data.expenses.filter((e) => e.trackerId !== id);
    this.save();
    return true;
  }

  async getExpensesByTrackerId(trackerId: string): Promise<Expense[]> {
    return this.data.expenses.filter((e) => e.trackerId === trackerId);
  }

  async getExpenseById(id: string): Promise<Expense | undefined> {
    return this.data.expenses.find((e) => e.id === id);
  }

  async createExpense(insertExpense: InsertExpense): Promise<Expense> {
    const expense: Expense = {
      id: randomUUID(),
      trackerId: insertExpense.trackerId,
      amount: insertExpense.amount,
      category: insertExpense.category,
      description: insertExpense.description || "",
      date: insertExpense.date,
      createdAt: new Date().toISOString(),
    };
    this.data.expenses.push(expense);
    this.save();
    return expense;
  }

  async deleteExpense(id: string): Promise<boolean> {
    const index = this.data.expenses.findIndex((e) => e.id === id);
    if (index === -1) return false;
    this.data.expenses.splice(index, 1);
    this.save();
    return true;
  }
}

export const storage = new JsonStorage();
