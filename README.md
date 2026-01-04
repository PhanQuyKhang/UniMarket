# UniMarket Installation Guide

This guide provides step-by-step instructions for setting up and running the UniMarket application locally.

## Prerequisites

Before you begin, ensure you have the following installed on your machine:

1.  **Node.js**: (Version 16 or higher recommended) - [Download Node.js](https://nodejs.org/)
2.  **PostgreSQL**: (Version 13 or higher) - [Download PostgreSQL](https://www.postgresql.org/download/)
3.  **pgAdmin** (Optional but recommended for database management) - Included with PostgreSQL installer for Windows.
4.  **Git**: [Download Git](https://git-scm.com/)

---

## 1. Clone the Repository

Clone the project to your local machine:

```bash
git clone https://github.com/HiuuKun/UniMarketTest.git
cd UniMarketTest
```

---

## 2. Database Setup

### Create Local Database

1.  Open **pgAdmin** (or your preferred SQL tool).
2.  Create a new database named `unimarket` (or any name you prefer).
3.  Execute the schema script to create tables. You can find the schema in `backend/schema.sql`.

---

## 3. Backend Setup

The backend runs on **Node.js** and **Express**, connecting to your PostgreSQL database.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    Create a file named `.env` in the `backend` directory. You can copy the following example configuration:

    ```env
    # Backend Environment Variables
    
    # ===== OPTION 1: Use Supabase (Recommended for Production) =====
    # Simply add this one line and comment out the local DB variables below:
    DATABASE_URL=postgresql://postgres.dkyrbffkwtruwnjrjzna:hcmut%40dath123@aws-1-ap-south-1.pooler.supabase.com:6543/postgres

    # ===== OPTION 2: Use Local PostgreSQL Database =====
    # Comment out DATABASE_URL above and use these instead:
    # DB_HOST=localhost
    # DB_PORT=5432
    # DB_USER=postgres
    # DB_PASSWORD=your_local_password
    # DB_NAME=your_database_name
    
    # ===== Server Configuration =====
    PORT=5000
    NODE_ENV=development
    
    # ===== App URL =====
    APP_URL=http://localhost:5000
    ```

4.  **Start the Backend Server:**
    ```bash
    npm start
    ```
    You should see: `Server running on port 5000`.

---

## 4. Frontend Setup

The frontend is built with **React**, **Vite**, and **TypeScript**.

1.  **Open a new terminal window** (keep the backend running in the first one).

2.  **Navigate to the project root:**
    ```bash
    cd UniMarketTest
    ```

3.  **Install Dependencies:**
    ```bash
    npm install
    ```

4.  **Configure Environment Variables (Optional):**
    If your backend is running on a port other than 5000, create a `.env` file in the root directory:
    ```env
    VITE_API_URL=http://localhost:5000/api
    ```

5.  **Start the Development Server:**
    ```bash
    npm run dev
    ```

6.  **Access the Application:**
    Open your browser and go to `http://localhost:3000` (or the URL shown in your terminal).

---

## Troubleshooting

*   **Database Connection Issues:** Ensure PostgreSQL service is running and credentials in `.env` are correct.
*   **Port Conflicts:** If port 3000 or 5000 is in use, modify the `PORT` in `.env` or check the terminal output for the new port assigned by Vite.