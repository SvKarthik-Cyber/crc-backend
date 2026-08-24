# Cyber Incident Response & Reporting Backend API (CRC-Backend)

A production-ready RESTful API built with Node.js, Express, and MongoDB Atlas for cyber incident reporting, triage, and audit-logged tracking. Features multipart evidence file handling (PDFs/Images), JWT authentication, Role-Based Access Control (RBAC), and WebSockets.

---

## 🛠️ 1. Tech Stack & Core Dependencies

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js (v20+), Express.js | Core web server and RESTful routing engine |
| **Database** | MongoDB Atlas, Mongoose ORM | Document storage, validation, and data modeling |
| **Authentication** | JSON Web Tokens (JWT), `bcryptjs` | Stateless session management & password hashing |
| **File Processing** | Multer | Handling multipart form-data for evidence file uploads |
| **Security & Utilities** | Helmet, CORS, `dotenv` | HTTP security headers, cross-origin access control, environment management |
| **Real-time Messaging** | Socket.io | WebSockets for real-time incident updates |

---

## 🚀 2. Local Setup & Installation

### Step 1: Environment Variables Setup

Create a `.env` file in the root directory (`crc-backend/.env`):

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/crc_db
JWT_SECRET=your_jwt_secret_key_here
CLIENT_ORIGIN=http://localhost:5173
```

### Step 2: Installation & Running

```bash
# Install dependencies
npm install

# Run development server with auto-reload
npm run dev
```

---

## 🔄 3. System Architecture & Workflow

1. **Client Submission** — The frontend sends an HTTP request containing a JWT token in headers and form data (including evidence files) to the backend.
2. **Authentication Layer** — `authenticateToken` middleware verifies the HTTP Bearer Token.
3. **Authorization Layer** — `authorizeRoles` validates role privileges (`individual`, `volunteer`, `admin`).
4. **File Pipeline** — Multer parses `multipart/form-data`, saves files to `/uploads/`, and generates URL access paths.
5. **Database Layer** — Mongoose inserts the incident document into MongoDB Atlas, initiating an audit `timeline` array.
6. **Static File Delivery** — Uploaded evidence is served statically via `http://localhost:5000/uploads/<filename>`.

---

## 🗄️ 4. Database Schemas (Data Models)

### User Schema (`User`)

- `name` (String, Required)
- `email` (String, Unique, Required)
- `password` (String, Hashed, Required)
- `role` (String, Enum: `individual`, `volunteer`, `admin`, Default: `individual`)
- `district` (String)

### Incident Schema (`Incident`)

- `reportedBy` (ObjectId, Ref: `User`)
- `category` (String, e.g., Phishing, Financial Fraud, Malware)
- `description` (String, Required)
- `severity` (String, Enum: `low`, `medium`, `high`)
- `district` (String, Required)
- `status` (String, Enum: `new`, `under_investigation`, `resolved`, `dismissed`, Default: `new`)
- `evidenceFiles` (Array of Strings — stored paths)
- `timeline` (Array of Objects tracking status updates, timestamp, actor, and notes)

---

## 📡 5. Complete API Endpoint Reference

### Base Configuration

- **Base URL:** `http://localhost:5000`
- **Authorization Header:** `Authorization: Bearer <your_jwt_token>`

### A. Authentication Routes (`/api/auth`)

#### `POST /api/auth/register`

- **Content-Type:** `application/json`

**Body:**

```json
{
  "name": "Karthik Suresh",
  "email": "karthik@example.com",
  "password": "SecurePassword123!",
  "phone": "9876543210",
  "district": "Ernakulam",
  "role": "individual"
}
```

**Response (201 Created):**

```json
{
  "message": "User registered successfully",
  "userId": "66c8f1a23b4e5c0012a1b2c3"
}
```

#### `POST /api/auth/login`

- **Content-Type:** `application/json`

**Body:**

```json
{
  "email": "karthik@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "66c8f1a23b4e5c0012a1b2c3",
    "name": "Karthik Suresh",
    "role": "individual",
    "district": "Ernakulam"
  }
}
```

### B. User Incident Routes (`/api/incidents`)

#### `POST /api/incidents`

Submits a new incident report with up to 5 attached evidence files.

- **Auth:** Required (`Bearer <token>`)
- **Content-Type:** `multipart/form-data`

**Form-Data Fields:**

| Field | Type | Example |
| :--- | :--- | :--- |
| `category` | text | `"Phishing"` |
| `description` | text | `"Received malicious link via SMS"` |
| `severity` | text | `"high"` |
| `district` | text | `"Ernakulam"` |
| `evidenceFiles` | files | Attach PDF/Image files |

**Response (201 Created):**

```json
{
  "message": "Incident reported successfully",
  "incident": {
    "_id": "66c8f9b83b4e5c0012a1b2d4",
    "category": "Phishing",
    "severity": "high",
    "district": "Ernakulam",
    "status": "new",
    "evidenceFiles": ["/uploads/evidence-1724500000000.pdf"]
  }
}
```

#### `GET /api/incidents/mine`

Retrieves all incidents submitted by the authenticated user.

- **Auth:** Required

#### `GET /api/incidents/:id`

Retrieves a specific incident along with its detailed investigation timeline.

- **Auth:** Required

### C. Admin & Volunteer Triage Routes (`/api/incidents`)

*(Restricted to `admin` or `volunteer` roles)*

#### `GET /api/incidents`

Fetches all system incidents with query parameters for filtering.

- **Auth:** Required (`admin` / `volunteer` only)
- **Query Parameters:** `?district=Ernakulam&severity=high&status=new`
- **Example:** `GET http://localhost:5000/api/incidents?district=Ernakulam&severity=high`

#### `PATCH /api/incidents/:id/status`

Updates incident status and logs an audit record into the `timeline` array.

- **Auth:** Required (`admin` / `volunteer` only)
- **Content-Type:** `application/json`

**Body:**

```json
{
  "status": "under_investigation",
  "note": "Case assigned to District Cyber Cell."
}
```

### D. System Health Check Route (`/api/health`)

#### `GET /api/health`

- **Auth:** Public

**Response (200 OK):**

```json
{
  "status": "ok",
  "message": "CRC Backend API Running"
}
```

---

## 💻 6. Frontend Integration Snippets

### Submitting an Incident with Evidence Files (JavaScript/React)

```javascript
const submitIncident = async (token, incidentData, fileArray) => {
  const formData = new FormData();
  formData.append('category', incidentData.category);
  formData.append('description', incidentData.description);
  formData.append('severity', incidentData.severity);
  formData.append('district', incidentData.district);

  // Attach evidence files
  for (let i = 0; i < fileArray.length; i++) {
    formData.append('evidenceFiles', fileArray[i]);
  }

  const response = await fetch('http://localhost:5000/api/incidents', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
      // Note: Do NOT manually set Content-Type header when passing FormData!
    },
    body: formData
  });

  return await response.json();
};
```

### Rendering Uploaded Evidence Files on Frontend

```javascript
// Prepend backend URL to access uploaded static files
const fileUrl = `http://localhost:5000${incident.evidenceFiles[0]}`;
```

```jsx
<a href={fileUrl} target="_blank" rel="noopener noreferrer">
  View Uploaded Evidence PDF
</a>
```
