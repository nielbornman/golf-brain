"use client";

import { useState } from "react";
import Section from "@/components/marketing/Section";
import Card from "@/components/marketing/Card";

async function postContact(name: string, email: string, message: string) {
  const res = await fetch("/api/contact", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, message }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "Failed to send");
  }
}

export default function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; msg: string } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus(null);

    const n = name.trim();
    const em = email.trim().toLowerCase();
    const m = message.trim();

    if (n.length < 2) return setStatus({ ok: false, msg: "Please enter your name." });
    if (!em.includes("@")) return setStatus({ ok: false, msg: "Please enter a valid email." });
    if (m.length < 5) return setStatus({ ok: false, msg: "Please enter a message." });

    try {
      setLoading(true);
      await postContact(n, em, m);
      setStatus({ ok: true, msg: "Message sent. We’ll get back to you." });
      setName("");
      setEmail("");
      setMessage("");
    } catch (err: any) {
      setStatus({ ok: false, msg: err?.message ?? "Failed to send" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Contact</h1>
      <p className="mt-2 text-slate-700">
        Questions, partnerships, or coach / academy interest — send a note.
      </p>

      <Section title="Send a message" subtitle="We store your message to respond. No spam.">
        <Card>
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 text-sm"
              autoComplete="name"
            />

            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full rounded-2xl border border-slate-200/70 bg-slate-50/60 px-4 py-3 text-sm"
              type="email"
              inputMode="email"
              autoComplete="email"
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Message"
              className="h-40 w-full resize-none rounded-2xl border border-slate-200/70 bg-white px-4 py-3 text-sm"
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-emerald-600 px-4 py-4 text-base font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-60"
            >
              {loading ? "Sending…" : "Send message"}
            </button>

            {status ? (
              <p className={`text-sm ${status.ok ? "text-slate-800" : "text-slate-700"}`}>
                {status.msg}
              </p>
            ) : null}
          </form>
        </Card>
      </Section>
    </div>
  );
}