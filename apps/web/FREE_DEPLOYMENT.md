# Déploiement Gratuit 🆓

Voici les meilleures options **gratuites** pour déployer ton app :

---

## Option 1: Vercel (Frontend) + Render (Socket Server) ⭐ RECOMMANDÉ

**Pourquoi c'est gratuit :**
- ✅ Vercel : Gratuit pour Next.js (généreux)
- ✅ Render : Plan gratuit avec limitations (mais suffisant)

### Étape 1: Déployer Socket Server sur Render (GRATUIT)

1. **Va sur render.com** → Sign up (gratuit)
2. **New** → **Web Service**
3. **Connect GitHub** → Sélectionne ton repo
4. **Configuration :**
   - **Name** : `pomodoro-socket-server`
   - **Root Directory** : `apps/web`
   - **Environment** : `Node`
   - **Build Command** : `npm install` (ou `pnpm install`)
   - **Start Command** : `node socket-server.js`
5. **Variables d'environnement :**
   - `CORS_ORIGIN=*` (ou ton URL Vercel après déploiement)
6. **Plan** : Sélectionne **Free**
7. **Deploy !**
8. **Copie l'URL** : `https://ton-app.onrender.com`

⚠️ **Note Render Free :**
- Le serveur "spin down" après 15 min d'inactivité
- Premier démarrage peut prendre 30-60 secondes
- Mais c'est **gratuit** et fonctionne bien pour un projet perso !

### Étape 2: Déployer Frontend sur Vercel (GRATUIT)

1. **Va sur vercel.com** → Import ton repo GitHub
2. **Configuration :**
   - **Root Directory** : `apps/web`
   - **Framework** : Next.js
   - **Build Command** : `pnpm build`
   - **Output Directory** : `.next`
3. **Variables d'environnement :**
   - `NEXT_PUBLIC_SOCKET_URL=https://ton-app.onrender.com`
4. **Important** : Modifie `package.json` pour Vercel :
   - Change `"start"` script pour ne PAS utiliser `server.js` sur Vercel
   - Vercel utilise `next build` automatiquement

### Étape 3: Modifier le code pour Vercel

Il faut créer un `next.config.ts` qui détecte si on est sur Vercel ou pas.

---

## Option 2: Fly.io (Tout ensemble) 🆓

**Fly.io a un plan gratuit généreux :**

1. **Install Fly CLI** : `curl -L https://fly.io/install.sh | sh`
2. **Login** : `fly auth login`
3. **Dans `apps/web`** : `fly launch`
4. **Configuration automatique**
5. **Deploy** : `fly deploy`

**Avantages Fly.io :**
- ✅ Gratuit (généreux)
- ✅ Supporte WebSockets
- ✅ Peut héberger Next.js + Socket.IO ensemble
- ✅ Pas de "spin down" comme Render

**Inconvénients :**
- ❌ Nécessite CLI (mais c'est facile)

---

## Option 3: Railway Free Tier

Railway a aussi un plan gratuit :
- **$5 de crédit gratuit par mois**
- Suffisant pour un projet perso
- Mais crédit limité (pas illimité)

---

## Option 4: Vercel + Railway (si tu as déjà Railway)

Si tu as déjà Railway avec crédit :
- Frontend sur Vercel (gratuit)
- Socket sur Railway (utilise ton crédit gratuit)

---

## Ma Recommandation pour GRATUIT

**Vercel + Render** :
- ✅ 100% gratuit
- ✅ Facile à configurer
- ✅ Fonctionne bien
- ⚠️ Render peut être lent au démarrage (mais gratuit !)

**Ou Fly.io** si tu veux tout ensemble :
- ✅ 100% gratuit
- ✅ Plus rapide que Render
- ⚠️ Nécessite CLI

---

## Code à modifier pour Vercel + Render

Je peux t'aider à modifier le code pour que ça fonctionne avec Vercel + Render. Dis-moi quelle option tu préfères !
