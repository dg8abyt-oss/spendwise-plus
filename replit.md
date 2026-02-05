# SpendWise - Spending Tracker

## Overview
A beautiful spending tracker application with pie chart visualization, multiple trackers, currency support (INR/USD), and 4-digit PIN authentication for cross-device access.

## Features
- **PIN Authentication**: 4-digit PIN to access data from any device
- **Multiple Trackers**: Create separate trackers for different budgets (e.g., Monthly, Vacation)
- **Currency Support**: Toggle between Indian Rupees (₹) and US Dollars ($)
- **Pie Chart Visualization**: Beautiful breakdown of spending by category
- **Custom Categories**: Users type their own expense categories
- **JSON Storage**: All data persisted in a local JSON file

## Tech Stack
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js
- **Storage**: JSON file (data.json)
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts for pie chart visualization

## Project Structure
```
client/src/
├── App.tsx                 # Main app with auth routing
├── components/
│   ├── pin-input.tsx       # 4-digit PIN input component
│   └── theme-provider.tsx  # Dark/light theme context
├── lib/
│   └── auth-context.tsx    # Authentication state management
├── pages/
│   ├── auth.tsx            # Login/Register page
│   └── dashboard.tsx       # Main dashboard with pie chart
server/
├── routes.ts               # API endpoints
└── storage.ts              # JSON file storage implementation
shared/
└── schema.ts               # TypeScript types and Zod schemas
```

## API Endpoints
- `POST /api/auth/register` - Create account with PIN
- `POST /api/auth/login` - Login with PIN
- `GET /api/trackers?userId=` - Get user's trackers
- `POST /api/trackers` - Create new tracker
- `DELETE /api/trackers/:id` - Delete tracker
- `GET /api/expenses?trackerId=` - Get tracker's expenses
- `POST /api/expenses` - Add expense
- `DELETE /api/expenses/:id` - Delete expense

## Data Models
- **User**: id, pin, preferredCurrency, createdAt
- **Tracker**: id, userId, name, currency, createdAt
- **Expense**: id, trackerId, amount, category, description, date, createdAt

## Theme
- Primary color: Purple/Indigo (hsl 250)
- Modern, clean design with dark mode support
