# API Documentation

## auth

### POST /auth/register

Register a new user (Patient)

**Body:**

- `email` (string, required)
- `password` (string, required, min 6 chars)
- `firstName` (string, required)
- `lastName` (string, required)
- `dob` (string, required, YYYY-MM-DD)
- `phone` (string, required)

**Auth:** None

### POST /auth/login

Login a user

**Body:**

- `email` (string, required)
- `password` (string, required)

**Auth:** None

### POST /auth/refresh

Refresh access token

**Body:**

- `refreshToken` (string, required)

**Auth:** None

## patient

### GET /patients/:id

Get a patient by ID

**Auth:** ADMIN, PROVIDER

### GET /patients

Get all patients (paginated)

**Query:**

- `page` (number, optional, default 1)
- `limit` (number, optional, default 10)

**Auth:** ADMIN, PROVIDER

### POST /patients

Create a new patient

**Body:**

- `firstName` (string, required)
- `lastName` (string, required)
- `dob` (string, required, YYYY-MM-DD)
- `email` (string, required)
- `phone` (string, required)

**Auth:** ADMIN, PROVIDER

### PUT /patients/:id

Update a patient

**Body:**

- `firstName` (string, optional)
- `lastName` (string, optional)
- `dob` (string, optional)
- `email` (string, optional)
- `phone` (string, optional)

**Auth:** ADMIN, PROVIDER

### DELETE /patients/:id

Delete a patient

**Auth:** ADMIN, PROVIDER

## provider

### GET /providers/:id

Get a provider by ID

**Auth:** ADMIN

### GET /providers

Get all providers (paginated)

**Query:**

- `page` (number, optional, default 1)
- `limit` (number, optional, default 10)

**Auth:** ADMIN

### POST /providers

Create a new provider

**Body:**

- `firstName` (string, required)
- `lastName` (string, required)
- `email` (string, required)
- `phone` (string, required)
- `specialty` (string, required)

**Auth:** ADMIN

### PUT /providers/:id

Update a provider

**Body:**

- `firstName` (string, optional)
- `lastName` (string, optional)
- `specialty` (string, optional)
- `email` (string, optional)
- `phone` (string, optional)

**Auth:** ADMIN

### DELETE /providers/:id

Delete a provider

**Auth:** ADMIN

## appointment

### GET /appointments/provider/:id

Get appointments for a provider

**Query:**

- `page` (number, optional, default 1)
- `limit` (number, optional, default 10)
- `status` (string, optional)

**Auth:** PROVIDER

### POST /appointments

Create a new appointment

**Body:**

- `patientId` (number, required)
- `providerId` (number, required)
- `startTime` (string, required, ISO Date)
- `endTime` (string, required, ISO Date)
- `reason` (string, optional)

**Auth:** PROVIDER

### PUT /appointments/:id

Update an appointment

**Body:**

- `patientId` (number, optional)
- `providerId` (number, optional)
- `startTime` (string, optional)
- `endTime` (string, optional)
- `reason` (string, optional)
- `status` (string, optional)

**Auth:** PROVIDER

### DELETE /appointments/:id

Delete an appointment

**Auth:** PROVIDER

### POST /appointments/:id/notes

Create a Visit Note container for an appointment

**Auth:** PROVIDER

### GET /appointments/:id/notes

Get the latest visit note entry for an appointment

**Auth:** Authenticated User

## visitNote

### GET /notes/:visitNoteId/entries

Get all entries for a visit note

**Auth:** PROVIDER

### POST /notes/:visitNoteId/entries

Create a new entry for a visit note

**Body:**

- `content` (string, required)

**Auth:** PROVIDER

## problem

### GET /problems/patient/:id

Get problems for a patient

**Auth:** PROVIDER, ADMIN

### GET /problems/:id

Get a problem by ID

**Auth:** PROVIDER, ADMIN

### POST /problems

Create a new problem

**Body:**

- `patientId` (number, required)
- `name` (string, required)
- `icdCode` (string, optional)
- `description` (string, optional)

**Auth:** PROVIDER, ADMIN

### PUT /problems/:id

Update a problem

**Body:**

- `name` (string, optional)
- `icdCode` (string, optional)
- `description` (string, optional)
- `status` (string, optional - ACTIVE, RESOLVED)

**Auth:** PROVIDER, ADMIN

## allergy

### GET /allergies/:id

Get allergies for a patient (ID is patient ID)

**Auth:** PROVIDER, ADMIN

### POST /allergies

Create a new allergy

**Body:**

- `patientId` (number, required)
- `category` (string, required - FOOD, MEDICATION, ENVIRONMENTAL, OTHER)
- `substance` (string, required)
- `reaction` (string, optional)
- `severity` (string, optional - MILD, MODERATE, SEVERE)
- `notes` (string, optional)

**Auth:** PROVIDER, ADMIN

### PUT /allergies/:id

Update an allergy

**Body:**

- `category` (string, optional)
- `substance` (string, optional)
- `reaction` (string, optional)
- `severity` (string, optional)
- `notes` (string, optional)

**Auth:** PROVIDER, ADMIN

### DELETE /allergies/:id

Delete an allergy

**Auth:** PROVIDER, ADMIN

## medication

### GET /medications/:id

Get medications for a patient (ID is patient ID)

**Auth:** PROVIDER, ADMIN

### POST /medications

Create a new medication

**Body:**

- `patientId` (number, required)
- `name` (string, required)
- `dosage` (string, required)
- `frequency` (string, required)
- `startDate` (string, required, ISO Date)
- `notes` (string, optional)

**Auth:** PROVIDER, ADMIN

### PUT /medications/:id

Update a medication

**Body:**

- `name` (string, optional)
- `dosage` (string, optional)
- `frequency` (string, optional)
- `status` (string, optional - ACTIVE, COMPLETED, DISCONTINUED)
- `notes` (string, optional)

**Auth:** PROVIDER, ADMIN

## vital

### GET /vitals/appointment/:appointmentId

Get vitals for an appointment

**Auth:** PROVIDER, ADMIN

### GET /vitals/patient/:patientId

Get vitals history for a patient

**Auth:** PROVIDER, ADMIN, PATIENT

### POST /vitals

Create a vital record

**Body:**

- `appointmentId` (number, required)
- `heartRate` (number, optional)
- `bloodPressureSystolic` (number, optional)
- `bloodPressureDiastolic` (number, optional)
- `temperature` (number, optional)
- `weight` (number, optional)
- `oxygenSaturation` (number, optional)

**Auth:** PROVIDER, ADMIN

### PUT /vitals/:id

Update a vital record

**Body:**

- `heartRate` (number, optional)
- `bloodPressureSystolic` (number, optional)
- `bloodPressureDiastolic` (number, optional)
- `temperature` (number, optional)
- `weight` (number, optional)
- `oxygenSaturation` (number, optional)

**Auth:** PROVIDER, ADMIN

### DELETE /vitals/:id

Delete a vital record

**Auth:** PROVIDER, ADMIN

## availability

### GET /availability/:id

Get availability for a provider

**Auth:** PROVIDER, ADMIN

### POST /availability

Create provider availability

**Body:**

- `startTime` (string, required, ISO Date)
- `endTime` (string, required, ISO Date)
- `workingDays` (array of strings, required - e.g. ["MONDAY", "TUESDAY"])

**Auth:** PROVIDER, ADMIN

### PUT /availability/:id

Update provider availability

**Body:**

- `startTime` (string, optional)
- `endTime` (string, optional)
- `workingDays` (array of strings, optional)

**Auth:** PROVIDER, ADMIN
