# BACKEND_ARCHITECTURE.md

# NewsFlow Backend Architecture

Version: 1.0

---

# Purpose

This document defines:

* Backend structure
* Module boundaries
* API conventions
* Service architecture
* Repository architecture
* Event architecture
* Queue architecture
* Authentication
* Authorization

This is the source of truth for backend implementation.

---

# Architecture Style

Pattern:

Modular Monolith

Reason:

* Faster development
* Easier deployment
* Lower complexity
* Easier onboarding
* Suitable for SaaS scale

Do NOT create microservices.

---

# Technology Stack

Runtime:

Node.js

Language:

TypeScript

Framework:

Express

ORM:

Prisma

Database:

PostgreSQL

Cache:

Redis

Queue:

BullMQ

Authentication:

Firebase Auth

Storage:

Cloudflare R2

Validation:

Zod

---

# Folder Structure

src/

modules/

auth/

agency/

customer/

product/

subscription/

complaint/

billing/

payment/

marketplace/

notification/

reporting/

audit/

shared/

database/

middleware/

events/

errors/

validators/

utils/

config/

jobs/

invoice-generation/

invoice-pdf/

email/

whatsapp/

sla-monitor/

app.ts

server.ts

---

# Module Structure

Every module must follow:

module/

controller/

service/

repository/

validator/

types/

routes/

dto/

---

Example

customer/

customer.controller.ts

customer.service.ts

customer.repository.ts

customer.validator.ts

customer.routes.ts

customer.types.ts

customer.dto.ts

---

# Layer Responsibilities

Controller

Responsibilities:

* Parse request
* Call service
* Return response

Must NOT:

* Contain business logic

---

Service

Responsibilities:

* Business rules
* Validations
* Domain workflows

Must NOT:

* Access database directly

---

Repository

Responsibilities:

* Database access
* Prisma queries

Must NOT:

* Contain business logic

---

Validator

Responsibilities:

* Request validation

Use:

Zod

---

# Authentication Architecture

Provider:

Firebase Authentication

---

# Login Flow

Client

↓

Firebase

↓

ID Token

↓

Backend Verification

↓

Generate Internal JWT

↓

Return JWT

---

# Internal JWT Payload

{
userId,
agencyId,
role
}

---

# Authorization Architecture

RBAC

Role Based Access Control

Roles:

SUPER_ADMIN

AGENCY_ADMIN

AGENCY_STAFF

CUSTOMER

---

# Permission Examples

AGENCY_ADMIN

Can:

* Create products
* Create customers
* Manage billing

Cannot:

* Access other agencies

---

AGENCY_STAFF

Can:

* Manage complaints
* View customers

Cannot:

* Configure billing rules

---

CUSTOMER

Can:

* View invoices
* Raise complaints

Cannot:

* Access agency operations

---

# Middleware Stack

requestLogger

↓

authentication

↓

tenantResolver

↓

authorization

↓

validation

↓

controller

---

# Request Logging

Every request must log:

requestId

userId

agencyId

route

duration

statusCode

timestamp

---

# Tenant Resolver

Purpose:

Resolve agency context.

Every request must contain:

agencyId

All repositories must receive agencyId.

---

# API Response Standard

Success:

{
"success": true,
"data": {}
}

Error:

{
"success": false,
"error": {
"message": "..."
}
}

Never expose stack traces.

---

# API Versioning

Prefix:

/api/v1

Example:

/api/v1/customers

/api/v1/subscriptions

---

# Module Definitions

## Auth Module

Responsibilities:

Login

Registration

JWT

Firebase verification

Role management

---

## Agency Module

Responsibilities:

Agency profile

Settings

Billing settings

Configuration

---

## Customer Module

Responsibilities:

Create customer

Update customer

View customer

Delete customer

Customer search

---

## Product Module

Responsibilities:

Manage newspapers

Manage magazines

Day-wise pricing

Product availability

---

## Subscription Module

Responsibilities:

Create subscription

Pause subscription

Resume subscription

Cancel subscription

---

## Complaint Module

Responsibilities:

Create complaint

Resolve complaint

Track SLA

Complaint analytics

---

## Billing Module

Responsibilities:

Invoice generation

Invoice calculations

Discount calculations

Penalty calculations

PDF creation

Most critical module.

---

## Payment Module

Responsibilities:

Record payments

Reconcile invoices

Track transactions

Refund handling

---

## Marketplace Module

Responsibilities:

Distribution requests

Article requests

Quotations

Approvals

---

## Notification Module

Responsibilities:

Email

WhatsApp

Push

Notification tracking

---

## Reporting Module

Responsibilities:

Revenue reports

Customer reports

Complaint reports

Growth metrics

---

## Audit Module

Responsibilities:

Activity history

Compliance logs

Security logs

---

# Event Architecture

Internal events only.

No external event broker.

---

# Events

CustomerCreated

CustomerUpdated

SubscriptionCreated

SubscriptionPaused

SubscriptionResumed

ComplaintCreated

ComplaintResolved

InvoiceGenerated

PaymentReceived

NotificationSent

DistributionRequestCreated

---

# Event Flow

Action

↓

Event

↓

Listeners

↓

Jobs

---

Example

ComplaintResolved

↓

Notification Job

↓

Customer Notification

---

# Queue Architecture

Technology:

BullMQ

Redis

---

# Queue Types

invoice-generation

invoice-pdf

email

whatsapp

notifications

sla-monitor

analytics

---

# Job Rules

Jobs must:

Be idempotent

Be retryable

Log failures

Support retries

---

# Billing Architecture

Critical Subsystem

---

Billing Steps

1 Load active subscriptions

2 Remove paused days

3 Apply day-specific rates

4 Add delivery zone charges

5 Evaluate complaint penalties

6 Calculate taxes

7 Create invoice

8 Lock invoice

9 Generate PDF

10 Queue notifications

---

# Invoice Immutability

Generated invoices:

Cannot be updated

Cannot be deleted

Cannot be recalculated

Corrections require adjustment records.

---

# Error Handling

Centralized.

Use:

AppError

ValidationError

AuthenticationError

AuthorizationError

NotFoundError

ConflictError

---

# Validation Strategy

Every request validated.

No raw request usage.

All schemas in:

validator/

Use:

Zod

---

# Database Transactions

Required for:

Invoice generation

Payment recording

Subscription creation

Complaint penalty processing

Use Prisma transactions.

---

# Security Rules

Never trust client values.

Never trust agencyId from client.

Always derive agencyId from JWT.

---

# Rate Limiting

Apply to:

Login

OTP

Complaint creation

Marketplace requests

---

# Audit Logging

Required for:

Customer changes

Subscription changes

Product changes

Billing actions

Payment actions

Role changes

---

# Monitoring

Track:

API failures

Job failures

Billing failures

Payment failures

Notification failures

---

# Definition of Done

Every backend feature must include:

Controller

Service

Repository

Validator

Tests

Documentation

RBAC

Audit Logging

Error Handling

Validation

No exceptions.
