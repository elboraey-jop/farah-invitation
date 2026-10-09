"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

type WishStatus = "unread" | "read" | "archived";
type Wish = { id: string; sender_name: string; message: string; status: WishStatus; created_at: string };
type InboxTab = "all" | WishStatus;
type SortOrder = "newest" | "oldest";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublicKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabasePublicKey ? createClient(supabaseUrl, supabasePublicKey) : null;

const tabLabels: Record<InboxTab, string> = { all: "All wishes", unread: "Unread", read: "Read", archived: "Archived" };
const statusLabels: Record<WishStatus, string> = { unread: "Needs reply", read: "Read", archived: "Archived" };

function formatWishDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function getInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "?";
}

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
  const [updatingIds, setUpdatingIds] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<InboxTab>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState<SortOrder>("newest");
  const [activeWish, setActiveWish] = useState<Wish | null>(null);

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

  useEffect(() => {
    if (!activeWish) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActiveWish(null);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [activeWish]);

  const counts = useMemo(() => wishes.reduce((summary, wish) => {
    summary[wish.status] += 1;
    return summary;
  }, { unread: 0, read: 0, archived: 0 }), [wishes]);

  const filteredWishes = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();
    return wishes
      .filter((wish) => activeTab === "all" || wish.status === activeTab)
      .filter((wish) => !normalizedSearch || `${wish.sender_name} ${wish.message}`.toLowerCase().includes(normalizedSearch))
      .sort((first, second) => {
        const firstTime = new Date(first.created_at).getTime();
        const secondTime = new Date(second.created_at).getTime();
        return sortOrder === "newest" ? secondTime - firstTime : firstTime - secondTime;
      });
  }, [activeTab, searchTerm, sortOrder, wishes]);

  const selectedVisibleCount = filteredWishes.filter((wish) => selectedIds.includes(wish.id)).length;
  const allVisibleSelected = filteredWishes.length > 0 && selectedVisibleCount === filteredWishes.length;

  function toggleSelection(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((selectedId) => selectedId !== id) : [...current, id]);
  }

  function toggleSelectVisible() {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !filteredWishes.some((wish) => wish.id === id)));
      return;
    }
    setSelectedIds((current) => Array.from(new Set([...current, ...filteredWishes.map((wish) => wish.id)])));
  }

  async function updateWishes(ids: string[], status: WishStatus) {
    if (!supabase || ids.length === 0) return;
    setUpdatingIds((current) => Array.from(new Set([...current, ...ids])));
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
        body: JSON.stringify({ ids, status }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Unable to update wishes.");
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
      setActiveWish((current) => current && ids.includes(current.id) ? { ...current, status } : current);
      await loadWishes();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update wishes.");
    } finally {
      setUpdatingIds((current) => current.filter((id) => !ids.includes(id)));
    }
  }

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
        setSelectedIds([]);
        setHasLoadedWishes(false);
      }
    } catch (logoutError) {
      setError(logoutError instanceof Error ? logoutError.message : "Unable to sign out.");
    } finally {
      setSigningOut(false);
    }
  }

  if (authChecking) return <main className="admin-shell admin-auth-shell"><div className="admin-login"><div className="admin-login__brand"><span className="admin-logo">F</span><span>FARAH &amp; KARIM</span></div><p className="eyebrow">Private inbox</p><h1>Checking access</h1><p className="admin-loading">Checking your secure admin session…</p></div></main>;

  if (!user) return <main className="admin-shell admin-auth-shell"><form className="admin-login" onSubmit={login}><div className="admin-login__brand"><span className="admin-logo">F</span><span>FARAH &amp; KARIM</span></div><p className="eyebrow">Private inbox</p><h1>Admin messages</h1><p>Sign in to manage every private wedding wish in one place.</p><label className="admin-field"><span>Email address</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" autoComplete="username" /></label><label className="admin-field"><span>Password</span><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" autoComplete="current-password" /></label><button className="button button--primary" type="submit" disabled={signingIn}>{signingIn ? "Signing in…" : "Enter inbox"}</button>{error && <p className="form-status form-status--error">{error}</p>}<small className="admin-login__note">Private access for the wedding team only.</small></form></main>;

  return <main className="admin-shell admin-dashboard">
    <div className="admin-dashboard__glow" aria-hidden="true" />
    <div className="admin-container">
      <header className="admin-topbar">
        <div className="admin-brand"><span className="admin-logo">F</span><div><strong>Farah &amp; Karim</strong><span>Private guestbook</span></div></div>
        <div className="admin-user"><span className="admin-user__status" aria-hidden="true" /><span className="admin-user__email">{user.email}</span><button className="admin-signout" type="button" onClick={() => void logout()} disabled={signingOut}>{signingOut ? "Signing out…" : "Sign out"}</button></div>
      </header>

      <section className="admin-hero"><div><p className="eyebrow">Your private inbox</p><h1>Wishes, collected beautifully.</h1><p>Every message from your guests, organized and easy to revisit.</p></div><button className="admin-refresh" type="button" onClick={() => void loadWishes()} disabled={loadingWishes}><span className={loadingWishes ? "admin-refresh__icon is-spinning" : "admin-refresh__icon"}>↻</span>{loadingWishes ? "Refreshing" : "Refresh inbox"}</button></section>

      {error && <div className="admin-alert" role="alert"><span>!</span>{error}</div>}

      <section className="admin-stats" aria-label="Inbox overview">
        <div className="admin-stat admin-stat--total"><span className="admin-stat__icon">✦</span><div><span>Total wishes</span><strong>{wishes.length}</strong></div><small>All messages</small></div>
        <div className="admin-stat admin-stat--unread"><span className="admin-stat__icon">✉</span><div><span>Unread</span><strong>{counts.unread}</strong></div><small>Needs your attention</small></div>
        <div className="admin-stat admin-stat--read"><span className="admin-stat__icon">✓</span><div><span>Read</span><strong>{counts.read}</strong></div><small>Already seen</small></div>
        <div className="admin-stat admin-stat--archived"><span className="admin-stat__icon">⌁</span><div><span>Archived</span><strong>{counts.archived}</strong></div><small>Kept for later</small></div>
      </section>

      <section className="admin-inbox" aria-label="Private wishes inbox">
        <div className="admin-inbox__heading"><div><p className="eyebrow">Guest messages</p><h2>All your wishes</h2></div><span className="admin-inbox__secure">● Secure &amp; private</span></div>
        <nav className="admin-tabs" aria-label="Filter wishes">
          {(Object.keys(tabLabels) as InboxTab[]).map((tab) => <button key={tab} className={activeTab === tab ? "admin-tab is-active" : "admin-tab"} type="button" onClick={() => { setActiveTab(tab); setSelectedIds([]); }} aria-pressed={activeTab === tab}><span>{tabLabels[tab]}</span><b>{tab === "all" ? wishes.length : counts[tab]}</b></button>)}
        </nav>

        <div className="admin-toolbar"><label className="admin-search"><span aria-hidden="true">⌕</span><input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search names or messages…" aria-label="Search wishes" />{searchTerm && <button type="button" onClick={() => setSearchTerm("")} aria-label="Clear search">×</button>}</label><label className="admin-sort"><span>Sort by</span><select value={sortOrder} onChange={(event) => setSortOrder(event.target.value as SortOrder)} aria-label="Sort wishes"><option value="newest">Newest first</option><option value="oldest">Oldest first</option></select></label></div>

        {selectedIds.length > 0 && <div className="admin-bulkbar"><strong>{selectedIds.length} selected</strong><span>Choose an action</span><div><button type="button" onClick={() => void updateWishes(selectedIds, "read")} disabled={updatingIds.length > 0}>Mark read</button><button type="button" onClick={() => void updateWishes(selectedIds, "unread")} disabled={updatingIds.length > 0}>Mark unread</button><button type="button" onClick={() => void updateWishes(selectedIds, activeTab === "archived" ? "read" : "archived")} disabled={updatingIds.length > 0}>{activeTab === "archived" ? "Restore" : "Archive"}</button></div><button className="admin-bulkbar__clear" type="button" onClick={() => setSelectedIds([])}>Clear</button></div>}

        <div className="admin-list-head"><label className="admin-check"><input type="checkbox" checked={allVisibleSelected} onChange={toggleSelectVisible} disabled={filteredWishes.length === 0} /><span /></label><span>{hasLoadedWishes ? `${filteredWishes.length} ${filteredWishes.length === 1 ? "message" : "messages"}` : "Inbox"}</span>{selectedVisibleCount > 0 && <small>{selectedVisibleCount} on screen selected</small>}</div>

        {!hasLoadedWishes && loadingWishes ? <div className="admin-skeletons" aria-label="Loading inbox"><span /><span /><span /></div> : !hasLoadedWishes ? <div className="admin-empty"><span className="admin-empty__mark">✦</span><h3>Your inbox is getting ready</h3><p>We’re loading your private guestbook.</p></div> : filteredWishes.length === 0 ? <div className="admin-empty"><span className="admin-empty__mark">{searchTerm ? "⌕" : "✦"}</span><h3>{searchTerm ? "No matches found" : activeTab === "all" ? "No wishes have arrived yet" : `No ${tabLabels[activeTab].toLowerCase()} messages`}</h3><p>{searchTerm ? "Try a different name or phrase." : "Guest messages will appear here as they come in."}</p>{searchTerm && <button className="admin-empty__action" type="button" onClick={() => setSearchTerm("")}>Clear search</button>}</div> : <div className="admin-wish-list">{filteredWishes.map((wish) => { const isUpdating = updatingIds.includes(wish.id); return <article className={`admin-wish admin-wish--${wish.status}`} key={wish.id} role="button" tabIndex={0} onClick={(event) => { const target = event.target as HTMLElement; if (!target.closest("button, input, label, a")) setActiveWish(wish); }} onKeyDown={(event) => { if ((event.key === "Enter" || event.key === " ") && event.target === event.currentTarget) { event.preventDefault(); setActiveWish(wish); } }} aria-label={`Open message from ${wish.sender_name}`}><label className="admin-check admin-wish__check"><input type="checkbox" checked={selectedIds.includes(wish.id)} onChange={() => toggleSelection(wish.id)} /><span /></label><div className="admin-wish__avatar">{getInitials(wish.sender_name)}</div><div className="admin-wish__content"><div className="admin-wish__meta"><div><strong>{wish.sender_name}</strong><span className={`admin-status admin-status--${wish.status}`}>{statusLabels[wish.status]}</span></div><time dateTime={wish.created_at}>{formatWishDate(wish.created_at)}</time></div><p>{wish.message}</p><div className="admin-wish__footer"><div className="admin-wish__actions">{wish.status !== "read" && <button type="button" onClick={() => void updateWishes([wish.id], "read")} disabled={isUpdating}>{isUpdating ? "Updating…" : "Mark read"}</button>}{wish.status === "read" && <button type="button" onClick={() => void updateWishes([wish.id], "unread")} disabled={isUpdating}>{isUpdating ? "Updating…" : "Mark unread"}</button>}{wish.status === "archived" ? <button type="button" onClick={() => void updateWishes([wish.id], "read")} disabled={isUpdating}>Restore</button> : <button type="button" onClick={() => void updateWishes([wish.id], "archived")} disabled={isUpdating}>Archive</button>}</div></div></div></article>; })}</div>}
      </section>
      <footer className="admin-footer"><span>Farah &amp; Karim · Private guestbook</span><span>Only the admin can see these messages</span></footer>
    </div>
    {activeWish && <div className="admin-modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setActiveWish(null); }}><section className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="wish-modal-title"><div className="admin-modal__topline"><span>Private wish</span><button className="admin-modal__close" type="button" onClick={() => setActiveWish(null)} aria-label="Close message">×</button></div><div className="admin-modal__identity"><div className="admin-wish__avatar">{getInitials(activeWish.sender_name)}</div><div><p className="eyebrow">A message from</p><h2 id="wish-modal-title">{activeWish.sender_name}</h2></div></div><div className="admin-modal__meta"><span className={`admin-status admin-status--${activeWish.status}`}>{statusLabels[activeWish.status]}</span><time dateTime={activeWish.created_at}>{formatWishDate(activeWish.created_at)}</time></div><blockquote>{activeWish.message}</blockquote><div className="admin-modal__footer"><span>Farah &amp; Karim · Guestbook</span><div className="admin-wish__actions">{activeWish.status !== "read" && <button type="button" onClick={() => void updateWishes([activeWish.id], "read")} disabled={updatingIds.includes(activeWish.id)}>Mark read</button>}{activeWish.status === "read" && <button type="button" onClick={() => void updateWishes([activeWish.id], "unread")} disabled={updatingIds.includes(activeWish.id)}>Mark unread</button>}{activeWish.status === "archived" ? <button type="button" onClick={() => void updateWishes([activeWish.id], "read")} disabled={updatingIds.includes(activeWish.id)}>Restore</button> : <button type="button" onClick={() => void updateWishes([activeWish.id], "archived")} disabled={updatingIds.includes(activeWish.id)}>Archive</button>}</div></div></section></div>}
  </main>;
}
