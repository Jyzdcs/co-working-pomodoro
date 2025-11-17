# Railway Setup Guide

## Trouver l'URL publique de Railway

Railway ne donne **pas** une URL `localhost` - c'est une URL publique. Voici comment la trouver :

### Méthode 1: Dans le Dashboard Railway

1. Va sur **railway.app** → ton projet
2. Clique sur ton service (le socket server)
3. Va dans l'onglet **"Settings"** ou **"Networking"**
4. Cherche **"Public Domain"** ou **"Generate Domain"**
5. Clique sur **"Generate Domain"** si pas encore fait
6. Tu auras une URL comme : `https://ton-app.up.railway.app`

### Méthode 2: Dans les Logs

1. Va dans l'onglet **"Deployments"** ou **"Logs"**
2. Cherche dans les logs une ligne qui dit quelque chose comme :
   ```
   Server accessible at: http://0.0.0.0:8080
   ```
3. Mais l'URL publique sera différente - regarde dans **Settings** → **Networking**

## Configuration

### Variables d'environnement dans Railway

Dans Railway, va dans **Settings** → **Variables** et ajoute :

```
CORS_ORIGIN=*
```

Ou si tu connais déjà ton URL Vercel :

```
CORS_ORIGIN=https://ton-app.vercel.app
```

### Port

Railway définit automatiquement `PORT` - tu n'as pas besoin de le configurer.

## Tester la connexion

Une fois que tu as l'URL publique Railway (ex: `https://ton-app.up.railway.app`), teste :

1. **Health check** : `https://ton-app.up.railway.app/health`
   - Devrait retourner `{"status":"ok"}`

2. **Available rooms** : `https://ton-app.up.railway.app/api/rooms`
   - Devrait retourner `{"rooms":[]}` (vide au début)

## Utiliser avec Vercel

Dans Vercel, ajoute cette variable d'environnement :

```
NEXT_PUBLIC_SOCKET_URL=https://ton-app.up.railway.app
```

⚠️ **Important** : Utilise l'URL **publique** Railway (avec `https://`), pas `localhost:8080` !

## Dépannage

### Le serveur dit "localhost:8080"

C'est normal dans les logs - c'est juste le port interne. Railway expose ton app publiquement via son propre domaine.

### CORS errors

Assure-toi que `CORS_ORIGIN` est bien configuré dans Railway :
- `*` pour accepter toutes les origines (dev)
- Ou ton URL Vercel exacte pour la production

### Le serveur ne démarre pas

Vérifie que :
1. Le fichier `socket-server.js` est bien à la racine du projet Railway
2. Le `package.json` a bien `socket.io` dans les dépendances
3. La commande de démarrage est : `node socket-server.js`
