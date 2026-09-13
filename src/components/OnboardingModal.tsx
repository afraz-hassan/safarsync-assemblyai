import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User, Car, Calendar, Hash, Sparkles, CheckCircle, X, ShieldCheck } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { UserProfile } from '../types';

export function OnboardingModal() {
  const { userProfile, saveUserProfile, isOnboardingOpen, setIsOnboardingOpen } = useAppContext();

  const [name, setName] = useState('');
  const [vehicleMake, setVehicleMake] = useState('Toyota');
  const [vehicleModel, setVehicleModel] = useState('Corolla Altis');
  const [year, setYear] = useState<number>(2023);
  const [plate, setPlate] = useState('');
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill with last saved details whenever modal opens or profile changes
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.name || '');
      setVehicleMake(userProfile.vehicleMake || 'Toyota');
      setVehicleModel(userProfile.vehicleModel || 'Corolla Altis');
      setYear(userProfile.year || 2023);
      setPlate(userProfile.plate || '');
    } else {
      // Clean defaults for new customer
      setName('');
      setVehicleMake('Toyota');
      setVehicleModel('Corolla Altis');
      setYear(2023);
      setPlate('');
    }
    setIsSaved(false);
    setError(null);
  }, [userProfile, isOnboardingOpen]);

  if (!isOnboardingOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!vehicleMake.trim() || !vehicleModel.trim()) {
      setError('Please provide vehicle make and model.');
      return;
    }

    const now = new Date();
    const formattedDate = now.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newProfile: UserProfile = {
      name: name.trim(),
      vehicleMake: vehicleMake.trim(),
      vehicleModel: vehicleModel.trim(),
      year: Number(year) || new Date().getFullYear(),
      plate: plate.trim() || undefined,
      updatedAt: formattedDate
    };

    saveUserProfile(newProfile);
    setIsSaved(true);

    setTimeout(() => {
      setIsOnboardingOpen(false);
      setIsSaved(false);
    }, 900);
  };

  const handleSkipOrDismiss = () => {
    if (userProfile) {
      setIsOnboardingOpen(false);
    } else {
      // Save default initial profile so they don't get prompted repeatedly
      const now = new Date();
      const formattedDate = now.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      saveUserProfile({
        name: 'Fleet Driver',
        vehicleMake: 'Toyota',
        vehicleModel: 'Corolla Altis',
        year: 2023,
        plate: 'ICT-LE-412',
        updatedAt: formattedDate
      });
      setIsOnboardingOpen(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (userProfile) setIsOnboardingOpen(false);
          }}
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Dialog Content */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl shadow-purple-950/60 overflow-hidden z-10"
        >
          {/* Header Banner */}
          <div className="relative p-6 sm:p-7 bg-gradient-to-br from-purple-950/70 via-slate-900 to-indigo-950/70 border-b border-slate-800">
            {userProfile && (
              <button
                onClick={() => setIsOnboardingOpen(false)}
                className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="flex items-center gap-3.5 mb-2.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-purple-600/30 ring-1 ring-white/20">
                <Car className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">
                  {userProfile ? 'Your Fleet Profile' : 'Welcome to SafarSync AI'}
                </h3>
                <p className="text-xs text-purple-300 font-medium">
                  {userProfile ? 'View & update your saved details' : 'Quick 30-second setup for voice logging'}
                </p>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mt-1">
              {userProfile 
                ? 'Your info is saved in local storage so you never have to sign up again. Modify any details below to keep your records synchronized.' 
                : 'Enter your basic details once. Your vehicle info will be saved locally so you can start logging journeys and fuel immediately.'}
            </p>

            {userProfile?.updatedAt && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/80 text-[11px] text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Last updated: <strong>{userProfile.updatedAt}</strong></span>
              </div>
            )}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Your Full Name / Fleet Manager
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Afraz Hassan"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (error) setError(null);
                  }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Vehicle Make
                </label>
                <div className="relative">
                  <Car className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Toyota"
                    value={vehicleMake}
                    onChange={(e) => setVehicleMake(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Vehicle Model
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Corolla Altis / Civic"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Year & Number Plate */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Model Year
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="number"
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Number Plate <span className="text-slate-500 lowercase">(optional)</span>
                </label>
                <div className="relative">
                  <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-purple-400" />
                  <input
                    type="text"
                    placeholder="e.g. ICT-LE-412"
                    value={plate}
                    onChange={(e) => setPlate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all uppercase"
                  />
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <button
                type="button"
                onClick={handleSkipOrDismiss}
                className="w-full sm:w-auto px-4 py-2.5 text-xs text-slate-400 hover:text-slate-200 transition-colors cursor-pointer text-center"
              >
                {userProfile ? 'Cancel' : 'Continue with Demo Fleet'}
              </button>

              <button
                type="submit"
                disabled={isSaved}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-80"
              >
                {isSaved ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-emerald-300 animate-bounce" />
                    <span>Details Saved!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-purple-200" />
                    <span>{userProfile ? 'Update & Save Details' : 'Save & Start Logging'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
