import { PublicPageLayout } from "../layouts/PublicPageLayout";

const sections = [
  {
    title: "What StackForge stores",
    body:
      "StackForge stores the account details and product data needed to run the app, including email address, profile metadata, projects, cards, notes, notifications, and settings."
  },
  {
    title: "Public sharing",
    body:
      "If you enable public project sharing, the project data exposed by that link becomes visible to anyone with the URL. Keep that in mind before sharing internal work."
  },
  {
    title: "Admin messages",
    body:
      "Messages sent through the report form are stored for site administration, bug triage, and direct replies from the website developer."
  },
  {
    title: "Security",
    body:
      "Reasonable steps are taken to protect stored data, but no hosted system can promise absolute security. Use strong passwords and avoid sharing sensitive secrets in project content."
  },
  {
    title: "Questions",
    body:
      "Use the footer report form if you want to ask how your data is handled or request follow-up from the site administrator."
  }
] as const;

export const PrivacyPage = () => {
  return (
    <PublicPageLayout
      eyebrow="Privacy"
      title="Privacy policy"
      description="A plain-language summary of what data the product stores and how site-admin messages are used."
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