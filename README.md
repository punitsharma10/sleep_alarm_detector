# Sleep Alarm Detector

**AI-Powered Real-Time Drowsiness Detection System**

> Detect fatigue before it becomes dangerous using AI Computer Vision.

Sleep Alarm Detector is a production-ready MERN application that uses your webcam and
Google MediaPipe Face Mesh to track facial landmarks in real time, compute the
**Eye Aspect Ratio (EAR)**, and raise a loud alarm when your eyes stay closed for
longer than a configurable threshold (default **2.5s**).

All computer-vision inference runs **100% in the browser** — no video ever leaves the
device. The backend only persists aggregated detection events (duration, average EAR,
blink count) for analytics.

---

## Tech Stack

| Layer      | Technology |
|------------|------------|
| Frontend   | React 19, Vite, TypeScript, Tailwind CSS, Framer Motion, React Router, TanStack Query, Axios, React Hook Form, Lucide, Recharts |
| Backend    | Node.js, Express, TypeScript |
| CV / AI    | MediaPipe Tasks Vision (Face Landmarker) |
| Database   | MongoDB (Mongoose) |
| Auth       | JWT (access + refresh), bcrypt |
| DevOps     | Docker, Docker Compose, NGINX, GitHub Actions |

---

## Monorepo Layout

```
.
├── client/            # React + Vite frontend
├── server/            # Express + TypeScript API
├── docker-compose.yml # Full stack (mongo + api + web)
└── .github/workflows/ # CI pipeline
```

---

## Quick Start (local, without Docker)

### 1. Backend

```bash
cd server
cp .env.example .env          # then edit secrets
npm install
npm run dev                   # http://localhost:5000
```

You need a running MongoDB. Easiest:

```bash
docker run -d -p 27017:27017 --name sad-mongo mongo:7
```

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev                   # http://localhost:5173
```

Open http://localhost:5173, register an account, and go to the dashboard.

---

## Quick Start (Docker Compose)

```bash
docker compose up --build
```

- Web (NGINX): http://localhost:8080
- API:         http://localhost:5000
- MongoDB:     localhost:27017

---

## API Endpoints

| Method | Path                      | Auth | Description                    |
|--------|---------------------------|------|--------------------------------|
| POST   | `/api/auth/register`      | —    | Create account                 |
| POST   | `/api/auth/login`         | —    | Login, returns JWT             |
| POST   | `/api/auth/forgot-password` | —  | Issue password reset token     |
| POST   | `/api/auth/reset-password`  | —  | Reset password with token      |
| GET    | `/api/user/profile`       | ✔    | Current user profile           |
| PUT    | `/api/user/settings`      | ✔    | Update user settings           |
| POST   | `/api/detection/save`     | ✔    | Save a detection event         |
| GET    | `/api/detection/history`  | ✔    | Paginated detection history    |
| GET    | `/api/detection/stats`    | ✔    | Aggregated analytics           |
| DELETE | `/api/detection/history`  | ✔    | Clear history                  |

---

## Computer Vision Logic

1. MediaPipe Face Landmarker returns 478 landmarks per frame.
2. Six landmarks per eye are used to compute EAR:
   `EAR = (‖p2-p6‖ + ‖p3-p5‖) / (2·‖p1-p4‖)`
3. If `EAR < threshold` → increment closed-eye timer, else reset.
4. Short closures are classified as **blinks**; sustained closure > `alarmDelay`
   is classified as **sleep** → alarm + event saved.

---

## License

MIT
