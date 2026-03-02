# Secure Healthcare System 🏥

> A secure, specialized Clinical Decision Support System (CDSS) for verifiable care plans and patient-doctor collaboration.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.x-blue.svg)](https://reactjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.x-blue.svg)](https://www.postgresql.org/)

---

## 📖 Table of Contents
- [Project Overview](#-project-overview)
- [Key Features](#-key-features)
- [Technology Stack](#-technology-stack)
- [Directory Structure](#-directory-structure)
- [Getting Started](#-getting-started)
- [Environment Configuration](#-environment-configuration)
- [Running the Application](#-running-the-application)
- [Contributors](#-contributors)

---

## 🚀 Project Overview

**Secure Healthcare** is a modern web platform designed to bridge the gap between patient records and actionable clinical decisions. It features a **Clinical Decision Support System (CDSS)** that uses a rule-based engine to assist doctors in generating verifiable care plans.

The system emphasizes security, ensuring that all patient data is encrypted and that interactions between patients and doctors are authenticated and logged.

---

## ✨ Key Features

*   **🤖 AI-Assisted CDSS:** Rule-based engine for generating care plans based on ICD-10 diagnosis codes.
*   **🩺 Doctor Dashboard:** Comprehensive view for physicians to manage patients, verify lab reports, and sign off on treatments.
*   **👤 Patient Portal:** Secure interface for patients to book appointments, upload lab reports, and view their care history.
*   **🔒 Enterprise Security:** JWT-based authentication, Role-Based Access Control (RBAC), and encryption for Personally Identifiable Information (PII).
*   **📄 Lab Report Parsing:** Automated regex-based parsing of uploaded lab reports to extract vital health metrics.

---

## 🛠 Technology Stack

### Frontend (User Interface)
*   **Framework:** React 19 (Vite)
*   **Styling:** TailwindCSS
*   **Routing:** React Router 7
*   **State Management:** Context API
*   **HTTP Client:** Axios

### Backend (API & Logic)
*   **Runtime:** Node.js
*   **Framework:** Express.js
*   **Database:** PostgreSQL (via `pg` driver)
*   **Authentication:** JSON Web Tokens (JWT) & bcrypt
*   **Security:** Helmet, CORS, Input Validation

---

## 📂 Directory Structure

```text
/
├── backend/                  # Node.js/Express API
│   ├── src/
│   │   ├── modules/          # Domain Logic (Auth, Patients, CDSS)
│   │   ├── routes/           # API Endpoints
│   │   ├── config/           # Database & Auth Config
│   │   └── app.js            # App Entry Point
│   └── package.json
│
├── frontend-sprint1/         # React Web Application
│   ├── src/
│   │   ├── components/       # Reusable UI Components
│   │   ├── pages/            # Page Views
│   │   └── context/          # Auth & User Context
│   └── vite.config.js
│
└── package.json              # Root scripts for concurrent runs
```

---

## 🏁 Getting Started

### Prerequisites
*   **Node.js** (v18 or higher)
*   **PostgreSQL** (v15 or higher) installed locally or a cloud instance (e.g., Neon, Supabase).
*   **Git**

### Installation

1.  **Clone the Repository**
    ```bash
    git clone https://github.com/your-username/secure-healthcare.git
    cd secure-healthcare
    ```

2.  **Install Dependencies**
    ```bash
    # Install root dependencies
    npm install

    # Install Backend dependencies
    cd backend
    npm install

    # Install Frontend dependencies
    cd ../frontend-sprint1
    npm install
    ```

---

## 🔐 Environment Configuration

Create a `.env` file in the `backend/` directory with the following variables:

```env
# Server Configuration
PORT=5000

# Database Connection
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require

# Authentication
JWT_SECRET=your_super_secret_key_change_this
JWT_EXPIRES_IN=1d

# Security Keys (Base64 Encoded)
PII_ENCRYPTION_KEY=your_base64_encryption_key
LAB_SYM_KEY=your_base64_lab_key

# Email Service (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
OTP_EXPIRY_MINUTES=2
```

---

## 🏃‍♂️ Running the Application

To run the full stack (Frontend + Backend) concurrently:

1.  Navigate to the root directory.
2.  Run the start script:

```bash
npm start
```

*   **Frontend:** `http://localhost:5173`
*   **Backend:** `http://localhost:5000`

---

> This project is for educational purposes.
