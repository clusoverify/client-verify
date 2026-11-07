# Cluso Infolink Verify — Steps to Connect API in Another Website

A direct, practical integration guide to connect Cluso Infolink Verify into your external website, ATS, HRMS, or custom backend.

---

## Step 1: Generate Your API Secret Key

1. Log into your **Client Verify Portal** (`https://verify.cluso.in`).
2. In the left navigation menu, click **API Connection** (or navigate to `/client/api-settings`).
3. Click the green **"Generate New API Key"** button.
4. A secure modal will appear displaying your secret key:
   ```text
   sk_live_SAMPLE_GENERATED_SECRET_KEY
   ```
5. **Copy and save this key** to your website’s environment variables (e.g., `CLUSO_API_KEY` in `.env`).  
   *(For security, the full key is only shown once).*

---

## Step 2: Standard Request Headers & Base URLs

Every API request from your website's backend **must** include these HTTP headers:

```http
Authorization: Bearer sk_live_YOUR_SECRET_KEY
Content-Type: application/json
```

- **Production Base URL**: `https://verify.cluso.in`
- **Local Dev Base URL**: `http://localhost:3000`

---

## Step 3: Trigger a Verification (POST)

Send candidate details via `POST` with a JSON payload. Select the check endpoint you need:

### A. Identity Verification (DigiLocker / Aadhaar)
- **Endpoint**: `POST https://verify.cluso.in/api/v1/external/verify/identity`
- **Request Body**:
  ```json
  {
    "candidateName": "Rahul Sharma",
    "candidateEmail": "rahul@example.com",
    "candidateMobile": "+919876543210"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "requestId": "ACM040926-0001",
    "status": "processing",
    "candidateSetupUrl": "https://candidate.verify.cluso.in/?email=..."
  }
  ```
  *(Deliver `candidateSetupUrl` to the user via SMS/email so they can complete Aadhaar authentication).*

---

### B. Court Record Check (Indian District & High Courts)
- **Endpoint**: `POST https://verify.cluso.in/api/v1/external/verify/court-record`
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
        "district": "Bengaluru Urban"
      }
    ]
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "requestId": "CRT040926-0001",
    "status": "processing"
  }
  ```

---

### C. Indian Passport Status Check (Instant Synchronous)
- **Endpoint**: `POST https://verify.cluso.in/api/v1/external/verify/passport`
- **Request Body**:
  ```json
  {
    "fileNumber": "BO1078292837261",
    "dateOfBirth": "20/08/1996"
  }
  ```
- **Response**:
  ```json
  {
    "success": true,
    "requestId": "PSP040926-0001",
    "status": "completed",
    "candidateName": "PRIYA SHARMA",
    "passportStatus": "Passport has been dispatched via Speed Post."
  }
  ```

---

### D. International Court & Police Registry Checks
- **Interpol Red Notice**: `POST /api/v1/external/verify/interpol`  
  ```json
  { "candidateName": "David Miller", "candidateDob": "1988-11-23", "birthCity": "London" }
  ```
- **UK Court Records**: `POST /api/v1/external/verify/uk-court`  
  ```json
  { "candidateName": "James Davies", "candidateDob": "1983-09-14" }
  ```
- **Singapore Court Judiciary**: `POST /api/v1/external/verify/singapore-court`  
  ```json
  { "candidateName": "Tan Wei Lin" }
  ```
- **Malaysia Court eJudgment**: `POST /api/v1/external/verify/malaysia-court`  
  ```json
  { "candidateName": "Tan Wei Meng" }
  ```
- **Philippines Court of Appeals**: `POST /api/v1/external/verify/philippines-court`  
  ```json
  { "candidateName": "Juan Dela Cruz" }
  ```
- **South Africa SAFLII Court**: `POST /api/v1/external/verify/saflii-court`  
  ```json
  { "candidateName": "Johan Van Der Merwe", "candidateDob": "1985-02-17" }
  ```
- **SAPS Wanted Persons (South Africa)**: `POST /api/v1/external/verify/saps-wanted`  
  ```json
  { "candidateName": "Sipho Ndlovu", "candidateDob": "1990-07-22" }
  ```

---

### E. Employment & Education Checks
- **Employment Verification**: `POST /api/v1/external/verify/employment`
  ```json
  {
    "candidateName": "Sneha Patel",
    "email": "sneha@example.com",
    "skipCandidateLogin": true,
    "employments": [
      {
        "companyName": "Tech Mahindra",
        "position": "Software Engineer",
        "joiningYear": "2021",
        "leavingYear": "2024"
      }
    ]
  }
  ```
- **Education Verification**: `POST /api/v1/external/verify/education`
  ```json
  {
    "candidateName": "Sneha Patel",
    "email": "sneha@example.com",
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

---

## Step 4: Poll Verification Status (GET — Always Free $0)

While background searches process (usually 5 to 15 seconds), poll the status endpoint:

- **Endpoint**: `GET https://verify.cluso.in/api/v1/external/status/{requestId}`
- **Headers**: `Authorization: Bearer sk_live_YOUR_KEY`
- **Response**:
  ```json
  {
    "success": true,
    "requestId": "ACM040926-0001",
    "status": "Completed"
  }
  ```
  Once `status` is `"Completed"`, `"Verified"`, or `"Discrepancy"`, retrieve the final report.

---

## Step 5: Download the Final Report (GET — Always Free $0)

### Option 1: Full JSON Report Data
- **Endpoint**: `GET https://verify.cluso.in/api/v1/external/report/{requestId}`
- **Response**:
  ```json
  {
    "success": true,
    "requestId": "ACM040926-0001",
    "status": "Completed",
    "candidateName": "Rahul Sharma",
    "report": {
      "digilockerStatus": "verified",
      "digilockerAadhaar": "XXXXXXXX9481",
      "digilockerPan": "XXXXX4829X"
    },
    "pdfUrl": "https://verify.cluso.in/api/v1/external/report/ACM040926-0001/pdf"
  }
  ```

### Option 2: Print-Ready HTML / PDF Document
- **Endpoint**: `GET https://verify.cluso.in/api/v1/external/report/{requestId}/pdf`
- **Response**: Self-contained HTML report with `Content-Disposition: attachment`. Can be printed directly to PDF via `window.print()` or headless browser.

---

## Complete Drop-in Code Recipes

### JavaScript / Node.js (fetch)

```javascript
// cluso-api.js
const API_KEY = process.env.CLUSO_API_KEY; // "sk_live_..."
const BASE_URL = "https://verify.cluso.in";

// 1. Submit a verification request
async function startVerification(endpoint, payload) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });
  return await response.json();
}

// 2. Poll until completed and fetch full report
async function waitForReport(requestId, maxWaitSeconds = 60) {
  const startTime = Date.now();
  
  while ((Date.now() - startTime) / 1000 < maxWaitSeconds) {
    await new Promise(r => setTimeout(r, 5000)); // wait 5s

    const statusRes = await fetch(`${BASE_URL}/api/v1/external/status/${requestId}`, {
      headers: { "Authorization": `Bearer ${API_KEY}` }
    });
    const statusData = await statusRes.json();
    
    if (["completed", "verified", "discrepancy"].includes(statusData.status?.toLowerCase())) {
      // Fetch full report
      const reportRes = await fetch(`${BASE_URL}/api/v1/external/report/${requestId}`, {
        headers: { "Authorization": `Bearer ${API_KEY}` }
      });
      return await reportRes.json();
    }
  }
  throw new Error("Verification timed out");
}

// 3. Example Execution
async function runDemo() {
  // Step A: Trigger
  const createResult = await startVerification("/api/v1/external/verify/identity", {
    candidateName: "Rahul Sharma",
    candidateEmail: "rahul@example.com"
  });

  console.log("Request ID:", createResult.requestId);
  console.log("Candidate Setup Link:", createResult.candidateSetupUrl);

  // Step B: Wait for completion
  const report = await waitForReport(createResult.requestId);
  console.log("Final Report Outcome:", report);
}
```

---

### Python 3 (requests)

```python
# cluso_api.py
import requests
import time

API_KEY = "sk_live_YOUR_KEY_HERE"
BASE_URL = "https://verify.cluso.in"
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

def verify_candidate(endpoint: str, payload: dict) -> dict:
    # 1. Trigger Verification
    res = requests.post(f"{BASE_URL}{endpoint}", headers=HEADERS, json=payload)
    res.raise_for_status()
    data = res.json()
    request_id = data["requestId"]
    print(f"Verification created: {request_id}")

    # 2. Poll Status (5s interval)
    while True:
        time.sleep(5)
        status_res = requests.get(f"{BASE_URL}/api/v1/external/status/{request_id}", headers=HEADERS)
        status_res.raise_for_status()
        status_data = status_res.json()
        current_status = status_data.get("status", "").lower()
        print(f"Polling Status: {current_status}")

        if current_status in ["completed", "verified", "discrepancy"]:
            break

    # 3. Retrieve Report
    report_res = requests.get(f"{BASE_URL}/api/v1/external/report/{request_id}", headers=HEADERS)
    report_res.raise_for_status()
    return report_res.json()
```
