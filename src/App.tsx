import React, { useState } from 'react';
import { Car, Mic, Table as TableIcon, Sparkles, LayoutDashboard, Radio, User, Edit3 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AppProvider, useAppContext } from './context/AppContext';
import { DataEntry } from './components/DataEntry';
import { Dashboard } from './components/Dashboard';
import { Logbook } from './components/Logbook';
import { ProfileView } from './components/ProfileView';
import { OnboardingModal } from './components/OnboardingModal';

function MainLayout() {
  const [activeTab, setActiveTab] = useState<'data' | 'dashboard' | 'logbook' | 'profile'>('data');
  const { userProfile, setIsOnboardingOpen, vehicles } = useAppContext();

  const navItems = [
    { id: 'data', label: 'Data Entry', shortLabel: 'Voice & Log', icon: Mic },
    { id: 'dashboard', label: 'Dashboard', shortLabel: 'Dashboard', icon: LayoutDashboard },
    { id: 'logbook', label: 'SQLite Logbook', shortLabel: 'Logbook', icon: TableIcon },
    { id: 'profile', label: 'My Profile & Vehicle', shortLabel: 'Profile', icon: User },
  ];

  const displayName = userProfile?.name || 'Customer';
  const displayVehicle = userProfile 
    ? `${userProfile.vehicleMake} ${userProfile.vehicleModel}` 
    : vehicles[0] ? `${vehicles[0].make} ${vehicles[0].model}` : 'Toyota Corolla';

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-[#020617] text-slate-100 font-sans antialiased overflow-hidden selection:bg-purple-500/30">
      
      {/* Dynamic Background Glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/10 blur-[120px]" />
      </div>

      {/* Onboarding & Profile Modal */}
      <OnboardingModal />

      {/* Mobile Top Header (hidden on lg) */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl shrink-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/25 ring-1 ring-white/10">
            <Car className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight text-white leading-tight">
              SafarSync AI
            </h1>
            <div className="text-[10px] font-medium text-purple-400 uppercase tracking-wider">
              {displayName} • {displayVehicle}
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsOnboardingOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-medium cursor-pointer hover:bg-purple-500/20 transition-all"
        >
          <User className="w-3.5 h-3.5 text-purple-400" />
          <span>{userProfile ? 'Profile' : 'Setup'}</span>
        </button>
      </header>

      {/* Desktop Sidebar Navigation (hidden on mobile) */}
      <aside className="hidden lg:flex w-[280px] border-r border-slate-800/60 bg-slate-950/50 backdrop-blur-2xl flex-col justify-between shrink-0 relative z-20">
        <div>
          {/* App Header */}
          <div className="p-6 border-b border-slate-800/60">
            <div className="flex items-center gap-4 mb-1">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-purple-500/25 ring-1 ring-white/10">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-bold text-lg tracking-tight text-white leading-tight">
                  SafarSync AI
                </h1>
                <div className="text-[11px] font-medium text-purple-400 uppercase tracking-widest mt-1">
                  AssemblyAI Edition
                </div>
              </div>
            </div>
          </div>

          {/* User Profile Mini Card */}
          <div className="p-4 mx-4 mt-4 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between group">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-purple-600/30 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{displayName}</div>
                <div className="text-[10px] text-purple-300 truncate">{displayVehicle}</div>
              </div>
            </div>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              title="Edit Profile & Vehicle"
              className="p-1.5 rounded-lg text-slate-400 hover:text-purple-300 hover:bg-purple-500/20 transition-all cursor-pointer shrink-0"
            >
              <Edit3 className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-2">
            {navItems.map(nav => (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-medium transition-all duration-300 relative overflow-hidden cursor-pointer ${
                  activeTab === nav.id
                    ? 'text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                {activeTab === nav.id && (
                  <motion.div 
                    layoutId="activeNavDesktop" 
                    className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-indigo-600/20 border border-purple-500/30 rounded-xl"
                  />
                )}
                <nav.icon className={`w-5 h-5 relative z-10 ${activeTab === nav.id ? 'text-purple-400' : ''}`} />
                <span className="relative z-10">{nav.label}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* API Integration Status */}
        <div className="p-6 mt-auto">
          <div className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 space-y-3">
            <div className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Voice & Intelligence</div>
            
            <div className="flex items-center justify-between group">
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-purple-500/15 flex items-center justify-center">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                </div>
                AssemblyAI Voice AI
              </span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Primary
              </span>
            </div>

            <div className="flex items-center justify-between group">
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                </div>
                Gemini Reasoning
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            </div>
            
            <div className="flex items-center justify-between group">
              <span className="flex items-center gap-2 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <TableIcon className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                SQLite Logbook
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative z-10 custom-scrollbar">
        <div className="p-4 sm:p-6 lg:p-10 pb-28 lg:pb-10 min-h-full max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'data' && (
              <motion.div key="data" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <DataEntry onNavigate={(tab) => setActiveTab(tab)} />
              </motion.div>
            )}
            {activeTab === 'dashboard' && (
              <motion.div key="dashboard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Dashboard onNavigate={(tab) => setActiveTab(tab)} />
              </motion.div>
            )}
            {activeTab === 'logbook' && (
              <motion.div key="logbook" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <Logbook onNavigate={(tab) => setActiveTab(tab)} />
              </motion.div>
            )}
            {activeTab === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <ProfileView onNavigate={(tab) => setActiveTab(tab)} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Mobile / Tablet Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 border-t border-slate-800 bg-slate-950/95 backdrop-blur-2xl z-30 px-3 py-2">
        <div className="flex items-center justify-around max-w-md mx-auto">
          {navItems.map(nav => {
            const isActive = activeTab === nav.id;
            return (
              <button
                key={nav.id}
                onClick={() => setActiveTab(nav.id as any)}
                className={`flex flex-col items-center justify-center min-h-[48px] py-1 px-3 rounded-xl transition-all relative cursor-pointer ${
                  isActive ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeNavMobile" 
                    className="absolute inset-0 bg-purple-500/10 border border-purple-500/20 rounded-xl"
                  />
                )}
                <nav.icon className="w-5 h-5 relative z-10 mb-0.5" />
                <span className="text-[11px] relative z-10 leading-none">{nav.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </nav>

    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
