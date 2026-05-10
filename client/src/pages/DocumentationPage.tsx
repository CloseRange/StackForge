import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BookOpen, ExternalLink } from "lucide-react";

import { Button } from "../components/ui/Button";
import { PublicPageLayout } from "../layouts/PublicPageLayout";
import { publicContentService } from "../services/publicContentService";
import type { DocumentationPayload } from "../types/api";

export const DocumentationPage = () => {
  const [document, setDocument] = useState<DocumentationPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadReadme = async () => {
      try {
        const nextDocument = await publicContentService.getReadme();

        if (!isMounted) {
          return;
        }

        setDocument(nextDocument);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setError(loadError instanceof Error ? loadError.message : "Unable to load documentation");
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReadme();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <PublicPageLayout
      eyebrow="Documentation"
      title="README rendered in-app"
      description="The docs page pulls the root README through the public API so the product site stays aligned with the repo."
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
        <div className="flex items-center gap-3 text-sm text-slate-300">
          <BookOpen className="h-4 w-4 text-sky-300" />
          <span>Repository README</span>
        </div>
        <a href="https://github.com/CloseRange/StackForge" target="_blank" rel="noreferrer">
          <Button variant="outline" className="gap-2">
            Open on GitHub
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
      </div>

      {isLoading ? <p className="text-sm text-slate-400">Loading documentation...</p> : null}
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      {document ? (
        <article className="markdown-doc space-y-4 text-slate-200">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children }) => <h1 className="font-display text-4xl font-semibold text-white">{children}</h1>,
              h2: ({ children }) => <h2 className="mt-8 text-2xl font-semibold text-white">{children}</h2>,
              h3: ({ children }) => <h3 className="mt-6 text-xl font-semibold text-white">{children}</h3>,
              p: ({ children }) => <p className="leading-7 text-slate-300">{children}</p>,
              a: ({ children, href }) => (
                <a href={href} target="_blank" rel="noreferrer" className="text-sky-300 underline decoration-sky-400/40 underline-offset-4">
                  {children}
                </a>
              ),
              ul: ({ children }) => <ul className="list-disc space-y-2 pl-6 text-slate-300">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal space-y-2 pl-6 text-slate-300">{children}</ol>,
              li: ({ children }) => <li>{children}</li>,
              code: ({ children, className }) => (
                <code
                  className={
                    className
                      ? `${className} text-slate-200`
                      : "rounded bg-slate-800 px-1.5 py-0.5 text-sm text-sky-200"
                  }
                >
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="overflow-x-auto rounded-2xl bg-slate-950 px-4 py-4 text-sm text-slate-200">
                  {children}
                </pre>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-2 border-sky-300/50 pl-4 text-slate-400">{children}</blockquote>
              )
            }}
          >
            {document.markdown}
          </ReactMarkdown>
        </article>
      ) : null}
    </PublicPageLayout>
  );
};