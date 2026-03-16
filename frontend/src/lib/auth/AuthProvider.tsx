"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import api from "@/lib/api";

/* ── Types matching backend auth contract ──────────────────────── */

export interface User {
  id: string;
  email: string;
  full_name: string;
  initials: string;
  role: string;
  is_active: boolean;
  workspace_id: string;
  workspace_role: string;
  permissions: string[];
  created_at: string;
  last_login_at: string;
}

export interface WorkspacePlan {
  id: string;
  name: string;
  tier: string;
  price_monthly: number;
  max_workspaces: number;
  max_users: number;
  included_tokens: number;
  is_active: boolean;
  current_period_start: string;
  current_period_end: string;
}

export interface TokenUsage {
  included: number;
  used: number;
  purchased: number;
  remaining: number;
  purchased_expires_at: string | null;
  reset_at: string;
}

export interface WorkspaceSetup {
  completed: boolean;
  current_step: number;
  total_steps: number;
  steps: Record<string, boolean>;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  industry: string;
  country: string;
  city: string;
  team_size: number;
  website_url: string;
  logo_url: string | null;
  plan: WorkspacePlan;
  token_usage: TokenUsage;
  setup: WorkspaceSetup;
  owner: { id: string; email: string; full_name: string };
  created_at: string;
}

/* ── Auth state ────────────────────────────────────────────────── */

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const TOKEN_KEY = "aeos_access_token";
const DEV_TOKEN = "dev-session-token";

/* ── Context ───────────────────────────────────────────────────── */

const AuthContext = createContext<AuthState>({
  user: null,
  workspace: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  logout: () => {},
  refreshSession: async () => {},
});

export function useAuth(): AuthState {
  return useContext(AuthContext);
}

/* ── Provider ──────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Fetch user + workspace from backend auth contract endpoints.
   * Phase 2: these endpoints will validate the real JWT.
   * Right now: they return deterministic seed data.
   */
  const fetchSession = useCallback(async (): Promise<boolean> => {
    try {
      const [meRes, wsRes] = await Promise.all([
        api.get("/api/v1/auth/me"),
        api.get("/api/v1/workspaces/current"),
      ]);
      setUser(meRes.data);
      setWorkspace(wsRes.data);
      return true;
    } catch {
      setUser(null);
      setWorkspace(null);
      return false;
    }
  }, []);

  /* Check for existing session on mount */
  useEffect(() => {
    async function init() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem(TOKEN_KEY)
          : null;

      if (token) {
        /* Token exists — validate against backend */
        const ok = await fetchSession();
        if (!ok) {
          /* Token invalid — clear it */
          localStorage.removeItem(TOKEN_KEY);
        }
      } else {
        /*
         * Dev auto-login: create a dev token and fetch session.
         * Phase 2 will remove this block entirely.
         */
        const isDev =
          process.env.NODE_ENV === "development" ||
          process.env.NEXT_PUBLIC_API_URL?.includes("localhost");

        if (isDev) {
          localStorage.setItem(TOKEN_KEY, DEV_TOKEN);
          await fetchSession();
        }
      }

      setIsLoading(false);
    }

    init();
  }, [fetchSession]);

  /**
   * Login.
   * Phase 2: POST /api/auth/login → { access_token, refresh_token }
   * Then call fetchSession() to populate user + workspace from /auth/me.
   */
  async function login(_email: string, _password: string): Promise<void> {
    /* Phase 2: real login call here */
    localStorage.setItem(TOKEN_KEY, DEV_TOKEN);
    await fetchSession();

    /* Redirect to stored destination or dashboard */
    const redirect =
      typeof window !== "undefined"
        ? sessionStorage.getItem("aeos_redirect")
        : null;
    sessionStorage.removeItem("aeos_redirect");
    router.push(redirect || "/app/dashboard");
  }

  /* Logout */
  function logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("aeos_refresh_token");
    setUser(null);
    setWorkspace(null);
    router.push("/login");
  }

  /* Re-fetch session (e.g. after workspace switch, plan change) */
  async function refreshSession(): Promise<void> {
    await fetchSession();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

/* ── Route guard ───────────────────────────────────────────────── */

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      if (typeof window !== "undefined") {
        sessionStorage.setItem("aeos_redirect", pathname);
      }
      router.replace("/login");
    }
  }, [isAuthenticated, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-aeos-200 border-t-aeos-600" />
          <span className="text-sm text-slate-400">Loading\u2026</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
