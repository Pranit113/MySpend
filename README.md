# MySpend – Personal Expense Tracker

A modern, production-ready personal expense and finance tracker designed with **[shadcn/ui](https://ui.shadcn.com/) + Tailwind CSS + React** (frontend) and **Spring Boot 3 + Neon PostgreSQL** (backend) with master password authentication and complete history tracking.

---

## Features

- **Secure Login & Datastore**: Master password protection stored encrypted (BCrypt) directly in Neon PostgreSQL.
- **Financial Dashboard**: Real-time Available Balance, Monthly Income, Monthly Expenses, Opening Balance, and Budget Tracker.
- **Transaction History**: Filter by date range and transaction type (`INCOME` / `EXPENSE`), edit records in a modal dialog, and delete entries.
- **Record Entries**: Distinct workflows for Expenses (with category tags) and Money Received (with source tags).
- **Monthly Budgeting**: Dynamic progress bar that warns when budget thresholds are exceeded.
- **PDF Financial Statement**: Generate clean, downloadable audit reports formatted with period opening balance, date-wise subtotals, and closing balance using Apache PDFBox.
- **Design System**: Built using **shadcn/ui** design foundation (Radix UI primitives, Lucide icons, accessible tokens, and customizable Tailwind classes).

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React, Vite, Tailwind CSS, [shadcn/ui](https://ui.shadcn.com/) (Radix UI primitives, Lucide React) |
| **Backend** | Java 21, Spring Boot 3, Spring Data JPA, Spring Security Crypto (BCrypt), Bean Validation |
| **Datastore** | Neon PostgreSQL (Free Tier) |
| **PDF Engine** | Apache PDFBox 3.x |

---

## Getting Started

### 1. Database Configuration (Neon PostgreSQL)

1. Create a free PostgreSQL database on [neon.tech](https://neon.tech).
2. Copy your connection URL, username, and password from the Neon dashboard.
3. Tables (`transactions` and `settings`) will be automatically created on startup via Hibernate (`ddl-auto=update`).

### 2. Run the Backend

Set your Neon database credentials:

**Windows (PowerShell):**
```powershell
$env:DB_URL      = "jdbc:postgresql://<neon-host>/<db>?sslmode=require"
$env:DB_USERNAME = "your_neon_username"
$env:DB_PASSWORD = "your_neon_password"

cd C:\Users\HP\.gemini\antigravity\scratch\myspend\backend
java -jar target\myspend-backend-1.0.0.jar
```

Or run via Maven:
```powershell
& "C:\Program Files\JetBrains\IntelliJ IDEA 2026.2.3\plugins\maven-plugin\lib\maven3\bin\mvn.cmd" spring-boot:run
```

The backend server starts on **http://localhost:8080**.

### 3. Run the Frontend

In a separate terminal:
```powershell
cd C:\Users\HP\.gemini\antigravity\scratch\myspend\myspend-frontend
npm run dev
```

The frontend launches on **http://localhost:5173**.

---

## First-Time Setup & Authentication

1. Open **http://localhost:5173**.
2. On your very first visit, you will be prompted to **Setup Master Password**.
3. Once set, your password is saved as a salted BCrypt hash inside the `settings` table on your Neon PostgreSQL database.
4. You can sign out at any time or update your master password from **Settings → Security & Master Password**.

---

## API Endpoints

### Authentication
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/auth/status` | Checks if master password is configured |
| `POST` | `/api/auth/setup` | Initializes master password |
| `POST` | `/api/auth/login` | Authenticates and returns session token |
| `POST` | `/api/auth/logout` | Revokes current session token |
| `POST` | `/api/auth/change-password` | Updates master password |

### Core & Financial
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/dashboard` | Dashboard metrics & 10 recent transactions |
| `GET` | `/api/transactions` | Filterable list (`startDate`, `endDate`, `type`) |
| `POST` | `/api/transactions` | Record new transaction |
| `PUT` | `/api/transactions/{id}` | Update existing transaction |
| `DELETE` | `/api/transactions/{id}` | Remove transaction record |
| `GET` | `/api/settings` | Retrieve budget and opening balance |
| `PUT` | `/api/settings` | Update budget and opening balance |
| `GET` | `/api/export/pdf` | Generate and download PDF statement |

---

## Project Structure

```
myspend/
├── README.md
├── backend/
│   ├── pom.xml
│   ├── target/myspend-backend-1.0.0.jar
│   └── src/main/java/com/myspend/
│       ├── MySpendApplication.java
│       ├── config/          # CORS, AuthFilter, TokenStore, GlobalExceptionHandler
│       ├── controller/      # AuthController, TransactionController, SettingsController, ExportController
│       ├── service/         # AuthService (BCrypt), TransactionService, SettingsService, PdfExportService
│       ├── repository/      # TransactionRepository, SettingsRepository
│       ├── entity/          # Transaction, Settings (with appPassword)
│       └── dto/             # LoginRequest, LoginResponse, TransactionRequest, DashboardResponse, etc.
└── myspend-frontend/
    ├── package.json
    ├── tailwind.config.js
    ├── components.json      # shadcn configuration
    └── src/
        ├── index.css        # Tailwind & shadcn theme tokens
        ├── api/             # api.js (token handling & fetch), fmt.js (₹ INR)
        ├── context/         # AuthContext.jsx
        ├── components/
        │   ├── Sidebar.jsx
        │   ├── TransactionForm.jsx
        │   └── ui/          # shadcn primitives: button, card, input, label, badge, dialog, progress, separator
        └── pages/
            ├── Login.jsx    # Setup & Login screen
            ├── Dashboard.jsx
            ├── Transactions.jsx
            ├── AddEntry.jsx
            └── Settings.jsx
```
