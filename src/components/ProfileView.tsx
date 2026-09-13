import React from 'react';
import { motion } from 'motion/react';
import { User, Car, Calendar, Hash, ShieldCheck, Edit3, Sparkles, Fuel, Navigation } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency } from '../lib/utils';

interface ProfileViewProps {
  onNavigate?: (tab: 'data' | 'dashboard' | 'logbook') => void;
}

export function ProfileView({ onNavigate }: ProfileViewProps) {
  const { userProfile, setIsOnboardingOpen, expenses, trips, vehicles } = useAppContext();

  const userVehicleName = userProfile 
    ? `${userProfile.vehicleMake} ${userProfile.vehicleModel}` 
    : vehicles[0] ? `${vehicles[0].make} ${vehicles[0].model}` : 'General Fleet';

  // Stats for this user's vehicle
  const vehicleExpenses = expenses.filter(e => 
    e.vehicle_name.toLowerCase().includes(userVehicleName.toLowerCase()) || 
    (userProfile?.vehicleMake && e.vehicle_name.toLowerCase().includes(userProfile.vehicleMake.toLowerCase()))
  );
  const totalSpent = vehicleExpenses.reduce((sum, e) => sum + e.amount_pkr, 0);

  const vehicleTrips = trips.filter(t => 
    t.vehicle_name.toLowerCase().includes(userVehicleName.toLowerCase()) || 
    (userProfile?.vehicleMake && t.vehicle_name.toLowerCase().includes(userProfile.vehicleMake.toLowerCase()))
  );
  const totalDistance = vehicleTrips.reduce((sum, t) => sum + t.distance_km, 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <span>Customer Profile & Vehicle</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/20 border border-purple-500/40 text-purple-300">
              Saved in LocalStorage
            </span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Your personal credentials and vehicle specifications are permanently stored on this device.
          </p>
        </div>

        <button
          onClick={() => setIsOnboardingOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold shadow-lg shadow-purple-600/30 transition-all cursor-pointer shrink-0"
        >
          <Edit3 className="w-4 h-4" />
          <span>Edit Profile Details</span>
        </button>
      </div>

      {/* Main Profile Card */}
      <motion.div 
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl shadow-purple-600/30 ring-2 ring-white/20">
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h3 className="text-xl sm:text-2xl font-bold text-white">
                {userProfile?.name || 'Driver / Fleet Customer'}
              </h3>
              <p className="text-xs sm:text-sm text-purple-300 font-medium mt-0.5">
                Primary Operator & Fleet Member
              </p>
              {userProfile?.updatedAt && (
                <div className="inline-flex items-center gap-1.5 mt-2 text-xs text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Last Updated: <strong className="text-slate-300">{userProfile.updatedAt}</strong></span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Auto-Persistent
            </span>
          </div>
        </div>

        {/* Vehicle Spec Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Car className="w-4 h-4 text-purple-400" />
              <span>Vehicle Make</span>
            </div>
            <div className="text-lg font-bold text-white">
              {userProfile?.vehicleMake || (vehicles[0] ? vehicles[0].make : 'Toyota')}
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Car className="w-4 h-4 text-indigo-400" />
              <span>Model</span>
            </div>
            <div className="text-lg font-bold text-white">
              {userProfile?.vehicleModel || (vehicles[0] ? vehicles[0].model : 'Corolla Altis')}
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>Model Year</span>
            </div>
            <div className="text-lg font-bold text-white">
              {userProfile?.year || (vehicles[0] ? vehicles[0].year : 2023)}
            </div>
          </div>

          <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/80">
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <Hash className="w-4 h-4 text-amber-400" />
              <span>License Plate</span>
            </div>
            <div className="text-lg font-bold text-white">
              {userProfile?.plate || (vehicles[0]?.plate ? vehicles[0].plate : 'ICT-LE-412')}
            </div>
          </div>
        </div>

        {/* Quick Activity Snapshot for this vehicle */}
        <div className="mt-8 pt-6 border-t border-slate-800/80">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Current Fleet Activity for this Vehicle
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-purple-300 font-medium">Logged Fuel & Expenses</div>
                <div className="text-xl font-bold text-white mt-1">{formatCurrency(totalSpent)}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{vehicleExpenses.length} entries recorded</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Fuel className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-indigo-300 font-medium">Total Distance Driven</div>
                <div className="text-xl font-bold text-white mt-1">{totalDistance} km</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{vehicleTrips.length} journeys logged</div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Navigation className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Fast Action Buttons */}
        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={() => onNavigate?.('data')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all cursor-pointer flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Voice Log with this Vehicle</span>
          </button>
          <button
            onClick={() => onNavigate?.('logbook')}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition-all cursor-pointer"
          >
            <span>View All Records in SQLite Logbook</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
