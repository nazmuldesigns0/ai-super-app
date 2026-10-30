import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import { SITE } from "@/lib/site";

export const metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses and protects your information.`,
};

const h2 = "mt-10 text-lg font-bold tracking-tight";
const p = "mt-3 text-sm leading-7 text-muted-foreground";
const ul = "mt-3 list-disc space-y-2 pl-5 text-sm leading-7 text-muted-foreground";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Privacy Policy</h1>
        <p className="mt-2 text-sm text-muted-foreground">Last updated: 30 October 2026</p>

        <p className={p}>
          {SITE.name} is a creative AI studio. This Privacy Policy explains what information we
          collect when you use the app, how we use it, and the choices you have. By using{" "}
          {SITE.name} you agree to the practices described here.
        </p>

        <section>
          <h2 className={h2}>1. Information we collect</h2>
          <p className={p}>
            We collect only what is needed to run your account and deliver the features you use:
          </p>
          <ul className={ul}>
            <li>
              <strong className="font-semibold text-foreground">Account information.</strong> When
              you create an account we store your email address and display name. If you sign in
              with Google, we also receive your Google profile photo. This account data is held in
              Google Firebase Authentication.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Your content.</strong> Chat messages
              and chat sessions, images you generate or edit, files you upload, and your saved
              master prompts are stored in Google Cloud Firestore and Firebase Storage, tied to your
              account.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Session token.</strong> A session
              token is kept in your browser&apos;s localStorage so you stay signed in between
              visits. It is not a third-party tracking cookie.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Usage data.</strong> We record basic
              usage such as credit and rate-limit counters to enforce free-plan limits and keep the
              service fair and secure.
            </li>
          </ul>
        </section>

        <section>
          <h2 className={h2}>2. How we use your information</h2>
          <ul className={ul}>
            <li>To create, verify and secure your account.</li>
            <li>To send verification and service emails.</li>
            <li>
              To provide AI chat, image generation, image editing and the other creative media
              tools.
            </li>
            <li>
              To respond to support requests sent to{" "}
              <a
                href={`mailto:${SITE.supportEmail}`}
                className="font-semibold text-violet-500 hover:underline"
              >
                {SITE.supportEmail}
              </a>
              .
            </li>
            <li>To prevent abuse and enforce usage limits.</li>
          </ul>
        </section>

        <section>
          <h2 className={h2}>3. Third-party services</h2>
          <p className={p}>{SITE.name} relies on trusted providers to operate:</p>
          <ul className={ul}>
            <li>
              <strong className="font-semibold text-foreground">Google Firebase</strong>{" "}
              (Authentication, Cloud Firestore and Firebase Storage) for accounts, databases and
              file storage.
            </li>
            <li>
              <strong className="font-semibold text-foreground">Third-party AI providers</strong>{" "}
              which process your prompts and images only when you make a request, so that a result
              can be produced.
            </li>
          </ul>
          <p className={p}>
            These providers process data on our behalf and are governed by their own terms and
            privacy policies.
          </p>
        </section>

        <section>
          <h2 className={h2}>4. Uploads and retention</h2>
          <p className={p}>
            Uploads are limited to {SITE.maxUploadMb} MB per file. Items saved in your library are
            kept for {SITE.libraryRetentionDays} days, after which they are removed. You can delete
            your content at any time from within the app.
          </p>
        </section>

        <section>
          <h2 className={h2}>5. What we do not do</h2>
          <p className={p}>
            We do not sell your personal data. We do not run third-party advertising and we do not
            use third-party tracking cookies. The only thing we persist in your browser to keep you
            signed in is the session token described above.
          </p>
        </section>

        <section>
          <h2 className={h2}>6. Your rights and choices</h2>
          <p className={p}>
            You can delete your content directly from the app, and you can request access to or
            deletion of your account and associated data by emailing{" "}
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="font-semibold text-violet-500 hover:underline"
            >
              {SITE.supportEmail}
            </a>
            . We will action reasonable requests within a reasonable time.
          </p>
        </section>

        <section>
          <h2 className={h2}>7. Children</h2>
          <p className={p}>
            {SITE.name} is not intended for children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with personal
            data, please contact{" "}
            <a
              href={`mailto:${SITE.supportEmail}`}
              className="font-semibold text-violet-500 hover:underline"
            >
              {SITE.supportEmail}
            </a>{" "}
            and we will remove it.
          </p>
        </section>

        <section>
          <h2 className={h2}>8. Changes to this policy</h2>
          <p className={p}>
            We may update this Privacy Policy from time to time. When we do, we will revise the
            &quot;Last updated&quot; date above. Continued use of {SITE.name} after a change means
            you accept the updated policy.
          </p>
        </section>

        <section>
          <h2 className={h2}>9. Contact</h2>
          <p className={p}>
            Questions about this policy? Email{" "}
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
            <Link href="/terms" className="font-semibold text-violet-500 hover:underline">
              Terms of Service
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
