import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/components/theme-provider";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Tracker, Expense, InsertTracker, InsertExpense } from "@shared/schema";
import { currencies } from "@shared/schema";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Wallet, Plus, LogOut, Moon, Sun, Trash2, IndianRupee, DollarSign, 
  TrendingUp, Calendar, Tag, ChevronRight, PieChartIcon, LayoutList
} from "lucide-react";
import { format } from "date-fns";

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(250, 60%, 45%)",
  "hsl(180, 70%, 40%)",
  "hsl(60, 80%, 45%)",
];

export default function Dashboard() {
  const { user, currentTracker, setCurrentTracker, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const [newTrackerName, setNewTrackerName] = useState("");
  const [newTrackerCurrency, setNewTrackerCurrency] = useState<"INR" | "USD">(user?.preferredCurrency || "USD");
  const [isTrackerDialogOpen, setIsTrackerDialogOpen] = useState(false);
  const [isExpenseDialogOpen, setIsExpenseDialogOpen] = useState(false);
  const [expenseAmount, setExpenseAmount] = useState("");
  const [expenseCategory, setExpenseCategory] = useState("");
  const [expenseDescription, setExpenseDescription] = useState("");
  const [expenseDate, setExpenseDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: trackers, isLoading: trackersLoading } = useQuery<Tracker[]>({
    queryKey: ["/api/trackers", user?.id],
    queryFn: async () => {
      const res = await fetch(`/api/trackers?userId=${user?.id}`);
      if (!res.ok) throw new Error("Failed to fetch trackers");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: expenses, isLoading: expensesLoading } = useQuery<Expense[]>({
    queryKey: ["/api/expenses", currentTracker?.id],
    queryFn: async () => {
      const res = await fetch(`/api/expenses?trackerId=${currentTracker?.id}`);
      if (!res.ok) throw new Error("Failed to fetch expenses");
      return res.json();
    },
    enabled: !!currentTracker,
  });

  const createTrackerMutation = useMutation({
    mutationFn: async (data: InsertTracker) => {
      return apiRequest("POST", "/api/trackers", { ...data, userId: user?.id });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trackers"] });
      setNewTrackerName("");
      setIsTrackerDialogOpen(false);
      toast({ title: "Tracker created!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to create tracker" });
    },
  });

  const deleteTrackerMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/trackers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trackers"] });
      if (currentTracker) setCurrentTracker(null);
      toast({ title: "Tracker deleted" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete tracker" });
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      return apiRequest("POST", "/api/expenses", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      setExpenseAmount("");
      setExpenseCategory("");
      setExpenseDescription("");
      setExpenseDate(format(new Date(), "yyyy-MM-dd"));
      setIsExpenseDialogOpen(false);
      toast({ title: "Expense added!" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to add expense" });
    },
  });

  const deleteExpenseMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/expenses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "Expense deleted" });
    },
    onError: () => {
      toast({ variant: "destructive", title: "Failed to delete expense" });
    },
  });

  const handleCreateTracker = () => {
    if (!newTrackerName.trim()) return;
    createTrackerMutation.mutate({
      name: newTrackerName.trim(),
      currency: newTrackerCurrency,
    });
  };

  const handleCreateExpense = () => {
    if (!expenseAmount || !expenseCategory.trim() || !currentTracker) return;
    createExpenseMutation.mutate({
      trackerId: currentTracker.id,
      amount: parseFloat(expenseAmount),
      category: expenseCategory.trim(),
      description: expenseDescription.trim(),
      date: expenseDate,
    });
  };

  const getCurrencySymbol = (cur: "INR" | "USD") => currencies[cur].symbol;

  const categoryData = expenses?.reduce((acc, expense) => {
    const existing = acc.find((item) => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  const totalSpent = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  if (!currentTracker && trackers && trackers.length > 0) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">SpendWise</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Select a Tracker</h2>
              <p className="text-muted-foreground">Choose a spending tracker or create a new one</p>
            </div>

            <div className="space-y-3 mb-6">
              {trackers.map((tracker) => (
                <Card 
                  key={tracker.id} 
                  className="hover-elevate cursor-pointer transition-all"
                  onClick={() => setCurrentTracker(tracker)}
                  data-testid={`tracker-card-${tracker.id}`}
                >
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        {tracker.currency === "INR" ? (
                          <IndianRupee className="w-5 h-5 text-primary" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">{tracker.name}</p>
                        <p className="text-sm text-muted-foreground">{currencies[tracker.currency].name}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTrackerMutation.mutate(tracker.id);
                        }}
                        data-testid={`button-delete-tracker-${tracker.id}`}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={isTrackerDialogOpen} onOpenChange={setIsTrackerDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full" size="lg" data-testid="button-new-tracker">
                  <Plus className="mr-2 h-5 w-5" />
                  Create New Tracker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tracker</DialogTitle>
                  <DialogDescription>Set up a new spending tracker with your preferred currency</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tracker-name">Tracker Name</Label>
                    <Input
                      id="tracker-name"
                      placeholder="e.g., Monthly Budget, Vacation"
                      value={newTrackerName}
                      onChange={(e) => setNewTrackerName(e.target.value)}
                      data-testid="input-tracker-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={newTrackerCurrency === "USD" ? "default" : "outline"}
                        onClick={() => setNewTrackerCurrency("USD")}
                        data-testid="button-new-tracker-usd"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        USD
                      </Button>
                      <Button
                        type="button"
                        variant={newTrackerCurrency === "INR" ? "default" : "outline"}
                        onClick={() => setNewTrackerCurrency("INR")}
                        data-testid="button-new-tracker-inr"
                      >
                        <IndianRupee className="mr-2 h-4 w-4" />
                        INR
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateTracker} disabled={!newTrackerName.trim()} data-testid="button-create-tracker">
                    Create Tracker
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    );
  }

  if (!currentTracker) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-xl font-bold">SpendWise</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto text-center">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <PieChartIcon className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Trackers Yet</h2>
            <p className="text-muted-foreground mb-8">Create your first spending tracker to get started</p>
            
            <Dialog open={isTrackerDialogOpen} onOpenChange={setIsTrackerDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" data-testid="button-new-tracker">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Your First Tracker
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Tracker</DialogTitle>
                  <DialogDescription>Set up a new spending tracker with your preferred currency</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="tracker-name">Tracker Name</Label>
                    <Input
                      id="tracker-name"
                      placeholder="e.g., Monthly Budget, Vacation"
                      value={newTrackerName}
                      onChange={(e) => setNewTrackerName(e.target.value)}
                      data-testid="input-tracker-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Currency</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant={newTrackerCurrency === "USD" ? "default" : "outline"}
                        onClick={() => setNewTrackerCurrency("USD")}
                        data-testid="button-new-tracker-usd"
                      >
                        <DollarSign className="mr-2 h-4 w-4" />
                        USD
                      </Button>
                      <Button
                        type="button"
                        variant={newTrackerCurrency === "INR" ? "default" : "outline"}
                        onClick={() => setNewTrackerCurrency("INR")}
                        data-testid="button-new-tracker-inr"
                      >
                        <IndianRupee className="mr-2 h-4 w-4" />
                        INR
                      </Button>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button onClick={handleCreateTracker} disabled={!newTrackerName.trim()} data-testid="button-create-tracker">
                    Create Tracker
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentTracker(null)}
              className="mr-1"
              data-testid="button-back-trackers"
            >
              <ChevronRight className="h-4 w-4 rotate-180 mr-1" />
              Trackers
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              {currentTracker.currency === "INR" ? (
                <IndianRupee className="w-4 h-4 text-primary" />
              ) : (
                <DollarSign className="w-4 h-4 text-primary" />
              )}
              <span className="font-semibold">{currentTracker.name}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleTheme} data-testid="button-theme-toggle">
              {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={logout} data-testid="button-logout">
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg">Spending Overview</CardTitle>
                <CardDescription>Breakdown by category</CardDescription>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total Spent</p>
                <p className="text-2xl font-bold text-primary">
                  {getCurrencySymbol(currentTracker.currency)}{totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="h-64 flex items-center justify-center">
                  <Skeleton className="h-48 w-48 rounded-full" />
                </div>
              ) : categoryData.length > 0 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        labelLine={false}
                      >
                        {categoryData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [
                          `${getCurrencySymbol(currentTracker.currency)}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                          "Amount"
                        ]}
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <PieChartIcon className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No expenses yet</p>
                  <p className="text-sm text-muted-foreground/70">Add your first expense to see the chart</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-2">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <LayoutList className="w-5 h-5" />
                  Expenses
                </CardTitle>
                <CardDescription>{expenses?.length || 0} transactions</CardDescription>
              </div>
              <Dialog open={isExpenseDialogOpen} onOpenChange={setIsExpenseDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" data-testid="button-add-expense">
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Expense</DialogTitle>
                    <DialogDescription>Record a new expense in {currentTracker.name}</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="expense-amount">Amount ({getCurrencySymbol(currentTracker.currency)})</Label>
                      <Input
                        id="expense-amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={expenseAmount}
                        onChange={(e) => setExpenseAmount(e.target.value)}
                        data-testid="input-expense-amount"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-category">Category</Label>
                      <Input
                        id="expense-category"
                        placeholder="e.g., Food, Transport, Shopping"
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        data-testid="input-expense-category"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-description">Description (optional)</Label>
                      <Input
                        id="expense-description"
                        placeholder="What was this for?"
                        value={expenseDescription}
                        onChange={(e) => setExpenseDescription(e.target.value)}
                        data-testid="input-expense-description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expense-date">Date</Label>
                      <Input
                        id="expense-date"
                        type="date"
                        value={expenseDate}
                        onChange={(e) => setExpenseDate(e.target.value)}
                        data-testid="input-expense-date"
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="outline">Cancel</Button>
                    </DialogClose>
                    <Button 
                      onClick={handleCreateExpense} 
                      disabled={!expenseAmount || !expenseCategory.trim()}
                      data-testid="button-save-expense"
                    >
                      Add Expense
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {expensesLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : expenses && expenses.length > 0 ? (
                <ScrollArea className="h-80">
                  <div className="space-y-2">
                    {expenses.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((expense) => (
                      <div
                        key={expense.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 group"
                        data-testid={`expense-item-${expense.id}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Tag className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {expense.category}
                              </Badge>
                            </div>
                            {expense.description && (
                              <p className="text-sm text-muted-foreground truncate">{expense.description}</p>
                            )}
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(expense.date), "MMM d, yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg whitespace-nowrap">
                            {getCurrencySymbol(currentTracker.currency)}{expense.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteExpenseMutation.mutate(expense.id)}
                            data-testid={`button-delete-expense-${expense.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <TrendingUp className="w-12 h-12 text-muted-foreground/30 mb-4" />
                  <p className="text-muted-foreground">No expenses recorded</p>
                  <p className="text-sm text-muted-foreground/70">Click "Add" to record your first expense</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {categoryData.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Category Summary</CardTitle>
              <CardDescription>Total spending per category</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {categoryData.sort((a, b) => b.value - a.value).map((cat, index) => (
                  <div
                    key={cat.name}
                    className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                  >
                    <div
                      className="w-3 h-10 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{cat.name}</p>
                      <p className="text-lg font-semibold text-primary">
                        {getCurrencySymbol(currentTracker.currency)}{cat.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
