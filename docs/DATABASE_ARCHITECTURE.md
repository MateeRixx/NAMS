# DATABASE_ARCHITECTURE.md

# NewsFlow Database Architecture

Version: 1.0

---

# Purpose

This document defines:

* Database entities
* Relationships
* Constraints
* Indexing strategy
* Multi-tenant enforcement
* Soft delete rules
* Audit requirements

Prisma schema must follow this document exactly.

---

# Database Technology

Database:

PostgreSQL

ORM:

Prisma

---

# Global Rules

## Rule 1

All business entities must belong to an Agency.

Every table must contain:

agencyId

except:

* Agency
* System Config
* Global Admin

---

## Rule 2

Use UUID primary keys.

Example:

id String @id @default(uuid())

---

## Rule 3

All entities contain:

createdAt

updatedAt

---

## Rule 4

Use soft delete for business records.

Fields:

deletedAt

deletedBy

---

## Rule 5

Invoices are immutable.

No updates after generation.

No deletes.

---

# Entity Overview

Agency

├── Users

├── Customers

├── Products

├── Delivery Zones

├── Subscriptions

├── Complaints

├── Invoices

├── Payments

├── Notifications

├── Distribution Requests

└── Audit Logs

---

# Agency

Purpose:

Tenant container.

Fields:

id

name

email

phone

address

gstNumber

logoUrl

status

createdAt

updatedAt

Relationships:

Agency

→ Users

→ Customers

→ Products

→ Invoices

→ Payments

---

# User

Purpose:

Authenticated system user.

Fields:

id

agencyId

email

phone

firebaseUid

firstName

lastName

role

isActive

createdAt

updatedAt

Indexes:

agencyId

email

phone

firebaseUid

Relationships:

belongsTo Agency

---

# Customer

Purpose:

Subscriber.

Fields:

id

agencyId

customerCode

firstName

lastName

phone

email

status

createdAt

updatedAt

deletedAt

Indexes:

agencyId

phone

customerCode

Relationships:

belongsTo Agency

hasMany Addresses

hasMany Subscriptions

hasMany Complaints

hasMany Invoices

---

# Address

Purpose:

Delivery location.

Fields:

id

agencyId

customerId

zoneId

houseNumber

street

landmark

area

city

state

postalCode

isPrimary

createdAt

updatedAt

Indexes:

customerId

zoneId

postalCode

Relationships:

belongsTo Customer

belongsTo DeliveryZone

---

# DeliveryZone

Purpose:

Logical delivery region.

Fields:

id

agencyId

name

description

monthlyCharge

createdAt

updatedAt

Indexes:

agencyId

name

Relationships:

hasMany Addresses

---

# Product

Purpose:

Newspaper or Magazine.

Fields:

id

agencyId

name

description

type

basePrice

isActive

createdAt

updatedAt

Indexes:

agencyId

name

type

Relationships:

hasMany ProductDayRates

hasMany Subscriptions

---

# ProductDayRate

Purpose:

Override pricing by weekday.

Fields:

id

agencyId

productId

dayOfWeek

price

createdAt

updatedAt

Indexes:

productId

dayOfWeek

Constraint:

One record per day per product.

Unique:

productId + dayOfWeek

---

# Subscription

Purpose:

Active delivery agreement.

Fields:

id

agencyId

customerId

productId

startDate

endDate

status

createdAt

updatedAt

Indexes:

agencyId

customerId

productId

status

Relationships:

belongsTo Customer

belongsTo Product

hasMany SubscriptionPauses

---

# SubscriptionPause

Purpose:

Vacation hold.

Fields:

id

agencyId

subscriptionId

startDate

endDate

reason

createdAt

updatedAt

Indexes:

subscriptionId

startDate

endDate

Rule:

Paused dates must not be billed.

---

# Complaint

Purpose:

Customer service issue.

Fields:

id

agencyId

customerId

subscriptionId

type

description

status

resolvedAt

createdAt

updatedAt

Indexes:

agencyId

customerId

status

type

Relationships:

belongsTo Customer

belongsTo Subscription

hasMany ComplaintHistory

---

# ComplaintHistory

Purpose:

Track complaint changes.

Fields:

id

agencyId

complaintId

action

notes

performedBy

createdAt

Indexes:

complaintId

createdAt

---

# Invoice

Purpose:

Permanent billing record.

Fields:

id

agencyId

customerId

invoiceNumber

billingMonth

billingYear

subtotal

deliveryCharges

discountAmount

taxAmount

totalAmount

status

generatedAt

createdAt

Indexes:

agencyId

customerId

billingMonth

billingYear

invoiceNumber

Relationships:

hasMany InvoiceItems

hasMany Payments

Rules:

Immutable

No updates

No deletes

---

# InvoiceItem

Purpose:

Line item breakdown.

Fields:

id

invoiceId

productId

description

quantity

unitPrice

amount

createdAt

Indexes:

invoiceId

productId

Relationships:

belongsTo Invoice

---

# Payment

Purpose:

Invoice settlement.

Fields:

id

agencyId

invoiceId

customerId

amount

method

status

transactionReference

paidAt

createdAt

Indexes:

agencyId

invoiceId

status

paidAt

Relationships:

belongsTo Invoice

belongsTo Customer

---

# DistributionRequest

Purpose:

Pamphlet distribution service.

Fields:

id

agencyId

customerId

title

description

requestedQuantity

quotedPrice

status

createdAt

updatedAt

Indexes:

agencyId

customerId

status

---

# ArticleRequest

Purpose:

Content publication request.

Fields:

id

agencyId

customerId

title

content

status

reviewNotes

createdAt

updatedAt

Indexes:

agencyId

customerId

status

---

# Notification

Purpose:

Track sent notifications.

Fields:

id

agencyId

customerId

type

channel

title

message

status

sentAt

createdAt

Indexes:

agencyId

customerId

status

channel

---

# AuditLog

Purpose:

Permanent activity history.

Fields:

id

agencyId

userId

entityType

entityId

action

oldValue

newValue

ipAddress

createdAt

Indexes:

agencyId

userId

entityType

entityId

createdAt

Examples:

Customer Updated

Invoice Generated

Payment Marked Paid

Role Changed

Price Modified

Complaint Resolved

---

# Enumerations

UserRole

SUPER_ADMIN

AGENCY_ADMIN

AGENCY_STAFF

CUSTOMER

---

ProductType

NEWSPAPER

MAGAZINE

BUNDLE

---

SubscriptionStatus

ACTIVE

PAUSED

CANCELLED

---

ComplaintStatus

PENDING

IN_PROGRESS

RESOLVED

CLOSED

---

PaymentStatus

PENDING

PAID

FAILED

REFUNDED

---

InvoiceStatus

PENDING

GENERATED

PAID

OVERDUE

---

NotificationChannel

EMAIL

WHATSAPP

PUSH

---

# Multi Tenant Enforcement

Every repository query must filter by:

agencyId

Example:

where: {
agencyId: currentAgencyId
}

No exceptions.

---

# Data Integrity Rules

Customer cannot be deleted if active subscriptions exist.

Invoice cannot be deleted.

Invoice cannot be modified.

Payments cannot exceed invoice amount.

Subscription pauses cannot overlap.

Product day rates must be unique per weekday.

---

# Future Tables (Not V1)

DeliveryRider

DeliveryRoute

Inventory

Vendor

ReferralProgram

AnalyticsSnapshot

These entities must not be implemented in Version 1.
