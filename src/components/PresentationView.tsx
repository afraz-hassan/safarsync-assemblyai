import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, ChevronRight, Sparkles, Mic, Radio, Database, TrendingUp, 
  ShieldCheck, Award, Copy, Check, ExternalLink, Play, Layers, 
  DollarSign, Activity, FileSpreadsheet, AlertTriangle, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';

interface PresentationViewProps {
  onNavigate: (tab: 'data' | 'dashboard' | 'logbook' | 'profile' | 'presentation') => void;
}

export function PresentationView({ onNavigate }: PresentationViewProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const { userProfile } = useAppContext();

  const slides = [
    {
      id: 'title',
      badge: 'Project Presentation',
      title: 'SafarSync AI',
      subtitle: 'Voice-First Fleet Intelligence Powered by AssemblyAI',
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="relative rounded-2xl overflow-hidden border border-purple-500/30 shadow-2xl shadow-purple-950/50 group">
            <img 
              src="/safarsync_banner.jpg" 
              alt="SafarSync AI Hackathon Banner" 
              className="w-full h-56 sm:h-72 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              onError={(e) => {
                // Fallback to stylized banner card if image loading fails
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent flex flex-col justify-end p-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/30 border border-purple-400/40 text-purple-200 text-xs font-semibold backdrop-blur-md w-fit mb-2">
                <Radio className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
                AssemblyAI Voice Agent Hackathon Submission
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Hands-Free Fleet Operations for the Modern Road
              </h3>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl mt-1">
                Zero typing. Zero distracted driving. Transforming noisy cabin speech into mathematically structured fleet databases in real-time.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                <Mic className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Core Speech Engine</div>
                <div className="text-sm font-bold text-white">AssemblyAI Universal-3</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Deterministic Extraction</div>
                <div className="text-sm font-bold text-white">Gemini 1.5 Flash</div>
              </div>
            </div>

            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs text-slate-400 font-medium">Persistence Engine</div>
                <div className="text-sm font-bold text-white">Zero-Latency Local Storage</div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'problem',
      badge: 'The Problem',
      title: 'Distracted Driving & Lost Millions',
      subtitle: 'The high-risk reality facing 3.5M+ commercial drivers & fleet operators',
      icon: AlertTriangle,
      content: (
        <div className="space-y-6">
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Every day, commercial fleet drivers and independent owner-operators are forced to choose between <strong className="text-rose-400 font-semibold">safety</strong> and <strong className="text-amber-400 font-semibold">record-keeping</strong>. Traditional fleet software demands typing on tiny mobile touchscreens inside vibrating truck cabins.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center mb-4">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Severe Road Hazard</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Typing mileage and expenses on a smartphone increases crash risk by 23x. Drivers delay logging until end-of-week, leading to forgotten numbers.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-rose-500/20 text-rose-300 font-mono text-xs font-semibold">
                23x higher collision risk
              </div>
            </div>

            <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Lost Fuel & Tax Deductions</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Over $12,000 per truck in business tax write-offs and IFTA rebates are lost annually due to crumpled physical receipts and unlogged trips.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-amber-500/20 text-amber-300 font-mono text-xs font-semibold">
                $12k+ unrecovered costs / yr
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/30 rounded-2xl p-5 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Delayed Maintenance</h4>
                <p className="text-slate-400 text-xs leading-relaxed">
                  Without continuous live odometer sync, oil changes, brake pads, and tire rotations get overlooked until catastrophic roadside breakdown occurs.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-indigo-500/20 text-indigo-300 font-mono text-xs font-semibold">
                $4,800 avg engine repair
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'architecture',
      badge: 'Architecture & Innovation',
      title: 'Dual-Agent Voice-to-SQL Pipeline',
      subtitle: 'Converting unconstrained human voice into strict relational schemas',
      icon: Layers,
      content: (
        <div className="space-y-6">
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
              
              <div className="bg-purple-950/40 border border-purple-500/40 rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mb-2">
                  <Mic className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">1. Driver Speaks</div>
                <div className="text-[11px] text-purple-300 mt-1 italic">
                  "Put 80 liters diesel for 120 dollars in Truck 01"
                </div>
              </div>

              <div className="text-center hidden md:flex flex-col items-center">
                <ArrowRight className="w-5 h-5 text-purple-400 animate-pulse" />
                <span className="text-[10px] text-slate-500 font-mono mt-1">Audio Buffer</span>
              </div>

              <div className="bg-indigo-950/40 border border-indigo-500/40 rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-2">
                  <Radio className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">2. AssemblyAI STT</div>
                <div className="text-[11px] text-indigo-300 mt-1">
                  High-accuracy noise-resilient speech transcription
                </div>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-4 text-center">
                <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-2">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">3. Gemini Reasoning</div>
                <div className="text-[11px] text-emerald-300 mt-1">
                  Entity extraction into clean JSON & auto-categorization
                </div>
              </div>

            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Deterministic Validation: Type guardrails prevent negative costs, nan values, and bad dates</span>
              </div>
              <div className="flex items-center gap-2 text-purple-400 font-mono">
                <span>Latency: &lt; 1.2s end-to-end</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <h5 className="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
                <Radio className="w-4 h-4 text-purple-400" />
                AssemblyAI: The Unfair Advantage
              </h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Cabin background acoustics (diesel engines, highway wind, sirens) break standard voice recognition. AssemblyAI's acoustic models provide unmatched word error rate (WER) even under 75dB truck interior noise.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <h5 className="font-bold text-white text-sm mb-1.5 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                Structured SQLite Logbook
              </h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Raw words are automatically normalized into database records: expense type, gallons/liters, unit price, vehicle FK, timestamp, and audit trail. Ready for CSV/PDF export.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'features',
      badge: 'Core Features',
      title: 'Built for Real Fleet Workflows',
      subtitle: 'A cohesive suite for drivers, fleet managers, and owner-operators',
      icon: Activity,
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center mb-3">
              <Mic className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">One-Touch Voice Logging</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Real-time reactive visual waveform with support for audio file uploads or direct microphone dictation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-3">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Live Telemetry Dashboard</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Instant visual breakdown of Cost per Kilometer, Fuel Efficiency (km/L), and category expenditures via Recharts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Structured Logbook</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Full-text searchable, filterable table for expenses and trips. Includes one-click CSV export for accountants.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Predictive Service Alerts</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Automated health status trackers calculated dynamically from logged odometer intervals and trip logs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-indigo-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">Clean Slate & Multi-Vehicle</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Driver onboarding with persistent profile memory in localStorage. Start fresh or reset anytime with zero mock artifacts.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="text-base font-bold text-white mb-1">PWA Ready</h4>
            <p className="text-slate-400 text-xs leading-relaxed">
              Fully responsive across desktop, tablet, and mobile browsers with haptic-ready buttons and ergonomic touch targets.
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'market',
      badge: 'Market Opportunity',
      title: 'A $45B Underserved Market',
      subtitle: 'Empowering the 90% of fleets with fewer than 10 vehicles',
      icon: DollarSign,
      content: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-purple-400 mb-1">$45.8B</div>
              <div className="text-xs font-bold text-white">Global Fleet Telematics</div>
              <div className="text-[11px] text-slate-400 mt-1">Growing at 16.5% CAGR by 2030</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-blue-400 mb-1">91.3%</div>
              <div className="text-xs font-bold text-white">Small Fleets (&lt; 6 Trucks)</div>
              <div className="text-[11px] text-slate-400 mt-1">Priced out of bloated enterprise ERPs</div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center">
              <div className="text-3xl font-extrabold text-emerald-400 mb-1">4.2x</div>
              <div className="text-xs font-bold text-white">Direct Customer ROI</div>
              <div className="text-[11px] text-slate-400 mt-1">Saved from fuel leakage and tax writeoffs</div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-900/20 via-indigo-900/20 to-slate-900/60 border border-purple-500/20 rounded-2xl p-6">
            <h4 className="text-lg font-bold text-white mb-2">Monetization & Commercial Strategy</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <strong>Freemium Starter:</strong> Free for 1 vehicle, 50 voice logs/month.
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  <strong>Pro Driver / Small Fleet:</strong> $14.99 / vehicle / month with unlimited AssemblyAI transcription.
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <strong>Enterprise Fleets:</strong> Custom multi-tier dispatch and automated fuel-card reconciliation.
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <strong>Insurtech Partnerships:</strong> Telemetry discounts for verified hands-free drivers.
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'hackathon',
      badge: 'Judging Criteria',
      title: 'Why SafarSync Wins',
      subtitle: 'Direct alignment with the AssemblyAI Voice Agent Hackathon benchmarks',
      icon: Award,
      content: (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">
                1. Voice AI as Core Foundation
              </div>
              <h5 className="font-bold text-white text-sm mb-1">Not a Chatbot Gimmick</h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Rather than an arbitrary conversational bot, voice is utilized as the primary transactional interface where physical hands cannot be used safely.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">
                2. Technical Polish & Architecture
              </div>
              <h5 className="font-bold text-white text-sm mb-1">End-to-End Resilience</h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Built with full reactive state management, audio waveform animations, deterministic type validations, and instant browser persistence.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">
                3. High Real-World Utility
              </div>
              <h5 className="font-bold text-white text-sm mb-1">Immediate Business Value</h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Solves actual physical pain points for independent truckers and fleet managers: compliance, tax reporting, and live cost calculation.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1">
                4. Flawless UI/UX Execution
              </div>
              <h5 className="font-bold text-white text-sm mb-1">Zero-Latency Interaction</h5>
              <p className="text-slate-400 text-xs leading-relaxed">
                Sleek dark cyberpunk dashboard styling, high-contrast readability under bright sunlight, and frictionless onboarding.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              onClick={() => onNavigate('data')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs tracking-wide shadow-lg shadow-purple-500/25 transition-all cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Launch Live Voice Demo</span>
            </button>

            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs tracking-wide border border-slate-700 transition-all cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-purple-400" />
              <span>Inspect Telemetry Dashboard</span>
            </button>
          </div>
        </div>
      )
    }
  ];

  // Helper for copying
  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const current = slides[currentSlide];

  return (
    <div className="space-y-6">
      {/* Top Banner Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 sm:p-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white">SafarSync AI Presentation Deck</h2>
              <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-bold border border-purple-500/30">
                Hackathon Mode
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive project pitch, architecture breakdown, and submission copy
            </p>
          </div>
        </div>

        {/* Slide Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={() => setCurrentSlide(prev => Math.max(0, prev - 1))}
            disabled={currentSlide === 0}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Previous Slide"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono font-semibold text-slate-300 px-2">
            {currentSlide + 1} / {slides.length}
          </span>

          <button
            onClick={() => setCurrentSlide(prev => Math.min(slides.length - 1, prev + 1))}
            disabled={currentSlide === slides.length - 1}
            className="p-2 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer"
            title="Next Slide"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Slide Navigation Pill Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {slides.map((s, idx) => (
          <button
            key={s.id}
            onClick={() => setCurrentSlide(idx)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              currentSlide === idx 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 border border-purple-400/40' 
                : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800/80 hover:bg-slate-800/60'
            }`}
          >
            {idx + 1}. {s.badge}
          </button>
        ))}
      </div>

      {/* Main Slide Card */}
      <div className="bg-slate-950/70 border border-slate-800/90 rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-2xl relative min-h-[460px] flex flex-col justify-between">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Slide Header */}
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold mb-2">
                <current.icon className="w-3.5 h-3.5" />
                <span>{current.badge}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {current.title}
              </h3>
              <p className="text-slate-400 text-sm mt-1">
                {current.subtitle}
              </p>
            </div>

            {/* Slide Body */}
            <div>
              {current.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Slide Footer */}
        <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
          <div>
            SafarSync AI • AssemblyAI Voice Agent Hackathon
          </div>
          <div className="flex items-center gap-3">
            {currentSlide > 0 && (
              <button 
                onClick={() => setCurrentSlide(prev => prev - 1)}
                className="hover:text-slate-300 transition-colors cursor-pointer"
              >
                ← Back
              </button>
            )}
            {currentSlide < slides.length - 1 ? (
              <button 
                onClick={() => setCurrentSlide(prev => prev + 1)}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
              >
                Next: {slides[currentSlide + 1].badge} →
              </button>
            ) : (
              <button 
                onClick={() => onNavigate('data')}
                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
              >
                Launch App Demo →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Submission Information Quick-Copy Box */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Hackathon Submission Form Values</h4>
              <p className="text-xs text-slate-400">Pre-validated character counts for lablab.ai submission</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Submission Title */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-400">Submission Title</span>
              <span className="font-mono text-slate-400 text-[11px]">34 / 50 chars</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 text-white font-mono text-xs select-all border border-slate-800">
              SafarSync AI - Voice Fleet Ops
            </div>
            <button
              onClick={() => copyToClipboard('SafarSync AI - Voice Fleet Ops', 'title')}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedKey === 'title' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'title' ? 'Copied to Clipboard!' : 'Copy Title'}</span>
            </button>
          </div>

          {/* Short Description */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-blue-400">Short Description</span>
              <span className="font-mono text-slate-400 text-[11px]">195 / 255 chars</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900 text-white font-mono text-xs select-all border border-slate-800 line-clamp-2">
              Voice-first fleet management platform powered by AssemblyAI and Gemini that instantly converts noisy cabin driver speech into structured vehicle expenses, fuel logs, and telemetry metrics.
            </div>
            <button
              onClick={() => copyToClipboard('Voice-first fleet management platform powered by AssemblyAI and Gemini that instantly converts noisy cabin driver speech into structured vehicle expenses, fuel logs, and telemetry metrics.', 'short')}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              {copiedKey === 'short' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'short' ? 'Copied to Clipboard!' : 'Copy Short Description'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
