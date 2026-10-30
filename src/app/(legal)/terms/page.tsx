import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Terms of Service",
  description: `The terms that govern your use of ${SITE.name}.`,
};

const h2 = "mt-10 text-lg font-bold tracking-tight";
const p = "mt-3 text-sm leading-7 text-muted-foreground";
const ul = "mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4">
          <Link href="/" className="flex items-center gap-2 text-base font-extrabold">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
            <span className="gradient-text">{SITE.name}</span>
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-12">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Terms of Service</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 30 October 2026</p>

        <p className={p}>
          These Terms of Service govern your use of {SITE.name}. By creating an account or using the
          app, you agree to these terms. If you do not agree, please do not use {SITE.name}.
        </p>

        <section>
          <h2 className={h2}>1. The service</h2>
          <p className={p}>
            {SITE.name} is a free creative AI studio offering chat, image generation, image editing
            and related media tools. The service is provided at no cost.
          </p>
        </section>

        <section>
          <h2 className={h2}>2. Your account</h2>
          <p className={p}>
            You are responsible for keeping your login credentials secure and for all activity under
            your account. Please provide accurate information and keep it up to date.
          </p>
        </section>

        <section>
          <h2 className={h2}>3. Acceptable use</h2>
          <p className={p}>You agree not to use {SITE.name} to:</p>
          <ul className={ul}>
            <li>create, upload or share illegal, harmful, infringing or abusive content;</li>
            <li>
              attempt to bypass rate limits, credit systems or any other usage limits;
            </li>
            <li>
              attack, overload, probe or otherwise disrupt the service or its infrastructure;
            </li>
            <li>violate the rights of others or any applicable law.</li>
          </ul>
          <p className={p}>Accounts used for abuse may be suspended or terminated.</p>
        </section>

        <section>
          <h2 className={h2}>4. Your content</h2>
          <p className={p}>
            You keep ownership of the content you create or upload. To operate the features you ask
            for — such as generating or editing an image, or sending a prompt to a model provider —
            you grant {SITE.name} permission to process, store and transmit that content. You are
            responsible for ensuring you have the rights to the content you submit.
          </p>
        </section>

        <section>
          <h2 className={h2}>5. AI output</h2>
          <p className={p}>
            AI output can be inaccurate, incomplete or unexpected. It should not be relied on as
            professional, legal, medical or financial advice. We make no warranty about the accuracy
            or suitability of any output.
          </p>
        </section>

        <section>
          <h2 className={h2}>6. Availability</h2>
          <p className={p}>
            The service is provided &quot;as is&quot; and &quot;as available&quot;. Because it
            relies on third-party — often free-tier — AI and infrastructure providers, we cannot
            guarantee uptime, availability, or that any particular feature will always work.
          </p>
        </section>

        <section>
          <h2 className={h2}>7. Suspension and termination</h2>
          <p className={p}>
            We may suspend or terminate accounts that abuse the service, violate these terms, or put
            the service or other users at risk. You may stop using the service at any time.
          </p>
        </section>

        <section>
          <h2 className={h2}>8. Limitation of liability</h2>
          <p className={p}>
            To the maximum extent permitted by law, {SITE.name} is not liable for any indirect or
            consequential losses arising from your use of, or inability to use, the service.
          </p>
        </section>

        <section>
          <h2 className={h2}>9. Governing law</h2>
          <p className={p}>
            These terms are governed by the applicable laws of the operator&apos;s jurisdiction, and
            any dispute will be handled by the competent courts of that jurisdiction.
          </p>
        </section>

        <section>
          <h2 className={h2}>10. Changes to these terms</h2>
          <p className={p}>
            We may update these terms from time to time. When we do, we will revise the &quot;Last
            updated&quot; date above. Continued use of {SITE.name} after a change means you accept
            the updated terms.
          </p>
        </section>

        <section>
          <h2 className={h2}>11. Contact</h2>
          <p className={p}>
            Questions about these terms? Email{" "}
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="font-semibold text-violet-500 hover:underline"
            >
              {SITE.supportEmail}
            </a>
            .
          </p>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-3xl flex-col items-center justify-between gap-2 px-5 py-8 text-xs text-muted-foreground sm:flex-row">
          <span>
            © {new Date().getFullYear()} {SITE.name}
          </span>
          <span className="inline-flex gap-4">
            <Link href="/privacy" className="font-semibold text-violet-500 hover:underline">
              Privacy Policy
            </Link>
            <Link href="/" className="hover:underline">
              Home
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
