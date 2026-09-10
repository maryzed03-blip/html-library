HTML Canvas — Login Fix
=======================

Αν το Google login παράθυρο ανοίγει και κλείνει:

1. Η εφαρμογή πλέον εμφανίζει τον πραγματικό Firebase error κωδικό.
2. Αν γράφει auth/unauthorized-domain:
   Firebase → Authentication → Settings → Authorized domains
   → Add domain
   → πρόσθεσε ΑΚΡΙΒΩΣ το domain που δείχνει η εφαρμογή
     π.χ. my-project.vercel.app

3. Αν γράφει auth/operation-not-allowed:
   Firebase → Authentication → Sign-in method
   → Google → Enable → Save

4. Αν γράφει auth/popup-blocked:
   επέτρεψε pop-ups για το Vercel site.

Η έκδοση παραμένει Firebase Spark:
- Authentication
- Firestore
- Analytics
- ΧΩΡΙΣ Firebase Storage.
