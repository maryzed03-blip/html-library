HTML CANVAS — GITHUB + VERCEL + FIREBASE SPARK
================================================

ΑΥΤΗ Η ΕΚΔΟΣΗ ΔΕΝ ΧΡΗΣΙΜΟΠΟΙΕΙ FIREBASE STORAGE.

1. FIREBASE AUTHENTICATION
--------------------------
Firebase Console
→ Authentication
→ Sign-in method
→ Google
→ Enable
→ Save

2. FIRESTORE DATABASE
---------------------
Firebase Console
→ Firestore Database
→ Create database

Μετά:
→ Firestore Database
→ Rules

Κάνε copy-paste το περιεχόμενο του αρχείου:
firestore.rules

και πάτησε Publish.

3. GITHUB
---------
Δημιούργησε νέο repository και ανέβασε ΟΛΑ τα αρχεία αυτού του φακέλου.

4. VERCEL
---------
Vercel
→ Add New Project
→ Import το GitHub repository
→ Deploy

Το project είναι ήδη ρυθμισμένο για Vite.

5. AUTHORIZED DOMAIN
--------------------
Όταν το Vercel σου δώσει διεύθυνση π.χ.

my-html-canvas.vercel.app

πήγαινε:
Firebase
→ Authentication
→ Settings
→ Authorized domains
→ Add domain

και πρόσθεσε:
my-html-canvas.vercel.app

PREVIEW ΕΙΚΟΝΕΣ
----------------
Δεν ανεβαίνουν σε Storage.
Αν βάλεις εικόνα preview, η εφαρμογή τη μικραίνει αυτόματα και την αποθηκεύει
ως μικρό JPEG thumbnail μέσα στο Firestore.

Αν δεν βάλεις εικόνα, χρησιμοποιείται αυτόματο preview από το HTML.

ΣΗΜΑΝΤΙΚΟ
---------
Το Firestore έχει όριο μεγέθους ανά document. Η εφαρμογή κάνει έλεγχο πριν
την αποθήκευση και θα σε ενημερώσει αν ένα component είναι υπερβολικά μεγάλο.

Η Firebase web apiKey δεν είναι password/server secret.
Η προστασία της βιβλιοθήκης γίνεται από Google Authentication + Firestore Rules.
