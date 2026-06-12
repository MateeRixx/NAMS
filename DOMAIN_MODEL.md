# DOMAIN_MODEL.md

# Product Name

NewsFlow

# Domain Definition

NewsFlow is a multi-tenant SaaS Operating System for newspaper and magazine distribution businesses.

The platform helps independent distribution agencies manage:

* Subscribers
* Products
* Billing
* Complaints
* Delivery Operations
* Distribution Services

The system is designed around Agencies.

Every business operation belongs to an Agency.

---

# Core Domain Hierarchy

Platform

└── Agency

```
├── Users

├── Customers

├── Products

├── Delivery Zones

├── Subscriptions

├── Complaints

├── Distribution Requests

├── Invoices

└── Payments
```

---

# Agency

## Definition

Agency represents an independent newspaper or magazine distributor.

An Agency is a Tenant.

All business data belongs to an Agency.

## Examples

Saraswati News Agency

City News Distribution

Morning Express Agency

## Responsibilities

Manage customers

Manage subscriptions

Manage products

Manage complaints

Generate invoices

Process payments

Configure delivery zones

---

# User

## Definition

A person who can access the platform.

Users belong to an Agency.

Users authenticate through:

* Phone OTP
* Email and Password

## Roles

SUPER_ADMIN

AGENCY_ADMIN

AGENCY_STAFF

CUSTOMER

---

# Role Definitions

## SUPER_ADMIN

Platform owner.

Can manage all agencies.

Can access global analytics.

Can suspend agencies.

---

## AGENCY_ADMIN

Agency owner.

Can access all records inside agency.

Can manage:

* Customers
* Products
* Billing
* Staff

---

## AGENCY_STAFF

Operational employee.

Can:

* View customers
* Resolve complaints
* Generate delivery sheets

Cannot:

* Access billing settings
* Manage staff

---

## CUSTOMER

Subscriber.

Can:

* View subscriptions
* Raise complaints
* Download invoices
* Purchase services

---

# Customer

## Definition

A subscriber receiving newspapers or magazines.

Customer belongs to exactly one Agency.

Customer can have multiple subscriptions.

## Owns

Subscriptions

Complaints

Invoices

Payments

Distribution Requests

---

# Address

## Purpose

Physical delivery location.

Separate entity because a customer may change address over time.

## Stores

House Number

Street

Sector

Area

City

Postal Code

Delivery Zone

---

# Delivery Zone

## Definition

A logical grouping of delivery addresses.

Used for:

* Delivery planning
* Route generation
* Monthly delivery surcharges

Examples:

Sector A

Sector B

Green Residency

Sunshine Apartments

---

# Product

## Definition

Anything that can be subscribed to.

## Types

NEWSPAPER

MAGAZINE

BUNDLE

## Examples

Times of India

The Hindu

Business Standard

India Today

Sunday Bundle

---

# Product Day Rate

## Purpose

Allows different prices on different days.

Example

Monday = ₹5

Tuesday = ₹5

Wednesday = ₹5

Thursday = ₹5

Friday = ₹5

Saturday = ₹6

Sunday = ₹7.5

---

# Subscription

## Definition

Agreement between Customer and Product.

Represents active delivery.

## Belongs To

Customer

Product

Agency

## States

ACTIVE

PAUSED

CANCELLED

---

# Subscription Pause

## Purpose

Vacation hold.

Customer temporarily stops delivery.

## Example

Pause Start

2026-06-01

Pause End

2026-06-10

No billing should occur during paused dates.

---

# Complaint

## Definition

Customer reports delivery issue.

## Complaint Types

MISSED_DELIVERY

DAMAGED_PAPER

WRONG_PRODUCT

LATE_DELIVERY

OTHER

---

# Complaint Lifecycle

PENDING

IN_PROGRESS

RESOLVED

CLOSED

---

# SLA Violation

## Rule

If customer accumulates

3 or more unresolved complaints

inside billing period

agency receives billing penalty.

---

# Billing Penalty

## Rule

15 percent discount applied automatically.

Discount belongs to customer.

Agency absorbs loss.

---

# Invoice

## Definition

Permanent monthly billing record.

Generated automatically.

## Contains

Invoice Items

Delivery Charges

Discounts

Penalties

Taxes

Final Amount

---

# Invoice Rules

Generated monthly.

Immutable.

Never recalculated.

Never modified.

Never deleted.

---

# Invoice Item

## Purpose

Detailed billing breakdown.

Examples

Times of India

31 deliveries

₹155

Sunday Premium

₹25

Delivery Charge

₹50

---

# Payment

## Definition

Settlement of an Invoice.

## Types

ONLINE

CASH

---

# Payment Status

PENDING

PAID

FAILED

REFUNDED

---

# Distribution Request

## Definition

Customer requests pamphlet distribution.

Agency provides quotation.

Customer approves.

Agency executes.

---

# Distribution Workflow

Request Created

↓

Quotation Generated

↓

Customer Approval

↓

Payment

↓

Distribution

↓

Completed

---

# Article Publication Request

## Definition

Customer requests publication of article, notice, advertisement or content.

Agency reviews request.

Agency approves or rejects.

---

# Notification

## Purpose

Deliver important system events.

## Channels

Push Notification

Email

WhatsApp

---

# Notification Examples

Invoice Generated

Payment Received

Complaint Resolved

Subscription Paused

Request Approved

---

# Audit Log

## Definition

Permanent history of critical actions.

## Examples

Price Changed

Invoice Generated

Customer Deleted

Payment Marked Paid

Complaint Resolved

Role Changed

---

# Billing Domain Rules

Rule 1

Only active subscriptions generate charges.

Rule 2

Paused subscriptions generate no charges.

Rule 3

Day-specific rates override base rates.

Rule 4

Delivery Zone charges are added monthly.

Rule 5

Complaint penalties apply before final invoice generation.

Rule 6

Generated invoices become immutable.

---

# Multi Tenant Rules

Rule 1

Agency data must never leak.

Rule 2

Agency can only access its own records.

Rule 3

Queries must always include agencyId.

Rule 4

Reports must be tenant isolated.

---

# Future Domain Expansion

Delivery Riders

Route Optimization

Inventory Management

Vendor Management

Digital Newspaper Access

Referral Programs

Agency Marketplace

White Label Mobile Applications

Multi Language Support

Advanced Analytics
