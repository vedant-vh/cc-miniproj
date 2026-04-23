# 🏆 Contest Tracker (PERN Stack)

A premium, full-stack web application for competitive programmers to track upcoming contests across multiple platforms (LeetCode, Codeforces, CodeChef, AtCoder, and Kaggle) in real-time.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Node.js](https://img.shields.io/badge/Node.js-20-green)
![Prisma](https://img.shields.io/badge/Prisma-7-2D3748)

## ✨ Features

- **Centralized Dashboard:** View upcoming and past contests from 5 major platforms.
- **Interactive Calendar Hub:** Monthly/Weekly/Daily view of contests with platform-specific color coding.
- **Smart Reminders:** Set bookmarks for contests and receive automated email notifications before they start.
- **Glassmorphism UI:** Modern "Glassmorphism 2.0" design system with smooth animations and responsive layouts.
- **Automated Sync:** Backend worker syncs with the CLIST API every hour to keep contest data fresh.
- **Profile Analytics:** Track your Codeforces rating trajectory directly in your profile dashboard.

## 🚀 Tech Stack

- **Frontend:** Next.js (App Router), React, Lucide Icons, Recharts, React-Big-Calendar.
- **Backend:** Node.js, Express.
- **Database:** PostgreSQL (Neon.tech), Prisma ORM.
- **Security:** JWT Authentication, Bcrypt password hashing, CORS protection.
- **Automation:** Node-cron for scheduled tasks and email workers.

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18+)
- PostgreSQL Database
- CLIST API Keys (Username & API Key)

### 1. Clone the repository
```bash
git clone https://github.com/vedant-vh/cc-miniproj.git
cd cc-miniproj
```

### 2. Backend Configuration
```bash
cd server
npm install
```
Create a `.env` file in the `server` folder:
```env
DATABASE_URL=your_postgresql_url
JWT_SECRET=your_jwt_secret
CLIST_USERNAME=your_clist_username
CLIST_API_KEY=your_clist_api_key
SMTP_USER=your_email
SMTP_PASS=your_app_password
FRONTEND_URL=http://localhost:3000
```
Run migrations:
```bash
npx prisma db push
```

### 3. Frontend Configuration
```bash
cd ../client
npm install
```
Create a `.env.local` file in the `client` folder:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

### 4. Run Locally
**Start Backend:**
```bash
cd server
node index.js
```
**Start Frontend:**
```bash
cd client
npm run dev
```

## 📋 Deployment

The project is designed to be deployed with:
- **Frontend:** Vercel (Root Directory: `client`)
- **Backend:** Render/Railway (Root Directory: `server`)

*Detailed deployment instructions can be found in the [deployment_guide.md](./deployment_guide.md).*

## 📄 License
This project is licensed under the MIT License.
