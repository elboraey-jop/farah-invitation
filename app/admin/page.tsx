"use client";

import { FormEvent, useEffect, useState } from "react";
import { createClient, type User } from "@supabase/supabase-js";

type Wish = { id: string; sender_name: string; message: string; status: string; created_at: string };

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [error, setError] = useState("");

  useEffect(() => { supabase?.auth.getUser().then(({ data }) => setUser(data.user)); }, []);

  async function login(event: FormEvent) {
    event.preventDefault();
    if (!supabase) { setError("Connect Supabase in .env.local first."); return; }
    const result = await supabase.auth.signInWithPassword({ email, password });
    if (result.error) setError(result.error.message);
    else setUser(result.data.user);
  }

  async function loadWishes() {
    const session = (await supabase?.auth.getSession())?.data.session;
    if (!session) return;
    const response = await fetch("/api/admin/wishes", { headers: { Authorization: `Bearer ${session.access_token}` } });
    const result = await response.json();
    if (response.ok) setWishes(result.wishes);
    else setError(result.error || "Unable to load wishes.");
  }

  async function markRead(id: string) {
    const session = (await supabase?.auth.getSession())?.data.session;
    if (!session) return;
    await fetch("/api/admin/wishes", { method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` }, body: JSON.stringify({ id, status: "read" }) });
    await loadWishes();
  }

  if (!user) return <main className="admin-shell"><form className="admin-login" onSubmit={login}><p className="eyebrow">Private inbox</p><h1>Admin messages</h1><p>Sign in to read the private wedding wishes.</p><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Admin email" /><input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" /><button className="button button--primary">Sign in</button>{error && <p className="form-status form-status--error">{error}</p>}</form></main>;

  return <main className="admin-shell"><div className="admin-panel"><div className="admin-panel__header"><div><p className="eyebrow">Farah &amp; Karim</p><h1>Private wishes</h1></div><button className="button button--outline" onClick={loadWishes}>Refresh</button></div><p className="section-copy">These messages are never shown on the public invitation.</p>{wishes.length === 0 ? <p className="empty-state">Click Refresh to load the inbox.</p> : <div className="wish-list">{wishes.map((wish) => <article className={`wish-item wish-item--${wish.status}`} key={wish.id}><div><strong>{wish.sender_name}</strong><time>{new Date(wish.created_at).toLocaleString()}</time></div><p>{wish.message}</p>{wish.status === "unread" && <button className="text-button" onClick={() => markRead(wish.id)}>Mark as read</button>}</article>)}</div>}</div></main>;
}
