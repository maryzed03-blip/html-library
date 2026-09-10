# HTML Canvas — GitHub / Vercel / Firebase Spark

Web έκδοση της εφαρμογής χωρίς Lovable, χωρίς Windows launcher και χωρίς Firebase Storage.

## Χρησιμοποιεί
- GitHub για τον κώδικα
- Vercel για hosting/build
- Firebase Authentication (Google)
- Cloud Firestore για φακέλους, HTML components και προαιρετικά συμπιεσμένα preview thumbnails
- Firebase Analytics

## Σημαντικό
Δεν χρησιμοποιείται καθόλου Firebase Storage. Η έκδοση είναι κατάλληλη για Firebase Spark, μέσα στα όρια χρήσης του δωρεάν πλάνου.

Οι preview εικόνες συμπιέζονται αυτόματα σε μικρό JPEG thumbnail πριν αποθηκευτούν μαζί με το component στο Firestore. Αν δεν χρειάζεσαι εικόνα, άφησέ την κενή και η εφαρμογή χρησιμοποιεί αυτόματο HTML preview.

## Firebase
1. Authentication → Sign-in method → Google → Enable.
2. Firestore Database → Create database.
3. Firestore → Rules → βάλε το περιεχόμενο του `firestore.rules` → Publish.
4. Μετά το Vercel deploy, πρόσθεσε το `xxxxx.vercel.app` στα Authentication → Settings → Authorized domains.

## Vercel
Κάνε import το GitHub repository. Το project είναι Vite και περιλαμβάνει `vercel.json`.

Build command: `npm run build`
Output directory: `dist`
