# Vitalia Backend – EMR & Appointment System API

**View the frontend code here →** [Frontend](https://github.com/RuiQiHuang1832/vitalia-frontend)

A modern backend powering a lightweight Electronic Medical Records (EMR) system and provider–patient appointment scheduling platform.

Vitalia focuses on clean architecture, realistic healthcare logic, and production-ready API design — including role separation, secure data flow, and early-stage EMR features such as visit notes, vitals, medications, and allergies.

## Features

### Authentication & Authorization

- JWT access + refresh tokens
- Secure bcrypt password hashing
- Role-based access control (admin, provider, patient)

### Patient & Provider Management

- Prisma-backed relational models
- Strict request validation
- Admin-controlled creation flows

### Appointment Scheduling System

- Create, update, and cancel appointments
- Smart conflict detection (prevents double-booking)
- Enforced clinical time windows
- Provider → Patient linkage

### Early EMR Functionality

Foundational EMR components that demonstrate real clinical data modeling:

- **Visit Notes** – provider-authored, tied to appointments
- **Vitals** – HR, BP, temp, weight, etc.
- **Medications** – active medication list
- **Allergies** – documented allergies + reactions

### Architecture & Tooling

**Architecture**
- Modular controllers, services, and middleware
- Centralized error handling
- Role-based access enforcement

**Tooling**
- PostgreSQL database (Supabase)
- Prisma ORM
- Clean, Postman-friendly route structure

## API Documentation

Full API documentation (routes, request/response examples, auth rules) is available here:

👉 [API_REFERENCE.md](./docs/API_REFERENCE.md)

## Postman / Testing

All endpoints were manually tested using Postman, including negative cases (invalid scheduling, conflicts, permissions).

Postman collections were used to verify:

- Authentication flows (Login, Register, Refresh Token)
- Role-based access control (Admin vs Provider vs Patient)
- Complex business logic (Appointment conflicts, Provider availability)
- EMR data integrity (Vitals, Medications, Allergies, Problems)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens)
- **Middleware:** Custom auth, role checks, validation
- **Dev Tools:** Postman

## Status

Vitalia Backend is **feature complete**.

All core EMR models (notes, vitals, meds, allergies, problems), provider workflows, and appointment scheduling logic are implemented and tested.

A lightweight frontend (provider + patient dashboards) will be introduced later to demonstrate full workflow usage.
