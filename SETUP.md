# Setup Guide — Step by Step (Windows)

This guide gets **Sleep Alarm Detector** running on your machine from scratch.
You need three things running: **MongoDB** (database), the **backend** (API), and
the **frontend** (website). Follow the parts in order.

---

## Part 1 — Get MongoDB

Pick **ONE** option. If you're new, use **Option A (Atlas)** — no installation needed.

### Option A — MongoDB Atlas (free cloud, recommended)

1. Go to https://www.mongodb.com/cloud/atlas/register and create a free account.
2. Create a **free "M0" cluster** (any cloud/region is fine). Wait ~2 minutes for it to start.
3. In the left menu open **Database Access** → **Add New Database User**.
   - Username: `sad_user`  Password: choose one (write it down, avoid `@ : / ?` symbols).
   - Role: **Read and write to any database** → Add User.
4. Open **Network Access** → **Add IP Address** → **Allow Access from Anywhere**
   (`0.0.0.0/0`) → Confirm. (Fine for development.)
5. Open **Database** → click **Connect** on your cluster → **Drivers** → copy the
   connection string. It looks like:
   ```
   mongodb+srv://sad_user:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your real password, and add the database name
   `sleep_alarm_detector` right before the `?`. Final result:
   ```
   mongodb+srv://sad_user:YOURPASSWORD@cluster0.abcde.mongodb.net/sleep_alarm_detector?retryWrites=true&w=majority
   ```
   Keep this string — you'll paste it into the backend `.env` in Part 2.

### Option B — Install MongoDB locally on Windows

1. Download **MongoDB Community Server** (Windows `.msi`):
   https://www.mongodb.com/try/download/community
2. Run the installer → choose **Complete** → keep **"Install MongoDB as a Service"**
   checked (this makes it start automatically) → Finish.
3. That's it. MongoDB now runs in the background on `localhost:27017`.
   Your connection string is simply:
   ```
   mongodb://localhost:27017/sleep_alarm_detector
   ```

---

## Part 2 — Start the Backend (API)

Open **PowerShell** and run these one line at a time:

```powershell
cd "C:\Users\paras\Desktop\ai project\server"
Copy-Item .env.example .env
npm install
```

Now open `server\.env` in a text editor and set `MONGO_URI` to the string from Part 1:

- Atlas users: paste your `mongodb+srv://...` string.
- Local install users: leave the default `mongodb://localhost:27017/sleep_alarm_detector`.

Then start it:

```powershell
npm run dev
```

You should see: `MongoDB connected` and `API listening on port 5000`.
**Leave this window open** — it must keep running.

---

## Part 3 — Start the Frontend (Website)

Open a **second** PowerShell window (keep the backend one running):

```powershell
cd "C:\Users\paras\Desktop\ai project\client"
Copy-Item .env.example .env
npm install
npm run dev
```

You should see a local URL like `http://localhost:5173`.

---

## Part 4 — Use the App

1. Open **http://localhost:5173** in Chrome or Edge.
2. Click **Get started** → **Create account** (any email + password ≥ 8 chars).
3. Go to **Live Detection** in the sidebar → click **Start** → **Allow** camera access.
4. Close your eyes for ~3 seconds → the alarm sounds and a warning appears.
5. Check **History** and **Analytics** to see saved events.

---

## Troubleshooting

- **`MongoDB error` / can't connect (Atlas):** re-check the password in the string and that
  Network Access allows `0.0.0.0/0`.
- **`MongoDB error` (local):** open Windows **Services**, find **MongoDB Server**, ensure it's
  **Running**.
- **Camera not working:** browsers only allow the camera on `http://localhost` or HTTPS —
  `localhost` is fine. Make sure no other app is using the webcam.
- **Port already in use:** stop other apps on port 5000 (backend) or 5173 (frontend), or change
  `PORT` in `server\.env`.
- **To stop the app:** press `Ctrl + C` in each PowerShell window.
