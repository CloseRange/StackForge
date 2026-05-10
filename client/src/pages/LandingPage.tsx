import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Zap, Layers3, TrendingUp, Sparkles, ArrowRight, CheckCircle2 } from "lucide-react";

import { PublicHeader } from "../components/header/PublicHeader";
import { Button } from "../components/ui/Button";

export const LandingPage = ({ initialSection = "hero" }: { initialSection?: "hero" | "features" }) => {
  const featuresSectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (initialSection !== "features") {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      featuresSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [initialSection]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <PublicHeader />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-20 sm:py-32 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        {/* Background gradient elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-40 -left-32 h-[600px] w-[600px] rounded-full bg-sky-600/15 blur-[120px]" />
          <div className="absolute -bottom-40 -right-32 h-[600px] w-[600px] rounded-full bg-amber-600/15 blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 h-[400px] w-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-cyan-600/10 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="rounded-full bg-sky-500/20 px-3 py-1 text-sm font-semibold text-sky-300">
              ✨ Campaign-Driven Project Management
            </span>
          </div>
          
          <h1 className="font-display text-5xl sm:text-7xl font-bold tracking-tight text-white leading-tight">
            Your projects as{" "}
            <span className="bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
              playable campaigns
            </span>
          </h1>
          
          <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-400">
            Move cards from deck to victory. Track progress through rarity and XP. Make project management feel like gaming — strategic, rewarding, and fun.
          </p>
          
          <div className="mt-10 flex flex-col sm:flex-row gap-4 items-center justify-center">
            <Link to="/register">
              <Button className="text-lg px-8 py-3 flex items-center gap-2">
                Get Started Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="text-lg px-8 py-3">
                Sign In
              </Button>
            </Link>
            <Link to="/demo">
              <Button variant="outline" className="text-lg px-8 py-3">
                Try Demo
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-slate-500">
            No credit card required. Start managing campaigns in minutes.
          </p>
        </div>
      </section>

      {/* Features Section */}
      <section ref={featuresSectionRef} className="relative px-6 py-20 sm:py-28 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        {/* Background accent elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/4 h-px w-1/2 bg-gradient-to-r from-transparent via-sky-400 to-transparent opacity-20" />
          <div className="absolute -top-24 left-1/3 h-96 w-96 rounded-full bg-purple-500/5 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 rounded-full bg-pink-500/5 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-4">
              Everything you need to ship
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              Campaign boards, card-based workflows, and real-time progress tracking — all with the visual clarity you need to make decisions fast.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.06] transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-sky-400 to-cyan-300 flex items-center justify-center mb-4">
                <Layers3 className="h-6 w-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Campaign Boards</h3>
              <p className="text-slate-400">
                Organize projects as campaigns. Group cards by status and drag them from deck to victory.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.06] transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-amber-400 to-orange-300 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Card-Based Tracking</h3>
              <p className="text-slate-400">
                Every task is a card with rarity levels, difficulty ratings, and XP rewards to make progress feel earned.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.06] transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-pink-400 to-rose-300 flex items-center justify-center mb-4">
                <TrendingUp className="h-6 w-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Real-Time Progress</h3>
              <p className="text-slate-400">
                XP bars, completion targets, and visual progress tracking keep everyone aligned and motivated.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.06] transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-purple-400 to-violet-300 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Quick Card Entry</h3>
              <p className="text-slate-400">
                Add cards fast without ceremony. Set difficulty, get XP values automatically, and keep shipping.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.06] transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-lime-400 to-emerald-300 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Team Collaboration</h3>
              <p className="text-slate-400">
                Invite team members, assign roles, and collaborate on campaigns together with full visibility.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur p-6 hover:bg-white/[0.06] transition">
              <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-blue-400 to-indigo-300 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-slate-950" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Visual Feedback</h3>
              <p className="text-slate-400">
                Rarity-based visual styling and experience point rewards make every action feel impactful.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative px-6 py-20 sm:py-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-t border-white/5">
        {/* Background accent elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 right-1/3 h-80 w-80 rounded-full bg-sky-600/10 blur-[120px]" />
          <div className="absolute bottom-0 left-1/4 h-96 w-96 rounded-full bg-amber-600/10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-4xl">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white text-center mb-16">
            Ship campaigns in three steps
          </h2>

          <div className="space-y-8">
            {/* Step 1 */}
            <div className="flex gap-6 items-start">
              <div className="h-12 w-12 min-w-12 rounded-full bg-gradient-to-br from-sky-400 to-cyan-300 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-950">1</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">Create a Campaign</h3>
                <p className="text-slate-400">
                  Start by naming a campaign and setting a brief. Each campaign is an isolated project board ready for your team to tackle.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-6 items-start">
              <div className="h-12 w-12 min-w-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-300 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-950">2</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">Add Cards to Your Deck</h3>
                <p className="text-slate-400">
                  Add tasks as cards. Set difficulty, and StackForge automatically calculates XP rewards. Organize with status, priority, and tags.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-6 items-start">
              <div className="h-12 w-12 min-w-12 rounded-full bg-gradient-to-br from-pink-400 to-rose-300 flex items-center justify-center">
                <span className="text-xl font-bold text-slate-950">3</span>
              </div>
              <div>
                <h3 className="text-2xl font-semibold text-white mb-2">Move Cards to Victory</h3>
                <p className="text-slate-400">
                  Drag cards through your board: deck → in progress → completed. Watch your XP bar fill as progress becomes visible and rewarding.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-20 sm:py-32 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-950">
        {/* Background accent elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 left-1/4 h-80 w-80 rounded-full bg-sky-500/15 blur-[120px]" />
          <div className="absolute -bottom-32 right-1/3 h-80 w-80 rounded-full bg-cyan-500/10 blur-[120px]" />
        </div>
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl sm:text-5xl font-bold text-white mb-6">
            Ready to transform how you ship?
          </h2>
          <p className="text-xl text-slate-400 mb-10">
            Join teams that turned project management into something they actually enjoy using.
          </p>
          <Link to="/register">
            <Button className="text-lg px-8 py-3 flex items-center gap-2 mx-auto">
              Create Your Free Campaign
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

    </div>
  );
};
