# 🎉 EventSphere — Full-Stack Event Management System

![Java](https://img.shields.io/badge/Java-21-orange?style=flat-square&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.0.5-brightgreen?style=flat-square&logo=springboot)
![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-7-purple?style=flat-square&logo=vite)
![Python](https://img.shields.io/badge/Python-3.10%2B-3776AB?style=flat-square&logo=python)
![Flask](https://img.shields.io/badge/Flask-3.0-black?style=flat-square&logo=flask)
![Oracle](https://img.shields.io/badge/Oracle-26ai%20Free-red?style=flat-square&logo=oracle)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38bdf8?style=flat-square&logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

> **EventSphere** is a full-stack event management platform that connects **Users**, **Organisers**, and **Admins** in a unified system. It is powered by a Spring Boot backend, a React frontend, a Random Forest ML model for intelligent venue suggestions, and a face recognition microservice for biometric admin authentication.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup](#backend-setup)
  - [Frontend Setup](#frontend-setup)
  - [ML Venue Suggestion Service Setup](#ml-venue-suggestion-service-setup)
  - [Face Recognition Service Setup](#face-recognition-service-setup)
- [Running All Services](#-running-all-services)
- [Environment Configuration](#-environment-configuration)
- [API Overview](#-api-overview)
- [ML Venue Suggestion Model](#-ml-venue-suggestion-model)
- [Face Recognition Service](#-face-recognition-service)
- [Authentication](#-authentication)
- [Roles & Permissions](#-roles--permissions)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)

---

## ✨ Features

### 👤 User
- Register & login with Email/Password, **Google OAuth2**, or **GitHub OAuth2**
- Browse events by status: Ongoing, Upcoming, Completed
- Register for events and make payments via simulated bank system
- View ticket history and download e-tickets
- OTP-based email verification & password reset

### 🎪 Organiser
- Register as an organiser with approval workflow
- Create, edit, and manage events and programmes
- Get **AI-powered venue suggestions** ranked by suitability score
- View event analytics and attendee lists

### 🛡️ Admin
- Full platform oversight dashboard
- **Face recognition biometric login** (no password needed)
- Approve/reject organiser registrations
- Manage venues and platform-wide event status
- Access all users, organisers, and transaction data

### 🤖 AI / ML
- **Venue Suggestion** — Random Forest model scores and ranks venues for any event based on category, type, duration, month, and day of week
- **Face Authentication** — dlib-powered 128-dim face encoding comparison for admin biometric login; threshold-tuned for real-world webcam conditions

### 🔧 System
- JWT-based stateless authentication
- AOP-powered request/response logging
- Scheduled event status auto-updates
- Swagger UI for live API documentation
- Dual datasource: Oracle 26ai (main) + H2 in-memory (mock bank)
- Gmail SMTP email notifications

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 19, Vite 7, Tailwind CSS 3, React Router 7, Axios |
| **Backend** | Spring Boot 4.0.5, Java 21, Spring Security, Spring Data JPA |
| **ML Service** | Python, Flask 3.0, scikit-learn (Random Forest), pandas, joblib |
| **Face Auth Service** | Python, Flask 3.0, face_recognition (dlib), Pillow, NumPy |
| **Database** | Oracle 26ai Free (main), H2 In-Memory (mock bank) |
| **Auth** | JWT (jjwt 0.12.6), OAuth2 (Google & GitHub), OTP via Gmail SMTP, Face Biometric |
| **Docs** | SpringDoc OpenAPI / Swagger UI |
| **Build** | Maven (backend), npm / Vite (frontend), pip (Python services) |
| **Icons** | Lucide React |

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      React Frontend                       │
│           (Vite + React 19 + Tailwind CSS)                │
│   Pages: Landing, User, Organiser, Admin, Events...       │
└─────────────────────┬────────────────────────────────────┘
                      │ HTTP / REST (Axios)  Port: 5173 (dev)
┌─────────────────────▼────────────────────────────────────┐
│             Spring Boot Backend  (Port 9090)              │
│  ┌───────────┐  ┌───────────┐  ┌────────────────────┐   │
│  │Controllers │  │ Services  │  │   Security Layer   │   │
│  │Auth / Event│  │Event/User │  │  JWT + OAuth2      │   │
│  │User / Admin│  │Payment    │  │  Spring Security   │   │
│  └───────────┘  └───────────┘  └────────────────────┘   │
│  ┌────────────────────────────────────────────────────┐  │
│  │           AOP Logging Aspect (LoggingAspect)       │  │
│  └────────────────────────────────────────────────────┘  │
└────┬──────────────┬────────────────┬─────────────────────┘
     │ Oracle JDBC  │ H2 JDBC        │ HTTP calls
     │              │                │
┌────▼────────┐ ┌───▼──────────┐ ┌──▼──────────────────────────────┐
│ Oracle 26ai │ │ H2 In-Memory │ │       Python Microservices       │
│ (Primary DB)│ │ (Mock Bank)  │ │                                  │
│ Users       │ │ BankAccounts │ │  ┌───────────────────────────┐  │
│ Events      │ │ Transactions │ │  │  ML Venue Suggestion      │  │
│ Organisers  │ │ EventFeedback│ │  │  Flask  •  Port 5000      │  │
│ Venues      │ │ EventMetadata│ │  │  Random Forest Regressor  │  │
│ OAuth users │ └──────────────┘ │  │  venue_model.pkl          │  │
└─────────────┘                  │  └───────────────────────────┘  │
                                 │  ┌───────────────────────────┐  │
                                 │  │  Face Recognition         │  │
                                 │  │  Flask  •  Port 5001      │  │
                                 │  │  dlib / face_recognition  │  │
                                 │  │  128-dim face encodings   │  │
                                 │  └───────────────────────────┘  │
                                 └─────────────────────────────────┘
```

---

## 📁 Project Structure

```
EventNest/
│
├── eventsphere-backend/              # Spring Boot Backend
│   ├── src/main/java/com/eventsphere/backend/
│   │   ├── BackendApplication.java   # Entry point
│   │   ├── aop/                      # Logging aspect (AOP)
│   │   ├── config/                   # Security, Mail, DataSource configs
│   │   ├── controller/               # REST Controllers
│   │   │   ├── AuthController.java
│   │   │   ├── EventController.java
│   │   │   ├── UserController.java
│   │   │   ├── OrganiserController.java
│   │   │   ├── AdminController.java
│   │   │   ├── BankController.java
│   │   │   ├── FaceAuthController.java
│   │   │   ├── MailController.java
│   │   │   ├── ProgrammeController.java
│   │   │   ├── VenueController.java
│   │   │   └── VenueSuggestController.java
│   │   ├── dto/                      # Request & Response DTOs
│   │   ├── entity/                   # JPA Entities (Oracle + H2)
│   │   ├── exception/                # Global exception handling
│   │   ├── repository/               # Spring Data JPA repositories
│   │   ├── scheduler/                # Event status auto-update scheduler
│   │   ├── security/                 # JWT filter, OAuth2 handler
│   │   ├── service/                  # Business logic
│   │   └── util/                     # OTP, password, bank detail utils
│   ├── src/main/resources/
│   │   └── application.properties
│   └── pom.xml
│
├── event-management/                 # React Frontend
│   ├── src/
│   │   ├── App.jsx                   # Root router
│   │   ├── main.jsx
│   │   ├── ThemeContext.jsx          # Dark/Light theme context
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── SignupPage.jsx
│   │   ├── RoleSelect.jsx
│   │   ├── UserPage.jsx
│   │   ├── OrganiserPage.jsx
│   │   ├── AdminPage.jsx
│   │   ├── EventsPage.jsx
│   │   ├── EventDetailPage.jsx
│   │   ├── CreateEventPage.jsx
│   │   ├── PaymentPage.jsx
│   │   ├── TicketPage.jsx
│   │   ├── TicketHistory.jsx
│   │   └── OAuthCallbackPage.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── ml/                               # ML Venue Suggestion Microservice
│   ├── app.py                        # Flask server (Port 5000) — POST /predict
│   ├── train_model.py                # Train RandomForestRegressor
│   ├── generate_training_data.py     # Generate synthetic training CSV
│   ├── training_data.csv             # Generated dataset (1,600 rows)
│   ├── venue_model.pkl               # Trained model artifact
│   ├── label_encoders.pkl            # Fitted LabelEncoders
│   └── requirements.txt
│
└── eventsphere-face-auth/            # Face Recognition Microservice
    ├── face_app.py                   # Flask server (Port 5001) — POST /verify
    ├── requirements_face.txt
    └── (no model file needed — dlib is pre-trained)
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Used for |
|------|---------|----------|
| Java | 21+ | Spring Boot backend |
| Maven | 3.9+ | Backend build |
| Node.js | 18+ | React frontend |
| npm | 9+ | Frontend package management |
| Python | 3.10+ | ML & face auth services |
| Oracle Database | 23ai Free | Primary database |
| CMake | Latest | Required to compile dlib (face auth) |

---

### Backend Setup

**1. Clone the repository**
```bash
git clone https://github.com/Aniruddha1110/EventNest.git
cd EventNest/eventsphere-backend
```

**2. Configure the database**

Create an Oracle user and schema:
```sql
CREATE USER eventsphere IDENTIFIED BY your_password;
GRANT CONNECT, RESOURCE TO eventsphere;
```

**3. Configure `application.properties`**

Update `src/main/resources/application.properties` with your credentials — see [Environment Configuration](#-environment-configuration).

**4. Run the backend**
```bash
./mvnw spring-boot:run
```

The server starts at **`http://localhost:9090`**.

| URL | Description |
|-----|-------------|
| `http://localhost:9090/swagger-ui` | Swagger API docs |
| `http://localhost:9090/h2-console` | H2 mock bank console |
| `http://localhost:9090/actuator/health` | Health check |

---

### Frontend Setup

**1. Navigate to the frontend directory**
```bash
cd EventNest/event-management
```

**2. Install dependencies**
```bash
npm install
```

**3. Start the development server**
```bash
npm run dev
```

The app will be available at **`http://localhost:5173`**.

```bash
npm run build      # Production build → dist/
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

### ML Venue Suggestion Service Setup

**1. Navigate to the ml directory**
```bash
cd EventNest/ml
```

**2. Create and activate a virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

**3. Install dependencies**
```bash
pip install -r requirements.txt
```

**4. Generate training data and train the model**

> Skip this step if `venue_model.pkl` and `label_encoders.pkl` already exist in the directory.

```bash
python generate_training_data.py   # creates training_data.csv (1,600 rows)
python train_model.py              # saves venue_model.pkl + label_encoders.pkl
```

Expected output from `train_model.py`:
```
Test RMSE :  ~0.04–0.06
Test R²   :  ~0.95+
CV R² (5-fold): ~0.94 ± 0.01
```

**5. Start the Flask service**
```bash
python app.py
```

The service runs at **`http://localhost:5000`**.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/predict` | POST | Score and rank venues for an event |
| `/health` | GET | Service health check |

---

### Face Recognition Service Setup

> ⚠️ **Installation order matters on Windows** — follow the steps below carefully to avoid dlib build errors.

**1. Navigate to the face auth directory**
```bash
cd EventNest/eventsphere-face-auth
```

**2. Create and activate a virtual environment**
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS / Linux
source venv/bin/activate
```

**3. Install dependencies in order**

```bash
# Step 1 — CMake (required to compile dlib's C++ code)
pip install cmake

# Step 2 — dlib (C++ face detection library)
pip install dlib

# Step 3 — face_recognition (wrapper around dlib)
pip install face-recognition

# Step 4 — remaining dependencies
pip install -r requirements_face.txt
```

> **If dlib fails on Windows**, download a pre-built wheel from [z-mahmud22/Dlib_Windows_Python3.x](https://github.com/z-mahmud22/Dlib_Windows_Python3.x) and install it manually:
> ```bash
> pip install dlib-<version>-cpXX-cpXX-win_amd64.whl
> pip install face-recognition flask pillow numpy
> ```

**4. Start the Flask service**
```bash
python face_app.py
```

The service runs at **`http://localhost:5001`**.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/verify` | POST | Compare two base64 face images |
| `/health` | GET | Service health check |

---

## ▶️ Running All Services

EventNest requires **4 services** running simultaneously. Start each in a separate terminal:

| # | Service | Directory | Command | Port |
|---|---------|-----------|---------|------|
| 1 | ML Venue Service | `ml/` | `python app.py` | `5000` |
| 2 | Face Auth Service | `eventsphere-face-auth/` | `python face_app.py` | `5001` |
| 3 | Spring Boot Backend | `eventsphere-backend/` | `./mvnw spring-boot:run` | `9090` |
| 4 | React Frontend | `event-management/` | `npm run dev` | `5173` |

> Start the Python services **before** the Spring Boot backend so they are ready when the backend initialises.

---

## ⚙️ Environment Configuration

> ⚠️ **Never commit `application.properties` with real credentials to a public repository.** Use environment variables or a secrets manager in production.

Key properties to configure in `eventsphere-backend/src/main/resources/application.properties`:

```properties
# Server
server.port=9090

# Oracle Database
spring.datasource.jdbc-url=jdbc:oracle:thin:@localhost:1521/FREEPDB1
spring.datasource.username=YOUR_DB_USERNAME
spring.datasource.password=YOUR_DB_PASSWORD

# JWT
jwt.secret=YOUR_256_BIT_SECRET_KEY
jwt.expiration=86400000

# Google OAuth2
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET

# GitHub OAuth2
spring.security.oauth2.client.registration.github.client-id=YOUR_GITHUB_CLIENT_ID
spring.security.oauth2.client.registration.github.client-secret=YOUR_GITHUB_CLIENT_SECRET

# Gmail SMTP
spring.mail.username=YOUR_EMAIL@gmail.com
spring.mail.password=YOUR_APP_PASSWORD
```

---

## 📡 API Overview

All endpoints are available via Swagger UI at `http://localhost:9090/swagger-ui`.

| Controller | Base Path | Description |
|------------|-----------|-------------|
| `AuthController` | `/api/auth` | Login, register, OTP, password reset |
| `UserController` | `/api/users` | User profile management |
| `OrganiserController` | `/api/organisers` | Organiser profile & management |
| `AdminController` | `/api/admin` | Admin operations |
| `EventController` | `/api/events` | Event CRUD & browsing |
| `ProgrammeController` | `/api/programmes` | Programme management |
| `VenueController` | `/api/venues` | Venue management |
| `VenueSuggestController` | `/api/venue-suggestions` | AI venue suggestion workflow |
| `BankController` | `/api/bank` | Mock payment processing |
| `MailController` | `/api/mail` | Email sending |
| `FaceAuthController` | `/api/face-auth` | Face biometric authentication |

---

## 🤖 ML Venue Suggestion Model

The `ml/` service provides intelligent venue recommendations powered by a **Random Forest Regressor**.

### How It Works

```
Organiser fills event details
        │
        ▼
Spring Boot VenueSuggestionService
  → POST http://localhost:5000/predict
        │
        ▼
Flask ML Service
  1. Encode: category, event_type, venue_id, venue_availability
  2. Build 8-feature row per venue
  3. RF model predicts suitability_score ∈ [0.0, 1.0]
  4. Sort descending, return top 3 with rank
        │
        ▼
Spring Boot returns ranked suggestions to frontend
```

### Features Used

| Feature | Type | Description |
|---------|------|-------------|
| `category` | Categorical | Cultural, Technical, Sports, Ceremony, Food |
| `event_type` | Categorical | Free / Paid |
| `event_month` | Numeric | 1–12 |
| `day_of_week` | Numeric | 0=Mon … 6=Sun |
| `duration_hours` | Numeric | Event duration |
| `venue_id` | Categorical | V-0001 to V-0010 |
| `venue_capacity` | Numeric | Seating capacity |
| `venue_availability` | Categorical | Y / N |

### Domain Rules Encoded in Training Data

The synthetic training data encodes real-world logic:

- **Cultural** events → large auditoriums and open-air theatres (V-0001, V-0002, V-0009)
- **Sports** events → stadiums and courts (V-0002, V-0006, V-0007)
- **Ceremony** events → prestigious indoor venues (V-0001, V-0005, V-0008)
- **Food** events → outdoor gardens and OATs (V-0003, V-0004, V-0009, V-0010)
- **Technical** events → medium indoor venues (V-0005, V-0008)
- **Long events (8h+)** score higher at large-capacity venues
- **Paid events** score higher at premium indoor venues
- **Outdoor venues** score higher during Oct–Feb (Bhubaneswar winter)

### Model Details

| Property | Value |
|----------|-------|
| Algorithm | `RandomForestRegressor` |
| Trees (`n_estimators`) | 200 |
| Max depth | 12 |
| Min samples per leaf | 4 |
| Training rows | 1,600 (160 events × 10 venues) |
| Test R² | ~0.95+ |
| Test RMSE | ~0.04–0.06 |

### Venue Reference

| Venue ID | Name | Capacity |
|----------|------|----------|
| V-0001 | Auditorium-1 | 5,000 |
| V-0002 | Cricket Stadium | 10,000 |
| V-0003 | Campus-3 OAT1 | 2,000 |
| V-0004 | Campus-15 OAT | 500 |
| V-0005 | KIMS Auditorium | 800 |
| V-0006 | KISS Athletics Stadium | 12,000 |
| V-0007 | Campus-8 Tennis Court | 300 |
| V-0008 | MBA Auditorium | 1,000 |
| V-0009 | MBA Garden | 3,000 |
| V-0010 | Campus-6 OAT | 800 |

### Predict API

**Request** — `POST http://localhost:5000/predict`
```json
{
  "category": "Cultural",
  "event_type": "Paid",
  "event_month": 10,
  "day_of_week": 5,
  "duration_hours": 8,
  "venues": [
    { "venue_id": "V-0001", "venue_name": "Auditorium-1", "venue_capacity": 5000, "venue_availability": "Y" },
    { "venue_id": "V-0009", "venue_name": "MBA Garden",   "venue_capacity": 3000, "venue_availability": "Y" }
  ]
}
```

**Response**
```json
{
  "suggestions": [
    { "venue_id": "V-0001", "venue_name": "Auditorium-1", "venue_capacity": 5000, "suitability_score": 0.88, "rank": 1 },
    { "venue_id": "V-0009", "venue_name": "MBA Garden",   "venue_capacity": 3000, "suitability_score": 0.73, "rank": 2 }
  ]
}
```

---

## 👁️ Face Recognition Service

The `eventsphere-face-auth/` service provides **biometric login for admins** using the `face_recognition` library (dlib under the hood). No model training is needed — dlib's model is pre-trained on millions of faces.

### How It Works

```
Admin opens login page → webcam capture
        │
        ▼
Frontend → Spring Boot FaceAuthController
        │
        ▼
Spring Boot → POST http://localhost:5001/verify
  {
    "known_image_b64":    "<reference photo BLOB from Oracle>",
    "captured_image_b64": "<live webcam frame>"
  }
        │
        ▼
Flask Face Auth Service
  1. Decode base64 → RGB numpy arrays
  2. Detect face locations (HOG detector, CPU-only)
  3. Compute 128-dim dlib face encodings
  4. Euclidean distance between encodings
  5. distance ≤ 0.55  →  match = true
        │
        ▼
Spring Boot grants or denies admin access
```

### Threshold Tuning

| Threshold | Behaviour |
|-----------|-----------|
| `0.45` | Strict — requires controlled lighting |
| `0.50` | dlib default recommendation |
| `0.55` | **Relaxed** — handles dim rooms and angle variation ✅ (used here) |

### Verify API

**Request** — `POST http://localhost:5001/verify`
```json
{
  "known_image_b64":    "<base64 of reference BLOB from Oracle ADMIN_BIOMETRIC>",
  "captured_image_b64": "<base64 of live webcam JPEG>"
}
```

**Response — match**
```json
{ "match": true, "distance": 0.38, "threshold": 0.55 }
```

**Response — no face detected**
```json
{ "match": false, "distance": 1.0, "threshold": 0.55, "reason": "no_face_detected" }
```

### Key Design Decisions

- **No training required** — only a single reference photo per admin is needed, stored as a BLOB in Oracle
- **HOG detector** — fast CPU-only detection suitable for development and low-resource servers
- **RGBA → RGB conversion** — handles browsers that send RGBA webcam frames
- **Temp file cleanup** — always deletes decoded image files in the `finally` block

---

## 🔐 Authentication

EventNest uses a **multi-strategy authentication system**:

1. **Email + Password** — Standard login with BCrypt-hashed passwords
2. **OTP Verification** — Email OTP sent via Gmail SMTP on registration
3. **Google OAuth2** — Sign in with Google account
4. **GitHub OAuth2** — Sign in with GitHub account
5. **Face Authentication** — Admin biometric login via dlib (Port 5001)
6. **JWT Tokens** — All protected routes require a `Bearer` token in the `Authorization` header (expires in 24 hours)

**Standard Auth Flow:**
```
User → Login → BCrypt verify → JWT issued → Token in every request → JwtAuthFilter → Access granted
```

**Face Auth Flow (Admin only):**
```
Admin → Webcam capture → FaceAuthController → Flask /verify → distance ≤ 0.55 → JWT issued
```

**OAuth2 Flow:**
```
User → Google/GitHub → OAuth2SuccessHandler → OAuthUser saved → JWT issued → OAuthCallbackPage
```

---

## 👥 Roles & Permissions

| Feature | User | Organiser | Admin |
|---------|------|-----------|-------|
| Browse Events | ✅ | ✅ | ✅ |
| Register for Events | ✅ | ❌ | ❌ |
| Make Payments | ✅ | ❌ | ❌ |
| View Ticket History | ✅ | ❌ | ❌ |
| Create Events | ❌ | ✅ | ✅ |
| Get AI Venue Suggestions | ❌ | ✅ | ✅ |
| Manage Venues | ❌ | ✅ (suggest) | ✅ (approve) |
| Face Biometric Login | ❌ | ❌ | ✅ |
| Approve Organisers | ❌ | ❌ | ✅ |
| View All Users | ❌ | ❌ | ✅ |
| Access Admin Dashboard | ❌ | ❌ | ✅ |

---

## 🗄 Database Schema

EventNest uses two datasources:

**Oracle 26ai Free (Primary)** — stores:
- `USER`, `ORGANISER`, `ADMIN` — platform users
- `EVENT`, `PROGRAMME` — event data
- `VENUE` — event venues with capacity and availability
- `OAUTH_USER` — OAuth2 linked accounts
- `ADMIN_BIOMETRIC` — admin reference face photo (BLOB) for face authentication

**H2 In-Memory (Mock Bank)** — stores:
- `BANK_ACCOUNT` — simulated user bank accounts
- `TRANSACTION` — payment transaction records
- `EVENT_FEEDBACK`, `EVENT_METADATA`, `PROGRAMME_META` — lightweight metadata

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add: your feature description'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

Please follow the existing code style and add tests for new features where applicable.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Aniruddha** — [@Aniruddha1110](https://github.com/Aniruddha1110)

> *EventSphere — Where every event finds its home.*