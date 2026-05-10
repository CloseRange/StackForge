import { PublicPageLayout } from "../layouts/PublicPageLayout";

const sections = [
  {
    title: "Acceptance",
    body:
      "By using StackForge, you agree to use the service lawfully, keep your account information accurate, and avoid interfering with the platform or other users."
  },
  {
    title: "Accounts and access",
    body:
      "You are responsible for activity that occurs under your account. Keep your credentials secure and notify the site admin if you suspect unauthorized use."
  },
  {
    title: "Project content",
    body:
      "You retain responsibility for the data you add to StackForge, including project names, cards, notes, and shared public links. Do not upload unlawful, abusive, or infringing content."
  },
  {
    title: "Availability",
    body:
      "StackForge may change features, APIs, and availability over time. The service is provided on an as-available basis while the product continues to evolve."
  },
  {
    title: "Contact",
    body:
      "If you need help with these terms, use the report form linked in the footer so your message reaches the site administrator directly."
  }
] as const;

export const TermsPage = () => {
  return (
    <PublicPageLayout
      eyebrow="Terms"
      title="Terms and conditions"
      description="A concise operating baseline for using StackForge while the product is still evolving."
    >
      <div className="space-y-6">
        {sections.map((section) => (
          <section key={section.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-3 leading-7 text-slate-300">{section.body}</p>
          </section>
        ))}
      </div>
    </PublicPageLayout>
  );
};