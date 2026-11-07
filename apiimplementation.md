# Cluso Infolink Verify — Complete API Implementation Specification & Integration Manual

> **Document Version**: 2.0.0  
> **Target System**: Client Verify Portal (`client-verify`)  
> **Base URL**: `https://verify.clusoinfolink.com` (Production) / `http://localhost:3000` (Local Development)  
> **Security Protocol**: TLS 1.3 / HTTPS Mandatory  
> **Auth Standard**: RFC 6750 Bearer Token with SHA-256 Key Hashing  

---

## Table of Contents

1. [Architectural Overview & Security Pipeline](#1-architectural-overview--security-pipeline)
2. [API Connecting Route & Client Portal Integration](#2-api-connecting-route--client-portal-integration)
3. [Authentication & Authorization Specifications](#3-authentication--authorization-specifications)
4. [Rate Limiting & Throttling](#4-rate-limiting--throttling)
5. [Billing & Usage Auditing](#5-billing--usage-auditing)
6. [External REST API Reference (All 18 Endpoints)](#6-external-rest-api-reference-all-18-endpoints)
   - [Verification Trigger Endpoints (POST)](#verification-trigger-endpoints-post)
     1. [Identity & Candidate Setup (`/api/v1/external/verify/identity`)](#1-identity--candidate-setup)
     2. [Court Record Check — eCourts India (`/api/v1/external/verify/court-record`)](#2-court-record-check--ecourts-india)
     3. [Passport Status Check — Passport Seva India (`/api/v1/external/verify/passport`)](#3-passport-status-check--passport-seva-india)
     4. [Digital Address Geo-Verification (`/api/v1/external/verify/digital-address`)](#4-digital-address-geo-verification)
     5. [Interpol Wanted Notice Check (`/api/v1/external/verify/interpol`)](#5-interpol-wanted-notice-check)
     6. [Interpol Worldwide Red Notice Check (`/api/v1/external/verify/rednotice`)](#6-interpol-worldwide-red-notice-check)
     7. [South African Court Check — SAFLII (`/api/v1/external/verify/saflii-court`)](#7-south-african-court-check--saflii)
     8. [SAPS Wanted Persons Check (`/api/v1/external/verify/saps-wanted`)](#8-saps-wanted-persons-check)
     9. [UK Court Records Check (`/api/v1/external/verify/uk-court`)](#9-uk-court-records-check)
     10. [Malaysia Court Check — eJudgment (`/api/v1/external/verify/malaysia-court`)](#10-malaysia-court-check--ejudgment)
     11. [Philippines Court of Appeals Check (`/api/v1/external/verify/philippines-court`)](#11-philippines-court-of-appeals-check)
     12. [Singapore Judiciary Court Check (`/api/v1/external/verify/singapore-court`)](#12-singapore-judiciary-court-check)
     13. [Employment Verification (`/api/v1/external/verify/employment`)](#13-employment-verification)
     14. [Education Verification (`/api/v1/external/verify/education`)](#14-education-verification)
   - [Retrieval & Status Endpoints (GET)](#retrieval--status-endpoints-get)
     15. [Verification Status Polling (`/api/v1/external/status/{requestId}`)](#15-verification-status-polling)
     16. [Download Completed Report JSON (`/api/v1/external/report/{requestId}`)](#16-download-completed-report-json)
     17. [Download Completed Report as PDF/HTML (`/api/v1/external/report/{requestId}/pdf`)](#17-download-completed-report-as-pdfhtml)
     18. [List Organisation Verifications (`/api/v1/external/list`)](#18-list-organisation-verifications)
7. [Internal & Search Proxy Endpoints](#7-internal--search-proxy-endpoints)
8. [Database Schemas & Data Models](#8-database-schemas--data-models)
9. [Error Code Matrix & Troubleshooting Guide](#9-error-code-matrix--troubleshooting-guide)
10. [SDK & Implementation Recipes (Node.js, Python, cURL)](#10-sdk--implementation-recipes-nodejs-python-curl)

---

## 1. Architectural Overview & Security Pipeline

The Cluso Infolink Verify API layer allows third-party client applications (such as Applicant Tracking Systems, HRMS, Career sites, and Internal Compliance Portals) to interact programmatically with Cluso Infolink's verification engine.

```
+----------------------------+
| Third-Party Client System  |
|  (ATS / HRMS / Web Portal) |
+----------------------------+
              |
              | HTTPS (TLS 1.3) + Bearer sk_live_xxx
              v
+---------------------------------------------------------+
|                API Gateway & Pipeline                   |
| 1. Extract Bearer Token & Validate Regex Format         |
| 2. SHA-256 Hash Token & Lookup in `api_keys`            |
| 3. Verify Organisation Status & `apiEnabled` Flag       |
| 4. Sliding-Window In-Memory Rate Limiting (100 req/min) |
| 5. Service-Level Permission & Enablement Verification   |
+---------------------------------------------------------+
              |
              +--------------------------+
              |                          |
              v                          v
+-------------------------+  +----------------------------+
| Synchronous Execution   |  | Asynchronous Background    |
| (Passport, Interpol,    |  | Execution                  |
|  Red Notice, SAPS)      |  | (Court Scrapers, Address,  |
| Direct response in ms   |  |  DigiLocker Setup URLs)    |
+-------------------------+  +----------------------------+
              |                          |
              +------------+-------------+
                           |
                           v
+---------------------------------------------------------+
|             Auditing & Metering Pipeline                |
| 1. Increment usage metrics in `organisations`           |
| 2. Record full audit entry into `api_usage_logs`        |
| 3. Compute cost according to per-service pricing rate   |
| 4. Attach X-RateLimit-* response headers                |
+---------------------------------------------------------+
```

---

## 2. API Connecting Route & Client Portal Integration

The client verification portal features dedicated UI routes for connecting systems, creating API keys, reviewing usage, and testing endpoints.

### UI Routes Summary

| Route | Access Level | Description |
| :--- | :--- | :--- |
| **`/client/api-settings`** | `org_owner` | **Dedicated API Connection Gateway**: Issue & revoke secret keys, inspect 4-step connection workflow, generate code snippets in 3 languages, run connection diagnostics test, view KPIs and breakdown by service. |
| **`/api-docs`** | Public / All | **Interactive REST API Reference**: Complete developer documentation for all 18 endpoints, searchable schemas, real-time cURL command generator, and response payloads. |
| **`/client/verifiers?tab=api`** | `org_owner` | Tabbed interface inside the Manage Verifiers portal providing an alternative view of API keys and endpoint cURL examples. |

### Sidebar Navigation Integration

In [`src/app/client/layout.tsx`](file:///d:/Cluso-Verify/Cluso%20migration/client-verify/src/app/client/layout.tsx), the navigation menu exposes:
```typescript
...(profile?.role === "org_owner"
  ? [
      {
        name: "Manage Verifiers",
        path: "/client/verifiers",
        icon: Users,
      },
      {
        name: "API Connection",
        path: "/client/api-settings",
        icon: Code,
      },
    ]
  : [])
```

---

## 3. Authentication & Authorization Specifications

### The Secret Key Scheme
- **Token Format**: `sk_live_` followed by **32 hexadecimal characters** (16 random cryptographically secure bytes).
  - Example: `sk_live_SAMPLE_GENERATED_SECRET_KEY`
- **One-Way Cryptographic Hashing**:
  When a key is generated, the raw token is returned to the user **exactly once** in a modal. Only the SHA-256 hash (`keyHash`) and a 4-character suffix (`keySuffix`) are saved in the database:
  ```typescript
  keyHash = crypto.createHash("sha256").update(rawToken).digest("hex");
  ```
- **Header Format**:
  Every request must supply the token in the standard HTTP `Authorization` header:
  ```http
  Authorization: Bearer sk_live_SAMPLE_GENERATED_SECRET_KEY
  ```

### Tenant Isolation & Permissions
1. The API key is linked to an `orgId` and `orgName`.
2. The organisation must have `status: "Active"` and `apiEnabled: true`.
3. The key may define explicit service permissions (e.g. `["identity", "court_record"]`). If `["*"]` or empty, all enabled services for the organisation are permitted.
4. Each service must be enabled in the organisation document (e.g. `org.courtRecordEnabled !== false`).

---

## 4. Rate Limiting & Throttling

The API implements a sliding 60-second window rate limiter keyed to the API key identifier.

- **Default Limit**: `100 requests per minute` per key.
- **Headers Returned on Every Response**:
  - `X-RateLimit-Limit`: Maximum requests permitted per 60-second window (e.g. `100`).
  - `X-RateLimit-Remaining`: Requests remaining in the current rolling window.
  - `X-RateLimit-Reset`: Unix epoch timestamp (in seconds) when the oldest window interval resets.
- **Throttling Response (HTTP 429)**:
  ```json
  {
    "error": "Too Many Requests",
    "message": "Rate limit exceeded. Maximum 100 requests per minute.",
    "retryAfter": 14
  }
  ```

---

## 5. Billing & Usage Auditing

Every API invocation is metered and audited in the MongoDB collection `api_usage_logs`.

### Billing Rules
1. **Verification Creation (POST)**:
   - Incurred only on successful receipt (`200 OK`).
   - Charged using the organisation's configured per-service rate (e.g. `courtRecordRate`, `identityRate`, or fallback to `monthlyRate`).
2. **Status Polling (`GET /status/{requestId}`)**:
   - **Always Free (`$0.00`)** to encourage frequent client status polling without penalty.
3. **Report Retrieval (`GET /report/{requestId}` & `/pdf`)**:
   - **Always Free (`$0.00`)**.
4. **Failed Requests (4xx / 5xx)**:
   - **Always Free (`$0.00`)**.

---

## 6. External REST API Reference (All 18 Endpoints)

### Overview of All 18 Endpoints

| # | Check / Operation | Method | Path | Processing Type | Cost |
| :- | :--- | :---: | :--- | :---: | :---: |
| 1 | Identity & Candidate Setup | `POST` | `/api/v1/external/verify/identity` | Async / Onboarding | Billed |
| 2 | Court Record (eCourts India) | `POST` | `/api/v1/external/verify/court-record` | Asynchronous Scraper | Billed |
| 3 | Indian Passport Status | `POST` | `/api/v1/external/verify/passport` | Synchronous Gov API | Billed |
| 4 | Digital Address Verification | `POST` | `/api/v1/external/verify/digital-address` | Async Geo-Selfie Link | Billed |
| 5 | Interpol Wanted Notice Check | `POST` | `/api/v1/external/verify/interpol` | Instant Database Check | Billed |
| 6 | Worldwide Red Notice Check | `POST` | `/api/v1/external/verify/rednotice` | Instant Database Check | Billed |
| 7 | South African Court (SAFLII) | `POST` | `/api/v1/external/verify/saflii-court` | Asynchronous Scraper | Billed |
| 8 | SAPS Wanted Persons | `POST` | `/api/v1/external/verify/saps-wanted` | Instant Database Check | Billed |
| 9 | UK Court Judgments Check | `POST` | `/api/v1/external/verify/uk-court` | Asynchronous Scraper | Billed |
| 10 | Malaysia Court eJudgment | `POST` | `/api/v1/external/verify/malaysia-court` | Asynchronous Scraper | Billed |
| 11 | Philippines Court of Appeals | `POST` | `/api/v1/external/verify/philippines-court` | Asynchronous Scraper | Billed |
| 12 | Singapore Court Judiciary | `POST` | `/api/v1/external/verify/singapore-court` | Asynchronous Scraper | Billed |
| 13 | Employment Verification | `POST` | `/api/v1/external/verify/employment` | Async / ATS Records | Billed |
| 14 | Education Verification | `POST` | `/api/v1/external/verify/education` | Async / Registry Check | Billed |
| 15 | Check Verification Status | `GET` | `/api/v1/external/status/{requestId}` | Status Polling | **Free ($0)** |
| 16 | Fetch Final Report (JSON) | `GET` | `/api/v1/external/report/{requestId}` | Data Retrieval | **Free ($0)** |
| 17 | Download Report as PDF (HTML) | `GET` | `/api/v1/external/report/{requestId}/pdf` | Standalone Printable HTML | **Free ($0)** |
| 18 | List All Verifications | `GET` | `/api/v1/external/list` | Paginated Filter | **Free ($0)** |

---

### Verification Trigger Endpoints (POST)

#### 1. Identity & Candidate Setup
- **Endpoint**: `POST /api/v1/external/verify/identity`
- **Description**: Creates a verification record, provisions a candidate portal account, and returns a self-onboarding URL (`candidateSetupUrl`) where the candidate completes DigiLocker Aadhaar/PAN authentication.
- **Request Body**:
  ```json
  {
    "candidateName": "Rahul Sharma",
    "candidateEmail": "rahul.sharma@example.com",
    "candidateMobile": "+919876543210",
    "requestingOrgName": "Acme Corp Ltd"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "ACM040926-0001",
    "status": "processing",
    "candidateSetupUrl": "https://candidate.verify.clusoinfolink.com/?email=rahul.sharma%40example.com&password=Cluso%40...",
    "message": "Identity verification request created successfully."
  }
  ```

---

#### 2. Court Record Check — eCourts India
- **Endpoint**: `POST /api/v1/external/verify/court-record`
- **Description**: Queues multi-district civil and criminal litigation checks across District Courts and High Courts of India via official eCourts services.
- **Request Body**:
  ```json
  {
    "candidateName": "Amit Kumar",
    "candidateDob": "1994-05-12",
    "fatherName": "Ramesh Kumar",
    "gender": "Male",
    "addresses": [
      {
        "address": "Flat 402, Green Glen",
        "city": "Bengaluru",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "stateCode": "29",
        "districtCode": "1"
      }
    ]
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "CRT040926-0001",
    "status": "processing",
    "message": "Court record verification created. eCourts search initiated."
  }
  ```

---

#### 3. Passport Status Check — Passport Seva India
- **Endpoint**: `POST /api/v1/external/verify/passport`
- **Description**: Real-time synchronous verification of Indian passport status and applicant identity through Passport Seva.
- **Request Body**:
  ```json
  {
    "fileNumber": "BO1078292837261",
    "dateOfBirth": "20/08/1996",
    "applicationType": "passport"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "PSP040926-0001",
    "status": "completed",
    "candidateName": "PRIYA SHARMA",
    "fileNumber": "BO1078292837261",
    "passportStatus": "Passport has been dispatched via Speed Post.",
    "details": {
      "typeOfApplication": "Normal",
      "applicationReceivedDate": "12/04/2024",
      "statusMessage": "Passport has been dispatched via Speed Post."
    }
  }
  ```

---

#### 4. Digital Address Geo-Verification
- **Endpoint**: `POST /api/v1/external/verify/digital-address`
- **Description**: Generates a mobile-friendly candidate verification session for GPS-tagged doorstep confirmation and live geo-selfies.
- **Request Body**:
  ```json
  {
    "candidateName": "Priya Sharma",
    "candidateEmail": "priya.s@example.com",
    "candidateAddress": "124 Park Avenue, Sector 14, Gurugram, Haryana"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "DAV040926-0001",
    "status": "processing",
    "candidateSetupUrl": "https://candidate.verify.clusoinfolink.com/?email=priya.s%40example.com...",
    "message": "Digital address verification created successfully."
  }
  ```

---

#### 5. Interpol Wanted Notice Check
- **Endpoint**: `POST /api/v1/external/verify/interpol`
- **Description**: Instant screening against active international Interpol Red Notices for wanted fugitives.
- **Request Body**:
  ```json
  {
    "candidateName": "David Miller",
    "candidateDob": "1988-11-23",
    "birthCity": "London"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "INT040926-0001",
    "status": "completed",
    "hasRecords": false,
    "matchCount": 0,
    "message": "No records found. Clean record."
  }
  ```

---

#### 6. Interpol Worldwide Red Notice Check
- **Endpoint**: `POST /api/v1/external/verify/rednotice`
- **Description**: Global lookup across 196 countries and 5,800+ international fugitive notices.
- **Request Body**:
  ```json
  {
    "candidateName": "Carlos Silva",
    "candidateDob": "1982-04-15",
    "birthCity": "Sao Paulo"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "RNW040926-0001",
    "status": "completed",
    "hasRecords": false,
    "matchCount": 0,
    "matches": []
  }
  ```

---

#### 7. South African Court Check — SAFLII
- **Endpoint**: `POST /api/v1/external/verify/saflii-court`
- **Description**: Automated search across South African High Courts, Supreme Court of Appeal, and Constitutional Court.
- **Request Body**:
  ```json
  {
    "candidateName": "Johan Van Der Merwe",
    "candidateDob": "1985-02-17",
    "birthCity": "Cape Town"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "SAF040926-0001",
    "status": "processing",
    "message": "SAFLII Court check initiated. Results will be available via the status endpoint."
  }
  ```

---

#### 8. SAPS Wanted Persons Check
- **Endpoint**: `POST /api/v1/external/verify/saps-wanted`
- **Description**: Instant screening against the South African Police Service (SAPS) national wanted persons registry.
- **Request Body**:
  ```json
  {
    "candidateName": "Sipho Ndlovu",
    "candidateDob": "1990-07-22",
    "candidateIdNumber": "9007225000081",
    "provinceCity": "Gauteng"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "SAP040926-0001",
    "status": "completed",
    "hasRecords": false,
    "matchCount": 0,
    "sapsWantedStatus": "completed"
  }
  ```

---

#### 9. UK Court Records Check
- **Endpoint**: `POST /api/v1/external/verify/uk-court`
- **Description**: Searches HM Courts & Tribunals Judiciary judgments and sentencing remarks across England, Wales, and appellate courts.
- **Request Body**:
  ```json
  {
    "candidateName": "James Arthur Davies",
    "candidateDob": "1983-09-14",
    "judgmentType": "Criminal",
    "jurisdiction": "Crown Court"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "UKC040926-0001",
    "status": "processing",
    "message": "UK Court check initiated. Results will be available via the status endpoint."
  }
  ```

---

#### 10. Malaysia Court Check — eJudgment
- **Endpoint**: `POST /api/v1/external/verify/malaysia-court`
- **Description**: Searches Mahkamah Persekutuan Malaysia eJudgment database for civil, criminal, and appellate litigation records.
- **Request Body**:
  ```json
  {
    "candidateName": "Tan Wei Meng",
    "candidateDob": "1991-03-05",
    "courtCategory": "High Court",
    "courtLocation": "Kuala Lumpur"
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "MYC040926-0001",
    "status": "processing",
    "message": "Malaysia Court check initiated. Results will be available via the status endpoint."
  }
  ```

---

#### 11. Philippines Court of Appeals Check
- **Endpoint**: `POST /api/v1/external/verify/philippines-court`
- **Description**: Live search across Court of Appeals stations (CA Manila, CA Visayas, CA Mindanao) by candidate full name or case docket number.
- **Request Body**:
  ```json
  {
    "candidateName": "Juan Dela Cruz",
    "candidateDob": "1990-06-15",
    "station": "all",
    "caseNo": ""
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "PHC070926-0001",
    "status": "processing",
    "message": "Philippines Court of Appeals check initiated. Results will be available via the status endpoint."
  }
  ```

---

#### 12. Singapore Judiciary Court Check
- **Endpoint**: `POST /api/v1/external/verify/singapore-court`
- **Description**: Singapore Judiciary hearing lists & judgments search across Supreme Court, State Courts, and Family Justice Courts.
- **Request Body**:
  ```json
  {
    "candidateName": "Tan Wei Lin",
    "court": "Supreme Court",
    "hearingType": "",
    "judgeName": "",
    "lawFirm": ""
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "SGC070926-0001",
    "status": "processing",
    "message": "Singapore Court check initiated. Results will be available via the status endpoint."
  }
  ```

---

#### 13. Employment Verification
- **Endpoint**: `POST /api/v1/external/verify/employment`
- **Description**: Submits past employment tenures and job designations. Setting `skipCandidateLogin: true` allows ATS/HRMS systems to feed employer data directly.
- **Request Body**:
  ```json
  {
    "candidateName": "Sneha Patel",
    "email": "sneha.p@example.com",
    "mobile": "+919876543210",
    "skipCandidateLogin": true,
    "employments": [
      {
        "companyName": "Tech Mahindra",
        "position": "Software Engineer",
        "joiningYear": "2021",
        "leavingYear": "2024",
        "employeeCode": "TM-4412"
      }
    ]
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "EMP040926-0001",
    "status": "processing",
    "itemCount": 1,
    "message": "Employment verification created successfully."
  }
  ```

---

#### 14. Education Verification
- **Endpoint**: `POST /api/v1/external/verify/education`
- **Description**: Submits academic qualification and degree certificate data for university registrar validation.
- **Request Body**:
  ```json
  {
    "candidateName": "Sneha Patel",
    "email": "sneha.p@example.com",
    "skipCandidateLogin": true,
    "educationList": [
      {
        "boardUniversity": "University of Delhi",
        "courseName": "Bachelor of Technology",
        "passingYear": "2021",
        "rollNumber": "DTU-2017-094"
      }
    ]
  }
  ```
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "EDU040926-0001",
    "status": "processing",
    "itemCount": 1,
    "message": "Education verification created successfully."
  }
  ```

---

### Retrieval & Status Endpoints (GET)

#### 15. Verification Status Polling
- **Endpoint**: `GET /api/v1/external/status/{requestId}`
- **Billing Cost**: **$0.00 (Always Free)**
- **Description**: Returns live lifecycle status, sub-status indicators, and timestamps. Recommended polling interval is 5 to 10 seconds.
- **Path Parameter**: `requestId` (e.g. `ACM040926-0001`)
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "ACM040926-0001",
    "candidateName": "Rahul Sharma",
    "type": "identity",
    "status": "Completed",
    "createdAt": "2026-09-04T10:15:00.000Z",
    "completedAt": "2026-09-04T10:18:22.000Z",
    "progress": {
      "subStatus": "completed",
      "onboardingStatus": "completed"
    }
  }
  ```

---

#### 16. Download Completed Report JSON
- **Endpoint**: `GET /api/v1/external/report/{requestId}`
- **Billing Cost**: **$0.00 (Always Free)**
- **Description**: Fetches sanitized verification report JSON once the check has reached `Completed` status.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "requestId": "ACM040926-0001",
    "type": "identity",
    "status": "Completed",
    "candidateName": "Rahul Sharma",
    "report": {
      "id": "ACM040926-0001",
      "name": "Rahul Sharma",
      "email": "rahul.sharma@example.com",
      "date": "Sep 04, 2026",
      "status": "Completed",
      "digilockerStatus": "verified",
      "digilockerAadhaar": "XXXXXXXX9481",
      "digilockerPan": "XXXXX4829X",
      "hasPhoto": true
    },
    "reportUrl": "https://verify.clusoinfolink.com/client/report/ACM040926-0001",
    "pdfUrl": "https://verify.clusoinfolink.com/api/v1/external/report/ACM040926-0001/pdf"
  }
  ```

---

#### 17. Download Completed Report as PDF/HTML
- **Endpoint**: `GET /api/v1/external/report/{requestId}/pdf`
- **Billing Cost**: **$0.00 (Always Free)**
- **Description**: Returns a self-contained, print-optimized HTML report document (`Content-Disposition: attachment`).
- **Response Headers**:
  ```http
  Content-Type: text/html; charset=utf-8
  Content-Disposition: attachment; filename="report-ACM040926-0001.html"
  ```
- **Usage**:
  Save to disk as `.html` and execute `window.print()` / `Ctrl+P` in any modern web browser or headless browser (Puppeteer / Playwright) to produce a PDF.

---

#### 18. List Organisation Verifications
- **Endpoint**: `GET /api/v1/external/list?page=1&limit=20&status=Completed`
- **Billing Cost**: **$0.00 (Always Free)**
- **Query Parameters**:
  - `page`: Page number (integer, default: `1`).
  - `limit`: Records per page (integer, default: `20`, max: `100`).
  - `status`: Optional filter (e.g. `Completed`, `Processing`, `Needs Attention`).
  - `type`: Optional check type filter (`identity`, `court_record`, `uk_court`, etc.).
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "page": 1,
    "limit": 20,
    "total": 42,
    "totalPages": 3,
    "verifications": [
      {
        "id": "ACM040926-0001",
        "name": "Rahul Sharma",
        "status": "Completed",
        "type": "identity",
        "date": "Sep 04, 2026"
      }
    ]
  }
  ```

---

## 7. Internal & Search Proxy Endpoints

The `client-verify` portal contains several internal handler routes for portal synchronization and live authority scraping:

| Endpoint | Method | Purpose |
| :--- | :---: | :--- |
| `/api/portal-data` | `GET` / `POST` | Primary state synchronization for logged-in client portal sessions. Supports actions: `createVerification`, `generateApiKey`, `revokeApiKey`, `refreshApiUsage`, `inviteVerifier`, `updateVerifierStatus`, `deleteVerifier`, `markNotificationRead`, `updateProfile`. |
| `/api/portal-data/verification-detail` | `GET` | Fetches full document attributes for viewing individual verification records in the portal. |
| `/api/auth/signup` | `POST` | Registers a new client organisation and primary administrator account. |
| `/api/auth/change-password` | `POST` | Updates client account password under active session. |
| `/api/auth/[...nextauth]` | `ALL` | NextAuth credentials authentication handler. |
| `/api/ecourts-search` | `POST` | Internal scraper proxy querying High Courts and District Courts. |
| `/api/ecourts-districts` | `GET` | Fetches dynamic district listing given an Indian state code. |
| `/api/passport-track` | `POST` | Direct HTTPS proxy communicating with `api1.passportindia.gov.in`. |
| `/api/saflii-search` | `POST` | Internal parser extracting case citations from `saflii.org`. |
| `/api/uk-court-search` | `POST` | Scrapes National Archives Find Case Law and Judiciary sentencing remarks. |
| `/api/malaysia-court-search` | `POST` | Scrapes Mahkamah Persekutuan Malaysia eJudgment database. |
| `/api/philippines-court-search` | `POST` | Searches Philippines Court of Appeals cases across Manila, Visayas, and Mindanao. |
| `/api/singapore-court-search` | `POST` | Searches Singapore Judiciary hearing lists & case outcomes. |
| `/api/mongodb/refresh` | `GET` | Cache flusher and cluster ping verification. |

---

## 8. Database Schemas & Data Models

### 1. `api_keys` Collection
```typescript
interface ApiKeyDocument {
  _id: ObjectId;
  orgId: string;             // References organisations.id or organisations._id
  orgName: string;           // Exact tenant name
  keyHash: string;           // SHA-256 hash of the sk_live_ token
  keySuffix: string;         // Last 4 characters of key (e.g. "9a2f")
  keyPrefix: string;         // Prefix ("sk_live_")
  permissions: string[];     // Array of allowed check types or ["*"]
  rateLimit: number;         // Max requests/minute (default: 100)
  status: "active" | "revoked";
  createdBy: string;         // Email of user who generated the key
  createdAt: string;         // ISO date string
  lastUsedAt: Date | null;   // Updated on every authenticated request
  revokedAt: string | null;
  isDeleted: boolean;
}
```

### 2. `api_usage_logs` Collection
```typescript
interface ApiUsageLogDocument {
  _id: ObjectId;
  orgId: string;
  orgName: string;
  apiKeyId: string;
  keySuffix: string;
  endpoint: string;          // e.g. "/api/v1/external/verify/identity"
  checkType: string;         // e.g. "identity", "court_record"
  method: string;            // "POST" | "GET"
  statusCode: number;        // e.g. 200, 400, 401
  cost: number;              // Billed amount according to org rates
  currency: string;          // "USD" | "INR" | "GBP" | "ZAR"
  ipAddress: string;         // Client IP address
  requestId: string;         // ID of created verification (if applicable)
  timestamp: Date;
  responseTimeMs: number;
  errorMessage?: string;
}
```

### 3. Verification Documents (`verifications` Collection)
When created via the external API, verifications have `source: "api"` and standard prefixing:
```typescript
{
  id: "ACM040926-0001",       // Format: <PREFIX><DDMMYY>-<NNNN>
  source: "api",              // Distinguishes programmatic orders from UI orders
  orgName: "Acme Corp Ltd",   // Strict tenant isolation
  status: "Processing",       // "Processing" | "Completed" | "Discrepancy"
  createdAt: "2026-09-04T10:15:00.000Z",
  type: "identity",           // Check type discriminator
  // ...check-specific result payloads
}
```

---

## 9. Error Code Matrix & Troubleshooting Guide

| HTTP Status | Error String | Cause | Resolution |
| :---: | :--- | :--- | :--- |
| `401` | `Missing or invalid Authorization header` | No `Authorization` header provided or missing `Bearer ` prefix. | Pass `Authorization: Bearer sk_live_...`. |
| `401` | `Invalid API key format` | Key does not begin with `sk_live_` or is not 40 chars long. | Verify the copied key matches `sk_live_[32 hex chars]`. |
| `401` | `Invalid or revoked API key` | Key hash not found in database or marked `status: "revoked"`. | Issue a new active key at `/client/api-settings`. |
| `403` | `Organisation is deactivated` | Account has been paused or deactivated by administrator. | Contact Cluso Infolink support or account manager. |
| `403` | `API access is disabled for this organisation` | `org.apiEnabled === false` in database. | Request API feature enablement from administrator. |
| `403` | `API key does not have permission for '...'` | Key was generated with scoped permissions excluding this service. | Issue a key with `*` or include the requested check. |
| `404` | `Verification record not found` | ID does not exist or belongs to a different organisation. | Verify `requestId` matches the value returned on creation. |
| `429` | `Too Many Requests` | Request rate exceeded 100 requests per minute. | Implement client-side throttling or exponential backoff. |
| `502` | `Failed to communicate with government server` | Upstream portal (e.g. Passport Seva, eCourts) unreachable. | Retry request after 30–60 seconds. |

---

## 10. SDK & Implementation Recipes (Node.js, Python, cURL)

### Node.js 18+ (Fetch) Recipe
```typescript
// cluso-infolink-client.ts
const CLUSO_API_KEY = process.env.CLUSO_API_KEY || "sk_live_YOUR_KEY_HERE";
const BASE_URL = "https://verify.clusoinfolink.com";

async function verifyCandidate(candidate: {
  name: string;
  email: string;
  mobile: string;
}) {
  // 1. Submit Identity Verification
  const submitRes = await fetch(`${BASE_URL}/api/v1/external/verify/identity`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${CLUSO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      candidateName: candidate.name,
      candidateEmail: candidate.email,
      candidateMobile: candidate.mobile,
    }),
  });

  const submitData = await submitRes.json();
  if (!submitRes.ok) throw new Error(submitData.error || "Submission failed");
  console.log("Created Check ID:", submitData.requestId);
  console.log("Candidate Setup Link:", submitData.candidateSetupUrl);

  // 2. Poll Status Until Completed
  const { requestId } = submitData;
  let status = "processing";
  while (status === "processing") {
    await new Promise((resolve) => setTimeout(resolve, 5000)); // 5s interval
    const statusRes = await fetch(`${BASE_URL}/api/v1/external/status/${requestId}`, {
      headers: { "Authorization": `Bearer ${CLUSO_API_KEY}` },
    });
    const statusData = await statusRes.json();
    status = statusData.status?.toLowerCase();
    console.log(`Polling status for ${requestId}:`, status);
  }

  // 3. Fetch Final Report
  const reportRes = await fetch(`${BASE_URL}/api/v1/external/report/${requestId}`, {
    headers: { "Authorization": `Bearer ${CLUSO_API_KEY}` },
  });
  return await reportRes.json();
}
```

### Python 3 Recipe
```python
# cluso_infolink_client.py
import requests
import time

API_KEY = "sk_live_YOUR_KEY_HERE"
BASE_URL = "https://verify.clusoinfolink.com"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def verify_court_record(name: str, dob: str, address: dict):
    payload = {
        "candidateName": name,
        "candidateDob": dob,
        "addresses": [address]
    }
    
    # 1. Trigger Verification
    res = requests.post(f"{BASE_URL}/api/v1/external/verify/court-record", headers=HEADERS, json=payload)
    res.raise_for_status()
    data = res.json()
    request_id = data["requestId"]
    print(f"Court check initiated: {request_id}")
    
    # 2. Poll Status
    while True:
        time.sleep(5)
        status_res = requests.get(f"{BASE_URL}/api/v1/external/status/{request_id}", headers=HEADERS)
        status_res.raise_for_status()
        status_data = status_res.json()
        current_status = status_data.get("status", "").lower()
        print(f"Current Status: {current_status}")
        
        if current_status in ["completed", "verified", "discrepancy"]:
            break
            
    # 3. Retrieve Report
    report_res = requests.get(f"{BASE_URL}/api/v1/external/report/{request_id}", headers=HEADERS)
    return report_res.json()
```

### cURL Quick Verification Recipe
```bash
# 1. Check Passport Status
curl -X POST "https://verify.clusoinfolink.com/api/v1/external/verify/passport" \
  -H "Authorization: Bearer sk_live_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "fileNumber": "BO1078292837261",
    "dateOfBirth": "20/08/1996"
  }'

# 2. Check Interpol Red Notice
curl -X POST "https://verify.clusoinfolink.com/api/v1/external/verify/interpol" \
  -H "Authorization: Bearer sk_live_YOUR_KEY_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "candidateName": "Carlos Silva",
    "candidateDob": "1982-04-15"
  }'

# 3. Download Report as PDF (HTML attachment)
curl -X GET "https://verify.clusoinfolink.com/api/v1/external/report/ACM040926-0001/pdf" \
  -H "Authorization: Bearer sk_live_YOUR_KEY_HERE" \
  -o "report-ACM040926-0001.html"
```

---

*Cluso Infolink Verify API Documentation — Built for Secure, Automated Background Verifications.*
