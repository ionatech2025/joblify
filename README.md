Joblify – Job Portal Platform

Joblify is a full-stack job portal application that connects job seekers with employers.
The platform provides dedicated interfaces for both users, enabling job posting, job applications, and professional profile management.

🚀 Features
👤 For Job Seekers

Create and manage professional profiles

Upload resumes and manage documents

Search and apply for jobs

Track application status

Save favorite jobs

Set profile visibility (public/private)

🏢 For Companies

Create company profiles

Post and manage job listings

Review and manage applications

Search for candidates

Upload company branding and logos

Manage subscriptions

⚙️ Core Features

🔐 Secure authentication with session management

📧 Email verification

🔑 Password reset functionality

📱 Responsive design

🌓 Dark / Light mode support

📊 Application tracking system

💼 Advanced job search and filtering

🛠️ Tech Stack
Frontend

React 18 – UI library

React Router DOM – Routing

Tailwind CSS – Styling

Radix UI – Accessible components

React Hook Form – Form handling

Axios – HTTP client

Vite – Build tool

Backend

Node.js – Runtime environment

Express – Web framework

MongoDB – Database

Prisma – ORM

JWT – Authentication

Bcrypt – Password hashing

Express Session – Session management

📋 Prerequisites

Make sure you have the following installed:

Node.js v18+

MongoDB v5+

npm or yarn package manager

🚀 Getting Started
1️⃣ Clone the Repository
git clone https://github.com/yourusername/joblify.git
cd joblify
Backend Setup
Navigate to backend directory
cd joblify-backend
Install dependencies
npm install
Create .env file
DATABASE_URL="mongodb://127.0.0.1:27017/joblify"
JWT_SECRET="your_super_secret_jwt_key_here"
NODE_ENV="development"
Setup Prisma
npx prisma generate
npx prisma db push
Start backend server
npm run dev

Backend runs on:

http://localhost:3000
Frontend Setup
Navigate to frontend directory
cd joblify-frontend
Install dependencies
npm install
Create .env file
VITE_API_URL="http://localhost:3000/api"
Start development server
npm run dev

Frontend runs on:

http://localhost:5173
📁 Project Structure
joblify
│
├── joblify-backend
│   ├── controllers
│   │   └── auth.controller.mjs
│   │
│   ├── lib
│   │   └── prisma.mjs
│   │
│   ├── middleware
│   │   └── auth.middleware.mjs
│   │
│   ├── routes
│   │   └── auth.routes.mjs
│   │
│   ├── prisma
│   │   └── schema.prisma
│   │
│   └── server.mjs
│
└── joblify-frontend
    ├── src
    │   ├── components
    │   │   ├── ui
    │   │   ├── Header.jsx
    │   │   └── Footer.jsx
    │   │
    │   ├── pages
    │   │   ├── SignUpPage.jsx
    │   │   └── LoginPage.jsx
    │   │
    │   ├── lib
    │   │   └── utils.js
    │   │
    │   ├── App.jsx
    │   └── main.jsx
    │
    ├── index.html
    └── package.json
🔧 Configuration
Database Schema

The Prisma schema includes models for:

Users (Job Seekers & Companies)

Job Posts

Applications

Profiles

Sessions

Subscriptions

Resumes

Environment Variables
Backend .env
DATABASE_URL="mongodb://127.0.0.1:27017/joblify"
JWT_SECRET="your_secret_key"
NODE_ENV="development"
PORT=3000
Frontend .env
VITE_API_URL="http://localhost:3000/api"
🚦 API Endpoints
Authentication
POST /api/auth/signup     → User signup
POST /api/auth/login      → User login
POST /api/auth/logout     → Logout
GET  /api/auth/me         → Get current user
Job Seeker
POST /api/jobseeker/profile
GET  /api/jobseeker/profile
POST /api/jobseeker/apply/:jobId
GET  /api/jobseeker/applications
Company
POST /api/company/profile
POST /api/company/jobs
GET  /api/company/jobs
PUT  /api/company/jobs/:jobId
GET  /api/company/applications
🚀 Deployment
Backend Deployment

Example platforms:

Render

Heroku

Steps:

Create production database (MongoDB Atlas)

Configure environment variables

Deploy using Git integration

Frontend Deployment

Example platforms:

Vercel

Netlify

Build project:

npm run build
