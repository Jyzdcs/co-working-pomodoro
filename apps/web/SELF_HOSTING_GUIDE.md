# Guide : Héberger sur ton PC 🏠

Héberger ton serveur Socket.IO sur ton PC personnel - guide complet.

---

## 💪 Ton PC est largement suffisant !

**Ryzen 5 + 16GB RAM** = Parfait pour cette app ! 

Cette app pomodoro est très légère :
- ✅ Socket.IO : ~50-100MB RAM max
- ✅ Next.js : ~200-300MB RAM
- ✅ Total : Moins de 1GB RAM utilisé
- ✅ CPU : Quasi rien (juste des timers)

**Verdict** : Ton PC peut facilement gérer ça + tes autres trucs en même temps ! 🚀

---

## ✅ Avantages

1. **Gratuit** : $0/mois
2. **Contrôle total** : Tu gères tout
3. **Performance** : Pas de limitations, pas de spin down
4. **Apprentissage** : Tu apprends le self-hosting
5. **Pas de cold start** : Toujours actif

---

## ⚠️ Inconvénients / Challenges

### 1. IP Publique Dynamique

**Problème** : Ton FAI change ton IP publique régulièrement (tous les jours/semaines).

**Solutions** :
- **Cloudflare Tunnel** (gratuit, recommandé) ⭐
- **DuckDNS** (gratuit)
- **No-IP** (gratuit avec limitations)
- **IP statique** (payant chez ton FAI, ~5€/mois)

### 2. Sécurité

**Risques** :
- Exposer ton PC sur internet
- Attaques potentielles
- Si compromis, accès à ton réseau local

**Protection** :
- Firewall bien configuré
- Ne pas exposer de ports sensibles
- Utiliser Cloudflare Tunnel (plus sûr)
- Garder ton OS à jour

### 3. Uptime

**Problème** :
- Si ton PC crash/redémarre → serveur down
- Si internet coupe → serveur down
- Si tu éteins ton PC → serveur down

**Solutions** :
- Configurer auto-start au boot
- Utiliser PM2 pour redémarrer automatiquement
- (Optionnel) UPS pour coupures de courant

### 4. Électricité

**Coût** : ~10-20€/mois d'électricité (PC allumé 24/7)

**Comparaison** :
- Render Free : $0 mais limitations
- Render Pro : $7/mois
- Ton PC : ~15€/mois électricité

---

## 🛠️ Solutions pour exposer ton serveur

### Option 1: Cloudflare Tunnel (Recommandé) ⭐

**Pourquoi c'est le meilleur** :
- ✅ Gratuit
- ✅ Pas besoin de configurer le routeur (port forwarding)
- ✅ Plus sécurisé (pas d'exposition directe)
- ✅ Fonctionne même avec IP dynamique
- ✅ HTTPS automatique
- ✅ Protection DDoS intégrée

**Comment** :
1. Installer `cloudflared` sur ton PC
2. Créer un tunnel Cloudflare
3. Configurer pour pointer vers `localhost:3001`
4. Cloudflare te donne une URL publique : `https://ton-app.trycloudflare.com`
5. (Optionnel) Configurer un domaine custom

**Setup** : Voir section détaillée ci-dessous

### Option 2: Port Forwarding (Classique)

**Comment** :
1. Configurer ton routeur pour forwarder le port 3001 vers ton PC
2. Trouver ton IP publique (ex: `https://whatismyipaddress.com`)
3. Accéder via : `http://ton-ip-publique:3001`

**Problèmes** :
- ❌ IP change régulièrement
- ❌ Pas de HTTPS (sauf config complexe)
- ❌ Expose directement ton PC
- ❌ Besoin de configurer le routeur

### Option 3: ngrok (Développement)

**Pourquoi** : Super pour tester, pas pour production

**Comment** :
```bash
ngrok http 3001
```

**Limitations** :
- URL change à chaque démarrage (gratuit)
- Limite de connexions (gratuit)
- Pas fait pour production

---

## 🚀 Setup avec Cloudflare Tunnel (Recommandé)

### Étape 1: Installer cloudflared

**Windows** :
```powershell
# Télécharge depuis https://github.com/cloudflare/cloudflared/releases
# Ou avec Chocolatey :
choco install cloudflared
```

**macOS** :
```bash
brew install cloudflared
```

**Linux** :
```bash
# Ubuntu/Debian
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

### Étape 2: Se connecter à Cloudflare

```bash
cloudflared tunnel login
```

Ça ouvre ton navigateur pour te connecter à Cloudflare (gratuit).

### Étape 3: Créer un tunnel

```bash
cloudflared tunnel create pomodoro-server
```

### Étape 4: Configurer le tunnel

Crée un fichier `config.yml` dans `~/.cloudflared/` :

```yaml
tunnel: pomodoro-server
credentials-file: /home/user/.cloudflared/[tunnel-id].json

ingress:
  - hostname: pomodoro.ton-domaine.com  # Ou utilise trycloudflare.com
    service: http://localhost:3001
  - service: http_status:404
```

### Étape 5: Démarrer le tunnel

```bash
cloudflared tunnel run pomodoro-server
```

### Étape 6: (Optionnel) Service système

Pour démarrer automatiquement au boot :

**Windows** : Utilise NSSM ou Task Scheduler  
**Linux/macOS** : Crée un service systemd/launchd

---

## 🔧 Configuration du code

### Option A: Tout sur ton PC (server.js)

Si tu héberges **tout** sur ton PC (Next.js + Socket.IO) :

1. **Démarre ton serveur** :
   ```bash
   cd apps/web
   node server.js
   ```

2. **Configure Cloudflare Tunnel** pour pointer vers `localhost:3001`

3. **C'est tout !** Ton app est accessible via l'URL Cloudflare

### Option B: Frontend Vercel + Socket sur ton PC

Si tu veux le frontend sur Vercel et le socket sur ton PC :

1. **Démarre socket-server.js** sur ton PC :
   ```bash
   cd apps/web
   node socket-server.js
   ```

2. **Configure Cloudflare Tunnel** pour pointer vers `localhost:3002` (port du socket server)

3. **Dans Vercel**, ajoute la variable :
   ```
   NEXT_PUBLIC_SOCKET_URL=https://ton-url-cloudflare.trycloudflare.com
   ```

---

## 🔒 Sécurité

### Firewall Windows

1. Va dans **Paramètres Windows** → **Firewall**
2. Autorise le port 3001 (ou 3002) pour les connexions entrantes
3. Ou mieux : Utilise Cloudflare Tunnel (pas besoin d'ouvrir de port)

### Firewall Linux

```bash
# Ubuntu/Debian
sudo ufw allow 3001/tcp
sudo ufw enable
```

### Sécurité générale

- ✅ Garde ton OS à jour
- ✅ Utilise Cloudflare Tunnel (plus sûr que port forwarding direct)
- ✅ Ne pas exposer d'autres ports
- ✅ Utilise un mot de passe fort sur ton PC
- ✅ Désactive les services inutiles

---

## ⚡ Gérer le serveur (PM2)

Pour que ton serveur redémarre automatiquement :

### Installer PM2

```bash
npm install -g pm2
```

### Démarrer avec PM2

```bash
cd apps/web
pm2 start server.js --name pomodoro
```

### Commandes utiles

```bash
pm2 list              # Voir tous les processus
pm2 logs pomodoro     # Voir les logs
pm2 restart pomodoro  # Redémarrer
pm2 stop pomodoro     # Arrêter
pm2 delete pomodoro   # Supprimer

# Sauvegarder la config pour auto-start au boot
pm2 save
pm2 startup           # Configure le démarrage automatique
```

---

## 📊 Monitoring

### Vérifier que ça marche

1. **Health check** : `https://ton-url/health`
2. **Logs** : `pm2 logs pomodoro`
3. **Status** : `pm2 status`

### Uptime monitoring (optionnel)

Utilise **Uptime Robot** (gratuit) pour être alerté si ton serveur tombe :
- Configure un monitor pour `https://ton-url/health`
- Tu recevras un email si ça tombe

---

## 💰 Coûts réels

**Électricité** :
- PC idle : ~50-100W
- Avec serveur : ~60-120W
- 24/7 : ~45-90 kWh/mois
- Coût : ~10-20€/mois (selon tarif)

**Comparaison** :
- Render Free : $0 mais limitations
- Render Pro : $7/mois (~6€)
- Ton PC : ~15€/mois électricité

**Verdict** : Un peu plus cher que Render Pro, mais tu as le contrôle total !

---

## 🎯 Recommandation

### Pour toi, je recommande :

1. **Cloudflare Tunnel** pour exposer ton serveur (gratuit, sécurisé)
2. **PM2** pour gérer le processus (redémarrage auto)
3. **Frontend sur Vercel** (gratuit, CDN global) + **Socket sur ton PC**
   - Meilleur des deux mondes
   - Frontend rapide partout
   - Socket toujours actif sur ton PC

### Setup recommandé :

```
Frontend (Next.js) → Vercel (gratuit, CDN)
Socket.IO Server → Ton PC (Cloudflare Tunnel)
```

---

## 📝 Checklist

- [ ] Installer cloudflared
- [ ] Créer un tunnel Cloudflare
- [ ] Configurer le tunnel pour pointer vers localhost:3001 (ou 3002)
- [ ] Tester l'accès via l'URL Cloudflare
- [ ] Installer PM2
- [ ] Démarrer le serveur avec PM2
- [ ] Configurer PM2 pour auto-start au boot
- [ ] (Optionnel) Configurer un domaine custom
- [ ] (Optionnel) Configurer Uptime Robot
- [ ] Tester que tout fonctionne

---

## 🚨 Dépannage

### Le tunnel ne démarre pas

- Vérifie que cloudflared est bien installé : `cloudflared --version`
- Vérifie que tu es connecté : `cloudflared tunnel list`
- Vérifie les logs : `cloudflared tunnel run pomodoro-server`

### Le serveur ne répond pas

- Vérifie que le serveur tourne : `pm2 list`
- Vérifie les logs : `pm2 logs pomodoro`
- Vérifie que le port est bien utilisé : `netstat -an | grep 3001`

### Connexions refusées

- Vérifie le firewall
- Vérifie que Cloudflare Tunnel pointe vers le bon port
- Vérifie les logs Cloudflare

---

## 🎓 Apprentissage

Héberger sur ton PC, tu apprendras :
- ✅ Gestion de serveurs
- ✅ Cloudflare Tunnel
- ✅ PM2 / gestion de processus
- ✅ Sécurité réseau
- ✅ Monitoring

C'est une excellente expérience ! 🚀

---

## ❓ Questions fréquentes

**Q: Mon PC doit être allumé 24/7 ?**  
A: Oui, sinon le serveur sera down. Mais avec PM2, il redémarre automatiquement si tu rebootes.

**Q: Ça va ralentir mon PC ?**  
A: Non, cette app est très légère. Tu ne verras aucune différence.

**Q: C'est sécurisé ?**  
A: Oui, avec Cloudflare Tunnel c'est très sécurisé. Plus sûr que d'exposer directement un port.

**Q: Je peux utiliser mon PC normalement ?**  
A: Oui ! Le serveur tourne en arrière-plan, tu peux faire ce que tu veux.

**Q: Et si je veux éteindre mon PC ?**  
A: Le serveur sera down. Mais tu peux le redémarrer facilement avec PM2.

---

Besoin d'aide pour configurer Cloudflare Tunnel ou PM2 ? Dis-moi ! 🚀
