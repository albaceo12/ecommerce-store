# 🛍️ E-commerce Project (MERN Stack)

This is a complete e-commerce application built with **MERN Stack**:\
- **Frontend**: React + Vite + Tailwind\
- **Backend**: Node.js + Express + MongoDB\
- **Online Payments**: Stripe\
- **File Management**: Cloudinary\
- **State Management**: Zustand

------------------------------------------------------------------------

## 📂 Project Structure

    project-root/
    ├── backend/        # Express + MongoDB server
    │   ├── server.js
    │   └── package.json
    ├── frontend/       # React + Vite app
    │   ├── src/
    │   └── package.json
    ├── .env            # Backend environment variables
    └── README.md

------------------------------------------------------------------------

## ⚙️ Prerequisites

-   Node.js (18+ recommended)\
-   npm or yarn\
-   MongoDB (local or Atlas)\
-   Cloudinary account\
-   Stripe account (for payment integration)

------------------------------------------------------------------------

## 🚀 Installation & Run

### 1️⃣ Clone & Install

``` bash
git clone <repo-url>
cd project-root
```

**Backend**

``` bash
cd backend
npm install
```

**Frontend**

``` bash
cd ../frontend
npm install
```

------------------------------------------------------------------------

### 2️⃣ Environment Variables

Create a `.env` file in the `backend` folder with the following values:

``` env
PORT=5000
MONGO_URI=your_mongo_connection_string

UPSTASH_REDIS_URL=your_redis_url

JWT_SECRET_KEY_ACCESS=your_access_secret
JWT_SECRET_KEY_REFRESH=your_refresh_secret

NODE_ENV=development

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloud_key
CLOUDINARY_API_SECRET=your_cloud_secret

STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_WEBHOOK_SECRET=your_webhook_secret

CLIENT_URL=http://localhost:3000

EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
```

------------------------------------------------------------------------

### 3️⃣ Run the Project

**Backend (port 5000):**

``` bash
cd backend
npm run dev
```

**Frontend (port 3000):**

``` bash
cd frontend
npm run dev
```

Now the API is available at `http://localhost:5000` and frontend at
`http://localhost:3000`.

------------------------------------------------------------------------

## 🛠️ Scripts

### Backend (`backend/package.json`)

-   `npm run dev` → run server with nodemon\
-   `npm start` → run server in production

### Frontend (`frontend/package.json`)

-   `npm run dev` → start development (Vite dev server)\
-   `npm run build` → build production bundle\
-   `npm run preview` → preview build\
-   `npm run lint` → run linter

------------------------------------------------------------------------

## 🧩 Technologies

-   **Backend**: Express, MongoDB, Mongoose, JWT, Redis (Upstash),
    Nodemailer, Stripe, Cloudinary\
-   **Frontend**: React, Vite, Tailwind, Zustand, React Hook Form, React
    Router DOM, Axios, Stripe.js, Toastify, Recharts, Framer Motion

------------------------------------------------------------------------

## 📌 Features

-   User registration & login (JWT + Refresh Token)\
-   Product management (CRUD)\
-   Online payment with Stripe\
-   Image upload to Cloudinary\
-   State management with Zustand\
-   Responsive UI with TailwindCSS\
-   Charts and analytics with Recharts

------------------------------------------------------------------------

## 🧪 Testing (WIP)

-   Backend: Jest + Supertest (to be added)\
-   Frontend: React Testing Library

------------------------------------------------------------------------

## 📦 Deployment

-   **Backend**: Render / Railway / Heroku / Docker\
-   **Frontend**: Vercel / Netlify\
-   **Database**: MongoDB Atlas\
-   **Storage**: Cloudinary

------------------------------------------------------------------------

## 📜 License

This project is released under the **ISC** license.
