# Setup PM2 pour ton serveur 🚀

PM2 permet de gérer ton serveur Node.js facilement et de le faire redémarrer automatiquement.

---

## Installation

```bash
npm install -g pm2
```

---

## Utilisation basique

### Démarrer le serveur

**Option 1: Tout ensemble (Next.js + Socket.IO)**
```bash
cd apps/web
pm2 start server.js --name pomodoro
```

**Option 2: Socket server seul**
```bash
cd apps/web
pm2 start socket-server.js --name pomodoro-socket
```

### Commandes utiles

```bash
# Voir tous les processus
pm2 list

# Voir les logs en temps réel
pm2 logs pomodoro

# Voir les logs des 100 dernières lignes
pm2 logs pomodoro --lines 100

# Redémarrer
pm2 restart pomodoro

# Arrêter
pm2 stop pomodoro

# Supprimer
pm2 delete pomodoro

# Voir les stats (CPU, RAM)
pm2 monit
```

---

## Auto-start au boot

### Windows

1. **Avec NSSM** (recommandé) :
   ```powershell
   # Télécharge NSSM depuis https://nssm.cc/download
   # Puis :
   nssm install PomodoroServer "C:\Program Files\nodejs\node.exe" "C:\path\to\apps\web\server.js"
   ```

2. **Avec Task Scheduler** :
   - Crée une nouvelle tâche
   - Déclencheur : Au démarrage
   - Action : Démarrer un programme
   - Programme : `pm2`
   - Arguments : `resurrect`

### Linux / macOS

```bash
# Sauvegarder la config actuelle
pm2 save

# Générer le script de démarrage
pm2 startup

# Suivre les instructions affichées
# (ça va te donner une commande à exécuter avec sudo)
```

---

## Configuration avancée

Crée un fichier `ecosystem.config.js` :

```javascript
module.exports = {
  apps: [{
    name: 'pomodoro',
    script: './server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    }
  }]
}
```

Puis démarre avec :
```bash
pm2 start ecosystem.config.js
```

---

## Monitoring

### Dashboard web (optionnel)

```bash
pm2 plus
```

Ça te donne un dashboard web pour monitorer ton serveur.

---

## Logs

Les logs sont dans : `~/.pm2/logs/`

Pour nettoyer les logs :
```bash
pm2 flush
```

---

C'est tout ! Ton serveur va maintenant redémarrer automatiquement si il crash. 🎉
