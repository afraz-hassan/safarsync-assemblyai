import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, 
  MicOff, 
  Play, 
  Volume2, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Keyboard, 
  Send, 
  Sparkles, 
  RotateCcw,
  Navigation,
  Fuel,
  Wrench,
  Shield,
  Radio,
  Calendar,
  Clock,
  Car,
  FileText,
  Table as TableIcon,
  MapPin,
  User,
  Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppContext } from '../context/AppContext';
import { askGemini, askGeminiAudio, checkGeminiStatus } from '../lib/gemini';
import { formatCurrency, formatDateTime } from '../lib/utils';

const SAMPLE_COMMANDS = [
  "I just spent 4000 rupees on 20 liters of petrol in Lahore",
  "Paid 6500 rupees for oil change and brake service on Corolla",
  "Paid 14500 rupees for annual insurance tracker renewal",
  "Drove 180 km from Lahore to Faisalabad",
  "What is my total fuel expense so far?",
];

interface DataEntryProps {
  onNavigate?: (tab: 'data' | 'dashboard' | 'logbook') => void;
}

export function DataEntry({ onNavigate }: DataEntryProps) {
  const { vehicles, expenses, trips, addExpense, addTrip, userProfile, setIsOnboardingOpen } = useAppContext();
  
  const [entryMode, setEntryMode] = useState<'voice' | 'manual'>('voice');
  
  // Voice & Input State
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [transcript, setTranscript] = useState<string>("");
  const [lastAction, setLastAction] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<any>({ hasAssemblyAiKey: true, assemblyAiConnected: true });

  // Current local time string helper: "YYYY-MM-DDTHH:mm"
  const getCurrentLocalDateTime = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().slice(0, 16);
  };

  // Manual Form State
  const [manualType, setManualType] = useState<'Fuel' | 'Maintenance' | 'Insurance' | 'Trip'>('Fuel');
  const [manualVehicleId, setManualVehicleId] = useState<number>(vehicles[0]?.id || 1);
  const [manualDate, setManualDate] = useState<string>(getCurrentLocalDateTime);
  const [manualAmount, setManualAmount] = useState<string>("");
  const [manualLiters, setManualLiters] = useState<string>("");
  const [manualStart, setManualStart] = useState<string>("");
  const [manualEnd, setManualEnd] = useState<string>("");
  const [manualDistance, setManualDistance] = useState<string>("");
  const [manualNotes, setManualNotes] = useState<string>("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Sync default vehicle selection if vehicles array updates
  useEffect(() => {
    if (vehicles.length > 0 && !vehicles.some(v => v.id === manualVehicleId)) {
      setManualVehicleId(vehicles[0].id);
    }
  }, [vehicles, manualVehicleId]);

  // Check AI status on mount
  useEffect(() => {
    checkGeminiStatus().then((status) => {
      setAiStatus(status);
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      audioChunksRef.current = [];

      // Cross-device getUserMedia
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        } 
      });
      
      // Determine optimal MIME type across iOS Safari, Chrome, Android, Edge
      let mimeType: string | undefined;
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/webm')) {
        mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      }
      
      const mediaRecorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordedBlob = new Blob(audioChunksRef.current, { 
          type: mediaRecorder.mimeType || 'audio/webm' 
        });
        await processAudio(recordedBlob);
      };

      mediaRecorder.start(250); // Slice data every 250ms for reliable chunks
      setIsRecording(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn("Microphone access error:", err);
      setError("Microphone permission was denied or is unavailable on this device. You can type your command below or use sample prompts.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  const handleResultAction = (result: any, sourceLabel: string) => {
    setLastAction({ ...result, source: sourceLabel });
    
    // If transcription occurred, surface it
    if (result.transcript) {
      setTranscript(result.transcript);
    }

    // Auto-commit action into React context database
    if (result.actionType === 'LOG_DATA') {
      const vehicleMatch = vehicles.find(v => 
        (result.vehicle && `${v.make} ${v.model}`.toLowerCase().includes(result.vehicle.toLowerCase()))
      ) || vehicles[0];

      const vehicleName = vehicleMatch ? `${vehicleMatch.make} ${vehicleMatch.model}` : "General Fleet";
      const vehicleId = vehicleMatch ? vehicleMatch.id : 1;

      const dateStr = result.date || getCurrentLocalDateTime().replace('T', ' ');

      if (result.logType === 'Trip') {
        addTrip({
          vehicle_id: vehicleId,
          vehicle_name: vehicleName,
          start_location: result.start_location || "Origin",
          end_location: result.end_location || "Destination",
          distance_km: Math.max(0, Number(result.distance_km) || 0),
          notes: result.transcript,
          created_at: dateStr,
        });
      } else {
        addExpense({
          vehicle_id: vehicleId,
          vehicle_name: vehicleName,
          type: result.logType || 'Fuel',
          amount_pkr: Math.max(0, Number(result.amount) || 0),
          liters: Math.max(0, Number(result.liters) || 0),
          notes: result.transcript,
          created_at: dateStr,
        });
      }
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    setIsProcessing(true);
    setError(null);
    try {
      const result = await askGeminiAudio(audioBlob, { vehicles, expenses, trips });
      handleResultAction(result, "AssemblyAI Universal-3");
    } catch (err: any) {
      console.error("Audio processing failed", err);
      setError(err.message || "Voice processing failed. Please try again or type your command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const executeTextCommand = async (text: string, source: string) => {
    if (!text.trim()) return;
    setIsProcessing(true);
    setError(null);
    setTranscript(text);
    try {
      const result = await askGemini(text, { vehicles, expenses, trips });
      handleResultAction(result, source);
      setTextInput("");
    } catch (err: any) {
      console.error("Text processing failed", err);
      setError(err.message || "Failed to process text command.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vehicle = vehicles.find(v => v.id === manualVehicleId) || vehicles[0];
    const vName = vehicle ? `${vehicle.make} ${vehicle.model}` : "Vehicle";
    
    // Clean formatted datetime "YYYY-MM-DD HH:mm"
    const timestamp = manualDate 
      ? manualDate.replace('T', ' ') 
      : getCurrentLocalDateTime().replace('T', ' ');

    let actionRecord: any = null;

    if (manualType === 'Trip') {
      const dist = Math.max(0, parseFloat(manualDistance) || 0);
      addTrip({ 
        vehicle_id: vehicle.id, 
        vehicle_name: vName, 
        start_location: manualStart || "Origin", 
        end_location: manualEnd || "Destination", 
        distance_km: dist, 
        notes: manualNotes.trim() || undefined,
        created_at: timestamp 
      });
      actionRecord = { 
        actionType: "LOG_DATA",
        logType: "Trip",
        start_location: manualStart, 
        end_location: manualEnd, 
        distance_km: dist,
        date: timestamp,
        transcript: manualNotes.trim() || undefined,
        reply: `Successfully recorded journey from ${manualStart || "Origin"} to ${manualEnd || "Destination"} (${dist} km) for ${formatDateTime(timestamp)}.` 
      };
      setManualStart("");
      setManualEnd("");
      setManualDistance("");
    } else {
      const amount = Math.max(0, parseFloat(manualAmount) || 0);
      const liters = manualType === 'Fuel' ? Math.max(0, parseFloat(manualLiters) || 0) : 0;
      addExpense({ 
        vehicle_id: vehicle.id, 
        vehicle_name: vName, 
        type: manualType, 
        amount_pkr: amount, 
        liters, 
        notes: manualNotes.trim() || undefined,
        created_at: timestamp 
      });
      actionRecord = { 
        actionType: "LOG_DATA",
        logType: manualType,
        amount, 
        liters,
        date: timestamp,
        transcript: manualNotes.trim() || undefined,
        reply: `Successfully recorded ${manualType} of ${formatCurrency(amount)} on ${formatDateTime(timestamp)}.` 
      };
      setManualAmount("");
      setManualLiters("");
    }

    setManualNotes("");
    setTranscript(`Manual Form Submission: ${manualType} (${vName})`);
    setLastAction({ ...actionRecord, source: "Manual Form", confidence: 1.0 });
  };

  return (
    <div className="space-y-6">
      {/* Header & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md">
              <Mic className="w-5 h-5" />
            </div>
            Vehicle Data & Voice Entry
          </h2>
          <p className="text-slate-400 mt-1 text-sm sm:text-base">
            Natural speech recognition by <span className="text-purple-400 font-semibold">AssemblyAI Speech Intelligence</span>, backed by structured manual logging.
          </p>

          {userProfile && (
            <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/25 text-xs text-purple-200">
              <User className="w-3.5 h-3.5 text-purple-400" />
              <span>
                Active Driver: <strong className="text-white">{userProfile.name}</strong> • Vehicle:{' '}
                <strong className="text-white">{userProfile.vehicleMake} {userProfile.vehicleModel}</strong>
                {userProfile.plate ? ` (${userProfile.plate})` : ''}
              </span>
              <button
                type="button"
                onClick={() => setIsOnboardingOpen(true)}
                className="text-purple-400 hover:text-white underline ml-1 cursor-pointer font-medium flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Navigation Mode Switcher */}
        <div className="flex bg-slate-900/90 p-1 rounded-xl border border-slate-800 self-start sm:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            id="tab-voice-mode"
            onClick={() => setEntryMode('voice')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              entryMode === 'voice' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mic className="w-4 h-4" /> Voice & AI
          </button>
          <button
            type="button"
            id="tab-manual-mode"
            onClick={() => setEntryMode('manual')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              entryMode === 'manual' 
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Keyboard className="w-4 h-4" /> Manual Form
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div className="text-sm flex-1">
            <p className="font-semibold mb-0.5">Notice</p>
            <p className="text-red-300/90">{error}</p>
          </div>
        </div>
      )}

      {/* 2-Column Responsive Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        
        {/* Left Column: Input Surface */}
        <AnimatePresence mode="wait">
          {entryMode === 'voice' ? (
            <motion.div 
              key="voice-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-7 flex flex-col justify-between relative overflow-hidden shadow-xl"
            >
              {/* Assembly AI Connected Live Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Radio className="w-3.5 h-3.5 text-purple-400" />
                  Primary Voice Recognition
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/15 border border-purple-500/30 text-purple-300 shadow-sm shadow-purple-500/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  AssemblyAI Connected
                </span>
              </div>

              {/* Mic Centerpiece & Audio Waveform */}
              <div className="py-6 flex flex-col items-center justify-center text-center">
                <button
                  type="button"
                  id="btn-voice-record"
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isProcessing}
                  aria-label={isRecording ? "Stop Recording" : "Start Voice Recording"}
                  className={`relative w-28 h-28 sm:w-36 sm:h-36 rounded-full flex items-center justify-center transition-all duration-300 select-none cursor-pointer ${
                    isRecording 
                      ? 'bg-red-500 text-white shadow-[0_0_50px_rgba(239,68,68,0.55)] scale-105' 
                      : 'bg-gradient-to-b from-slate-800 to-slate-900 hover:from-purple-950/40 hover:to-slate-800 text-purple-400 border border-slate-700/80 shadow-xl hover:shadow-purple-500/20'
                  }`}
                >
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-red-500/30 pointer-events-none" />
                  )}
                  {isRecording ? (
                    <MicOff className="w-12 h-12 sm:w-14 sm:h-14 text-white" />
                  ) : (
                    <Mic className="w-12 h-12 sm:w-14 sm:h-14" />
                  )}
                </button>

                {/* Animated Waveform Bars when recording */}
                {isRecording && (
                  <div className="flex items-center gap-1 mt-4 h-6">
                    {[40, 75, 100, 60, 90, 45, 80, 55, 95, 70, 85, 50].map((h, idx) => (
                      <span
                        key={idx}
                        className="w-1 bg-purple-400 rounded-full animate-pulse"
                        style={{ 
                          height: `${Math.max(20, h * 0.25)}px`,
                          animationDelay: `${idx * 0.08}s` 
                        }}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-4">
                  <h3 className="text-lg sm:text-xl font-bold text-white">
                    {isRecording ? (
                      <span className="text-red-400 flex items-center justify-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                        Listening via AssemblyAI... {recordingSeconds}s
                      </span>
                    ) : (
                      'Tap to Speak with AssemblyAI'
                    )}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                    {isRecording 
                      ? 'Tap again when finished to transcribe with domain-boosted speech intelligence.'
                      : 'Log fuel, repairs, motorway trips, or query fleet stats in plain English or Urdu/Roman Urdu.'}
                  </p>
                </div>
              </div>

              {/* Direct Text Prompt Bar */}
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  executeTextCommand(textInput, "Text Input");
                }}
                className="mt-2 mb-4"
              >
                <div className="relative flex items-center">
                  <input
                    type="text"
                    id="input-text-command"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Or type command: e.g. Spent 4000 rupees on petrol..."
                    disabled={isProcessing || isRecording}
                    className="w-full bg-slate-950/90 border border-slate-800 focus:border-purple-500 rounded-2xl py-3 pl-4 pr-12 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  />
                  <button
                    type="submit"
                    id="btn-submit-text-command"
                    disabled={!textInput.trim() || isProcessing || isRecording}
                    className="absolute right-2 p-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-40 disabled:hover:bg-purple-600 transition-colors cursor-pointer"
                    aria-label="Send text command"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </form>

              {/* Quick Sample Prompts */}
              <div className="pt-4 border-t border-slate-800/80">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5 px-1">
                  Quick Voice Scenarios (Tap to test)
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SAMPLE_COMMANDS.slice(0, 4).map((cmd, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => executeTextCommand(cmd, "Quick Example")}
                      disabled={isProcessing || isRecording}
                      className="text-left text-xs bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800/80 hover:border-purple-500/40 text-slate-300 p-2.5 rounded-xl flex items-center justify-between gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      <span className="truncate">"{cmd}"</span>
                      <Play className="w-3 h-3 text-purple-400 shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="manual-panel"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-3xl p-5 sm:p-7 shadow-xl"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                  <Keyboard className="w-5 h-5 text-purple-400" />
                  Manual Entry Form
                </h3>
                <span className="text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-700/60 font-mono">
                  SQLite Direct Log
                </span>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-4">
                
                {/* Visual Category Selector Cards */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Entry Category
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'Fuel', label: 'Fuel', icon: Fuel, color: 'text-amber-400', border: 'border-amber-500/30' },
                      { id: 'Maintenance', label: 'Service', icon: Wrench, color: 'text-cyan-400', border: 'border-cyan-500/30' },
                      { id: 'Insurance', label: 'Insurance', icon: Shield, color: 'text-blue-400', border: 'border-blue-500/30' },
                      { id: 'Trip', label: 'Trip / Mileage', icon: Navigation, color: 'text-indigo-400', border: 'border-indigo-500/30' }
                    ].map(cat => {
                      const isSelected = manualType === cat.id;
                      const Icon = cat.icon;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          id={`cat-select-${cat.id.toLowerCase()}`}
                          onClick={() => setManualType(cat.id as any)}
                          className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all cursor-pointer ${
                            isSelected
                              ? `bg-purple-950/40 border-purple-500 text-white shadow-md shadow-purple-950/50 ring-1 ring-purple-500/40`
                              : `bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700`
                          }`}
                        >
                          <Icon className={`w-5 h-5 mb-1 ${cat.color}`} />
                          <span className="text-xs font-semibold">{cat.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Vehicle Selection */}
                <div>
                  <label htmlFor="manual-vehicle-select" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <Car className="w-3.5 h-3.5 text-purple-400" />
                    Target Vehicle
                  </label>
                  <select 
                    id="manual-vehicle-select"
                    value={manualVehicleId}
                    onChange={e => setManualVehicleId(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                  >
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.make} {v.model} ({v.year}) {v.plate ? `• ${v.plate}` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* DATE & TIME INPUT (Explicitly Requested) */}
                <div className="bg-slate-950/60 border border-purple-500/20 rounded-2xl p-3.5">
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="manual-entry-datetime" className="flex items-center gap-1.5 text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      <Calendar className="w-3.5 h-3.5 text-purple-400" />
                      Transaction Date & Time
                    </label>
                    <button
                      type="button"
                      id="btn-set-datetime-now"
                      onClick={() => setManualDate(getCurrentLocalDateTime())}
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20"
                    >
                      <Clock className="w-3 h-3" /> Set to Now
                    </button>
                  </div>
                  <input 
                    id="manual-entry-datetime"
                    type="datetime-local" 
                    required
                    value={manualDate}
                    onChange={e => setManualDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700/80 hover:border-slate-600 focus:border-purple-500 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-purple-500 transition-all font-mono"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Allows logging past expenses or backdated journeys into your SQLite database.
                  </p>
                </div>

                {/* Category-Specific Fields */}
                {manualType !== 'Trip' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className={manualType === 'Fuel' ? "col-span-1" : "col-span-1 sm:col-span-2"}>
                      <label htmlFor="manual-entry-amount" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Amount (PKR)
                      </label>
                      <input 
                        id="manual-entry-amount"
                        type="number" 
                        required 
                        min="1"
                        value={manualAmount}
                        onChange={e => setManualAmount(e.target.value)}
                        placeholder="e.g. 5000"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                    {manualType === 'Fuel' && (
                      <div>
                        <label htmlFor="manual-entry-liters" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                          Fuel Volume (Liters)
                        </label>
                        <input 
                          id="manual-entry-liters"
                          type="number" 
                          step="0.01"
                          required 
                          min="0.1"
                          value={manualLiters}
                          onChange={e => setManualLiters(e.target.value)}
                          placeholder="e.g. 18.5"
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="manual-entry-start" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-400" /> Origin
                        </label>
                        <input 
                          id="manual-entry-start"
                          type="text" 
                          required 
                          value={manualStart}
                          onChange={e => setManualStart(e.target.value)}
                          placeholder="e.g. Lahore Cantt"
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                      <div>
                        <label htmlFor="manual-entry-end" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-red-400" /> Destination
                        </label>
                        <input 
                          id="manual-entry-end"
                          type="text" 
                          required 
                          value={manualEnd}
                          onChange={e => setManualEnd(e.target.value)}
                          placeholder="e.g. Islamabad F-7"
                          className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="manual-entry-distance" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                        Distance (KM)
                      </label>
                      <input 
                        id="manual-entry-distance"
                        type="number" 
                        required
                        min="0.1"
                        step="0.1"
                        value={manualDistance}
                        onChange={e => setManualDistance(e.target.value)}
                        placeholder="e.g. 375"
                        className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </>
                )}

                {/* Notes / Memo Field */}
                <div>
                  <label htmlFor="manual-entry-notes" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5 text-purple-400" />
                    Notes & Reference <span className="text-slate-500 font-normal lowercase">(optional)</span>
                  </label>
                  <input 
                    id="manual-entry-notes"
                    type="text" 
                    value={manualNotes}
                    onChange={e => setManualNotes(e.target.value)}
                    placeholder={manualType === 'Fuel' ? 'e.g. Shell Cantt Station, full tank' : manualType === 'Trip' ? 'e.g. Client visit, M-2 Motorway toll' : 'e.g. 10,000km service & oil filter'}
                    className="w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <button
                  type="submit"
                  id="btn-save-manual-entry"
                  className="w-full mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-purple-600/25 flex justify-center items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" /> Save Record to Fleet Database
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Right Column: Output & Confirmation Section */}
        <div className="flex flex-col">
          <AnimatePresence mode="wait">
            {isProcessing ? (
              <motion.div 
                key="processing"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center min-h-[420px] shadow-xl"
              >
                <div className="w-16 h-16 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4">
                  <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
                </div>
                <h3 className="text-lg font-bold text-white">Transcribing with AssemblyAI</h3>
                <p className="text-slate-400 text-sm mt-1 max-w-xs">
                  Applying speech recognition with domain word-boosting, extracting fleet parameters...
                </p>
              </motion.div>
            ) : lastAction ? (
              <motion.div 
                key="action-recorded"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/60 backdrop-blur-xl border border-emerald-500/30 rounded-3xl p-5 sm:p-7 flex-1 flex flex-col justify-between shadow-xl"
              >
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base sm:text-lg font-bold text-emerald-400">
                        {lastAction.tool === 'ask_assistant' ? 'AI Response' : 'Record Confirmed & Saved'}
                      </h3>
                    </div>
                    <span className="text-[11px] px-3 py-1 rounded-full bg-purple-500/15 border border-purple-500/30 text-purple-300 font-semibold flex items-center gap-1.5 shadow-sm">
                      <Sparkles className="w-3 h-3 text-purple-400" />
                      {lastAction.source || "AssemblyAI Voice"}
                    </span>
                  </div>

                  <div className="space-y-4">
                    {/* Transcript / Input Query */}
                    {transcript && (
                      <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800">
                        <div className="flex items-center justify-between mb-1.5">
                          <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Volume2 className="w-3.5 h-3.5 text-purple-400" /> Logged Command
                          </label>
                          {lastAction.confidence && (
                            <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              Confidence: {Math.round(lastAction.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-base text-slate-100 font-medium leading-snug italic">
                          "{transcript}"
                        </p>
                      </div>
                    )}

                    {/* AI Reply / Confirmation Statement */}
                    <div className="bg-purple-500/10 border border-purple-500/20 rounded-2xl p-4">
                      <p className="text-sm sm:text-base text-purple-200 font-medium leading-relaxed">
                        {lastAction.reply}
                      </p>
                    </div>

                    {/* Parsed Operation Badges */}
                    {lastAction.args && (
                      <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800">
                        <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2.5">
                          Database Stored Telemetry
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lastAction.args.vehicle && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200">
                              <Car className="w-3 h-3 text-purple-400" />
                              {lastAction.args.vehicle}
                            </span>
                          )}
                          {lastAction.args.type && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-200">
                              {lastAction.args.type === 'Fuel' ? <Fuel className="w-3 h-3 text-amber-400" /> : <Wrench className="w-3 h-3 text-cyan-400" />}
                              {lastAction.args.type}
                            </span>
                          )}
                          {lastAction.args.amount_pkr !== undefined && lastAction.args.amount_pkr > 0 && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300">
                              {formatCurrency(lastAction.args.amount_pkr)}
                            </span>
                          )}
                          {lastAction.args.liters !== undefined && lastAction.args.liters > 0 && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300">
                              {lastAction.args.liters} Liters
                            </span>
                          )}
                          {lastAction.args.distance_km !== undefined && lastAction.args.distance_km > 0 && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-500/20 text-indigo-300">
                              <Navigation className="w-3 h-3 text-indigo-400" />
                              {lastAction.args.distance_km} KM
                            </span>
                          )}
                          {lastAction.args.start_location && (
                            <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                              {lastAction.args.start_location} → {lastAction.args.end_location}
                            </span>
                          )}
                          {lastAction.args.date && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                              <Calendar className="w-3 h-3 text-purple-400" />
                              {formatDateTime(lastAction.args.date)}
                            </span>
                          )}
                          {lastAction.args.notes && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 text-slate-300">
                              <FileText className="w-3 h-3 text-slate-400" />
                              {lastAction.args.notes}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action Controls */}
                <div className="pt-5 mt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2">
                  {onNavigate && (
                    <button
                      type="button"
                      id="btn-nav-to-logbook"
                      onClick={() => onNavigate('logbook')}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors cursor-pointer shadow-md shadow-purple-600/20"
                    >
                      <TableIcon className="w-3.5 h-3.5" />
                      View in SQLite Logbook
                    </button>
                  )}
                  <button
                    type="button"
                    id="btn-new-entry-reset"
                    onClick={() => {
                      setLastAction(null);
                      setTranscript("");
                      setError(null);
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer ml-auto"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    New Entry
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div 
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-slate-900/30 border border-slate-800/60 border-dashed rounded-3xl p-6 sm:p-8 flex-1 flex flex-col items-center justify-center text-center min-h-[420px]"
              >
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mb-4 text-purple-400">
                  <Mic className="w-8 h-8" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-slate-200">Awaiting Spoken Entry</h3>
                <p className="text-slate-400 text-xs sm:text-sm mt-1.5 max-w-xs leading-relaxed">
                  Tap the microphone or use the manual form with custom date & time to log entries. AssemblyAI Speech Intelligence transcribes speech with precision.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
