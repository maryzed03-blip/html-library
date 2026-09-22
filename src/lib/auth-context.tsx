import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isValidAccessCode } from "./access-code.js";

type LocalUser = { uid: string; email: string | null };

type AuthValue = {
  user: LocalUser | null;
  loading: boolean;
  error: string | null;
  errorCode: string | null;
  signIn: (code: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthValue | null>(null);
const SESSION_KEY = "html-library-owner-unlocked";
const OWNER_UID = "personal-owner";

function initialUser(): LocalUser | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY) === "1"
    ? { uid: OWNER_UID, email: null }
    : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(() => initialUser());
  const [error, setError] = useState<string | null>(null);

  const value = useMemo<AuthValue>(
    () => ({
      user,
      loading: false,
      error,
      errorCode: null,
      clearError: () => setError(null),
      signIn: async (code: string) => {
        setError(null);
        if (!isValidAccessCode(code)) {
          setError("Ο κωδικός δεν είναι σωστός.");
          return;
        }
        sessionStorage.setItem(SESSION_KEY, "1");
        setUser({ uid: OWNER_UID, email: null });
      },
      signOut: async () => {
        sessionStorage.removeItem(SESSION_KEY);
        setUser(null);
      },
    }),
    [user, error],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
