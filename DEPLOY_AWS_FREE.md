# Deploy on AWS Free Tier with CI/CD (hands-on learning guide)

Goal: run the whole app on **one free EC2 instance** with **auto-HTTPS**, and set up
**GitHub Actions** so every push to `main` redeploys automatically. Database stays on
**MongoDB Atlas** (free).

```
Browser ──HTTPS──> Caddy (TLS) ──> NGINX (serves React + proxies /api) ──> Node API ──> MongoDB Atlas
                         (all three containers run on one EC2 t2.micro)
GitHub push to main ──> GitHub Actions ──SSH──> EC2 ──> git pull + docker compose up --build
```

### Why the extra pieces (read this)
- **Free domain + HTTPS are required.** The webcam (`getUserMedia`) is blocked on plain
  `http://<ip>`. Browsers only allow the camera on **HTTPS**. We get free HTTPS with a
  DuckDNS subdomain + Caddy.
- **Swap file required.** t2.micro has 1 GB RAM — not enough to build the React app. We add
  a 2 GB swap file so builds don't crash.

---

## Part 0 — Prerequisites

1. Code pushed to GitHub (see DEPLOYMENT.md Part 0 if not done). The repo must include the
   new files: `docker-compose.prod.yml`, `Caddyfile`, `.github/workflows/deploy.yml`.
2. Atlas **Network Access** = `0.0.0.0/0` (already done).
3. Have your Atlas `MONGO_URI` and two JWT secrets ready (generate with
   `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`).

---

## Part 1 — Get a free domain (DuckDNS)

1. Go to https://www.duckdns.org and sign in (Google/GitHub).
2. Create a subdomain, e.g. `sleepalarm-punit` → gives you `sleepalarm-punit.duckdns.org`.
3. Leave the tab open — you'll paste your EC2 IP here in Part 3.

---

## Part 2 — Launch an EC2 instance (free tier)

1. AWS Console → search **EC2** → **Launch instance**.
2. **Name:** `sleep-alarm`.
3. **AMI:** Ubuntu Server 24.04 LTS (must say "Free tier eligible").
4. **Instance type:** `t2.micro` (Free tier eligible). *(If t2.micro isn't offered in your
   region, `t3.micro` is the free-tier type there.)*
5. **Key pair:** click **Create new key pair** → name `sleep-alarm-key` → type **RSA**,
   format **.pem** → **Create**. The `.pem` file downloads — **keep it safe**, you need it
   for SSH and for the CI/CD secret.
6. **Network settings** → **Edit** → add these inbound rules (Security Group):
   | Type  | Port | Source |
   |-------|------|--------|
   | SSH   | 22   | My IP  |
   | HTTP  | 80   | Anywhere (0.0.0.0/0) |
   | HTTPS | 443  | Anywhere (0.0.0.0/0) |
7. **Configure storage:** 20–30 GB (free tier allows up to 30 GB).
8. **Launch instance.** Open the instance → copy its **Public IPv4 address**.

---

## Part 3 — Point your domain at the instance

1. Back on the DuckDNS tab, paste the EC2 **Public IPv4** into the "current ip" box for your
   subdomain → **update ip**.
2. Now `yourname.duckdns.org` resolves to your server.

---

## Part 4 — Connect and prepare the server

1. SSH in (from Git Bash / PowerShell, in the folder where the `.pem` is):

```bash
chmod 400 sleep-alarm-key.pem          # (Git Bash) restrict key permissions
ssh -i sleep-alarm-key.pem ubuntu@<EC2_PUBLIC_IP>
```
Type `yes` at the fingerprint prompt.

2. Install Docker + Compose + Git:

```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
sudo apt install -y git
```

3. Add a 2 GB swap file (so the React build doesn't run out of memory):

```bash
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

4. **Log out and back in** so the docker group takes effect:

```bash
exit
ssh -i sleep-alarm-key.pem ubuntu@<EC2_PUBLIC_IP>
docker --version && docker compose version    # both should print versions
```

---

## Part 5 — Clone the repo and configure secrets

1. Clone your repo into a folder named `app` (the CI/CD workflow expects `~/app`):

```bash
git clone https://github.com/<your-username>/<your-repo>.git ~/app
cd ~/app
```

2. Create the production `.env` (this stays only on the server, never in git):

```bash
nano .env
```
Paste this and fill in your real values, then save (Ctrl+O, Enter, Ctrl+X):

```env
SITE_ADDRESS=yourname.duckdns.org
MONGO_URI=mongodb+srv://alarm:Paras77%40@cluster0.r14besm.mongodb.net/sleep_alarm_detector?retryWrites=true&w=majority
JWT_ACCESS_SECRET=your-first-generated-secret
JWT_REFRESH_SECRET=your-second-generated-secret
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d
CLIENT_ORIGIN=https://yourname.duckdns.org
```

3. First deploy (this builds the images — takes a few minutes on t2.micro):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

4. Watch it come up:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f caddy   # Ctrl+C to stop watching
```
Caddy will fetch the HTTPS certificate automatically (needs ports 80/443 open + DNS set —
both done). Give it ~30 seconds.

5. Open **https://yourname.duckdns.org** in your browser. Register, go to Live Detection,
   allow the camera — it works because the site is HTTPS. 🎉

---

## Part 6 — Turn on CI/CD (auto-deploy on push)

1. In your GitHub repo → **Settings → Secrets and variables → Actions → New repository
   secret**. Add three secrets:
   | Name | Value |
   |------|-------|
   | `EC2_HOST` | your EC2 Public IPv4 |
   | `EC2_USER` | `ubuntu` |
   | `EC2_SSH_KEY` | the **entire contents** of your `sleep-alarm-key.pem` file (open it in a text editor, copy everything including the BEGIN/END lines) |
2. That's it — `.github/workflows/deploy.yml` is already in your repo. From now on:

```powershell
git add .
git commit -m "some change"
git push
```
GitHub Actions will SSH into EC2, `git pull`, and rebuild. Watch it under the repo's
**Actions** tab. In ~2–4 min your change is live at your domain.

---

## Cost & safety (free tier)

- **Free for 12 months:** t2.micro 750 hrs/month (one always-on instance fits), 30 GB EBS,
  generous data transfer. Atlas M0 is free forever. DuckDNS is free.
- **After 12 months** the instance is ~$8–10/month.
- **To avoid charges while learning:** you can **Stop** the instance in the EC2 console when
  not using it (you keep the disk; you're not billed for compute while stopped — note the
  public IP changes on restart unless you attach an Elastic IP). To fully stop billing,
  **Terminate** the instance and delete the volume.
- Set a **Billing alarm** (AWS Budgets → create a $1 budget alert) so you're notified of any
  charge.

---

## Troubleshooting

- **Site not loading / no HTTPS:** check `docker compose -f docker-compose.prod.yml logs caddy`.
  Usually DNS not pointed yet, or ports 80/443 not open in the Security Group.
- **Build killed / out of memory:** confirm the swap file is on: `free -h` should show ~2 GB
  swap. Re-run the swap steps in Part 4 if not.
- **API errors / can't log in:** `docker compose -f docker-compose.prod.yml logs api`. Usually
  a wrong `MONGO_URI` in `.env` or Atlas not allowing `0.0.0.0/0`.
- **CI/CD fails at SSH:** the `EC2_SSH_KEY` secret must be the full `.pem` contents; `EC2_HOST`
  must be the current public IP (it changes if you Stop/Start without an Elastic IP).
- **Camera blocked:** you must open the **https://** domain, not the raw IP or http.
