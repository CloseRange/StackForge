import { useEffect, useState, type FormEvent } from "react";

import { Button } from "../components/ui/Button";
import { useAuth } from "../hooks/useAuth";
import { PublicPageLayout } from "../layouts/PublicPageLayout";
import { publicContentService } from "../services/publicContentService";
import type { AdminMessageType } from "../types/api";

const messageTypeOptions: Array<{ value: AdminMessageType; label: string }> = [
  { value: "bug_report", label: "Bug report" },
  { value: "support", label: "Support request" },
  { value: "feedback", label: "Product feedback" },
  { value: "general", label: "General message" }
];

export const ReportBugPage = () => {
  const { isAuthenticated, token, user } = useAuth();
  const [messageType, setMessageType] = useState<AdminMessageType>("bug_report");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      return;
    }

    setName((current) => current || user.displayName || "");
    setEmail((current) => current || user.email || "");
  }, [isAuthenticated, user]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      await publicContentService.createAdminMessage(
        {
          messageType,
          name,
          email,
          subject,
          message,
          pageUrl: window.location.href,
          userAgent: navigator.userAgent
        },
        token
      );

      setIsSubmitted(true);
      setSubject("");
      setMessage("");
      setMessageType("bug_report");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to submit your message");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicPageLayout
      eyebrow="Support"
      title="Report a bug or message the site admin"
      description="This form stores messages in the admin_messages table so bug reports, feedback, and direct site questions all land in one place."
    >
      <div className="grid gap-5 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <h2 className="text-xl font-semibold text-white">What this form is for</h2>
          <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
            <p>Use it for reproducible bugs, support issues, product feedback, or a direct note to the website developer.</p>
            <p>If you are signed in, your account is attached automatically so follow-up is easier.</p>
            <p>If you are not signed in, include an email address so you can be contacted back.</p>
          </div>
          <div className="mt-6 rounded-2xl border border-sky-300/20 bg-sky-400/10 p-4 text-sm text-sky-100">
            {isAuthenticated && user ? `Signed in as ${user.email}.` : "You can submit this form without an account."}
          </div>
          {isSubmitted ? (
            <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
              Your message was submitted to the site admin.
            </div>
          ) : null}
        </section>

        <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <label className="block text-sm text-slate-300">
            Message type
            <select
              value={messageType}
              onChange={(event) => setMessageType(event.target.value as AdminMessageType)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none"
            >
              {messageTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm text-slate-300">
              Name
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                placeholder="Your name"
              />
            </label>
            <label className="block text-sm text-slate-300">
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
                placeholder="you@example.com"
              />
            </label>
          </div>

          <label className="block text-sm text-slate-300">
            Subject
            <input
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              placeholder="Short summary"
              required
              minLength={3}
            />
          </label>

          <label className="block text-sm text-slate-300">
            Message
            <textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              className="mt-2 min-h-48 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
              placeholder="What happened, what you expected, and how to reproduce it."
              required
              minLength={10}
            />
          </label>

          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Send message"}
          </Button>
        </form>
      </div>
    </PublicPageLayout>
  );
};