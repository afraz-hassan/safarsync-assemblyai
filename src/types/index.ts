export interface Vehicle {
  id: number;
  make: string;
  model: string;
  year: number;
  plate?: string;
}

export interface UserProfile {
  name: string;
  vehicleMake: string;
  vehicleModel: string;
  year: number;
  plate?: string;
  updatedAt: string;
}

export interface Expense {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  type: 'Fuel' | 'Maintenance' | 'Insurance';
  amount_pkr: number;
  liters: number;
  notes?: string;
  created_at: string;
}

export interface Trip {
  id: number;
  vehicle_id: number;
  vehicle_name: string;
  start_location: string;
  end_location: string;
  distance_km: number;
  notes?: string;
  created_at: string;
}

export interface ActionRecord {
  tool: string;
  args: Record<string, any>;
  reply: string;
  type: string;
  source: string;
  confidence?: number | null;
}
