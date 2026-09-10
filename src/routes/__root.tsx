import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, Link, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { AuthProvider, useAuth } from "@/lib/auth-context";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Αρχική
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">Η σελίδα δεν φόρτωσε</h1>
        <p className="mt-2 text-sm text-muted-foreground">Δοκίμασε ξανά ή επέστρεψε στην αρχική.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Δοκιμή ξανά
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground"
          >
            Αρχική
          </Link>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function CloudGate() {
  const { user, loading, error, errorCode, signIn, clearError } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-background text-foreground">
        <div className="text-center">
          <div className="text-4xl">🌳</div>
          <p className="mt-3 text-sm text-muted-foreground">Σύνδεση με Firebase…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 text-foreground">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-32 -top-40 h-[520px] w-[520px] rounded-full bg-brand/35 blur-[120px]" />
          <div className="absolute right-0 top-40 h-[460px] w-[460px] rounded-full bg-cyanx/25 blur-[120px]" />
        </div>
        <div className="relative z-10 w-full max-w-md rounded-3xl border border-border bg-card/90 p-8 text-center shadow-2xl backdrop-blur-xl">
          <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-brand to-cyanx text-3xl">🌳</div>
          <h1 className="mt-5 font-display text-2xl font-semibold">HTML Library</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Η βιβλιοθήκη σου αποθηκεύεται στο Firebase και συγχρονίζεται όταν συνδέεσαι με τον ίδιο Google λογαριασμό.
          </p>
          <button
            onClick={() => void signIn()}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-brand to-cyanx px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg shadow-brand/20"
          >
            Σύνδεση με Google
          </button>
          <p className="mt-3 text-[10px] leading-4 text-muted-foreground">
            Αν το Google παράθυρο ανοίξει και κλείσει αμέσως, εδώ θα εμφανιστεί πλέον
            ο ακριβής λόγος.
          </p>
          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-left">
              <p className="text-sm font-semibold text-red-500">
                Η σύνδεση δεν ολοκληρώθηκε
              </p>
              <p className="mt-2 text-xs leading-5 text-red-400">{error}</p>
              {errorCode && (
                <p className="mt-2 font-mono text-[10px] text-muted-foreground">
                  Κωδικός: {errorCode}
                </p>
              )}
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">
                Τρέχον domain: {typeof window !== "undefined" ? window.location.hostname : ""}
              </p>
              <button
                onClick={clearError}
                className="mt-3 rounded-lg border border-border bg-background px-3 py-1.5 text-xs text-foreground"
              >
                Κλείσιμο μηνύματος
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return <Outlet />;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CloudGate />
      </AuthProvider>
    </QueryClientProvider>
  );
}
