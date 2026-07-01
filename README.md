# Vehicle Spare Parts Stock Management Tool

Full-stack inventory system for managing vehicle spare parts stock (in/out) organized by vehicle brand.

- `server/` — Node.js + Express + Prisma API (PostgreSQL hosted on [Neon](https://neon.tech))
- `client/` — React + Vite frontend (Tailwind CSS)

## Features
- Login with JWT, two roles: **ADMIN** (full control) and **STAFF** (stock in/out + view only)
- Manage Brands, Categories and Spare Parts (Products)
- Record Stock In (receiving) and Stock Out (issuing/selling), tracked per part and per vehicle brand
- Full stock movement history/audit trail with filters (brand, part, type, date range)
- Dashboard: total parts, total stock value, low-stock count, stock value by brand, recent movements
- Low-stock alerts based on a per-part reorder level

## Prerequisites
- Node.js 18+ installed
- A free [Neon](https://neon.tech) account (or any hosted PostgreSQL) with a project/database created

## 1. Get your Neon connection strings
1. Create a Neon project and database.
2. From the Neon dashboard, copy the **pooled connection string** (host contains `-pooler`) — this is your `DATABASE_URL`.
3. Also copy the **direct connection string** (no `-pooler`) — this is your `DIRECT_URL`. Prisma needs the direct connection for migrations.

## 2. Backend setup

```bash
cd server
npm install
cp .env.example .env
# edit .env and paste in your DATABASE_URL, DIRECT_URL, and a random JWT_SECRET

npx prisma migrate dev --name init   # creates tables in your Neon database
npx prisma db seed                   # creates a default admin user + sample brands/parts

npm run dev                          # starts the API on http://localhost:5000
```

Default admin login created by the seed script:
- **username:** `admin`
- **password:** `admin123`

Change this password after first login (or edit `prisma/seed.js` before seeding).

## 3. Frontend setup

```bash
cd client
npm install
cp .env.example .env
# .env already points VITE_API_URL at http://localhost:5000/api, which matches the default server port

npm run dev                          # starts the app on http://localhost:5173
```

## Running both together
Open two terminals — one running `npm run dev` in `server/`, one running `npm run dev` in `client/` — then visit `http://localhost:5173` and log in with the admin credentials above.

## Making schema changes later
After editing `server/prisma/schema.prisma`, run:
```bash
cd server
npx prisma migrate dev --name <describe-the-change>
```

## Project structure
```
server/
  prisma/schema.prisma   Data model (User, Brand, Category, Product, StockMovement)
  prisma/seed.js         Seeds an admin user + sample brands/categories/parts
  src/routes             Express routers per resource
  src/controllers        Route handlers, including the stock in/out transaction logic
  src/middleware         JWT auth, role guard, centralized error handler
client/
  src/pages              One page per screen (Login, Dashboard, Products, Stock In/Out, History, Brands, Categories, Users)
  src/api                Thin axios wrappers per resource
  src/context/AuthContext.jsx   Auth state, token persistence
  src/components         Shared layout, forms, and table/modal/pagination pieces
```
