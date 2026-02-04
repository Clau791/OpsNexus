# OpsNexus Platform

## 🚀 Project Overview
**OpsNexus** is a unified dashboard for managers to monitor alerts and tickets from multiple sources (Nagios & Optimum Desk).
This project consists of a **FastAPI Backend** and a **React (Vite) Frontend**.

## 📊 Current Status
**Status:** ✅ Initial Skeleton Complete

- **Backend:**
  - Mock Integrations for Nagios (Alerts) and Optimum Desk (Tickets).
  - JWT Authentication.
  - CSV Export Service.
- **Frontend:**
  - Premium Glassmorphism UI (TailwindCSS).
  - Login Page connected to API.
  - Dashboard with Data Tables and Export functionality.

## 🛠️ Setup & Run Instructions

### 1. Backend (Python/FastAPI)
The backend requires Python 3.

**Quick Setup:**
```bash
cd backend
chmod +x setup.sh
./setup.sh
```

**Running the Server:**
```bash
cd backend
source venv/bin/activate  # On Windows: venv\Scripts\activate
uvicorn main:app --reload
```
*Server runs at: http://localhost:8000*

### 2. Frontend (React/Vite)
The frontend requires Node.js.

**Setup & Run:**
```bash
cd frontend
npm install
npm run dev
```
*App runs at: http://localhost:5173*

## ☁️ Deployment
Ready to go live? Check out our [Deployment Guide](DEPLOYMENT.md) for instructions on hosting with Vercel.

## 🔑 Demo Credentials
To log in to the dashboard, use the following mock credentials:

- **Username:** `admin`
- **Password:** `password123`

## 🤝 Cum să folosești acest proiect (Clone/Fork)
Dacă vrei să copiezi acest proiect pe propriul tău cont de GitHub:

### Varianta 1: Fork (Recomandat pentru contribuții)
1. Apasă butonul **Fork** din dreapta sus a paginii GitHub.
2. Clonează noul repo creat pe contul tău:
   ```bash
   git clone https://github.com/USERNAME/OpsNexus.git
   ```

### Varianta 2: Clonare și mutare pe cont propriu (Pentru proiect nou)
Dacă vrei să pornești un proiect nou bazat pe acesta:

```bash
# 1. Clonează repo-ul original
e
```

## 📁 Project Structure
```
/
├── backend/        # FastAPI Application
│   ├── main.py     # Entry point
│   ├── auth.py     # Authentication Logic
│   └── ...
└── frontend/       # React Application
    ├── src/        # Source code
    └── ...
```
