# Déploiement complet sur Railway

Railway peut héberger **tout** : le frontend Next.js ET le serveur Socket.IO ensemble ! 🎉

## Pourquoi Railway pour tout ?

- ✅ Supporte les WebSockets (Socket.IO)
- ✅ Supporte Next.js avec custom server
- ✅ Un seul déploiement, tout fonctionne ensemble
- ✅ Plus simple à gérer

## Configuration Railway

### 1. Créer un nouveau projet Railway

1. Va sur **railway.app** → **New Project**
2. **"Deploy from GitHub repo"** (ou upload manuel)
3. Sélectionne ton repo
4. Railway détectera automatiquement le projet

### 2. Configuration du service

Railway devrait détecter automatiquement :
- **Root Directory** : `apps/web`
- **Build Command** : `pnpm install` (ou `npm install`)
- **Start Command** : `node server.js`

Si pas automatique, configure manuellement :
- **Start Command** : `node server.js`
- **Root Directory** : `apps/web`

### 3. Variables d'environnement

Dans Railway → **Settings** → **Variables**, ajoute :

```
NODE_ENV=production
PORT=3001
```

Railway définit automatiquement `PORT`, mais tu peux le laisser vide aussi.

### 4. Générer un domaine public

1. Va dans **Settings** → **Networking**
2. Clique sur **"Generate Domain"**
3. Railway te donnera une URL comme : `https://ton-app.up.railway.app`

### 5. C'est tout ! 🚀

Ton app est maintenant déployée avec :
- ✅ Frontend Next.js
- ✅ Socket.IO server
- ✅ Tout fonctionne ensemble sur la même URL

## Structure

```
Railway Service
├── Next.js App (frontend)
├── Socket.IO Server (/api/socket)
└── API Routes (/api/rooms)
```

Tout est accessible via la même URL Railway !

## Test

1. **Frontend** : `https://ton-app.up.railway.app`
2. **Socket.IO** : Se connecte automatiquement via `/api/socket`
3. **API Rooms** : `https://ton-app.up.railway.app/api/rooms`

## Avantages vs Vercel + Railway séparés

- ✅ Un seul déploiement
- ✅ Pas besoin de configurer CORS entre services
- ✅ Tout sur le même domaine
- ✅ Plus simple à gérer
- ✅ Moins cher (un seul service)

## Dépannage

### Le build échoue

Assure-toi que :
- **Root Directory** = `apps/web`
- **Build Command** = `pnpm install` (ou `npm install`)
- **Start Command** = `node server.js`

### Les WebSockets ne fonctionnent pas

Railway supporte les WebSockets nativement, mais vérifie :
- Que `server.js` est bien utilisé (pas `next start`)
- Que le port est bien configuré (Railway le fait auto)

### Erreur "Cannot find module"

Vérifie que toutes les dépendances sont dans `package.json` :
- `next`
- `socket.io`
- `react`
- etc.
