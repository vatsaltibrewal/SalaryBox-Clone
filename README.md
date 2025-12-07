# Employee Document & HR Management Dashboard

A minimal, SalaryBox-inspired employee management dashboard built with a modern web stack. It lets small businesses manage companies, employees, HR documents, and basic onboarding flows — without any login or complex setup.

---

## 1. Overview

This project focuses on **clean UI** and **practical HR workflows**:

- No authentication for now – anyone can open the app and start using it.
- Company selection similar to a streaming profile screen.
- Rich employee table with filtering, sorting, and search.
- Multi-step employee creation flow with optional document generation.
- Per-employee profile page with editable details, photo upload, and document management.
- HR documents (offer letters, employment letters, etc.) generated as PDFs from templates.

The goal is to feel like a simplified version of tools like SalaryBox while keeping the codebase small and easy to understand.

---

## 2. Tech Stack

### Frontend

- Next.js 16 (App Router, Server + Client Components)
- TypeScript
- Tailwind CSS (v4) utility-first styling
- shadcn/ui component library for forms, dialogs, buttons, and layout
- TanStack React Table v8 for interactive employee tables

### Backend

- Express.js (REST API server)
- TypeScript / modern JavaScript
- Supabase JavaScript client for database and storage
- Puppeteer for HTML-to-PDF generation (HR documents)
- Multer for handling multipart form-data uploads

### Data & Storage

- Supabase PostgreSQL for relational data:
  - companies
  - employees
  - document_templates
  - employee_documents
- Supabase Storage buckets:
  - avatars – public employee profile photos
  - employee-documents – private HR documents (PDFs)

The frontend and backend are separated into two apps but designed to work together as a single product.

---

## 3. Core Features

### 3.1 Company Management

- Landing screen shows all companies in a **Company profile selection** layout.
- Each company card displays:
  - Company logo or a generated avatar if no logo is uploaded.
  - Company name.
- Dedicated **“Add Company”** button opens a compact popup form to create a new company.
- Once a company is selected, the user is taken to that company’s dashboard.

### 3.2 Company Dashboard (SalaryBox-style)

- SalaryBox-inspired layout for a clean, dense HR dashboard.
- Primary focus is the **“My Team / Staff Details”** area.
- Employee list is implemented with TanStack Table:
  - Column-based sorting (e.g., name, department, date of joining, status).
  - Text search to quickly find employees by name or email.
  - Filters (e.g., by department, status).
  - Pagination for large teams.
- Clear **“Add Employee”** button in a prominent location on the page.

### 3.3 Add Employee Flow (Two Steps)

The add employee wizard is split into two main steps for clarity and speed.

#### Step 1 – Employee Details

Form fields include:

- Required:
  - Name
  - Mobile number
  - Email
  - Date of Joining
- Optional:
  - Job Title
  - Department
  - Gender
  - Annual CTC
  - Profile picture (handled separately via avatar upload)
- Backend generates a **dummy login OTP** for the employee and stores it in the database.
- On successful save, the employee is created under the selected company, and the flow moves to Step 2.

#### Step 2 – Document Generation (Optional)

- Shows a list of available document templates, for example:
  - Standard Offer Letter
  - Standard Employment Letter
- Each template:
  - Has a readable name and document type.
  - Uses placeholders for dynamic values such as employee name, company name, job title, annual CTC, and date of joining.
- The user can:
  - Select one or more templates to generate immediately.
  - Optionally **preview** any template as a PDF before generating.
- When the user confirms:
  - The backend renders the appropriate HTML template with employee and company data.
  - Puppeteer converts the HTML into a PDF.
  - The PDF is uploaded to Supabase Storage (employee-documents bucket).
  - A record is inserted into the employee_documents table.
- If the user skips this step, they can always generate documents later from the employee’s profile page.

At the end of this flow, the employee appears in the main staff table for the company.

---

## 4. Employee Table & Filtering

The staff table is designed for HR operators to quickly find and manage people:

- Columns typically include:
  - Name
  - Job Title
  - Department
  - Mobile
  - Email
  - Date of Joining
  - Gender
  - Status
  - Created At
- Features:
  - Sort by any key column (for example, Date of Joining, Name, Status).
  - Filter by department and status.
  - Search by free text (name or email).
- Clicking a row opens the full **Employee Profile** page for that person.

The table UX is similar to modern admin dashboards and HR tools, but the underlying implementation stays lightweight and headless using TanStack Table.

---

## 5. Employee Profile Page

Clicking an employee from the dashboard navigates to a detailed profile page:

### 5.1 Layout

- Left sidebar:
  - Employee avatar (or initials if no photo).
  - Name and job title.
  - Navigation sections similar to SalaryBox, for example:
    - Personal Details
    - Employment Details
    - Custom Details
    - Background Verification
    - Bank Account
    - Requests
    - User Permission
    - Attendance Details
    - Salary Details
    - Leave & Balance Details
    - Penalty & Overtime Details
    - Tax Declarations
    - Documents
    - Additional Settings
  - At this stage, only key sections like Personal Details, Employment Details, and Documents are wired end-to-end; the rest exist as placeholders for future expansion.

- Right content area:
  - Shows the active section’s form or content.
  - Uses shadcn/ui forms for a clean, consistent look.

### 5.2 Personal & Employment Details

From the profile page, HR can:

- View and edit core fields:
  - Name, email, mobile.
  - Date of joining.
  - Job title, department.
  - Status and basic employment metadata.
- Save changes via inline forms that talk to the Express backend, which updates Supabase.

### 5.3 Avatar Upload

- Profile photo upload is handled via a simple file input on the employee profile.
- On upload:
  - The file is sent as multipart form-data to the Express backend.
  - The server stores the image in the Supabase Storage avatars bucket.
  - The public URL of the stored image is saved in the employees table.
- The frontend immediately displays the new avatar, falling back to initials when no avatar is present.

---

## 6. Document Templates & PDF Engine

### 6.1 Template Storage

- Templates are stored in the document_templates table.
- Each template includes:
  - Name (for display in the UI)
  - Slug (machine-friendly identifier)
  - Document type (e.g., OFFER_LETTER, EMPLOYMENT_LETTER)
  - HTML body with template placeholders
  - Optional company_id to allow per-company custom templates
- Global templates (with company_id set to null) are available to all companies.

### 6.2 Placeholder System

Common placeholders used inside templates include:

- {{employee_name}}
- {{company_name}}
- {{date_of_joining}}
- {{job_title}}
- {{annual_ctc}}

On the server, these placeholders are replaced with real values from the employee and company records before HTML is passed to Puppeteer.

### 6.3 PDF Generation Flow

When HR chooses to generate documents (either in the add employee wizard or from the profile page):

1. The frontend calls the Express API with the employee id and selected template id.
2. The backend:
   - Fetches employee, company, and template rows.
   - Renders template HTML with placeholder values.
   - Generates a PDF using Puppeteer.
   - Uploads the PDF to Supabase Storage (employee-documents bucket).
   - Creates an employee_documents record that links employee, company, and template, and stores the file path.
3. The document is now visible in the employee’s Documents tab and can be downloaded as needed.

### 6.4 Previewing Templates

Before generating a real document, HR can preview the PDF version of a template for a specific employee:

- The frontend calls a dedicated preview endpoint with employee id and template id.
- The backend:
  - Renders HTML with actual employee and company data.
  - Generates a PDF in memory.
  - Streams it back in the response as application/pdf without storing it.
- The frontend shows this PDF inside a modal viewer using a dialog component and an embedded PDF viewer.

This enables HR to confirm wording, formatting, and key amounts (like salary) before generating final documents.

---

## 7. Employee Documents Tab

The Documents section on the employee profile is the central place to manage HR paperwork for that person.

### 7.1 Document List

- Table of all generated documents for that employee:
  - Document name (from its template)
  - Document type
  - Created date and time
- Data is loaded from the employee_documents table.

### 7.2 Downloading

- When a user chooses to download a document:
  - The frontend calls a download endpoint with the document id.
  - The backend creates a short-lived signed URL from Supabase Storage and returns it.
  - The frontend opens the signed URL in a new tab, letting the browser handle the PDF download or display.

### 7.3 Generating New Documents

- From the Documents tab, HR can:
  - Select a template from a dropdown.
  - Optionally preview it.
  - Generate a new document using the same flow as in the add employee wizard.
- Newly generated documents appear in the list instantly after creation.

---

## 8. Data Model Summary

At a high level, the core tables are:

- companies
  - Basic company information and branding.
- employees
  - All employee master data.
  - Links to companies.
  - Stores avatar URL and login OTP.
- document_templates
  - Defines reusable HR document layouts and content.
  - Supports global and per-company templates.
- employee_documents
  - Links employees, templates, and companies.
  - Stores the storage path to generated PDF files.

Storage buckets:

- avatars
  - Small, public images for employee profile pictures.
- employee-documents
  - Private PDFs with signed-URL access.

---

## 9. User Flow Summary

1. Open the app (no login required).
2. Land on the company selection screen:
   - View all companies as cards in a profile-style grid.
   - Click a company to open its dashboard.
   - Or click the add button to create a new company via a popup form.
3. On the company dashboard:
   - See the staff table with filters, sort options, and search.
   - Click “Add Employee” to start the onboarding wizard.
4. Add employee wizard:
   - Step 1: Fill in employee details and save.
   - Step 2: Optionally select templates, preview PDFs, and generate documents.
5. After saving:
   - The new employee appears in the company’s staff table.
6. Click an employee row:
   - Navigate to that employee’s profile page.
   - Use Personal and Employment sections to update data.
   - Upload or change profile photo.
   - Open the Documents tab to view, generate, and download documents.
7. Repeat for additional employees and companies.

This end-to-end flow gives a compact but realistic HR system: from company selection to employee onboarding and document handling — all built on a modern, production-ready stack, but still easy to reason about and extend.
