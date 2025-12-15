import Link from "next/link";
import { ArrowRight, HeartPulse, ShieldCheck, Activity } from "lucide-react";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 font-sans">

      {/* Navbar */}
      <header className="px-6 h-16 flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          <HeartPulse className="h-6 w-6 text-red-500" />
          <span className="text-xl font-bold tracking-tight">Pharmabuddy</span>
        </div>
        <nav className="hidden md:flex gap-6 text-sm font-medium text-zinc-600 dark:text-zinc-400">
          <Link href="#features" className="hover:text-black dark:hover:text-white transition-colors">Features</Link>
          <Link href="#about" className="hover:text-black dark:hover:text-white transition-colors">About</Link>
        </nav>
        <Link
          href="/dashboard"
          className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-full text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all"
        >
          Open Dashboard
        </Link>
      </header>

      <main className="flex-1">

        {/* Hero Section */}
        <section className="py-20 px-6 text-center flex flex-col items-center">
          <div className="bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 px-3 py-1 rounded-full text-xs font-semibold mb-6 uppercase tracking-wider">
            Your Digital Health Companion
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight max-w-4xl mb-6 bg-clip-text text-transparent bg-gradient-to-b from-zinc-900 to-zinc-500 dark:from-white dark:to-zinc-500">
            Never miss a dose again.
          </h1>
          <p className="text-xl text-zinc-500 dark:text-zinc-400 max-w-2xl mb-10 leading-relaxed">
            Pharmabuddy keeps your health on track with intelligent medication reminders, WhatsApp integration, and automated caregiver alerts.
          </p>

          <div className="flex gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full text-lg font-medium transition-all shadow-lg shadow-red-500/20"
            >
              Get Started <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto grid md:grid-cols-3 gap-8">

          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/30 transition-colors">
            <Activity className="h-10 w-10 text-red-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Smart Reminders</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Receive timely nudges via WhatsApp. Confirm your dose with a simple reply.</p>
          </div>

          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/30 transition-colors">
            <ShieldCheck className="h-10 w-10 text-blue-500 mb-4" />
            <h3 className="text-xl font-bold mb-2">Caregiver Safety Net</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Missed a dose? We'll automatically escalate and notify your emergency contact.</p>
          </div>

          <div className="p-8 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 hover:border-red-500/30 transition-colors">
            <div className="h-10 w-10 mb-4 flex items-center justify-center bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 rounded-lg text-lg font-bold">W</div>
            <h3 className="text-xl font-bold mb-2">WhatsApp Integration</h3>
            <p className="text-zinc-500 dark:text-zinc-400">Interact naturally. Log doses, snooze reminders, and get health tips right in WhatsApp.</p>
          </div>

        </section>

      </main>

      <footer className="h-20 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-500 text-sm">
        © 2025 Pharmabuddy. Built for health.
      </footer>
    </div>
  );
}
