import Link from "next/link";
import {
  Sparkles,
  MessageSquare,
  Palette,
  Swords,
  Wand2,
  Image as ImageIcon,
  FolderOpen,
  ShieldCheck,
  Zap,
  Check,
  ArrowRight,
  Crown,
  Mail,
} from "lucide-react";
import { PLANS } from "@/lib/plans";
import { SITE } from "@/lib/site";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

export default function Home() {
  const features = [
    { icon: MessageSquare, title: "AI Chat", desc: "Chat with every leading model and switch instantly.", color: "from-fuchsia-500 to-pink-500" },
    { icon: Swords, title: "Chat Arena", desc: "Two models answer at once — compare side by side.", color: "from-violet-500 to-indigo-500" },
    { icon: Palette, title: "Image Studio", desc: "Turn a sentence into a stunning image.", color: "from-amber-500 to-orange-500" },
    { icon: Wand2, title: "Image Enhance", desc: "Upscale, sharpen and clean up any photo.", color: "from-purple-500 to-violet-500" },
    { icon: ImageIcon, title: "BG Removal", desc: "Remove backgrounds in a single click.", color: "from-rose-500 to-red-500" },
    { icon: FolderOpen, title: "Smart Library", desc: "Every creation saved and organised for 30 days.", color: "from-emerald-500 to-teal-500" },
  ];

  return (
    <div className="aurora-field min-h-screen overflow-hidden">
      {/* Nav */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-500 text-white shadow-lg shadow-violet-500/30 animate-float">
            <Sparkles className="h-5 w-5" />
          </span>
          <span className="text-xl font-extrabold gradient-text">{SITE.name}</span>
        </Link>
        <nav className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/login"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-accent"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition hover:opacity-90"
          >
            Get started <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-4xl px-5 pb-16 pt-10 text-center sm:pt-16">
        <div className="aurora-blob -left-20 top-0 h-72 w-72 bg-violet-500/40" />
        <div className="aurora-blob -right-16 top-10 h-72 w-72 bg-cyan-400/30" />

        <span className="relative z-10 inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-white/60 px-4 py-1.5 text-xs font-semibold text-violet-700 shadow-sm backdrop-blur dark:bg-white/10 dark:text-violet-200">
          <Zap className="h-3.5 w-3.5" /> One studio · Every AI tool
        </span>

        <h1 className="relative z-10 mt-6 text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">
          Create, chat and <span className="gradient-text">imagine</span>
          <br />
          with AI that just works.
        </h1>

        <p className="relative z-10 mx-auto mt-5 max-w-2xl text-base text-muted-foreground sm:text-lg">
          {SITE.description} Start free with BDT 0 — no card required.
        </p>

        <div className="relative z-10 mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white shadow-xl shadow-violet-500/30 transition hover:scale-105"
          >
            Start for free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background/70 px-6 py-3 text-sm font-semibold backdrop-blur transition hover:bg-accent"
          >
            I already have an account
          </Link>
        </div>

        <div className="relative z-10 mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Email verification &amp; human check</span>
          <span className="inline-flex items-center gap-1.5"><Zap className="h-3.5 w-3.5 text-amber-500" /> Instant setup with Google</span>
        </div>
      </section>

      {/* Features */}
      <section className="relative mx-auto max-w-6xl px-5 py-10">
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
          Everything you need, <span className="gradient-text">in one place</span>
        </h2>
        <div className="stagger mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="lift rounded-2xl border border-border bg-card/80 p-6 backdrop-blur">
                <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${feature.color} text-white shadow-md`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-semibold">{feature.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pricing */}
      <section className="relative mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center text-2xl font-extrabold sm:text-3xl">
          Simple <span className="gradient-text">pricing</span>
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">Start free. Upgrade whenever you need more.</p>

        <div className="stagger mt-10 grid gap-5 sm:grid-cols-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-6 backdrop-blur transition-all hover:-translate-y-1"
            >
              <div className={`absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r ${plan.gradient}`} />
              {plan.popular && (
                <span className="absolute right-5 top-5 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                  <Sparkles className="h-3 w-3" /> Popular
                </span>
              )}
              <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br ${plan.gradient} text-white shadow-md`}>
                {plan.id === "studio" ? <Crown className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}
              </div>
              <h3 className="text-lg font-bold">{plan.name}</h3>
              <p className="mt-1 text-2xl font-extrabold">{plan.priceLabel}</p>
              <p className="mt-2 text-xs text-muted-foreground">{plan.blurb}</p>
              <ul className="mt-5 space-y-2">
                {plan.features.slice(0, 4).map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link
                href="/register"
                className={`mt-6 block rounded-xl bg-gradient-to-r ${plan.gradient} px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg transition hover:opacity-90`}
              >
                Get started
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative mx-auto max-w-6xl border-t border-border px-5 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white">
              <Sparkles className="h-3.5 w-3.5" />
            </span>
            <span className="gradient-text">{SITE.name}</span>
          </div>
          <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Mail className="h-3.5 w-3.5" />
            Support:{" "}
            <a href={`mailto:${SITE.supportEmail}`} className="font-semibold text-violet-500 hover:underline">
              {SITE.supportEmail}
            </a>
          </p>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} {SITE.name}</p>
        </div>
      </footer>
    </div>
  );
}
