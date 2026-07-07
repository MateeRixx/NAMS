# NAMS (NewsFlow) — Newspaper Agency Management System

A full-stack SaaS platform for newspaper and magazine distribution agencies to manage subscriptions, deliveries, billing, and customer communications.

## What It Does

- **Customer Portal** — Customers register, subscribe to newspapers/magazines (daily, weekly, monthly), manage delivery addresses, track invoices, make payments (Razorpay), raise complaints, and request article publications or bulk distribution.
- **Admin Dashboard** — Manage customers, products, pricing (per-day rates), delivery zones, additional billing charges. Generate monthly invoices automatically with day-wise prorated billing. View reports (revenue, products, complaints, growth, collections). Send manual notifications via Email/WhatsApp/Push.
- **Automated Billing** — Per-day price calculation using product base price + day-of-week overrides. Monthly invoice generation with delivery charges, billing charges (fixed/percentage), complaint credits, and SLA discounts. Invoices delivered via PDF and email.
- **Multi-Agency** — Each agency operates independently with its own customers, products, zones, and billing configuration.
- **Notifications** — Email (Resend), WhatsApp (Twilio), and Web Push for invoice alerts, complaint updates, and manual broadcasts.
- **Mobile Ready** — Android apps via Capacitor wrapping the React/Vite frontends.

## Tech Stack

| Layer | Technology |
|---|---|
| **Runtime** | Node.js 20+, TypeScript |
| **Backend** | Express.js, Prisma ORM, PostgreSQL, Redis, BullMQ |
| **Frontend** | React 19, Vite, React Router |
| **Mobile** | Capacitor (Android) |
| **Payment** | Razorpay |
| **Email** | Resend |
| **Messaging** | Twilio (WhatsApp), Web Push API |
| **PDF** | PDFKit |
| **Infra** | Docker, Docker Compose |
| **CI/CD** | GitHub Actions |

## Architecture

```
nams/
├── apps/
│   ├── backend/          Express API — auth, billing, customers, products, etc.
│   ├── admin/            Admin dashboard (React + Vite + Capacitor)
│   └── customer/         Customer portal (React + Vite + Capacitor)
├── packages/
│   ├── database/         Prisma schema, migrations, seed, client
│   ├── shared/           Shared types, constants, error classes
│   └── config/           Shared ESLint + TS config
├── Dockerfile            Multi-stage build (production)
├── docker-compose.yml    Dev services (postgres, redis)
└── docker-compose.prod.yml  Production stack
```

## Deployment

| Component | Platform | URL |
|---|---|---|
| **Backend API** | AWS EC2 (Mumbai) | `https://api.modernakhbaar.indevs.in` |
| **Admin Dashboard** | Vercel | `https://admin.modernakhbaar.indevs.in` |
| **Customer Portal** | Vercel | `https://modernakhbaar.indevs.in` |
| **Database** | Neon (PostgreSQL, Singapore) | Cloud |
| **Redis** | Upstash Redis Cloud | Cloud |
| **Container** | Docker on EC2, Nginx reverse proxy | Port 80 → 3000 |

Backend runs in Docker on EC2 behind Nginx. Frontends are deployed on Vercel and auto-deploy from `main`.

## Key Features

- **Per-day pricing** — Set different prices for each day of the week per product; billing prorates across the month
- **Delivery zones** — Define serviceable areas with monthly delivery charges
- **Additional charges** — Add fixed or percentage-based billing charges
- **Complaint management** — Customers raise complaints; admin tracks resolution timeline
- **Invoice PDFs** — Auto-generated with customer details, line items, delivery charges, and adjustments
- **SLA discounts** — Automatic 15% discount if 3+ complaints are unresolved in a billing period
- **Audit logging** — All admin actions logged with before/after values
- **OTP auth** — Email-based OTP for customer registration and password reset
