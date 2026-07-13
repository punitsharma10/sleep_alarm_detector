# Deployment Guide — AWS with CI/CD (push-to-deploy)

This deploys **Sleep Alarm Detector** so that **every push to `main` automatically
redeploys** your changes. No servers to manage.

**Architecture**

| Part      | Service            | Auto-deploy on push? |
|-----------|--------------------|----------------------|
| Frontend  | AWS Amplify Hosting | ✅ built-in           |
| Backend   | AWS App Runner      | ✅ built-in           |
| Database  | MongoDB Atlas       | (already set up)     |

Rough cost: Atlas free (M0) + Amplify ~free for low traffic + App Runner ~$5–15/mo
(it's the only always-on paid piece). A cheaper free-tier alternative (EC2) is noted
at the bottom.

---

## Part 0 — Push your code to GitHub

AWS deploys *from* GitHub, so the code must live there first.

1. Create a free account at https://github.com and create a **new empty repository**
   (e.g. `sleep-alarm-detector`). Do NOT add a README/gitignore (we already have them).
2. In PowerShell, from the project root:

```powershell
cd "C:\Users\paras\Desktop\ai project"
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-username>/sleep-alarm-detector.git
git push -u origin main
```

> Your secrets are safe: `.env` files are git-ignored, so passwords are NOT pushed.
> You'll set them directly in AWS instead.

---

## Part 1 — Create an AWS account

1. Go to https://aws.amazon.com → **Create an AWS Account**.
2. You'll need an email, a password, and a **credit/debit card** (AWS requires one even
   for free tier; you won't be charged unless you exceed limits).
3. Choose the **Basic (Free)** support plan.
4. Sign in to the **AWS Management Console**.
5. Top-right, set your **Region** (e.g. `Asia Pacific (Mumbai) ap-south-1`) and keep the
   same region for everything.

---

## Part 2 — Generate your secrets (do this once)

You need two long random strings for JWT. In PowerShell:

```powershell
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Copy both outputs — one is `JWT_ACCESS_SECRET`, the other `JWT_REFRESH_SECRET`.
Also have ready your Atlas `MONGO_URI` (from SETUP.md, with `@` encoded as `%40`).

---

## Part 3 — Deploy the BACKEND (App Runner)

1. In the AWS Console search bar, open **App Runner** → **Create service**.
2. **Source**:
   - Repository type: **Source code repository**
   - Click **Add new** to connect GitHub → authorize AWS → pick your repo.
   - Branch: **main**
   - **Deployment trigger: Automatic** ← this is the CI/CD (redeploys on every push).
3. **Configure build** → choose **Configure all settings here**:
   - Runtime: **Nodejs 18**
   - **Source directory**: `server`
   - Build command: `npm ci && npm run build`
   - Start command: `npm run start`
   - Port: `5000`
4. **Configure service**:
   - Service name: `sad-api`
   - CPU/Memory: smallest (1 vCPU / 2 GB is fine; you can pick 0.25 vCPU / 0.5 GB to save cost)
   - Expand **Environment variables** and add:
     | Key | Value |
     |-----|-------|
     | `NODE_ENV` | `production` |
     | `PORT` | `5000` |
     | `MONGO_URI` | *your Atlas string* |
     | `JWT_ACCESS_SECRET` | *first secret from Part 2* |
     | `JWT_REFRESH_SECRET` | *second secret* |
     | `JWT_ACCESS_EXPIRES` | `15m` |
     | `JWT_REFRESH_EXPIRES` | `7d` |
     | `CLIENT_ORIGIN` | `http://temporary` *(we'll fix this in Part 5)* |
   - **Health check** (under configure service → optional): Path `/api/health`.
5. Click **Create & deploy**. Wait ~5–10 min until status is **Running**.
6. Copy the **Default domain** it gives you, e.g.
   `https://abcd1234.ap-south-1.awsapprunner.com`. This is your **backend URL**.
7. Quick test: open `https://<backend-url>/api/health` in a browser — you should see
   `{"success":true,"status":"ok"}`.

> Atlas note: your Atlas **Network Access** must allow AWS to connect. The easiest
> setting is **Allow access from anywhere (`0.0.0.0/0`)**, which you already enabled.

---

## Part 4 — Deploy the FRONTEND (Amplify Hosting)

1. In the AWS Console, open **AWS Amplify** → **Create new app** → **Host web app**.
2. Choose **GitHub** → authorize → select your repo and the **main** branch.
3. Amplify detects the monorepo and reads `amplify.yml` (already in the repo). Confirm the
   app root is **client** and the build settings are auto-filled. If asked, keep them.
4. **Environment variables** → add:
   | Key | Value |
   |-----|-------|
   | `VITE_API_URL` | `https://<backend-url>/api` |

   (Use the App Runner URL from Part 3, with `/api` on the end.)
5. Click **Save and deploy**. Wait ~3–5 min. Amplify gives you a **frontend URL** like
   `https://main.d1234abcd.amplifyapp.com`.
6. **SPA routing fix** (important, or refreshing `/login` gives a 404): in the Amplify
   app → **Hosting → Rewrites and redirects → Add rule**:
   - Source: `/<*>`
   - Target: `/index.html`
   - Type: **200 (Rewrite)**

---

## Part 5 — Connect the two (CORS)

The backend must trust the frontend's domain.

1. Go back to **App Runner → sad-api → Configuration → Edit**.
2. Change the `CLIENT_ORIGIN` env var to your **frontend URL** (no trailing slash), e.g.
   `https://main.d1234abcd.amplifyapp.com`.
3. Save → App Runner redeploys automatically (~5 min).

---

## Part 6 — Test the live app

1. Open your Amplify **frontend URL**.
2. Register an account → open **Live Detection** → allow the camera.
3. Close your eyes ~3s → alarm fires and the event is saved to Atlas.

---

## Your CI/CD is now live 🎉

From now on:

```powershell
# make a change, then:
git add .
git commit -m "my change"
git push
```

- App Runner rebuilds + redeploys the **backend** automatically.
- Amplify rebuilds + redeploys the **frontend** automatically.
- The existing GitHub Actions workflow (`.github/workflows/ci.yml`) runs typecheck/build
  as a quality gate on every push/PR.

Watch progress in the App Runner and Amplify consoles (each shows build logs).

---

## Troubleshooting

- **Frontend loads but login fails / CORS error:** `CLIENT_ORIGIN` on App Runner must
  exactly match the Amplify URL (https, no trailing slash). Redeploy after changing.
- **`/api/health` fails:** check App Runner logs; usually a wrong `MONGO_URI` or Atlas
  Network Access not allowing `0.0.0.0/0`.
- **App Runner build fails:** confirm Source directory = `server`, Node runtime = 18.
- **Amplify build fails:** confirm app root = `client`; check the build log for the failing
  step.
- **Refreshing a route 404s:** add the SPA rewrite rule (Part 4, step 6).

---

## Cheaper alternative (free tier, more manual): single EC2 instance

If you'd rather stay in the AWS free tier for 12 months:

1. Launch a **t2.micro** (or t3.micro) EC2 instance (Ubuntu), free-tier eligible.
2. Install Docker + Docker Compose on it.
3. Use the repo's `docker-compose.yml` to run api + web + nginx.
4. For CI/CD, add a GitHub Actions job that SSHes into the instance on push to `main`
   and runs `git pull && docker compose up -d --build`.

This is cheaper but you manage the server, TLS certificates, and security patches
yourself. The managed Amplify + App Runner path above is recommended for simplicity.
