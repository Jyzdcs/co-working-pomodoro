# Vercel Deployment Guide

## The Problem

Vercel uses **serverless functions** which don't support persistent WebSocket connections. Our app uses Socket.IO which requires a persistent server.

## Solution: Split Deployment

Deploy the **frontend** to Vercel and the **Socket.IO server** to a platform that supports persistent connections.

**✅ Good news:** The code is already updated to support this! Just follow the steps below.

---

## Option 1: Railway (Recommended - Easiest)

### Step 1: Deploy Socket.IO Server to Railway

1. **Go to Railway** (https://railway.app) and sign up/login
2. **Click "New Project"** → **"Empty Project"**
3. **Click "Add Service"** → **"GitHub Repo"** (or upload files manually)
4. **If using GitHub:**
   - Select your repo
   - Set **Root Directory** to `apps/web`
   - Railway will auto-detect the project
5. **If uploading manually:**
   - Copy `socket-server.js` and `package-socket-server.json` to a new folder
   - Rename `package-socket-server.json` to `package.json`
   - Upload to Railway
6. **Set environment variables:**
   - `CORS_ORIGIN=https://your-vercel-app.vercel.app` (you'll update this after Vercel deploy)
   - `PORT=3002` (optional, Railway auto-assigns)
7. **Deploy** - Railway will give you a URL like `https://your-app.up.railway.app`
8. **Copy the Railway URL** - you'll need it for Vercel

### Step 2: Deploy Frontend to Vercel

1. **Go to Vercel** (https://vercel.com) and import your GitHub repo
2. **Configure project:**
   - **Root Directory:** `apps/web`
   - **Framework Preset:** Next.js
   - **Build Command:** `pnpm build` (or `npm run build`)
   - **Output Directory:** `.next`
3. **Add environment variable:**
   - **Key:** `NEXT_PUBLIC_SOCKET_URL`
   - **Value:** Your Railway URL (e.g., `https://your-app.up.railway.app`)
4. **Deploy!**
5. **After deployment, update Railway's `CORS_ORIGIN`:**
   - Go back to Railway
   - Update `CORS_ORIGIN` to your Vercel URL (e.g., `https://your-app.vercel.app`)

**That's it!** Your app should now work on Vercel. 🎉

---

## Option 2: Fly.io

### Deploy Socket.IO Server:

1. **Install Fly CLI**: `curl -L https://fly.io/install.sh | sh`
2. **Create** `fly.toml`:
   ```toml
   app = "your-app-name"
   primary_region = "iad"
   
   [build]
   
   [http_service]
     internal_port = 3002
     force_https = true
     auto_stop_machines = false
     auto_start_machines = true
     min_machines_running = 1
   
   [[services]]
     protocol = "tcp"
     internal_port = 3002
   ```
3. **Create** `Dockerfile`:
   ```dockerfile
   FROM node:20-alpine
   WORKDIR /app
   COPY package.json .
   RUN npm install
   COPY socket-server.js .
   CMD ["node", "socket-server.js"]
   ```
4. **Deploy**: `fly deploy`

### Frontend setup same as Railway above.

---

## Option 3: Render

1. **Create new Web Service** on Render
2. **Build command**: `npm install`
3. **Start command**: `node socket-server.js`
4. **Environment**: `CORS_ORIGIN=https://your-vercel-app.vercel.app`
5. **Deploy**

---

## Quick Setup Script

After deploying the socket server, update these files:

1. **`apps/web/src/hooks/useRoomSocket.ts`** - Change socket connection
2. **`apps/web/src/app/page.tsx`** - Change API fetch URL
3. **Vercel environment variables** - Add `NEXT_PUBLIC_SOCKET_URL`

---

## Testing Locally

Before deploying, test locally:

1. **Terminal 1**: `node socket-server.js` (runs on port 3002)
2. **Terminal 2**: `cd apps/web && npm run dev` (runs on port 3001)
3. **Set** `NEXT_PUBLIC_SOCKET_URL=http://localhost:3002` in `.env.local`

---

## Notes

- The socket server needs to stay running 24/7 (persistent connection)
- Railway/Fly.io/Render all support this
- Vercel is perfect for the frontend (static + API routes)
- Make sure CORS is configured correctly on the socket server
