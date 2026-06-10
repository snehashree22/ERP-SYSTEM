# 🚀 RetailFlow ERP System

![RetailFlow Overview](https://img.shields.io/badge/Status-Active-success) ![License](https://img.shields.io/badge/License-MIT-blue) ![Python](https://img.shields.io/badge/Python-3.11+-yellow) ![React](https://img.shields.io/badge/React-18-blue)

RetailFlow is a complete, full-stack Enterprise Resource Planning (ERP) system designed to manage all aspects of a retail business from a single, unified dashboard. It seamlessly connects Products, Inventory, Sales, Purchases, Suppliers, Customers, and Employees.

## ✨ Key Features
- **📦 Inventory Management:** Real-time stock tracking, automatic deductions on sales, and low-stock alerts.
- **💰 Sales & Purchases:** Point-of-sale style order creation and purchase tracking with automatic inventory adjustments.
- **🔐 Secure Authentication:** JWT-based login system with bcrypt password hashing and 3-tier Role-Based Access Control (Admin, Manager, Employee).
- **🎨 Modern UI/UX:** Built with React and Tailwind CSS, featuring Recharts for data visualization and a fully responsive layout.
- **🌙 Dark/Light Mode:** Full CSS-variable-based dark mode system.
- **🤖 AI Insights:** Integrated Google Gemini AI (using the RAG pattern) to analyze real database metrics and provide business intelligence.
- **📄 PDF Reports:** Downloadable financial, sales, and inventory reports generated automatically.

---

## 🛠️ Tech Stack

### Frontend (React + Vite)
- **Framework:** React 18 (Vite for fast tooling)
- **Routing:** React Router DOM (with protected route wrappers)
- **API Client:** Axios (with automated JWT interceptors)
- **Styling:** Tailwind CSS v4
- **Charts:** Recharts

### Backend (FastAPI + Python)
- **Framework:** FastAPI (High performance, automatic Swagger docs)
- **Database:** PostgreSQL via SQLAlchemy ORM
- **Authentication:** Python-JOSE (JWT) + Passlib (bcrypt)
- **AI Integration:** Google Generative AI (Gemini)

---

## 🚀 How to Run Locally

### 1. Database Setup
Ensure you have PostgreSQL installed. Create a database (e.g., `erp_db`) and update the connection string in your `.env` file inside the `BACKEND` folder.

### 2. Start the Backend
```bash
cd BACKEND
python -m venv venv
# On Windows: venv\Scripts\activate
# On Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
*The backend will run on `http://localhost:8000`. You can view the automatic API documentation at `http://localhost:8000/docs`.*

### 3. Start the Frontend
```bash
cd FRONTEND
npm install
npm run dev
```
*The frontend will run on `http://localhost:5173` (or 5174).*

---

## 🛡️ Security Note
This system implements strict Role-Based Access Control. The public registration endpoint forces all new signups to the `employee` role to prevent privilege escalation. Privileged accounts (Admins and Managers) must be created via the protected admin endpoints.

---

*Built with ❤️ for efficient retail management.*
