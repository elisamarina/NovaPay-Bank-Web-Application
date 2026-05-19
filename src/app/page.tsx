import Image from "next/image";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  ArrowUpRight,
  Banknote,
  Gauge,
  Landmark,
  Layers3,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  WalletCards,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";

const features = [
  {
    icon: Landmark,
    title: "Connected banking",
    text: "Link bank accounts and see balances from one clean dashboard.",
  },
  {
    icon: Banknote,
    title: "Payments flow",
    text: "Prepare transfers and track the money movement experience end to end.",
  },
  {
    icon: TrendingUp,
    title: "Staking ready",
    text: "A dedicated product lane for future EVM vault-based yield features.",
  },
];

const metrics = [
  { value: "3", label: "Core money views" },
  { value: "24/7", label: "Dashboard access" },
  { value: "EVM", label: "Staking direction" },
];

const workflow = [
  {
    step: "01",
    title: "Connect",
    text: "Start with account linking so NovaPay can organize balances and surface the financial picture that matters first.",
  },
  {
    step: "02",
    title: "Understand",
    text: "Move through balances, bank cards, transfers, and transaction history without jumping between disconnected tools.",
  },
  {
    step: "03",
    title: "Expand",
    text: "When the staking layer lands, the app can introduce vault positions next to the same financial dashboard.",
  },
];

const securityNotes = [
  {
    icon: ShieldCheck,
    title: "Account-first access",
    text: "The dashboard remains behind authentication, while the marketing page stays public and fast.",
  },
  {
    icon: LockKeyhole,
    title: "Clear trust boundary",
    text: "Banking, payments, and future staking can be separated into explicit flows instead of hidden side effects.",
  },
  {
    icon: Layers3,
    title: "Modular growth",
    text: "The staking route can evolve later into wallet connection, vault discovery, and position management.",
  },
];

const LandingPage = () => {
  return (
    <main className="landing-page">
      <nav className="landing-nav">
        <Link href="/" className="landing-brand">
          <Image src="/icons/logo.svg" alt="NovaPay logo" width={36} height={36} />
          <span>NovaPay</span>
        </Link>

        <div className="landing-nav-actions">
          <ThemeToggle />
          <Link href="/sign-in" className="landing-link">
            Sign in
          </Link>
          <Link href="/sign-up" className="landing-nav-cta">
            Get started
          </Link>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-ambient-grid" />
        <div className="landing-motion-rail" aria-hidden="true">
          <span>Banking dashboard</span>
          <span>Payments</span>
          <span>Vault preview</span>
          <span>Secure sessions</span>
        </div>
        <div className="landing-dashboard-scene" aria-hidden="true">
          <div className="landing-window">
            <div className="landing-window-top">
              <span />
              <span />
              <span />
            </div>
            <div className="landing-window-body">
              <div className="landing-balance-preview">
                <p>Total balance</p>
                <strong>$12,508.42</strong>
                <div>
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
              <div className="landing-card-preview">
                <p>NovaPay Vault</p>
                <strong>8.4% APY</strong>
                <span>Staking preview</span>
              </div>
              <div className="landing-list-preview">
                <span />
                <span />
                <span />
              </div>
              <div className="landing-floating-chip landing-floating-chip-one">
                <Activity size={16} />
                Live insight
              </div>
              <div className="landing-floating-chip landing-floating-chip-two">
                <Gauge size={16} />
                Fast overview
              </div>
            </div>
          </div>
        </div>

        <div className="landing-hero-content">
          <p className="landing-eyebrow">
            <Sparkles size={16} />
            Banking now. EVM staking next.
          </p>
          <h1>NovaPay</h1>
          <p className="landing-hero-copy">
            A modern finance dashboard for connected bank accounts, payments,
            transaction clarity, and a future on-chain staking layer. NovaPay is
            meant to feel calm enough for daily money checks, but ambitious
            enough to grow into vault-based DeFi when the product is ready.
          </p>
          <p className="landing-hero-subcopy">
            Start with the essentials: see accounts, understand cash movement,
            and enter the app without fighting clutter. The staking lane stays
            visible as a product promise, not a half-wired feature.
          </p>
          <div className="landing-hero-actions">
            <Link href="/sign-up" className="landing-primary-cta">
              Create account
              <ArrowRight size={18} />
            </Link>
            <Link href="/sign-in" className="landing-secondary-cta">
              Enter app
            </Link>
          </div>
          <div className="landing-metrics">
            {metrics.map((metric) => (
              <div key={metric.label}>
                <strong>{metric.value}</strong>
                <span>{metric.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section-header">
          <p className="landing-eyebrow">Product surface</p>
          <h2>Everything important, without financial noise.</h2>
        </div>
        <div className="landing-feature-grid">
          {features.map((feature) => {
            const Icon = feature.icon;

            return (
              <article className="landing-feature" key={feature.title}>
                <Icon size={22} />
                <h3>{feature.title}</h3>
                <p>{feature.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section landing-flow-section">
        <div className="landing-section-header">
          <p className="landing-eyebrow">How it works</p>
          <h2>A simple path from bank visibility to future staking.</h2>
        </div>
        <div className="landing-flow-grid">
          {workflow.map((item) => (
            <article className="landing-flow-card" key={item.step}>
              <span>{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-security-section">
        <div className="landing-section-header">
          <p className="landing-eyebrow">Trust model</p>
          <h2>Designed so new finance features have room to be built properly.</h2>
        </div>
        <div className="landing-security-grid">
          {securityNotes.map((note) => {
            const Icon = note.icon;

            return (
              <article className="landing-security-card" key={note.title}>
                <Icon size={22} />
                <div>
                  <h3>{note.title}</h3>
                  <p>{note.text}</p>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="landing-section landing-staking-strip">
        <div>
          <p className="landing-eyebrow">Architecture direction</p>
          <h2>Built to grow from banking into vault-based staking.</h2>
          <p className="landing-strip-copy">
            The first staking version should be conservative: one supported
            asset, one vault strategy, explicit risk copy, and no automated
            compounding until accounting is tested properly.
          </p>
        </div>
        <div className="landing-strip-items">
          <span>
            <WalletCards size={18} />
            ERC-4626 vault path
          </span>
          <span>
            <LockKeyhole size={18} />
            Role-based controls
          </span>
          <span>
            <TrendingUp size={18} />
            Reward accounting later
          </span>
        </div>
      </section>

      <section className="landing-final-cta">
        <p className="landing-eyebrow">Ready when you are</p>
        <h2>Enter NovaPay and keep building the finance layer step by step.</h2>
        <Link href="/sign-up" className="landing-primary-cta">
          Start with NovaPay
          <ArrowUpRight size={18} />
        </Link>
      </section>

      <footer className="landing-footer">
        <div className="landing-footer-brand">
          <Link href="/" className="landing-brand">
            <Image src="/icons/logo.svg" alt="NovaPay logo" width={36} height={36} />
            <span>NovaPay</span>
          </Link>
          <p>
            A finance dashboard for connected banking today and a measured path
            toward EVM staking tomorrow.
          </p>
        </div>

        <div className="landing-footer-links">
          <div>
            <h3>Product</h3>
            <Link href="/sign-in">Dashboard</Link>
            <Link href="/sign-up">Create account</Link>
            <Link href="/staking">Staking preview</Link>
          </div>
          <div>
            <h3>Company</h3>
            <Link href="/">About</Link>
            <Link href="/">Roadmap</Link>
            <Link href="/">Contact</Link>
          </div>
          <div>
            <h3>Legal</h3>
            <Link href="/">Privacy</Link>
            <Link href="/">Terms</Link>
            <Link href="/">Security</Link>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <p>© 2026 NovaPay. All rights reserved.</p>
          <p>Banking interface first. On-chain vaults later.</p>
        </div>
      </footer>
    </main>
  );
};

export default LandingPage;
