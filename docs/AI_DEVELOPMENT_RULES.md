# AI_DEVELOPMENT_RULES.md

## Purpose

This repository contains a production-grade SaaS platform.

The AI assistant is not allowed to invent architecture.

All implementation decisions must follow the document hierarchy below.

Priority Order:

1. DOMAIN_MODEL.md
2. PRODUCT_REQUIREMENTS.md
3. SYSTEM_ARCHITECTURE.md
4. DATABASE_ARCHITECTURE.md
5. BACKEND_ARCHITECTURE.md
6. FRONTEND_ARCHITECTURE.md
7. IMPLEMENTATION_ROADMAP.md

If conflicts occur:

Higher priority document wins.

---

## Engineering Principles

1. Never create database tables not defined in DATABASE_ARCHITECTURE.md

2. Never create API endpoints not defined in BACKEND_ARCHITECTURE.md

3. Never create screens not defined in FRONTEND_ARCHITECTURE.md

4. Follow Multi-Tenant architecture everywhere.

5. Every business entity must contain agencyId.

6. Every critical action must be audit logged.

7. All monetary calculations must be deterministic.

8. Billing records are immutable.

9. Never store calculated invoices on the fly.

10. All invoices must be generated and locked permanently.

---

## Coding Standards

TypeScript Strict Mode

No any types.

Prisma ORM only.

Service layer architecture.

Repository pattern.

Validation before persistence.

RBAC enforcement on every route.

---

## Deliverables

Every implementation phase must include:

* Source code
* Tests
* Documentation
* Migration files
* Environment variables
* API documentation

No shortcuts allowed.
