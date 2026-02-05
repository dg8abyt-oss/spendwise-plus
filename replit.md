# SpendWise - Spending Tracker

## Overview
A beautiful spending tracker application with pie chart visualization, multiple trackers, currency support (INR/USD), and 4-digit PIN authentication for cross-device access.

## Features
- **PIN Authentication**: 4-digit PIN to access data from any device
- **Multiple Trackers**: Create separate trackers for different budgets (e.g., Monthly, Vacation)
- **Currency Support**: Toggle between Indian Rupees (₹) and US Dollars ($)
- **Pie Chart Visualization**: Beautiful breakdown of spending by category
- **Custom Categories**: Users type their own expense categories
- **Database Storage**: All data persisted in PostgreSQL

## Tech Stack
- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js (development) / Vercel Serverless (production)
- **Storage**: PostgreSQL database
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
├── routes.ts               # API endpoints (Express)
└── storage.ts              # PostgreSQL storage implementation
api/                        # Vercel serverless functions
├── _db.ts                  # Database connection
├── auth/
│   ├── login.ts
│   └── register.ts
├── trackers/
│   ├── index.ts
│   └── [id].ts
└── expenses/
    ├── index.ts
    └── [id].ts
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

## Vercel Deployment

### Prerequisites
1. A PostgreSQL database (Vercel Postgres, Supabase, Neon, etc.)
2. Vercel account

### Deployment Steps
1. Push this code to a GitHub repository
2. Import the project in Vercel
3. Add the following environment variable:
   - `DATABASE_URL` or `POSTGRES_URL` - Your PostgreSQL connection string
4. Deploy!

### Database Setup
The app automatically creates the required tables on first connection:
- `users` - Stores user PINs and preferences
- `trackers` - Stores spending trackers
- `expenses` - Stores individual expenses

### Build Command
```bash
npm run build
```

### Output Directory
```
dist/public
```
