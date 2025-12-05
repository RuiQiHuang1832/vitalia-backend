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

- Modular controllers, services, and middleware
- Centralized error handling
- PostgreSQL database (Supabase)
- Prisma ORM
- Clean, Postman-friendly route structure

## Postman Testing

You can already test **all authentication routes** and basic CRUD flows in Postman:

### Available for Testing

- `POST /auth/register` — create a new user
- `POST /auth/login` — receive an access + refresh token
- `POST /auth/refresh` — obtain a new access token

These endpoints are fully functional and require no special role.

### Locked Behind Admin Privileges (for now)

Provider and patient routes exist (`/providers`, `/patients`, `/appointments`) but are **intentionally restricted** behind admin-only access while role-level features are being built out.

This ensures clean separation between patient, provider, and admin behavior as the system evolves.

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express
- **ORM:** Prisma
- **Database:** PostgreSQL
- **Auth:** JWT (access + refresh tokens)
- **Middleware:** Custom auth, role checks, validation
- **Dev Tools:** Postman

## Status

Vitalia is in **active development**.
Current goals include:

- Expanding core EMR models (notes, vitals, meds, allergies)
- Enhancing provider workflows
- Improved validation and error handling
- Strengthening appointment rules

A lightweight frontend (provider + patient dashboards) will be introduced later to demonstrate full workflow usage.
