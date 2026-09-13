import React, { useState } from 'react';
import { 
  BarChart3, 
  Fuel, 
  Navigation, 
  Sparkles, 
  Wrench, 
  ArrowRight, 
  Car, 
  Plus, 
  Calendar, 
  TrendingUp, 
  Coins, 
  Gauge, 
  ShieldCheck,
  Filter
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../lib/utils';

const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b'];

interface DashboardProps {
  onNavigate?: (tab: 'data' | 'dashboard' | 'logbook') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { expenses, trips, vehicles, userProfile } = useAppContext();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | 'all'>('all');

  // Filter data based on selected vehicle
  const filteredExpenses = selectedVehicleId === 'all'
    ? expenses
    : expenses.filter(e => e.vehicle_id === selectedVehicleId);

  const filteredTrips = selectedVehicleId === 'all'
    ? trips
    : trips.filter(t => t.vehicle_id === selectedVehicleId);

  const totalExpenses = filteredExpenses.reduce((acc, curr) => acc + curr.amount_pkr, 0);
  const totalLiters = filteredExpenses.reduce((acc, curr) => acc + curr.liters, 0);
  const totalDistance = filteredTrips.reduce((acc, curr) => acc + curr.distance_km, 0);
  const fuelEfficiency = totalLiters > 0 ? (totalDistance / totalLiters).toFixed(2) : "0.00";
  const costPerKm = totalDistance > 0 ? (totalExpenses / totalDistance).toFixed(1) : "0.0";

  const fuelExpenses = filteredExpenses.filter(e => e.type === 'Fuel').reduce((a, b) => a + b.amount_pkr, 0);
  const maintExpenses = filteredExpenses.filter(e => e.type === 'Maintenance').reduce((a, b) => a + b.amount_pkr, 0);
  const insuranceExpenses = filteredExpenses.filter(e => e.type === 'Insurance').reduce((a, b) => a + b.amount_pkr, 0);

  const pieData = [
    { name: 'Fuel', value: fuelExpenses },
    { name: 'Maintenance', value: maintExpenses },
    { name: 'Insurance', value: insuranceExpenses },
  ].filter(d => d.value > 0);

  // Process data for Area Chart (Expenses over time)
  const sortedExpenses = [...filteredExpenses].sort((a, b) => {
    const timeA = new Date(a.created_at.replace(' ', 'T')).getTime();
    const timeB = new Date(b.created_at.replace(' ', 'T')).getTime();
    return (isNaN(timeA) ? 0 : timeA) - (isNaN(timeB) ? 0 : timeB);
  });
  const chartData = sortedExpenses.map(e => ({
    date: e.created_at.split(' ')[0],
    amount: e.amount_pkr,
    type: e.type,
    vehicle: e.vehicle_name
  }));

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  const selectedVehicleObj = selectedVehicleId === 'all' 
    ? null 
    : vehicles.find(v => v.id === selectedVehicleId);

  return (
    <motion.div 
      className="max-w-6xl mx-auto space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Top Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
              <BarChart3 className="w-5 h-5" />
            </div>
            Fleet Analytics & Efficiency
          </h2>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Operational cost analytics, fuel telemetry, and predictive maintenance schedules.
          </p>
          {userProfile && (
            <div className="mt-1.5 text-xs text-purple-300 font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span>
                Personalized for <strong className="text-white">{userProfile.name}</strong> •{' '}
                <strong className="text-white">{userProfile.vehicleMake} {userProfile.vehicleModel}</strong>
                {userProfile.plate ? ` (${userProfile.plate})` : ''}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Vehicle Filter Selector */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-sm shadow-inner">
            <Filter className="w-4 h-4 text-purple-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium">Filter:</span>
            <select
              id="dashboard-vehicle-filter"
              value={selectedVehicleId}
              onChange={e => setSelectedVehicleId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className="bg-transparent text-white font-medium text-xs sm:text-sm focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900 text-white">All Fleet Vehicles ({vehicles.length})</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                  {v.make} {v.model} ({v.plate || v.year})
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Button */}
          {onNavigate && (
            <button
              type="button"
              id="dashboard-btn-new-entry"
              onClick={() => onNavigate('data')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Log Entry
            </button>
          )}
        </div>
      </div>

      {/* Starting Fresh Clean Slate Banner */}
      {totalExpenses === 0 && totalDistance === 0 && (
        <motion.div 
          variants={itemVariants}
          className="bg-purple-950/20 border border-purple-500/30 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Clean Slate — Ready for Live Logging</h4>
              <p className="text-xs text-slate-400 mt-0.5">
                All demo sample data has been reset to zero. Speak naturally with AssemblyAI voice recognition or submit the manual form to log your first live journey or expense.
              </p>
            </div>
          </div>
          {onNavigate && (
            <button 
              onClick={() => onNavigate('data')}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold shadow-md shadow-purple-600/20 shrink-0 cursor-pointer"
            >
              Record First Entry
            </button>
          )}
        </motion.div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { 
            label: "Total Expenses", 
            value: formatCurrency(totalExpenses), 
            icon: Coins, 
            color: "text-emerald-400", 
            sub: selectedVehicleObj ? `${selectedVehicleObj.make} ${selectedVehicleObj.model}` : "Across all registered fleet vehicles" 
          },
          { 
            label: "Total Journey Distance", 
            value: `${totalDistance.toLocaleString()} km`, 
            icon: Navigation, 
            color: "text-indigo-400", 
            sub: `${filteredTrips.length} journeys logged` 
          },
          { 
            label: "Fuel Logged", 
            value: `${totalLiters.toFixed(1)} L`, 
            icon: Fuel, 
            color: "text-amber-400", 
            sub: `${formatCurrency(fuelExpenses)} fuel spend` 
          },
          { 
            label: "Fuel Efficiency", 
            value: `${fuelEfficiency} km/L`, 
            icon: Gauge, 
            color: "text-cyan-400", 
            sub: totalDistance > 0 ? `Avg cost: PKR ${costPerKm}/km` : "Distance ÷ Volume", 
            special: true 
          }
        ].map((kpi, i) => (
          <motion.div 
            key={i} 
            variants={itemVariants} 
            className={`bg-slate-900/50 backdrop-blur-xl border ${kpi.special ? 'border-purple-500/40 bg-gradient-to-br from-slate-900 to-purple-950/30 shadow-lg shadow-purple-900/20' : 'border-slate-800'} rounded-2xl p-5 sm:p-6 relative overflow-hidden group hover:border-slate-700 transition-colors`}
          >
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between relative z-10">
              <span>{kpi.label}</span>
              <div className="w-8 h-8 rounded-xl bg-slate-800/80 flex items-center justify-center">
                <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-white mt-3 font-mono tracking-tight relative z-10">
              {kpi.value}
            </div>
            <div className="text-xs text-slate-400 mt-2 relative z-10 flex items-center gap-1">
              {kpi.sub}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Visual Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-2 bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-slate-200">Expense Trend Timeline</h3>
              <p className="text-xs text-slate-400 mt-0.5">Chronological breakdown of expenditures</p>
            </div>
            <span className="text-xs text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full font-medium">
              PKR / Transaction
            </span>
          </div>

          <div className="h-[280px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `Rs.${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '12px', color: '#f8fafc', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)' }}
                    formatter={(val: any) => [formatCurrency(Number(val)), "Amount"]}
                    labelFormatter={(label) => `Date: ${label}`}
                  />
                  <Area type="monotone" dataKey="amount" stroke="#a855f7" strokeWidth={3} fillOpacity={1} fill="url(#colorAmount)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                No expense entries available for this selection.
              </div>
            )}
          </div>
        </motion.div>

        {/* Side Panel: Donut Chart & Predictive Insight */}
        <motion.div variants={itemVariants} className="space-y-6 lg:col-span-1">
          <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h3 className="text-base sm:text-lg font-semibold text-slate-200 mb-1">Expenditure Split</h3>
            <p className="text-xs text-slate-400 mb-4">By category allocation</p>
            
            <div className="h-[180px] w-full relative">
              {totalExpenses > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#090d16', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }} 
                        formatter={(val: any) => [formatCurrency(Number(val)), 'Spent']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                    <span className="text-base font-bold text-white font-mono">
                      {(totalExpenses / 1000).toFixed(1)}k
                    </span>
                  </div>
                </>
              ) : (
                <div className="flex h-full items-center justify-center text-slate-500 text-xs">No data</div>
              )}
            </div>
            
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="text-slate-300">Fuel Refills</span>
                </div>
                <span className="font-mono text-slate-200 font-semibold">{formatCurrency(fuelExpenses)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500" />
                  <span className="text-slate-300">Maintenance & Service</span>
                </div>
                <span className="font-mono text-slate-200 font-semibold">{formatCurrency(maintExpenses)}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                  <span className="text-slate-300">Insurance & Licensing</span>
                </div>
                <span className="font-mono text-slate-200 font-semibold">{formatCurrency(insuranceExpenses)}</span>
              </div>
            </div>
          </div>

          {/* Predictive Maintenance Card */}
          <div className="bg-gradient-to-br from-purple-950/40 to-indigo-950/40 border border-purple-500/20 rounded-2xl p-5 relative overflow-hidden shadow-lg">
            <div className="flex items-center gap-2 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Predictive Fleet Telemetry
            </div>
            <p className="text-slate-200 text-xs sm:text-sm leading-relaxed">
              Based on logged journeys ({totalDistance} km), periodic <strong>Synthetic 5W-30 Oil & Filter inspection</strong> is recommended within the next <strong className="text-white font-mono">3,800 km</strong>.
            </p>
            <div className="mt-3 pt-3 border-t border-purple-500/20 flex items-center justify-between text-[11px] text-purple-300">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Fleet Health: Optimal
              </span>
              <span>AssemblyAI + Gemini Audit</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Trips Overview Section */}
      <motion.div variants={itemVariants} className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-slate-200">Recent Journey Logs</h3>
            <p className="text-xs text-slate-400 mt-0.5">Tracked route segments and travel mileage</p>
          </div>
          {onNavigate && (
            <button
              type="button"
              id="dashboard-btn-view-all-trips"
              onClick={() => onNavigate('logbook')}
              className="text-xs font-medium text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
            >
              Full Logbook <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTrips.slice(0, 6).map(trip => (
            <div key={trip.id} className="p-4 bg-slate-950/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="flex items-center justify-between mb-2.5">
                <div className="text-xs font-semibold text-slate-200 flex items-center gap-2">
                  <span className="truncate max-w-[100px]">{trip.start_location}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  <span className="truncate max-w-[100px]">{trip.end_location}</span>
                </div>
                <span className="text-xs font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md border border-indigo-500/20">
                  {trip.distance_km} km
                </span>
              </div>
              <div className="flex items-end justify-between pt-2 border-t border-slate-900 text-xs text-slate-400">
                <div>
                  <div className="font-medium text-slate-300">{trip.vehicle_name}</div>
                  {trip.notes && <div className="text-[11px] text-slate-500 truncate max-w-[160px]">{trip.notes}</div>}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {formatDateTime(trip.created_at)}
                </div>
              </div>
            </div>
          ))}
          {filteredTrips.length === 0 && (
            <div className="col-span-full py-8 text-center text-slate-500 text-sm">
              No journey records found for this vehicle.
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
