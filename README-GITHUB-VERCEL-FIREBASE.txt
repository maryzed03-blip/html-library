HTML CANVAS — GITHUB + VERCEL + FIREBASE

Η εφαρμογή είναι web έκδοση. Δεν χρειάζεται Lovable και δεν χρειάζεται Windows EXE.

ΤΙ ΧΡΗΣΙΜΟΠΟΙΕΙ
- GitHub: αποθήκευση κώδικα
- Vercel: φιλοξενία / deploy
- Firebase Authentication: σύνδεση με Google
- Cloud Firestore: folders + HTML components
- Firebase Storage: preview εικόνες
- Firebase Analytics: έχει ήδη συνδεθεί με το measurementId του project

1. FIREBASE — ΜΙΑ ΦΟΡΑ
Στο Firebase Console για το project html-library-861db:

A. Authentication
   Build > Authentication > Get started > Sign-in method > Google > Enable > Save

B. Firestore
   Build > Firestore Database > Create database.

C. Storage
   Build > Storage > Get started.

D. Rules
   Αντέγραψε το περιεχόμενο του firestore.rules στις Firestore Rules και Publish.
   Αντέγραψε το περιεχόμενο του storage.rules στις Storage Rules και Publish.

Οι rules επιτρέπουν σε κάθε συνδεδεμένο χρήστη να βλέπει ΜΟΝΟ τα δικά του δεδομένα.

2. GITHUB
- Δημιούργησε ένα νέο repository.
- Ανέβασε ΟΛΑ τα αρχεία αυτού του φακέλου στη ρίζα του repository.
- Μην ανεβάσεις node_modules ή dist (είναι ήδη στο .gitignore).

3. VERCEL
- Vercel > Add New > Project.
- Import το GitHub repository.
- Framework: Vite (θα το αναγνωρίσει συνήθως μόνο του).
- Build Command: npm run build
- Output Directory: dist
- Deploy.

4. ΠΟΛΥ ΣΗΜΑΝΤΙΚΟ ΓΙΑ GOOGLE LOGIN
Μετά το πρώτο deploy, πάρε το domain που σου δίνει το Vercel, π.χ.
my-html-library.vercel.app

Firebase Console > Authentication > Settings > Authorized domains
και πρόσθεσε το domain ΧΩΡΙΣ https://

Αν βάλεις δικό σου custom domain αργότερα, πρόσθεσέ το και αυτό.

5. ΧΡΗΣΗ
- Ανοίγεις το Vercel URL.
- Πατάς «Σύνδεση με Google».
- Η βιβλιοθήκη αποθηκεύεται στο Firebase.
- Αν μπεις από άλλο PC με τον ίδιο Google λογαριασμό, βλέπεις την ίδια βιβλιοθήκη.

ΣΗΜΕΙΩΣΗ
Το Firebase web apiKey δεν λειτουργεί σαν ιδιωτικός κωδικός server. Η πραγματική προστασία των δεδομένων γίνεται από Authentication + Firestore/Storage Rules. Μην αλλάξεις τις rules σε public read/write.
