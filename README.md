# DPR Tracker – Employee Daily Progress Report System

Production-ready web application for tracking employee DPR (Daily Progress Report) status with admin dashboard, employee master, and Excel-style DPR matrix.

## Tech Stack

- **Frontend:** HTML5, CSS3, JavaScript, Bootstrap 5
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (Neon DB)
- **ORM:** Prisma
- **Auth:** JWT (hardcoded admin credentials)

## Features

- Admin login (`Admin` / `Admin@786`)
- Employee CRUD with search, pagination, sorting, validation
- Monthly DPR dashboard with status badges (Excellent → Critical)
- DPR detailing matrix with sticky columns, color-coded dropdowns, bulk save
- Joining-date visibility rules per month
- Excel/CSV export, dark mode, responsive sidebar layout

## Project Structure

```
├── client/          # Frontend pages, CSS, JS
├── server/          # Express API (controllers, routes, services)
├── prisma/          # Schema, migrations, seed
├── package.json
└── .env.example
```

## Prerequisites

- Node.js 18+
- Neon PostgreSQL database (or any PostgreSQL)

## Installation

1. **Clone and install dependencies**

```bash
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and set:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST/DB?sslmode=require"
JWT_SECRET="your-secret-key"
PORT=3000
NODE_ENV=development
```

3. **Neon DB setup**

- Create a project at [https://neon.tech](https://neon.tech)
- Copy the connection string into `DATABASE_URL`
- Ensure `?sslmode=require` is present

4. **Prisma setup**

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

Alternatively, for quick prototyping without migrations:

```bash
npm run db:push
npm run db:seed
```

## Run Commands

| Command | Description |
|---------|-------------|
| `npm start` | Start production server |
| `npm run dev` | Start with nodemon (development) |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run migrations |
| `npm run db:seed` | Seed sample employees & DPR data |
| `npm run db:studio` | Open Prisma Studio |

5. **Start the application**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

**Login:** Username `Admin` | Password `Admin@786`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| POST | `/api/auth/logout` | Logout |
| GET | `/api/employees` | List employees |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/:id` | Update employee |
| DELETE | `/api/employees/:id` | Delete employee |
| GET | `/api/dashboard/status` | Dashboard DPR status |
| GET | `/api/dpr?month=&year=` | DPR matrix data |
| POST | `/api/dpr/bulk-save` | Bulk save DPR entries |
| GET | `/api/dpr/status-summary` | Status summary counts |

Protected routes require `Authorization: Bearer <token>` header.

## DPR Status Rules

Based only on **Not Filled** count for the selected month:

| Not Filled | Status |
|------------|--------|
| 0 | Excellent (green) |
| 1–2 | Best (blue) |
| 3–5 | Better (cyan) |
|  6–7 | Good (yellow) |
| 8–10 | Improvement (orange) |
| >10 | Critical (red) |

Holiday, Comp Off, and NA are ignored in status calculation.

## Deployment

1. Set `NODE_ENV=production` and a strong `JWT_SECRET`
2. Run migrations on production database: `npx prisma migrate deploy`
3. Use a process manager (PM2, Docker, or cloud platform)
4. Serve on port defined by `PORT` (default 3000)

### Example PM2

```bash
npm run db:generate
npx prisma migrate deploy
npm start
```

## License

ISC
