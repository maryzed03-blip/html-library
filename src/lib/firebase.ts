import { getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported as analyticsIsSupported } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAmn6yg37A6iA1m8VGqhhHxyGrLLzRBGtw",
  authDomain: "html-library-861db.firebaseapp.com",
  projectId: "html-library-861db",
  messagingSenderId: "590032646761",
  appId: "1:590032646761:web:8676b75ab9c28bc4c9a8f8",
  measurementId: "G-CKV29TKTNZ",
};

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const googleProvider = new GoogleAuthProvider();
export const firestore = getFirestore(firebaseApp);

if (typeof window !== "undefined") {
  void analyticsIsSupported()
    .then((ok) => {
      if (ok) getAnalytics(firebaseApp);
    })
    .catch(() => undefined);
}
