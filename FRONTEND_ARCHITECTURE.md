# FRONTEND_ARCHITECTURE.md

# NewsFlow Frontend Architecture

Version: 1.0

---

# Purpose

This document defines:

* Frontend applications
* Navigation
* Screens
* Components
* Design System
* State Management
* API Integration Rules
* UI Behavior

This is the source of truth for all frontend implementation.

---

# Frontend Applications

NewsFlow contains two frontend applications.

## Application 1

Agency Admin Dashboard

Technology:

* Next.js
* TypeScript
* Tailwind
* Shadcn UI

Purpose:

Agency Operations

---

## Application 2

Customer Mobile Application

Technology:

* React
* Vite
* Capacitor
* TypeScript

Purpose:

Subscriber Self Service

---

# Design Philosophy

NewsFlow must not look like a generic SaaS dashboard.

Design inspiration:

* Premium Newspapers
* Editorial Publications
* Financial Journals

Examples:

* NY Times
* Financial Times
* WSJ

The interface should feel trustworthy, elegant, and calm.

---

# Brand Identity

## Background

#FCFAF6

Warm paper-like tone.

---

## Primary Text

#121212

---

## Primary Accent

#1A2E40

Deep editorial blue.

---

## Secondary Accent

#631D1E

Editorial burgundy.

---

# Typography

Headings:

Playfair Display

Body:

Plus Jakarta Sans

Fallback:

Inter

---

# Design Principles

Large whitespace

Readable typography

Minimal visual noise

Strong hierarchy

Fast interactions

Professional appearance

---

# Animation Principles

Animations must be subtle.

Avoid flashy effects.

---

# Approved Animations

Counter Roll

Split Flap Counter

Drawer Slide

Page Fade

Card Elevation

Button Press Feedback

---

# Forbidden Animations

Parallax

Excessive bouncing

Heavy particle effects

Neon effects

Glassmorphism

---

# State Management

Technology:

TanStack Query

Context API

---

# Rules

Server state:

TanStack Query

UI state:

Context

Local state:

useState

---

# Form Handling

Technology:

React Hook Form

Validation:

Zod

---

# Mobile App Navigation

Bottom Navigation

Tabs:

Home

Subscriptions

Marketplace

Invoices

Profile

---

# Mobile App Routes

/auth

/home

/subscriptions

/subscriptions/:id

/complaints

/invoices

/marketplace

/profile

/settings

---

# Customer Mobile App

---

## Authentication Screen

Purpose:

Login

Features:

Phone OTP

Email Login

Password Login

Forgot Password

---

## Home Screen

Purpose:

Customer Overview

Widgets:

Active Subscriptions

Pending Complaints

Latest Invoice

Announcements

Marketplace Banner

---

## Subscription List

Purpose:

View all subscriptions

Actions:

Pause

Resume

View Details

---

## Subscription Details

Display:

Product

Pricing

Status

Pause History

Billing History

---

## Pause Subscription Screen

Fields:

Start Date

End Date

Reason

Submit

---

## Complaint List

Purpose:

Track complaints

Filters:

Open

Resolved

Closed

---

## Complaint Create Screen

Fields:

Complaint Type

Description

Attachment

Submit

---

## Invoice List

Purpose:

Billing history

Display:

Month

Amount

Status

Download

---

## Invoice Details

Display:

Invoice Breakdown

Products

Taxes

Charges

Discounts

PDF Download

---

## Marketplace Home

Services:

Pamphlet Distribution

Article Publication

---

## Distribution Request Screen

Fields:

Title

Description

Quantity

Area

Attachments

---

## Article Request Screen

Fields:

Title

Content

Attachments

---

## Profile Screen

Display:

Name

Phone

Email

Address

---

# Admin Dashboard Navigation

Sidebar

Dashboard

Customers

Products

Subscriptions

Complaints

Marketplace

Billing

Reports

Settings

---

# Dashboard Screen

Purpose:

Business Overview

Widgets:

Active Customers

Revenue

Outstanding Payments

Pending Complaints

New Subscriptions

Monthly Growth

---

# Customer Management

Routes:

/customers

/customers/create

/customers/:id

/customers/:id/edit

---

## Customer List

Features:

Search

Filters

Export CSV

Pagination

---

## Customer Details

Display:

Profile

Addresses

Subscriptions

Complaints

Invoices

Payments

---

# Product Management

Routes:

/products

/products/create

/products/:id

---

## Product List

Display:

Name

Type

Status

Price

---

## Product Details

Display:

Base Price

Day Rates

Subscribers

Status

---

# Subscription Management

Routes:

/subscriptions

/subscriptions/:id

---

## Subscription List

Filters:

Active

Paused

Cancelled

---

## Subscription Details

Display:

Customer

Product

Status

Pause History

Billing Impact

---

# Complaint Management

Routes:

/complaints

/complaints/:id

---

## Complaint List

Filters:

Pending

In Progress

Resolved

Closed

---

## Complaint Details

Display:

Customer

Issue

Timeline

Resolution Notes

---

# Marketplace Management

Routes:

/marketplace

/distribution-requests

/article-requests

---

## Distribution Requests

Display:

Customer

Status

Quotation

Amount

---

## Article Requests

Display:

Title

Customer

Status

Review Notes

---

# Billing Module

Routes:

/billing

/invoices

/invoices/:id

---

## Billing Dashboard

Widgets:

Generated Invoices

Outstanding Amount

Collections

Penalty Discounts

---

## Invoice Details

Display:

Invoice Items

Taxes

Discounts

Payments

PDF Download

---

# Reports Module

Routes:

/reports

---

Reports:

Revenue Report

Customer Growth

Complaint Analytics

Collection Report

Product Performance

---

# Settings Module

Routes:

/settings

---

Features:

Agency Profile

Billing Settings

Notification Settings

User Management

---

# Component Library

Buttons

Inputs

Tables

Modals

Cards

Badges

Drawers

Tabs

Dropdowns

Pagination

Date Picker

---

# Shared Components

Customer Card

Invoice Card

Complaint Card

Subscription Card

Revenue Widget

Metric Widget

Status Badge

---

# Data Fetching Rules

All data comes from backend APIs.

Frontend must never:

Calculate invoices

Calculate taxes

Calculate penalties

Calculate discounts

---

# Error Handling

Every screen must support:

Loading State

Empty State

Error State

Success State

---

# Responsive Requirements

Desktop:

Admin Dashboard

Tablet:

Supported

Mobile:

Customer Application

---

# Accessibility

Keyboard Navigation

Focus States

Semantic HTML

Screen Reader Support

Color Contrast Compliance

---

# Performance Requirements

Initial Load:

Under 3 seconds

Page Navigation:

Under 500ms perceived delay

---

# Future UI Modules

Delivery Rider App

Route Optimization Dashboard

Advanced Analytics

Inventory Management

Vendor Portal

White Label Themes

Not included in Version 1.

---

# Frontend Definition of Done

Every screen must include:

Loading State

Error State

Empty State

Validation

Accessibility

Responsive Layout

API Integration

Design System Compliance

No placeholder UI.

No fake data in production.
