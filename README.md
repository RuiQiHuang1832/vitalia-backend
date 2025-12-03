# Vitalia Backend – EMR & Appointment System API

**View the frontend code here →** [Frontend](https://github.com/RuiQiHuang1832/vitalia-frontend)

A modern backend powering an Electronic Medical Records (EMR) and appointment scheduling system.

Built with clean architecture, role-based auth, and production-ready API design.  
Focused on realistic healthcare logic such as provider/patient separation, appointment conflict checks, and secure data handling.

## Features

- **User Authentication** – JWT access tokens, refresh flow, bcrypt password hashing  
- **Role-Based Authorization** – provider vs patient access control  
- **Patient & Provider Management** – Prisma models with strict validation  
- **Appointment Scheduling**  
  - Create, update, cancel  
  - Prevent double-booking  
  - Enforce valid time windows  
- **PostgreSQL Integration** – relational schema with Prisma ORM  
- **Modular Architecture** – controllers, services, middleware separation  
- **Error Handling** – consistent responses and input validation  
- **Developer-Friendly** – clean routes, clear naming, Postman-ready  

## Tech Stack

- **Runtime:** Node.js  
- **Framework:** Express  
- **ORM:** Prisma  
- **Database:** PostgreSQL  
- **Auth:** JWT (access + refresh tokens)  
- **Middleware:** Custom auth, role checks, validation  
- **Dev Tools:** Postman, Prisma Studio  

## Status

In active development — core EMR models, authentication system, and appointment logic are being built out phase by phase.

Future updates include improved validation, richer appointment rules, and expanded provider workflows.
