import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ScanFace,
  Bell,
  Gauge,
  ShieldCheck,
  Eye,
  Camera,
  Activity,
  BarChart3,
  ChevronDown,
  Check,
  ArrowRight,
} from 'lucide-react';
import { Logo } from '@/components/common/Logo';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const features = [
  { icon: ScanFace, title: 'Real-time Face Mesh', desc: '478 facial landmarks tracked per frame with GPU-accelerated MediaPipe — entirely in your browser.' },
  { icon: Eye, title: 'Eye Aspect Ratio', desc: 'Precise EAR computation classifies open, blink, closed and sleep states with a configurable threshold.' },
  { icon: Bell, title: 'Instant Alarm', desc: 'A loud, escalating alarm fires the moment your eyes stay closed past your chosen delay.' },
  { icon: ShieldCheck, title: 'Privacy First', desc: 'Video never leaves your device. Only anonymous event metrics are stored for your analytics.' },
  { icon: Gauge, title: 'Live Metrics & FPS', desc: 'Watch EAR, eye state, closed-eye timer and frame rate update in real time.' },
  { icon: BarChart3, title: 'Rich Analytics', desc: 'Daily, weekly and monthly trends with interactive charts and detection history.' },
];

const steps = [
  { icon: Camera, title: 'Grant camera access', desc: 'Your webcam feed is processed locally — nothing is uploaded.' },
  { icon: Activity, title: 'AI tracks your eyes', desc: 'MediaPipe computes the Eye Aspect Ratio on every frame.' },
  { icon: Bell, title: 'Get alerted instantly', desc: 'Eyes closed too long? A loud alarm wakes you up immediately.' },
];

const faqs = [
  { q: 'Does my video get uploaded anywhere?', a: 'No. All computer-vision inference runs in your browser via MediaPipe. Only aggregated metrics (duration, average EAR, blink count) are saved to power your analytics.' },
  { q: 'How accurate is the detection?', a: 'It uses the well-established Eye Aspect Ratio method on 478 facial landmarks. You can fine-tune the threshold and alarm delay in settings for your face and lighting.' },
  { q: 'What hardware do I need?', a: 'Any device with a webcam and a modern browser (Chrome, Edge, Firefox, Safari). A GPU improves frame rate but is not required.' },
  { q: 'Can I use it while driving?', a: 'It is a helpful assistant, not a substitute for rest. Never rely solely on software for safety-critical situations.' },
];

const plans = [
  { name: 'Free', price: '$0', period: '/mo', features: ['Real-time detection', 'Adjustable threshold', '7-day history', 'Community support'], cta: 'Get started', highlight: false },
  { name: 'Pro', price: '$9', period: '/mo', features: ['Everything in Free', 'Unlimited history', 'Advanced analytics', 'Multiple alarm sounds', 'Priority support'], cta: 'Start Pro trial', highlight: true },
  { name: 'Team', price: '$29', period: '/mo', features: ['Everything in Pro', 'Up to 10 members', 'Shared dashboards', 'Admin controls'], cta: 'Contact sales', highlight: false },
];

function Section({ id, children, className = '' }: { id?: string; children: React.ReactNode; className?: string }) {
  return (
    <section id={id} className={`mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </section>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const dashHref = user ? '/app' : '/register';

  return (
    <div className="min-h-screen bg-white dark:bg-[#0b1120]">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/70 backdrop-blur-xl dark:border-white/10 dark:bg-[#0b1120]/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" aria-label="Home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 dark:text-slate-300 md:flex">
            <a href="#features" className="hover:text-brand-500">Features</a>
            <a href="#how" className="hover:text-brand-500">How it works</a>
            <a href="#pricing" className="hover:text-brand-500">Pricing</a>
            <a href="#faq" className="hover:text-brand-500">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to={dashHref}>
              <Button size="sm">{user ? 'Dashboard' : 'Get started'}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <Section className="relative overflow-hidden text-center">
        <div className="pointer-events-none absolute inset-0 bg-grid-glow" />
        <motion.div
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12 } } }}
          className="relative z-10 mx-auto max-w-3xl"
        >
          <motion.div variants={fadeUp} className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-brand-600 dark:text-brand-300">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-500" />
            </span>
            AI Computer Vision · Runs 100% in your browser
          </motion.div>
          <motion.h1 variants={fadeUp} className="text-4xl font-black tracking-tight sm:text-6xl">
            Detect fatigue before it
            <span className="bg-gradient-to-r from-brand-400 to-brand-600 bg-clip-text text-transparent"> becomes dangerous</span>
          </motion.h1>
          <motion.p variants={fadeUp} className="mx-auto mt-6 max-w-xl text-lg text-slate-600 dark:text-slate-300">
            Sleep Alarm Detector uses your webcam and real-time AI to track your eyes,
            measure the Eye Aspect Ratio, and sound a loud alarm the instant drowsiness sets in.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link to={dashHref}>
              <Button size="lg" className="gap-2">
                Start detecting <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline">See how it works</Button>
            </a>
          </motion.div>
        </motion.div>

        {/* Hero mock */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="relative z-10 mx-auto mt-16 max-w-4xl"
        >
          <div className="rounded-3xl border border-slate-200 bg-white/60 p-3 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-white/5">
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { label: 'EAR', value: '0.31', sub: 'Eyes open', color: 'text-emerald-500' },
                { label: 'State', value: 'Awake', sub: 'Monitoring', color: 'text-brand-500' },
                { label: 'FPS', value: '30', sub: 'Real-time', color: 'text-slate-500' },
              ].map((m) => (
                <div key={m.label} className="rounded-2xl bg-slate-50 p-5 text-left dark:bg-white/5">
                  <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{m.label}</p>
                  <p className={`mt-1 text-3xl font-bold ${m.color}`}>{m.value}</p>
                  <p className="text-sm text-slate-500">{m.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </Section>

      {/* Features */}
      <Section id="features">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to stay alert</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">A complete detection pipeline, from landmarks to alarm, built for accuracy and privacy.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="group rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:shadow-lg dark:border-white/10 dark:bg-white/[0.03]"
            >
              <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-brand-500/10 text-brand-500 transition group-hover:bg-brand-500 group-hover:text-white">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </Section>

      {/* How it works */}
      <Section id="how" className="rounded-3xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Three steps between you and a safer, more alert session.</p>
        </div>
        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-lg shadow-brand-600/30">
                <s.icon className="h-7 w-7" />
              </div>
              <div className="mt-2 text-sm font-semibold text-brand-500">Step {i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* Pricing */}
      <Section id="pricing">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple, transparent pricing</h2>
          <p className="mt-4 text-slate-600 dark:text-slate-300">Start free. Upgrade when you need more. (Demo pricing.)</p>
        </div>
        <div className="mt-14 grid gap-6 lg:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative rounded-3xl border p-8 ${
                p.highlight
                  ? 'border-brand-500 bg-brand-500/[0.04] shadow-xl shadow-brand-600/10'
                  : 'border-slate-200 bg-white dark:border-white/10 dark:bg-white/[0.03]'
              }`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-600 px-3 py-1 text-xs font-semibold text-white">
                  Most popular
                </div>
              )}
              <h3 className="text-lg font-semibold">{p.name}</h3>
              <div className="mt-4 flex items-baseline gap-1">
                <span className="text-4xl font-black">{p.price}</span>
                <span className="text-slate-500">{p.period}</span>
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {p.features.map((feat) => (
                  <li key={feat} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-brand-500" /> {feat}
                  </li>
                ))}
              </ul>
              <Link to={dashHref} className="mt-8 block">
                <Button className="w-full" variant={p.highlight ? 'primary' : 'outline'}>{p.cta}</Button>
              </Link>
            </div>
          ))}
        </div>
      </Section>

      {/* FAQ */}
      <Section id="faq">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Frequently asked questions</h2>
          </div>
          <div className="mt-10 space-y-3">
            {faqs.map((f, i) => (
              <div key={f.q} className="rounded-2xl border border-slate-200 dark:border-white/10">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left font-medium"
                >
                  {f.q}
                  <ChevronDown className={`h-5 w-5 transition ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <p className="px-5 pb-5 text-sm text-slate-600 dark:text-slate-400">{f.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* Contact / CTA */}
      <Section id="contact">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-800 px-8 py-16 text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to stay alert?</h2>
          <p className="mx-auto mt-3 max-w-xl text-brand-100">
            Create a free account and run your first detection session in under a minute.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to={dashHref}>
              <Button size="lg" className="bg-white text-brand-700 hover:bg-brand-50">Get started free</Button>
            </Link>
            <a href="mailto:hello@sleepalarm.app">
              <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">Contact us</Button>
            </a>
          </div>
        </div>
      </Section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
          <Logo />
          <p className="text-sm text-slate-500">© {new Date().getFullYear()} Sleep Alarm Detector. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
