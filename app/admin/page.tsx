"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

type Wish = { id: string; sender_name: string; message: string; status: string; created_at: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabasePublicKey ? createClient(supabaseUrl, supabasePublicKey) : null;

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("farah@admin.com");
  const [password, setPassword] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [error, setError] = useState("");
  const [authChecking, setAuthChecking] = useState(true);
  const [signingIn, setSigningIn] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [loadingWishes, setLoadingWishes] = useState(false);
  const [hasLoadedWishes, setHasLoadedWishes] = useState(false);
  const [updatingWishId, setUpdatingWishId] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      setAuthChecking(false);
      return;
    }

    let mounted = true;
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!mounted) return;
      if (sessionError) setError("Unable to check your admin session.");
      setUser(data.session?.user ?? null);
      setAuthChecking(false);
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!supabase) {
      setError("Supabase is not configured. Add the required environment variables first.");
      return;
    }
    if (!email.trim() || !password) {
      setError("Enter the admin email and password.");
      return;
    }

    setSigningIn(true);
    try {
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) setError(result.error.message);
      else setUser(result.data.user);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Unable to sign in.");
    } finally {
      setSigningIn(false);
    }
  }

  const loadWishes = useCallback(async () => {
    if (!supabase) {
      setError("Supabase is not configured. Add the required environment variables first.");
      return;
    }

    setLoadingWishes(true);
    setError("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) {
        setUser(null);
        return;
      }

      const response = await fetch("/api/admin/wishes", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        if (response.status === 401) setUser(null);
        throw new Error(result.error || "Unable to load wishes.");
      }

      setWishes(Array.isArray(result.wishes) ? result.wishes : []);
      setHasLoadedWishes(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load wishes.");
    } finally {
      setLoadingWishes(false);
    }
  }, []);

  useEffect(() => {
    if (user) void loadWishes();
  }, [loadWishes, user]);

  async function logout() {
    if (!supabase) return;
    setSigningOut(true);
    setError("");
    try {
      const result = await supabase.auth.signOut();
      if (result.error) setError(result.error.message);
      else {
        setUser(null);
        setWishes([]);
        setHasLoadedWishes(false);
      }
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  async function markRead(id: string) {
    if (!supabase) return;
    setUpdatingWishId(id);
    setError("");
    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!data.session) {
        setUser(null);
        return;
      }

      const response = await fetch("/api/admin/wishes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session.access_token}` },
        body: JSON.stringify({ id, status: "read" }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to update wish.");
      await loadWishes();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update wish.");
    } finally {
      setUpdatingWishId(null);
    }
  }

  if (authChecking) return <main className="admin-shell"><div className="admin-login"><p className="eyebrow">Private inbox</p><h1>Checking access</h1><p className="admin-loading">Checking your secure admin session…</p></div></main>;

  if (!user) return <main className="admin-shell"><form className="admin-login" onSubmit={login}><p className="eyebrow">Private inbox</p><h1>Admin messages</h1><p>Sign in to read the private wedding wishes.</p><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" autoComplete="username" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" /><button className="button button--primary" type="submit" disabled={signingIn}>{signingIn ? "Signing in…" : "Sign in"}</button>{error && <p className="form-status form-status--error">{error}</p>}</form></main>;

  return <main className="admin-shell"><div className="admin-panel"><div className="admin-panel__header"><div><p className="eyebrow">Farah &amp; Karim</p><h1>Private wishes</h1><p className="admin-auth-copy">Signed in as {user.email}</p></div><div className="admin-actions"><button className="button button--outline" type="button" onClick={() => void loadWishes()} disabled={loadingWishes}>{loadingWishes ? "Loading…" : "Refresh"}</button><button className="text-button" type="button" onClick={() => void logout()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button></div></div><p className="section-copy">These messages are never shown on the public invitation.</p>{error && <p className="form-status form-status--error">{error}</p>}{loadingWishes && !hasLoadedWishes ? <p className="empty-state admin-loading">Loading the private inbox…</p> : !hasLoadedWishes ? <p className="empty-state">Click Refresh to load the inbox.</p> : wishes.length === 0 ? <p className="empty-state">No wishes have arrived yet.</p> : <div className="wish-list">{wishes.map((wish) => <article className={`wish-item wish-item--${wish.status}`} key={wish.id}><div><strong>{wish.sender_name}</strong><time>{new Date(wish.created_at).toLocaleString()}</time></div><p>{wish.message}</p>{wish.status === "unread" && <button className="text-button" type="button" onClick={() => void markRead(wish.id)} disabled={updatingWishId === wish.id}>{updatingWishId === wish.id ? "Updating…" : "Mark as read"}</button>}</article>)}</div>}</div></main>;
}
