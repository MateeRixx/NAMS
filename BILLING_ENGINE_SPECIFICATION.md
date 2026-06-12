# BILLING_ENGINE_SPECIFICATION.md

# NewsFlow Billing Engine Specification

Version: 1.0

Priority: CRITICAL

---

# Purpose

This document defines the complete billing engine.

The billing engine is responsible for:

* Subscription charge calculation
* Day-wise pricing
* Vacation pause handling
* Delivery zone charges
* Complaint penalties
* Tax calculation
* Invoice generation
* Invoice locking

This document is the source of truth for all billing calculations.

No billing logic may exist outside this specification.

---

# Core Principles

## Principle 1

Billing must be deterministic.

Given the same inputs:

The same invoice must always be generated.

---

## Principle 2

Invoices are immutable.

After generation:

No updates

No edits

No deletions

---

## Principle 3

Every calculation must be auditable.

System must be able to explain:

Why every rupee was charged.

---

# Billing Frequency

Monthly

Invoices generated once per month.

Example:

Billing Month:

June 2026

Billing Period:

2026-06-01

to

2026-06-30

---

# Billing Inputs

Invoice generation uses:

Active Subscriptions

Pause Records

Day-wise Rates

Delivery Zone Charges

Complaint Penalties

Tax Rules

---

# Invoice Generation Flow

Step 1

Load Active Subscriptions

↓

Step 2

Calculate Delivered Days

↓

Step 3

Apply Day Rates

↓

Step 4

Calculate Subscription Charges

↓

Step 5

Apply Delivery Zone Charges

↓

Step 6

Apply Complaint Penalties

↓

Step 7

Apply Taxes

↓

Step 8

Generate Invoice

↓

Step 9

Lock Invoice

↓

Step 10

Generate PDF

---

# Subscription Charge Calculation

Formula:

Subscription Total

=

Sum of all delivered day prices

---

Example

The Hindu

Monday-Friday

₹5

Saturday

₹6

Sunday

₹7.5

Month:

30 days

Delivered:

30 days

Calculation:

22 weekdays × ₹5 = ₹110

4 Saturdays × ₹6 = ₹24

4 Sundays × ₹7.5 = ₹30

Total

₹164

---

# Day Rate Priority

Highest Priority:

ProductDayRate

Fallback:

Base Product Price

---

Example

Base Price:

₹5

Sunday Override:

₹8

Sunday must use:

₹8

Not ₹5

---

# Pause Calculation

Purpose:

Vacation Hold

---

Rule

Paused dates generate:

0 charges

---

Example

Pause:

2026-06-10

to

2026-06-15

Delivered Days:

30 - 6 = 24

Only 24 days billed.

---

# Pause Validation Rules

Pause Start <= Pause End

Pause cannot overlap existing pause.

Pause must belong to subscription.

---

# Delivery Zone Charges

Purpose:

Monthly delivery surcharge.

---

Example

Zone:

Green Residency

Monthly Charge:

₹50

Invoice must add:

₹50

Once per billing cycle.

---

# Delivery Charge Rules

Applied per customer.

Not per product.

---

Correct

3 newspapers

1 zone charge

₹50

---

Incorrect

3 newspapers

3 zone charges

₹150

---

# Complaint Penalty System

Purpose:

Protect customers from poor service.

---

Penalty Rule

If unresolved complaints >= 3

during billing cycle

Apply:

15% discount

---

Complaint Status Considered

PENDING

IN_PROGRESS

---

Statuses Ignored

RESOLVED

CLOSED

---

Example

Customer:

Rahul

Complaints:

4 unresolved

Invoice:

₹1000

Penalty:

15%

Discount:

₹150

Final:

₹850

---

# Penalty Calculation Formula

Penalty Amount

=

Subtotal × 15%

---

Rule

Apply before taxes.

---

# Tax Calculation

Version 1

Single GST field.

---

Formula

Taxable Amount

=

Subtotal

*

Delivery Charges

*

Penalty

---

GST

=

Taxable Amount × GST Rate

---

Configurable

Agency Settings

Default:

0%

---

# Invoice Number Format

Format

INV-YYYY-MM-XXXX

---

Examples

INV-2026-06-0001

INV-2026-06-0002

INV-2026-06-0003

---

Invoice numbers must be unique.

---

# Invoice Structure

Invoice

Contains:

Invoice Header

Invoice Items

Delivery Charges

Discounts

Taxes

Final Amount

---

Example

The Hindu

₹164

Business Standard

₹150

Delivery Charge

₹50

Penalty Discount

-₹55

GST

₹0

Total

₹309

---

# Invoice Item Rules

Each product must create:

One Invoice Item

---

Example

Invoice Items

The Hindu

₹164

Business Standard

₹150

---

Do not create daily invoice rows.

---

# Invoice Status Lifecycle

PENDING

↓

GENERATED

↓

PAID

or

↓

OVERDUE

---

# Invoice Locking

After generation:

Invoice becomes immutable.

---

Forbidden Operations

Update Invoice

Delete Invoice

Recalculate Invoice

Modify Amount

---

Allowed Operations

View

Download

Record Payment

---

# Adjustment Strategy

If mistake found:

Create Adjustment Record

Never edit invoice.

---

Adjustment Example

Original Invoice

₹1000

Correction

-₹100

Adjustment Record

₹-100

---

# Billing Job Architecture

Queue

invoice-generation

---

Execution

Monthly Scheduler

↓

Invoice Job

↓

Invoice Creation

↓

PDF Generation

↓

Notification Job

---

# Monthly Billing Scheduler

Runs:

1st Day of Every Month

Time:

01:00 AM

Server Time

---

Generates invoices for:

Previous Month

---

Example

Run Date

2026-07-01

Generates:

June 2026 invoices

---

# Invoice PDF Rules

PDF must contain:

Agency Details

GST Number

Customer Details

Invoice Number

Billing Month

Line Items

Taxes

Final Amount

Generated Timestamp

---

# Audit Requirements

Audit log required for:

Invoice Generation

Payment Recording

Adjustment Creation

Invoice Download

Manual Overrides

---

# Edge Cases

Case 1

Subscription Starts Mid Month

Charge only active dates.

---

Case 2

Subscription Ends Mid Month

Charge only active dates.

---

Case 3

Pause Entire Month

Invoice amount:

₹0

plus any applicable fixed charges.

---

Case 4

No Active Subscription

No invoice generated.

---

Case 5

Multiple Products

Each product calculated independently.

---

# Performance Requirements

Invoice generation:

10,000 customers

within 15 minutes

per agency.

---

# Testing Requirements

Mandatory Tests

Day Rate Calculation

Pause Calculation

Zone Charge Calculation

Penalty Calculation

Tax Calculation

Invoice Locking

Invoice Number Generation

Invoice PDF Generation

---

# Billing Definition of Done

Billing engine is complete only when:

✓ Day-wise pricing works

✓ Pause periods work

✓ Zone charges work

✓ Complaint penalties work

✓ Taxes work

✓ Invoice locking works

✓ PDFs generate correctly

✓ Audit logs generated

✓ Tests passing

No shortcuts allowed.

Billing correctness is more important than development speed.
