# FlopKart: The World's Worst E-Commerce Website

> A deliberately terrible, fully working online store built for a web development competition (theme: *"Design the most hilariously terrible online shopping experience imaginable, while keeping it functional enough for users to explore"*).

**Live demo:** `https://YOUR_PROJECT_ID.web.app` *(replace after deploying)*

> **Content notice:** the site contains crude humour and swearing in its final "roast" screen and one popup. See [Customization](#customization) for a family-friendly option.

---

## Table of Contents
1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Getting Started](#getting-started)
6. [Firebase Setup & Deployment](#firebase-setup--deployment)
7. [Customization](#customization)
8. [Accessibility Notes](#accessibility-notes)
9. [Credits & Disclaimer](#credits--disclaimer)
10. [License](#license)

---

## Overview
FlopKart is a parody e-commerce site that does everything a good store should not do, while still letting visitors browse products, search, fill a cart and attempt to check out. The cart works, prices are shown in Indian rupees (₹), and every product links to its real Flipkart listing.

## Features

### Shopping (technically functional)
- Product grid with MRP, price, taglines, fake reviews and links to the original Flipkart listings
- Search, sort, cart drawer and a checkout flow
- Hall of Regret: visitors post complaints, stored in Firebase Firestore
- Live "failed shoppers" counter shared across all visitors (Firestore)

### The "terrible" experience
- **Add-to-cart button runs away** from the cursor the first few times
- **Prices keep rising** every few seconds; **Spin to WIN** makes everything more expensive
- **Search returns unrelated results**; sorting options make no sense
- **Cart quantities change randomly**; the remove button asks "are you sure?" several times
- **Fake captcha** that never quite finishes, then **checkout always fails** with Error 418 and a "Certificate of Suffering"
- **Order-click question popup** with a timer; ignore it and the site gets angry
- **Popup blast** (16 fake ads) with sound, followed by a **page-shaking crash**, a fake blue crash screen, and a final roast screen
- Rage meter, DO NOT PRESS button, fake countdown that always resets, fake live purchase feed, cookie banner with a tiny decline link, a useless support chatbot, a cursor emoji trail, and a flashbang "dark mode" (type `dark`)

## Tech Stack
| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, vanilla JavaScript (no build step) |
| Database | Firebase Cloud Firestore |
| Backend | Firebase Cloud Functions (v2, Node.js 20): `checkout` endpoint |
| Hosting | Firebase Hosting **or** Netlify |

## Project Structure
```
.
├── public/                 # Frontend (deployed to Firebase Hosting)
│   ├── index.html
│   ├── style.css
│   ├── app.js              # All site behaviour and gags
│   ├── products.js         # Product data (edit this)
│   ├── firebase-config.js  # Your Firebase web config
│   ├── blast.mp3           # Popup blast sound
│   └── blast-data.js       # Embedded copy of the sound (fallback)
├── functions/              # Backend: Cloud Function that always rejects orders
│   ├── index.js
│   └── package.json
├── netlify.toml            # Netlify deploy settings
├── netlify/functions/      # Netlify version of the checkout function
├── firebase.json           # Hosting, functions and Firestore config
├── firestore.rules         # Database security rules
├── .firebaserc             # Firebase project alias
├── FIREBASE_SETUP.md       # Step-by-step Firebase guide
└── README.md
```

## Getting Started

### Run locally (no Firebase needed)
The site falls back to `localStorage` when Firebase is not configured.
```bash
cd public
python3 -m http.server 8000
```
Open http://localhost:8000.

> Serve the site over HTTP rather than opening the file directly if you want the most reliable audio and network behaviour.

## Firebase Setup & Deployment

1. Create a project at the [Firebase Console](https://console.firebase.google.com) and enable **Firestore** (production mode).
2. Register a **Web app** and paste its config into `public/firebase-config.js`.
3. Replace `YOUR_PROJECT_ID` in `.firebaserc`.
4. Install the CLI and sign in:
   ```bash
   npm install -g firebase-tools
   firebase login
   ```
5. Deploy:
   ```bash
   # Free plan: hosting and database rules only
   firebase deploy --only hosting,firestore

   # Full deploy including the checkout Cloud Function (requires the Blaze plan)
   cd functions && npm install && cd ..
   firebase deploy
   ```

Without the Cloud Function, the frontend uses a built-in fake rejection, so checkout still fails comically. See [`FIREBASE_SETUP.md`](FIREBASE_SETUP.md) for details.

**Firestore data:** `regrets/*` (Hall of Regret posts) and `stats/global` (failed-shopper counter). The security rules allow only length-limited creates and +1 counter increments; updates and deletes are blocked.

## Deploy on Netlify (alternative to Firebase Hosting)
Firestore still works from Netlify; only the hosting and checkout function change.
1. Push the project to GitHub, then in Netlify choose **Add new site → Import an existing project**.
2. Netlify reads `netlify.toml` automatically: **publish directory** `public`, **functions** `netlify/functions`, no build command.
3. Make sure `public/firebase-config.js` contains your Firebase web config, then deploy.
4. *Quick alternative:* drag and drop the `public` folder onto https://app.netlify.com/drop (the checkout then uses the built-in fake rejection).
5. In the Firebase Console, add your Netlify domain under **Authentication → Settings → Authorized domains** only if you later enable Firebase Auth.

## Customization
- **Products:** edit `public/products.js`. Each product needs `name`, `mrp`, `price`, `seller`, `url` and an emoji. Collection pages use `col: true`. Always verify prices on the live listing before publishing.
- **Wording / swearing:** the popup question lives in the `GATE` object and the final screen in the `ROAST` object, both in `public/app.js`. Change the text for a family-friendly version.
- **Sound:** replace `public/blast.mp3` (and regenerate `blast-data.js`, a base64 data-URI copy of the same file).
- **Currency:** search for `₹` in `public/app.js`.

## Accessibility Notes
- Popups and dialogs use `role="dialog"` and keyboard-focusable buttons
- Visible focus outlines on interactive elements
- Users who enable "reduce motion" get no shaking, trail or scrolling-marquee animation
- Mobile-friendly responsive layout

*Note: the flashing glitch effect and loud sound are intentional parts of the joke. Use judgement when demoing to audiences sensitive to flashing visuals or sound.*

## Credits & Disclaimer
- **FlopKart is a parody project.** It is **not affiliated with, endorsed by, or sponsored by Flipkart, Apple, Samsung, Motorola, vivo, or any other brand** shown.
- Product names and links point to the original Flipkart listings. No Flipkart images or product descriptions are copied; emoji and original jokes are used instead.
- **Seller names shown on the cards are fictional jokes** and are labelled as such. Prices are indicative launch prices and may differ from live Flipkart prices.
- All trademarks and product names belong to their respective owners.
- Popup blast sound: supplied by the project author.

## License
Add your preferred license here (for example MIT) before publishing, and include a `LICENSE` file in the repository.
