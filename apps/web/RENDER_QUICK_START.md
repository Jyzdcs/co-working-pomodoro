# Render Quick Start 🚀

Guide rapide pour déployer le socket server sur Render.

## ⚡ Setup en 5 minutes

### 1. Créer le service sur Render

1. Va sur **render.com** → **New +** → **Web Service**
2. Connecte ton repo GitHub
3. Configure :
   - **Name** : `pomodoro-socket-server`
   - **Root Directory** : `apps/web` ⚠️
   - **Environment** : `Node`
   - **Build Command** : `npm install` (ou `pnpm install`)
   - **Start Command** : `node socket-server.js`
   - **Plan** : **Free**

### 2. Variables d'environnement

Dans **Environment Variables**, ajoute :

```
CORS_ORIGIN=*
```

### 3. Déployer

Clique **"Create Web Service"** et attends 2-3 minutes.

### 4. Copier l'URL

Une fois déployé, Render te donne une URL comme :
```
https://pomodoro-socket-server.onrender.com
```

**Copie cette URL** - tu en auras besoin pour Vercel !

### 5. Tester

Ouvre dans ton navigateur :
```
https://ton-url.onrender.com/health
```

Devrait retourner : `{"status":"ok"}`

✅ **C'est tout pour Render !**

---

## 🔗 Utiliser avec Vercel

Dans Vercel, ajoute cette variable d'environnement :

```
NEXT_PUBLIC_SOCKET_URL=https://ton-url.onrender.com
```

Puis mets à jour Render :

```
CORS_ORIGIN=https://ton-app.vercel.app
```

---

## 📝 Note importante

Render Free Tier :
- ⚠️ Spin down après 15 min d'inactivité
- ⚠️ Cold start = 30-60 secondes après spin down
- ✅ Mais c'est gratuit !

**Solution** : Utilise Uptime Robot (gratuit) pour ping toutes les 5 minutes et garder Render actif.

---

Pour plus de détails, voir `VERCEL_RENDER_GUIDE.md` 📖
