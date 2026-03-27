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

/* ── Types ─────────────────────────────────────────────────────── */

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
  last_login_at: string | null;
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

interface AuthState {
  user: User | null;
  workspace: Workspace | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  register: (email: string, password: string, fullName: string, websiteUrl?: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshSession: () => Promise<void>;
}

const TOKEN_KEY = "aeos_access_token";
const REFRESH_KEY = "aeos_refresh_token";

/* ── Context ───────────────────────────────────────────────────── */

const AuthContext = createContext<AuthState>({
  user: null,
  workspace: null,
  isAuthenticated: false,
  isLoading: true,
  register: async () => {},
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

  /* On mount: check for existing token → validate */
  useEffect(() => {
    async function init() {
      const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
      if (token) {
        const ok = await fetchSession();
        if (!ok) {
          /* Try refresh */
          const refresh = localStorage.getItem(REFRESH_KEY);
          if (refresh) {
            try {
              const res = await api.post("/api/v1/auth/refresh", { refresh_token: refresh });
              localStorage.setItem(TOKEN_KEY, res.data.access_token);
              localStorage.setItem(REFRESH_KEY, res.data.refresh_token);
              await fetchSession();
            } catch {
              localStorage.removeItem(TOKEN_KEY);
              localStorage.removeItem(REFRESH_KEY);
            }
          } else {
            localStorage.removeItem(TOKEN_KEY);
          }
        }
      }
      setIsLoading(false);
    }
    init();
  }, [fetchSession]);

  /* Register */
  async function register(email: string, password: string, fullName: string, websiteUrl?: string): Promise<void> {
    // Derive company name from website URL or email domain for backend compatibility
    let companyName = fullName.split(" ")[0] + "'s Company";
    if (websiteUrl) {
      try {
        const host = new URL(websiteUrl).hostname.replace("www.", "");
        const name = host.split(".")[0];
        if (name && name.length > 1) companyName = name.charAt(0).toUpperCase() + name.slice(1);
      } catch { /* use fallback */ }
    } else if (email.includes("@")) {
      const domain = email.split("@")[1].split(".")[0];
      if (!["gmail","yahoo","hotmail","outlook","icloud","aol","protonmail","live"].includes(domain.toLowerCase())) {
        companyName = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }
    const res = await api.post("/api/v1/auth/register", {
      email,
      password,
      full_name: fullName,
      company_name: companyName,
      website_url: websiteUrl || "",
    });
    localStorage.setItem(TOKEN_KEY, res.data.access_token);
    localStorage.setItem(REFRESH_KEY, res.data.refresh_token);
    await fetchSession();
    router.push("/app/onboarding/company");
  }

  /* Login */
  async function login(email: string, password: string): Promise<void> {
    const res = await api.post("/api/v1/auth/login", { email, password });
    localStorage.setItem(TOKEN_KEY, res.data.access_token);
    localStorage.setItem(REFRESH_KEY, res.data.refresh_token);
    await fetchSession();

    const redirect = typeof window !== "undefined" ? sessionStorage.getItem("aeos_redirect") : null;
    sessionStorage.removeItem("aeos_redirect");
    router.push(redirect || "/app/dashboard");
  }

  /* Logout */
  function logout(): void {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      api.post("/api/v1/auth/logout").catch(() => {});
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    setUser(null);
    setWorkspace(null);
    router.push("/login");
  }

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
        register,
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
          <span className="text-sm text-fg-muted">Loading…</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
