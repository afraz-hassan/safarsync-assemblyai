import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vehicle, Expense, Trip, UserProfile } from '../types';

interface AppContextType {
  userProfile: UserProfile | null;
  saveUserProfile: (profile: UserProfile) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  vehicles: Vehicle[];
  expenses: Expense[];
  trips: Trip[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: number, vehicle: Partial<Vehicle>) => void;
  deleteVehicle: (id: number) => void;
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: number, expense: Partial<Expense>) => void;
  deleteExpense: (id: number) => void;
  addTrip: (trip: Omit<Trip, 'id'>) => void;
  updateTrip: (id: number, trip: Partial<Trip>) => void;
  deleteTrip: (id: number) => void;
  clearAllData: () => void;
  resetToDefaults: () => void;
}

// Clean slate: no pre-existing fake expenses or trips
const DEFAULT_EXPENSES: Expense[] = [];
const DEFAULT_TRIPS: Trip[] = [];

const FRESH_START_FLAG = 'safarsync_fresh_start_v2';

// Auto-purge any stale mock data previously stored in client browser
try {
  if (typeof window !== 'undefined' && localStorage.getItem(FRESH_START_FLAG) !== 'true') {
    // Clear old demo mock data from previous builds
    localStorage.removeItem('fleet_expenses');
    localStorage.removeItem('fleet_trips');
    
    // If the saved vehicles contain default demo seeds, clean them up
    const savedVehicles = localStorage.getItem('fleet_vehicles');
    if (savedVehicles && (savedVehicles.includes('Civic RS Turbo') || savedVehicles.includes('Tucson AWD'))) {
      localStorage.removeItem('fleet_vehicles');
    }
    
    localStorage.setItem(FRESH_START_FLAG, 'true');
  }
} catch (e) {
  console.warn('Storage migration notice', e);
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem('fleet_user_profile');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed.name === 'string' && parsed.name.trim().length > 0) {
          return parsed;
        }
      }
      return null;
    } catch {
      return null;
    }
  });

  // Automatically open onboarding on first visit if user has no saved profile
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('fleet_user_profile');
    } catch {
      return false;
    }
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    try {
      const saved = localStorage.getItem('fleet_vehicles');
      const parsed = saved ? JSON.parse(saved) : null;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
      // If user has a profile saved, register their single vehicle
      const savedProfileStr = localStorage.getItem('fleet_user_profile');
      if (savedProfileStr) {
        const profile = JSON.parse(savedProfileStr);
        if (profile?.vehicleMake && profile?.vehicleModel) {
          return [{
            id: 1,
            make: profile.vehicleMake,
            model: profile.vehicleModel,
            year: profile.year || 2023,
            plate: profile.plate
          }];
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    try {
      const saved = localStorage.getItem('fleet_expenses');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : DEFAULT_EXPENSES;
    } catch {
      return DEFAULT_EXPENSES;
    }
  });

  const [trips, setTrips] = useState<Trip[]>(() => {
    try {
      const saved = localStorage.getItem('fleet_trips');
      const parsed = saved ? JSON.parse(saved) : null;
      return Array.isArray(parsed) ? parsed : DEFAULT_TRIPS;
    } catch {
      return DEFAULT_TRIPS;
    }
  });

  // Local storage synchronization
  useEffect(() => {
    try {
      localStorage.setItem('fleet_vehicles', JSON.stringify(vehicles));
    } catch (e) {
      console.warn('Could not save vehicles to localStorage', e);
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_expenses', JSON.stringify(expenses));
    } catch (e) {
      console.warn('Could not save expenses to localStorage', e);
    }
  }, [expenses]);

  useEffect(() => {
    try {
      localStorage.setItem('fleet_trips', JSON.stringify(trips));
    } catch (e) {
      console.warn('Could not save trips to localStorage', e);
    }
  }, [trips]);

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    setVehicles(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(v => v.id)) + 1 : 1;
      return [{ ...vehicle, id: newId }, ...prev];
    });
  };

  const updateVehicle = (id: number, vehicle: Partial<Vehicle>) => {
    setVehicles(prev => prev.map(v => v.id === id ? { ...v, ...vehicle } : v));
  };

  const deleteVehicle = (id: number) => {
    setVehicles(prev => prev.filter(v => v.id !== id));
  };

  const addExpense = (expense: Omit<Expense, 'id'>) => {
    setExpenses(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(e => e.id)) + 1 : 1;
      return [{ ...expense, id: newId }, ...prev];
    });
  };

  const updateExpense = (id: number, expense: Partial<Expense>) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, ...expense } : e));
  };

  const deleteExpense = (id: number) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
  };

  const addTrip = (trip: Omit<Trip, 'id'>) => {
    setTrips(prev => {
      const newId = prev.length > 0 ? Math.max(...prev.map(t => t.id)) + 1 : 1;
      return [{ ...trip, id: newId }, ...prev];
    });
  };

  const updateTrip = (id: number, trip: Partial<Trip>) => {
    setTrips(prev => prev.map(t => t.id === id ? { ...t, ...trip } : t));
  };

  const deleteTrip = (id: number) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  const saveUserProfile = (profile: UserProfile) => {
    setUserProfile(profile);
    try {
      localStorage.setItem('fleet_user_profile', JSON.stringify(profile));
    } catch (e) {
      console.warn('Could not save user profile to localStorage', e);
    }

    // Ensure their vehicle is registered and set at the top of the vehicles list
    setVehicles(prev => {
      const cleanPlate = (profile.plate || '').trim();
      const cleanMake = profile.vehicleMake.trim();
      const cleanModel = profile.vehicleModel.trim();

      // Check if matching vehicle already exists by plate or make & model
      const existingIndex = prev.findIndex(v => 
        (cleanPlate && v.plate?.toLowerCase() === cleanPlate.toLowerCase()) ||
        (v.make.toLowerCase() === cleanMake.toLowerCase() && v.model.toLowerCase() === cleanModel.toLowerCase())
      );

      if (existingIndex >= 0) {
        const copy = [...prev];
        copy[existingIndex] = {
          ...copy[existingIndex],
          make: cleanMake,
          model: cleanModel,
          year: profile.year,
          plate: cleanPlate || copy[existingIndex].plate
        };
        // Move to first position so it defaults across the entire app
        const [primary] = copy.splice(existingIndex, 1);
        return [primary, ...copy];
      } else {
        const newId = prev.length > 0 ? Math.max(...prev.map(v => v.id)) + 1 : 1;
        const newVehicle: Vehicle = {
          id: newId,
          make: cleanMake,
          model: cleanModel,
          year: profile.year,
          plate: cleanPlate || undefined
        };
        return [newVehicle, ...prev];
      }
    });
  };

  const clearAllData = () => {
    setExpenses([]);
    setTrips([]);
    try {
      localStorage.removeItem('fleet_expenses');
      localStorage.removeItem('fleet_trips');
    } catch (e) {
      console.warn('Could not clear logs from localStorage', e);
    }
  };

  const resetToDefaults = () => {
    setExpenses([]);
    setTrips([]);
    try {
      localStorage.removeItem('fleet_expenses');
      localStorage.removeItem('fleet_trips');
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <AppContext.Provider value={{ 
      userProfile,
      saveUserProfile,
      isOnboardingOpen,
      setIsOnboardingOpen,
      vehicles, expenses, trips, 
      addVehicle, updateVehicle, deleteVehicle, 
      addExpense, updateExpense, deleteExpense, 
      addTrip, updateTrip, deleteTrip,
      clearAllData,
      resetToDefaults
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}
