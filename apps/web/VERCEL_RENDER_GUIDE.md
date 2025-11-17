# Guide Complet : Vercel + Render 🚀

Guide détaillé pour déployer ton app **gratuitement** avec Vercel (frontend) + Render (socket server).

---

## 📋 Vue d'ensemble

- **Frontend (Next.js)** → Vercel (gratuit, CDN global, très rapide)
- **Socket.IO Server** → Render (gratuit, supporte WebSockets)

**Coût total : $0** 🎉

---

## ⚠️ Limitations Render Free Tier

Avant de commencer, sache que Render Free a ces limitations :

1. **Spin Down** : Le serveur s'endort après 15 minutes d'inactivité
2. **Cold Start** : Premier démarrage après spin down = 30-60 secondes
3. **Performance** : Moins rapide que les plans payants
4. **Bandwidth** : Limité mais généreux pour un projet perso

**Pour un projet perso/test** : C'est largement suffisant !  
**Pour production sérieuse** : Considère Render Pro ($7/mois) ou Fly.io

---

## 🔧 Préparation du Code

### Étape 1: Vérifier les fichiers

Assure-toi d'avoir :
- ✅ `socket-server.js` (serveur Socket.IO standalone)
- ✅ `package-socket-server.json` (pour Render)
- ✅ Code frontend qui supporte URL externe

### Étape 2: Modifier le code frontend

Le code est déjà prêt ! Il détecte automatiquement si `NEXT_PUBLIC_SOCKET_URL` est défini.

---

## 🚀 Déploiement sur Render (Socket Server)

### Étape 1: Créer un compte Render

1. Va sur **https://render.com**
2. **Sign up** avec GitHub (plus facile)
3. Confirme ton email

### Étape 2: Créer un nouveau Web Service

1. Dans le dashboard Render, clique **"New +"**
2. Sélectionne **"Web Service"**
3. **Connect Repository** :
   - Clique **"Connect account"** si pas encore fait
   - Sélectionne ton repo GitHub
   - Clique **"Connect"**

### Étape 3: Configuration du Service

Une fois le repo connecté, configure :

**Basic Settings :**
- **Name** : `pomodoro-socket-server` (ou ce que tu veux)
- **Region** : Choisis le plus proche (ex: `Frankfurt` pour Europe)
- **Branch** : `main` (ou ta branche principale)
- **Root Directory** : `apps/web` ⚠️ **IMPORTANT**

**Build & Deploy :**
- **Environment** : `Node`
- **Build Command** : `npm install` (ou `pnpm install` si tu utilises pnpm)
- **Start Command** : `node socket-server.js`

**Plan :**
- Sélectionne **"Free"** (gratuit)

### Étape 4: Variables d'environnement

Dans la section **"Environment Variables"**, ajoute :

```
CORS_ORIGIN=*
```

⚠️ **Note** : On met `*` pour accepter toutes les origines. Après avoir déployé Vercel, tu pourras changer pour ton URL Vercel exacte.

### Étape 5: Déployer

1. Clique **"Create Web Service"**
2. Render va commencer le build
3. Attends 2-3 minutes pour le premier déploiement
4. Une fois déployé, Render te donne une URL comme :
   ```
   https://pomodoro-socket-server.onrender.com
   ```
5. **Copie cette URL** - tu en auras besoin pour Vercel !

### Étape 6: Tester le serveur

Une fois déployé, teste :

1. **Health check** :
   ```
   https://ton-app.onrender.com/health
   ```
   Devrait retourner : `{"status":"ok"}`

2. **Available rooms** :
   ```
   https://ton-app.onrender.com/api/rooms
   ```
   Devrait retourner : `{"rooms":[]}`

✅ Si ça marche, ton serveur Socket.IO est prêt !

---

## 🌐 Déploiement sur Vercel (Frontend)

### Étape 1: Créer un compte Vercel

1. Va sur **https://vercel.com**
2. **Sign up** avec GitHub
3. Autorise Vercel à accéder à tes repos

### Étape 2: Importer le projet

1. Dans le dashboard Vercel, clique **"Add New..."** → **"Project"**
2. Sélectionne ton repo GitHub
3. Clique **"Import"**

### Étape 3: Configuration du projet

Vercel détecte automatiquement Next.js, mais vérifie :

**Framework Preset :**
- Devrait être **"Next.js"** (auto-détecté)

**Root Directory :**
- Clique **"Edit"** à côté de Root Directory
- Change de `.` à `apps/web` ⚠️ **IMPORTANT**

**Build and Output Settings :**
- **Build Command** : `pnpm build` (ou `npm run build`)
- **Output Directory** : `.next` (par défaut)
- **Install Command** : `pnpm install` (ou `npm install`)

⚠️ **Important** : Vercel utilise `next build` par défaut, ce qui est parfait. Il ne faut PAS utiliser `server.js` sur Vercel.

### Étape 4: Variables d'environnement

Dans **"Environment Variables"**, ajoute :

**Variable :**
- **Name** : `NEXT_PUBLIC_SOCKET_URL`
- **Value** : `https://ton-app.onrender.com` (l'URL Render que tu as copiée)
- **Environments** : ✅ Production, ✅ Preview, ✅ Development

⚠️ **Note** : `NEXT_PUBLIC_` est important - ça rend la variable accessible côté client.

### Étape 5: Déployer

1. Clique **"Deploy"**
2. Vercel va :
   - Installer les dépendances
   - Builder Next.js
   - Déployer sur leur CDN
3. Attends 2-3 minutes
4. Une fois déployé, Vercel te donne une URL comme :
   ```
   https://ton-app.vercel.app
   ```

### Étape 6: Mettre à jour Render CORS

Maintenant que tu as l'URL Vercel :

1. Retourne sur **Render** → ton service socket server
2. Va dans **"Environment"** → **"Environment Variables"**
3. Modifie `CORS_ORIGIN` :
   - Change de `*` à ton URL Vercel exacte :
     ```
     CORS_ORIGIN=https://ton-app.vercel.app
     ```
4. Render va redéployer automatiquement

⚠️ **Pourquoi ?** : C'est plus sécurisé que `*` et évite les problèmes CORS.

---

## ✅ Vérification finale

### Test 1: Frontend

1. Va sur ton URL Vercel : `https://ton-app.vercel.app`
2. La page devrait se charger normalement
3. Ouvre la console du navigateur (F12)
4. Tu devrais voir : `Socket connected: [socket-id]`

### Test 2: Socket.IO

1. Sur la page Vercel, crée ou rejoins une room
2. Le timer devrait fonctionner
3. Ouvre un autre onglet avec la même room
4. Les deux devraient être synchronisés en temps réel

### Test 3: Available Rooms

1. Va sur : `https://ton-app.vercel.app`
2. Si quelqu'un est dans une room, elle devrait apparaître dans "Available Rooms"

---

## 🔧 Dépannage

### Problème : Socket ne se connecte pas

**Symptômes :**
- Console dit "Socket connection error"
- Le statut reste "Connecting..."

**Solutions :**
1. Vérifie que `NEXT_PUBLIC_SOCKET_URL` est bien défini dans Vercel
2. Vérifie que l'URL Render est correcte (avec `https://`)
3. Vérifie que Render est bien démarré (peut prendre 30-60 sec si spin down)
4. Vérifie les logs Render pour voir s'il y a des erreurs

### Problème : CORS errors

**Symptômes :**
- Erreur dans la console : "CORS policy blocked"
- Socket ne peut pas se connecter

**Solutions :**
1. Vérifie que `CORS_ORIGIN` dans Render correspond à ton URL Vercel
2. Assure-toi que l'URL Vercel est exacte (avec `https://`, pas `http://`)
3. Redéploie Render après avoir changé `CORS_ORIGIN`

### Problème : Render est lent au démarrage

**Symptômes :**
- Premier chargement prend 30-60 secondes
- Socket se connecte après un délai

**Explication :**
- C'est normal avec Render Free Tier (spin down après 15 min)
- Le serveur doit "wake up" au premier appel

**Solutions :**
1. **Attendre** : C'est normal, ça va se connecter
2. **Uptime Robot** (gratuit) : Configure un ping toutes les 5 minutes pour garder Render actif
   - Va sur https://uptimerobot.com
   - Crée un monitor pour `https://ton-app.onrender.com/health`
   - Interval : 5 minutes
   - Ça garde Render actif 24/7 (gratuit)

### Problème : Build échoue sur Vercel

**Symptômes :**
- Build Vercel échoue
- Erreur dans les logs

**Solutions :**
1. Vérifie que **Root Directory** = `apps/web`
2. Vérifie que toutes les dépendances sont dans `package.json`
3. Vérifie les logs Vercel pour l'erreur exacte
4. Assure-toi que `pnpm-lock.yaml` ou `package-lock.json` est commité

### Problème : Build échoue sur Render

**Symptômes :**
- Build Render échoue
- Erreur "Cannot find module"

**Solutions :**
1. Vérifie que **Root Directory** = `apps/web`
2. Vérifie que `socket-server.js` est bien dans `apps/web/`
3. Vérifie que `package.json` a bien `socket.io` dans dependencies
4. Assure-toi que le **Start Command** est : `node socket-server.js`

---

## 📊 Monitoring (Optionnel mais recommandé)

### Uptime Robot (Gratuit)

Pour garder Render actif 24/7 :

1. Va sur **https://uptimerobot.com**
2. **Sign up** (gratuit)
3. **Add New Monitor** :
   - **Monitor Type** : HTTP(s)
   - **Friendly Name** : Pomodoro Socket Server
   - **URL** : `https://ton-app.onrender.com/health`
   - **Monitoring Interval** : 5 minutes
4. **Create Monitor**

✅ Ça ping Render toutes les 5 minutes = pas de spin down !

---

## 💰 Coûts

**Vercel :**
- ✅ Gratuit pour projets personnels
- Limite : 100GB bandwidth/mois (largement suffisant)
- Limite : 100 builds/mois (largement suffisant)

**Render :**
- ✅ Gratuit (Free Tier)
- Limitations : Spin down après 15 min, cold start

**Total : $0/mois** 🎉

---

## 🎯 Résumé des URLs

Une fois déployé, tu auras :

- **Frontend** : `https://ton-app.vercel.app`
- **Socket Server** : `https://ton-app.onrender.com`
- **Health Check** : `https://ton-app.onrender.com/health`
- **API Rooms** : `https://ton-app.onrender.com/api/rooms`

---

## 📝 Checklist de déploiement

- [ ] Compte Render créé
- [ ] Socket server déployé sur Render
- [ ] URL Render copiée
- [ ] Health check Render fonctionne
- [ ] Compte Vercel créé
- [ ] Frontend déployé sur Vercel
- [ ] Variable `NEXT_PUBLIC_SOCKET_URL` configurée dans Vercel
- [ ] CORS mis à jour dans Render avec URL Vercel
- [ ] Test : Frontend se charge
- [ ] Test : Socket se connecte
- [ ] Test : Timer fonctionne
- [ ] Test : Synchronisation multi-utilisateurs fonctionne
- [ ] (Optionnel) Uptime Robot configuré

---

## 🚀 Prochaines étapes

Une fois que tout fonctionne :

1. **Custom Domain** (optionnel) :
   - Vercel : Ajoute ton domaine dans Settings → Domains
   - Render : Ajoute ton domaine dans Settings → Custom Domain

2. **Analytics** (optionnel) :
   - Vercel Analytics : Gratuit, activable dans Settings

3. **Monitoring** :
   - Uptime Robot pour garder Render actif
   - Vercel Analytics pour voir les performances

---

## ❓ Questions fréquentes

**Q: Pourquoi pas tout sur Render ?**  
A: Vercel est meilleur pour le frontend (CDN global, très rapide). Render est mieux pour les serveurs persistants.

**Q: Pourquoi pas tout sur Vercel ?**  
A: Vercel ne supporte pas les WebSockets persistants (serverless).

**Q: Render est trop lent, que faire ?**  
A: Utilise Uptime Robot pour éviter le spin down, ou upgrade vers Render Pro ($7/mois).

**Q: Je peux utiliser Fly.io à la place de Render ?**  
A: Oui ! Fly.io est aussi gratuit et plus rapide. Voir `FREE_DEPLOYMENT.md`.

**Q: Ça marche en local ?**  
A: Oui ! En local, utilise `node server.js` qui fait tout ensemble.

---

Besoin d'aide ? Dis-moi où tu bloques ! 🚀
