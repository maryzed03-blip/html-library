import {
  browserLocalPersistence,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { auth, googleProvider } from "./firebase";

type AuthValue = {
  user: User | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);

function getFirebaseCode(err: unknown): string {
  if (typeof err === "object" && err !== null && "code" in err) {
    const code = (err as { code?: unknown }).code;
    return typeof code === "string" ? code : "";
  }
  return "";
}

function friendlyAuthError(err: unknown): { code: string; message: string } {
  const code = getFirebaseCode(err);
  const host =
    typeof window !== "undefined" ? window.location.hostname : "το domain του site";

  switch (code) {
    case "auth/unauthorized-domain":
      return {
        code,
        message:
          `Το domain "${host}" δεν είναι ακόμα εξουσιοδοτημένο στο Firebase. ` +
          `Πήγαινε Firebase → Authentication → Settings → Authorized domains → Add domain και πρόσθεσε: ${host}`,
      };

    case "auth/operation-not-allowed":
      return {
        code,
        message:
          "Το Google Sign-In δεν είναι ενεργό. Πήγαινε Firebase → Authentication → Sign-in method → Google → Enable → Save.",
      };

    case "auth/popup-blocked":
      return {
        code,
        message:
          "Ο browser μπλόκαρε το παράθυρο σύνδεσης. Επίτρεψε pop-ups για αυτό το site και ξαναπάτησε «Σύνδεση με Google».",
      };

    case "auth/popup-closed-by-user":
      return {
        code,
        message:
          "Το παράθυρο σύνδεσης έκλεισε πριν ολοκληρωθεί η είσοδος. Πάτησε ξανά «Σύνδεση με Google» και ολοκλήρωσε τη διαδικασία.",
      };

    case "auth/network-request-failed":
      return {
        code,
        message:
          "Δεν ολοκληρώθηκε η επικοινωνία με το Firebase/Google. Έλεγξε τη σύνδεση internet και δοκίμασε ξανά.",
      };

    case "auth/cancelled-popup-request":
      return {
        code,
        message:
          "Ξεκίνησε δεύτερο παράθυρο σύνδεσης πριν ολοκληρωθεί το πρώτο. Περίμενε ένα δευτερόλεπτο και δοκίμασε ξανά.",
      };

    default: {
      const raw =
        err instanceof Error
          ? err.message
          : typeof err === "string"
            ? err
            : "Άγνωστο σφάλμα σύνδεσης.";
      return {
        code: code || "auth/unknown",
        message: `Η σύνδεση με Google δεν ολοκληρώθηκε. ${raw}`,
      };
    }
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(
      auth,
      (next) => {
        setUser(next);
        setLoading(false);
        if (next) {
          setError(null);
          setErrorCode(null);
        }
      },
      (err) => {
        const info = friendlyAuthError(err);
        setError(info.message);
        setErrorCode(info.code);
        setLoading(false);
      },
    );

    return unsub;
  }, []);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading,
      error,
      errorCode,

      clearError: () => {
        setError(null);
        setErrorCode(null);
      },

      signIn: async () => {
        setError(null);
        setErrorCode(null);

        try {
          await setPersistence(auth, browserLocalPersistence);

          // Always allow the user to explicitly choose the Google account.
          googleProvider.setCustomParameters({
            prompt: "select_account",
          });

          await signInWithPopup(auth, googleProvider);
        } catch (err) {
          const info = friendlyAuthError(err);
          setError(info.message);
          setErrorCode(info.code);

          // Do not rethrow: the UI now shows the useful Firebase error instead
          // of leaving an unhandled rejected Promise after the popup closes.
          console.error("Firebase Google sign-in failed:", err);
        }
      },

      signOut: async () => {
        setError(null);
        setErrorCode(null);
        try {
          await firebaseSignOut(auth);
        } catch (err) {
          const info = friendlyAuthError(err);
          setError(info.message);
          setErrorCode(info.code);
        }
      },
    }),
    [user, loading, error, errorCode],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
