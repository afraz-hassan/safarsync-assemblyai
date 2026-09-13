import React, { useState, useMemo } from 'react';
import { 
  Table as TableIcon, 
  Fuel, 
  Navigation, 
  Car, 
  Plus, 
  Trash2, 
  Download, 
  Search, 
  Filter, 
  Calendar,
  FileText,
  Sparkles,
  MapPin,
  Clock,
  RotateCcw
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { formatCurrency, formatDateTime } from '../lib/utils';

interface LogbookProps {
  onNavigate?: (tab: 'data' | 'dashboard' | 'logbook') => void;
}

export function Logbook({ onNavigate }: LogbookProps) {
  const { 
    expenses, 
    trips, 
    vehicles, 
    addVehicle, 
    deleteExpense, 
    deleteTrip, 
    deleteVehicle,
    clearAllData,
    resetToDefaults 
  } = useAppContext();

  const [activeTab, setActiveTab] = useState<'expenses' | 'trips' | 'vehicles'>('expenses');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | 'all'>('all');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  // New Vehicle Form State
  const [make, setMake] = useState('Toyota');
  const [model, setModel] = useState('Yaris ATIV');
  const [year, setYear] = useState(2024);
  const [plate, setPlate] = useState('ISB-558');

  const handleAddVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (make && model && year) {
      addVehicle({ 
        make: make.trim(), 
        model: model.trim(), 
        year, 
        plate: plate.trim() || undefined 
      });
      setShowAddVehicle(false);
      setMake('');
      setModel('');
      setPlate('');
    }
  };

  // Filtered Expenses
  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const matchVehicle = selectedVehicleId === 'all' || e.vehicle_id === selectedVehicleId;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        e.vehicle_name.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q) ||
        (e.notes && e.notes.toLowerCase().includes(q)) ||
        e.created_at.toLowerCase().includes(q) ||
        e.amount_pkr.toString().includes(q);
      return matchVehicle && matchSearch;
    });
  }, [expenses, selectedVehicleId, searchQuery]);

  // Filtered Trips
  const filteredTrips = useMemo(() => {
    return trips.filter(t => {
      const matchVehicle = selectedVehicleId === 'all' || t.vehicle_id === selectedVehicleId;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        t.vehicle_name.toLowerCase().includes(q) ||
        t.start_location.toLowerCase().includes(q) ||
        t.end_location.toLowerCase().includes(q) ||
        (t.notes && t.notes.toLowerCase().includes(q)) ||
        t.created_at.toLowerCase().includes(q) ||
        t.distance_km.toString().includes(q);
      return matchVehicle && matchSearch;
    });
  }, [trips, selectedVehicleId, searchQuery]);

  // Filtered Vehicles
  const filteredVehicles = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return vehicles.filter(v => {
      if (!q) return true;
      return (
        v.make.toLowerCase().includes(q) ||
        v.model.toLowerCase().includes(q) ||
        (v.plate && v.plate.toLowerCase().includes(q)) ||
        v.year.toString().includes(q)
      );
    });
  }, [vehicles, searchQuery]);

  const handleExportCSV = () => {
    let data: any[] = [];
    let filename = '';
    
    if (activeTab === 'expenses') {
      data = filteredExpenses.map(e => ({
        ID: e.id,
        Vehicle: e.vehicle_name,
        Category: e.type,
        Amount_PKR: e.amount_pkr,
        Fuel_Liters: e.liters,
        Timestamp: e.created_at,
        Notes: e.notes || ''
      }));
      filename = `expenses_${new Date().toISOString().slice(0, 10)}.csv`;
    } else if (activeTab === 'trips') {
      data = filteredTrips.map(t => ({
        ID: t.id,
        Vehicle: t.vehicle_name,
        Start_Location: t.start_location,
        End_Location: t.end_location,
        Distance_KM: t.distance_km,
        Timestamp: t.created_at,
        Notes: t.notes || ''
      }));
      filename = `trips_${new Date().toISOString().slice(0, 10)}.csv`;
    } else {
      data = filteredVehicles.map(v => ({
        ID: v.id,
        Make: v.make,
        Model: v.model,
        Year: v.year,
        License_Plate: v.plate || ''
      }));
      filename = `vehicles_${new Date().toISOString().slice(0, 10)}.csv`;
    }

    if (data.length === 0) return;

    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    const csvContent = `${headers}\n${rows}`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalFilteredExpense = filteredExpenses.reduce((sum, e) => sum + e.amount_pkr, 0);
  const totalFilteredDistance = filteredTrips.reduce((sum, t) => sum + t.distance_km, 0);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {/* Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
              <TableIcon className="w-5 h-5" />
            </div>
            Fleet SQLite Logbook
          </h2>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Structured relational inspection, search filters, and CSV export for fleet records.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {(expenses.length > 0 || trips.length > 0) && (
            confirmClear ? (
              <div className="flex items-center gap-1.5 bg-red-950/60 border border-red-500/40 rounded-xl p-1 text-xs">
                <span className="text-red-300 px-2 font-medium">Clear all?</span>
                <button
                  type="button"
                  onClick={() => {
                    clearAllData();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  Yes, Wipe
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                id="btn-clear-logs"
                onClick={() => setConfirmClear(true)}
                title="Wipe all expenses and trips to start from complete scratch"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-900/80 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl text-xs font-medium transition-all border border-slate-800 hover:border-red-500/30 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Start Clean</span>
              </button>
            )
          )}

          <button
            type="button"
            id="btn-export-csv"
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs sm:text-sm font-medium transition-all border border-slate-700/80 shadow-sm cursor-pointer"
          >
            <Download className="w-4 h-4 text-purple-400" />
            Export CSV
          </button>

          {onNavigate && (
            <button
              type="button"
              id="btn-add-entry-shortcut"
              onClick={() => onNavigate('data')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-md shadow-purple-600/25 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Entry
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search Filter Toolbar */}
      <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-xl space-y-4">
        
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Main Category Tabs */}
          <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
            {[
              { id: 'expenses', label: 'Expenses', icon: Fuel, count: expenses.length },
              { id: 'trips', label: 'Trips', icon: Navigation, count: trips.length },
              { id: 'vehicles', label: 'Vehicles', icon: Car, count: vehicles.length },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                id={`tab-logbook-${tab.id}`}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSearchQuery('');
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span>{tab.label}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  activeTab === tab.id ? 'bg-purple-800/70 text-purple-200' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Quick Database Reset */}
          <button
            type="button"
            id="btn-reset-demo-data"
            onClick={() => {
              if (window.confirm('Reset fleet database to default sample records?')) {
                resetToDefaults();
              }
            }}
            className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors ml-auto"
          >
            <RotateCcw className="w-3 h-3" /> Reset Sample Data
          </button>
        </div>

        {/* Search & Filter Controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              id="logbook-search-input"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={`Search ${activeTab} by vehicle, location, amount, notes, or date...`}
              className="w-full bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Vehicle Dropdown Filter (for expenses and trips) */}
          {activeTab !== 'vehicles' && (
            <div className="flex items-center gap-2 bg-slate-950/90 border border-slate-800 rounded-xl px-3 py-1.5 shrink-0">
              <Filter className="w-3.5 h-3.5 text-purple-400" />
              <select
                id="logbook-vehicle-filter"
                value={selectedVehicleId}
                onChange={e => setSelectedVehicleId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                className="bg-transparent text-white text-xs sm:text-sm font-medium focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900 text-white">All Vehicles</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id} className="bg-slate-900 text-white">
                    {v.make} {v.model} ({v.plate || v.year})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Live Status Metric Bar */}
        <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
          {activeTab === 'expenses' && (
            <>
              <span>Showing {filteredExpenses.length} of {expenses.length} expenses</span>
              <span className="font-medium text-emerald-400 font-mono">
                Total: {formatCurrency(totalFilteredExpense)}
              </span>
            </>
          )}
          {activeTab === 'trips' && (
            <>
              <span>Showing {filteredTrips.length} of {trips.length} trips</span>
              <span className="font-medium text-indigo-400 font-mono">
                Total Distance: {totalFilteredDistance.toLocaleString()} km
              </span>
            </>
          )}
          {activeTab === 'vehicles' && (
            <span>Showing {filteredVehicles.length} of {vehicles.length} registered vehicles</span>
          )}
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <AnimatePresence mode="wait">
          
          {/* EXPENSES TAB */}
          {activeTab === 'expenses' && (
            <motion.div 
              key="expenses-table"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Amount</th>
                    <th className="px-5 py-3.5">Volume (L)</th>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Notes & Reference</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredExpenses.map((e) => (
                    <tr key={e.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-500">#{e.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        {e.vehicle_name}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          e.type === 'Fuel' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                            : e.type === 'Maintenance'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                              : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                        }`}>
                          {e.type}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-emerald-400">
                        {formatCurrency(e.amount_pkr)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {e.liters > 0 ? `${e.liters} L` : '—'}
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-400/80" />
                          {formatDateTime(e.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs max-w-xs truncate">
                        {e.notes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button 
                          type="button"
                          onClick={() => deleteExpense(e.id)}
                          aria-label={`Delete expense ${e.id}`}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredExpenses.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No matching expenses found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* TRIPS TAB */}
          {activeTab === 'trips' && (
            <motion.div 
              key="trips-table"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              className="overflow-x-auto"
            >
              <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-5 py-3.5">ID</th>
                    <th className="px-5 py-3.5">Vehicle</th>
                    <th className="px-5 py-3.5">Origin</th>
                    <th className="px-5 py-3.5">Destination</th>
                    <th className="px-5 py-3.5">Distance</th>
                    <th className="px-5 py-3.5">Date & Time</th>
                    <th className="px-5 py-3.5">Notes</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredTrips.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-slate-500">#{t.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-200">{t.vehicle_name}</td>
                      <td className="px-5 py-3.5 text-slate-300 flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        {t.start_location}
                      </td>
                      <td className="px-5 py-3.5 text-slate-300">
                        <span className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-red-400" />
                          {t.end_location}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-indigo-400">
                        {t.distance_km} km
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 font-mono text-xs">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-purple-400/80" />
                          {formatDateTime(t.created_at)}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400 text-xs max-w-xs truncate">
                        {t.notes || '—'}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button 
                          type="button"
                          onClick={() => deleteTrip(t.id)}
                          aria-label={`Delete trip ${t.id}`}
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filteredTrips.length === 0 && (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                        No matching trips found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </motion.div>
          )}

          {/* VEHICLES TAB */}
          {activeTab === 'vehicles' && (
            <motion.div 
              key="vehicles-table"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
            >
              <div className="flex justify-between items-center px-6 py-4 bg-slate-950/40 border-b border-slate-800">
                <span className="text-xs sm:text-sm font-medium text-slate-300">
                  {vehicles.length} Fleet Vehicles Registered
                </span>
                <button 
                  type="button"
                  id="btn-toggle-register-vehicle"
                  onClick={() => setShowAddVehicle(!showAddVehicle)}
                  className="flex items-center gap-1.5 text-xs font-semibold bg-white text-slate-900 px-3 py-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Register Vehicle
                </button>
              </div>

              {/* Add Vehicle Inline Form */}
              <AnimatePresence>
                {showAddVehicle && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-b border-slate-800 bg-slate-900/90 overflow-hidden"
                  >
                    <form onSubmit={handleAddVehicle} className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
                      <div>
                        <label htmlFor="veh-make-input" className="block text-xs font-medium text-slate-400 mb-1.5">Make</label>
                        <input
                          id="veh-make-input"
                          type="text"
                          required
                          value={make}
                          onChange={e => setMake(e.target.value)}
                          placeholder="e.g. Toyota"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="veh-model-input" className="block text-xs font-medium text-slate-400 mb-1.5">Model</label>
                        <input
                          id="veh-model-input"
                          type="text"
                          required
                          value={model}
                          onChange={e => setModel(e.target.value)}
                          placeholder="e.g. Corolla Altis"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all"
                        />
                      </div>
                      <div>
                        <label htmlFor="veh-year-input" className="block text-xs font-medium text-slate-400 mb-1.5">Year</label>
                        <input
                          id="veh-year-input"
                          type="number"
                          required
                          min="1990"
                          max="2030"
                          value={year}
                          onChange={e => setYear(parseInt(e.target.value) || 2024)}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-mono"
                        />
                      </div>
                      <div>
                        <label htmlFor="veh-plate-input" className="block text-xs font-medium text-slate-400 mb-1.5">License Plate</label>
                        <input
                          id="veh-plate-input"
                          type="text"
                          value={plate}
                          onChange={e => setPlate(e.target.value)}
                          placeholder="e.g. LHR-2024"
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 transition-all font-mono uppercase"
                        />
                      </div>
                      <button
                        type="submit"
                        id="btn-submit-vehicle"
                        className="w-full bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors cursor-pointer shadow-md shadow-purple-600/20"
                      >
                        Save Vehicle
                      </button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm whitespace-nowrap">
                  <thead className="bg-slate-950/90 text-slate-400 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-5 py-3.5">ID</th>
                      <th className="px-5 py-3.5">Make</th>
                      <th className="px-5 py-3.5">Model</th>
                      <th className="px-5 py-3.5">Year</th>
                      <th className="px-5 py-3.5">Plate Number</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {filteredVehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="px-5 py-3.5 font-mono text-slate-500">#{v.id}</td>
                        <td className="px-5 py-3.5 font-medium text-slate-200">{v.make}</td>
                        <td className="px-5 py-3.5 text-slate-200">{v.model}</td>
                        <td className="px-5 py-3.5 font-mono text-slate-400">{v.year}</td>
                        <td className="px-5 py-3.5 font-mono font-medium text-purple-400">
                          {v.plate || '—'}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button 
                            type="button"
                            onClick={() => deleteVehicle(v.id)}
                            aria-label={`Delete vehicle ${v.id}`}
                            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
