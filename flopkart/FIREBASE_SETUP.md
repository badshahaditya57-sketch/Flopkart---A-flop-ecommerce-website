# Firebase setup (≈10 minutes)

1. **Create project:** https://console.firebase.google.com → Add project → name it (e.g. `flopkart-yourname`).
2. **Enable Firestore:** Build → Firestore Database → Create database → *Production mode* → pick a region (e.g. `asia-south1`).
3. **Register web app:** Project settings → Your apps → `</>` Web → copy the config into `public/firebase-config.js`.
4. **Set project id:** replace `YOUR_PROJECT_ID` in `.firebaserc`.
5. **Install CLI & login:**
   ```
   npm i -g firebase-tools
   firebase login
   ```
6. **Deploy (free plan, no backend function):**
   ```
   firebase deploy --only hosting,firestore
   ```
   The site then uses a built-in fake rejection if `/api/checkout` is missing.
7. **Deploy with the Cloud Function (needs Blaze plan, usage at this scale is ~free):**
   ```
   cd functions && npm install && cd ..
   firebase deploy
   ```
8. Open `https://YOUR_PROJECT_ID.web.app`.

**Test locally:** `firebase emulators:start` (or `cd public && python3 -m http.server 8000`).

**What lives in Firestore:** `regrets/*` (Hall of Regret posts) and `stats/global` (live "failed shoppers" counter). Rules in `firestore.rules` allow only length-limited creates and +1 counter bumps, so nobody can wipe or fake your data.
