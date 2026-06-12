# SYSTEM_ARCHITECTURE.md

# NewsFlow System Architecture

Version: 1.0

---

# Purpose

This document defines the technical architecture of NewsFlow.

It explains:

* System boundaries
* Infrastructure components
* Deployment topology
* Service responsibilities
* Multi-tenant strategy
* External integrations

This document must be treated as the architecture source of truth.

---

# Architecture Philosophy

NewsFlow is a business-critical SaaS platform.

The architecture must prioritize:

1. Reliability
2. Maintainability
3. Auditability
4. Scalability
5. Simplicity

Avoid unnecessary microservices.

Prefer a modular monolith until scale requires separation.

---

# High-Level Architecture

```
                     ┌──────────────────┐
                     │ Customer Mobile  │
                     │ App (Capacitor)  │
                     └────────┬─────────┘
                              │
                              ▼

                     ┌──────────────────┐
                     │  API Backend     │
                     │ (Express TS)     │
                     └────────┬─────────┘

      ┌───────────────────────┼───────────────────────┐
      ▼                       ▼                       ▼
```

┌────────────────┐    ┌────────────────┐     ┌────────────────┐
│ PostgreSQL     │    │ Redis          │     │ BullMQ Jobs    │
│ Primary DB     │    │ Cache/Queues   │     │ Async Workers  │
└────────────────┘    └────────────────┘     └────────────────┘

```
                              │
                              ▼

                    ┌──────────────────┐
                    │ Cloudflare R2    │
                    │ File Storage     │
                    └──────────────────┘

                              │
                              ▼

                    ┌──────────────────┐
                    │ External Services│
                    └──────────────────┘

                          ├── Firebase Auth
                          ├── WhatsApp API
                          ├── Email Provider
                          └── Payment Gateway
```

---

# System Components

## Customer Mobile App

Technology:

* React
* Vite
* Capacitor
* TypeScript

Responsibilities:

* Authentication
* Subscription Management
* Complaint Creation
* Invoice Viewing
* Marketplace Access

Must never:

* Calculate invoices
* Calculate penalties
* Store business logic

Business logic belongs to backend.

---

## Agency Admin Dashboard

Technology:

* Next.js
* TypeScript
* Tailwind
* Shadcn UI

Responsibilities:

* Customer Management
* Product Management
* Billing Operations
* Complaint Management
* Reports

Must consume backend APIs only.

No direct database access.

---

## Backend API

Technology:

* Node.js
* Express
* TypeScript

Pattern:

Modular Monolith

Responsibilities:

* Authentication
* Authorization
* Billing
* Complaints
* Payments
* Notifications
* Marketplace

All business rules live here.

---

# Multi-Tenant Architecture

## Strategy

Shared Database

Shared Infrastructure

Logical Isolation

---

# Tenant Identifier

agencyId

Every business table must contain:

agencyId

Examples:

Customer

Subscription

Invoice

Complaint

Payment

Notification

DistributionRequest

---

# Tenant Enforcement

Every authenticated request must resolve:

agencyId

before executing business logic.

Queries must always filter by:

agencyId

Example:

BAD

findMany()

GOOD

findMany({
where: {
agencyId
}
})

---

# Authentication Architecture

Provider:

Firebase Authentication

---

# Supported Methods

Email + Password

Phone OTP

---

# Authentication Flow

User Login

↓

Firebase Verification

↓

Backend Verification

↓

JWT Generation

↓

API Access

---

# JWT Payload

{
userId,
agencyId,
role
}

---

# Authorization

Role Based Access Control

Roles:

SUPER_ADMIN

AGENCY_ADMIN

AGENCY_STAFF

CUSTOMER

---

# Database Architecture

Primary Database:

PostgreSQL

ORM:

Prisma

Reason:

* ACID Compliance
* Strong Relational Support
* Billing Safety
* Mature Ecosystem

---

# Redis Architecture

Redis is required.

Purposes:

OTP Cache

Rate Limiting

Session Caching

Job Queues

Temporary State

---

# Queue Architecture

Technology:

BullMQ

Purpose:

Move heavy workloads away from API requests.

---

# Background Jobs

Invoice Generation

PDF Generation

WhatsApp Delivery

Email Delivery

Notification Dispatch

Complaint SLA Evaluation

Analytics Aggregation

---

# Storage Architecture

Provider:

Cloudflare R2

Alternative:

Amazon S3

---

# Stored Files

Invoices

Exports

Profile Images

Marketplace Attachments

Agency Documents

---

# Notification Architecture

Supported Channels:

Push

WhatsApp

Email

---

# Notification Flow

Business Event

↓

Notification Event

↓

Queue

↓

Worker

↓

Delivery

---

# Event Driven Architecture

System events should be published internally.

Examples:

ComplaintCreated

ComplaintResolved

InvoiceGenerated

PaymentReceived

SubscriptionPaused

SubscriptionResumed

DistributionRequestCreated

---

# Billing Architecture

Billing is the most critical subsystem.

---

# Monthly Billing Process

Load Active Subscriptions

↓

Apply Day Rates

↓

Apply Pause Periods

↓

Apply Zone Charges

↓

Apply Complaint Penalties

↓

Generate Invoice

↓

Lock Invoice

↓

Generate PDF

↓

Send Notifications

---

# Billing Rules

Invoices are immutable.

Invoices cannot be edited.

Invoices cannot be deleted.

Adjustments require separate records.

---

# CSV Export Architecture

Purpose:

Generate delivery sheets.

Grouping:

Zone

Street

Area

Apartment

---

# Monitoring Architecture

Monitor:

API Errors

Queue Failures

Billing Failures

Payment Failures

Notification Failures

---

# Logging

Every service must produce structured logs.

Required Fields:

timestamp

agencyId

userId

event

severity

---

# Audit Architecture

Critical operations must generate audit logs.

Examples:

Customer Deletion

Price Change

Invoice Creation

Manual Payment Update

Role Change

Complaint Resolution

---

# Deployment Architecture

Deployment Type:

Docker Containers

---

# Environment Separation

Development

Staging

Production

---

# CI/CD Pipeline

Git Push

↓

Tests

↓

Build

↓

Deployment

---

# Secrets Management

Environment Variables Only

Never commit:

API Keys

Passwords

Tokens

Certificates

---

# Backup Strategy

Database Backup:

Daily

Retention:

30 Days

---

# Disaster Recovery

Recovery Objective:

Less than 24 hours

Maximum Data Loss:

Less than 1 day

---

# Future Architecture Expansion

Delivery Rider Application

Route Optimization Engine

Advanced Analytics

Multi Region Deployment

White Label Agency Apps

Inventory Management

Vendor Management

AI Forecasting

These modules must integrate without requiring major architectural redesign.

---

# Architecture Decision Record

Current Decision:

Modular Monolith

Reason:

Faster development

Lower operational complexity

Easier maintenance

Supports expected scale

Future microservices should only be introduced when justified by measurable bottlenecks.
