# Installation

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- Git

## Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The backend will run on `http://localhost:5000`

## Database Setup

1. Create a PostgreSQL database:
```bash
createdb unimarket
```

2. Run migrations:
```bash
npm run migrate
```

3. (Optional) Seed the database:
```bash
npm run seed
```

## Environment Variables

Create a `.env` file in the backend directory:

```
DATABASE_URL=postgresql://user:password@localhost:5432/unimarket
NODE_ENV=development
PORT=5000
JWT_SECRET=your_jwt_secret_key
```

Create a `.env.local` file in the frontend directory:

```
VITE_API_URL=http://localhost:5000
```

## Running the Project

Run both frontend and backend concurrently from the root directory:

```bash
npm run dev
```

Or run them separately in different terminals.
