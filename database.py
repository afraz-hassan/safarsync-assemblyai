"""
Database Layer for SafarSync AI - Voice Edition
Manages SQLite connection, table schemas, and CRUD operations for:
- vehicles
- expenses
- trips
"""

import sqlite3
import pandas as pd
from typing import Optional, Dict, Any, List

DB_NAME = "safarsync.db"


def get_connection():
    """Returns a SQLite connection with row factory enabled."""
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_db():
    """Initializes the database schema and seeds initial vehicle data if empty."""
    conn = get_connection()
    cursor = conn.cursor()

    # Table 1: Vehicles
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            make TEXT NOT NULL,
            model TEXT NOT NULL,
            year INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    """)

    # Table 2: Expenses (Fuel / Maintenance)
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            type TEXT NOT NULL CHECK(type IN ('Fuel', 'Maintenance')),
            amount_pkr REAL NOT NULL,
            liters REAL DEFAULT 0.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
        );
    """)

    # Table 3: Trips
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            vehicle_id INTEGER NOT NULL,
            start_location TEXT NOT NULL,
            end_location TEXT NOT NULL,
            distance_km REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (vehicle_id) REFERENCES vehicles (id) ON DELETE CASCADE
        );
    """)

    # Seed default vehicle if table is empty
    cursor.execute("SELECT COUNT(*) FROM vehicles;")
    count = cursor.fetchone()[0]
    if count == 0:
        cursor.execute("""
            INSERT INTO vehicles (make, model, year)
            VALUES ('Toyota', 'Corolla Altis', 2022);
        """)
        vehicle_id = cursor.lastrowid
        # Seed a sample trip and expense for instant dashboard visualization
        cursor.execute("""
            INSERT INTO expenses (vehicle_id, type, amount_pkr, liters)
            VALUES (?, 'Fuel', 7500.0, 27.5);
        """, (vehicle_id,))
        cursor.execute("""
            INSERT INTO expenses (vehicle_id, type, amount_pkr, liters)
            VALUES (?, 'Maintenance', 3500.0, 0.0);
        """, (vehicle_id,))
        cursor.execute("""
            INSERT INTO trips (vehicle_id, start_location, end_location, distance_km)
            VALUES (?, 'Lahore Cantt', 'Islamabad F-7', 375.0);
        """, (vehicle_id,))

    conn.commit()
    conn.close()


def get_default_vehicle_id() -> int:
    """Gets the ID of the primary vehicle in the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM vehicles ORDER BY id ASC LIMIT 1;")
    row = cursor.fetchone()
    conn.close()
    if row:
        return row["id"]
    return 1


def add_vehicle(make: str, model: str, year: int) -> int:
    """Adds a new vehicle to the database."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO vehicles (make, model, year)
        VALUES (?, ?, ?);
    """, (make.strip(), model.strip(), int(year)))
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()
    return new_id


def add_expense(
    type: str,
    amount_pkr: float,
    liters: float = 0.0,
    vehicle_id: Optional[int] = None
) -> Dict[str, Any]:
    """Adds an expense record (Fuel or Maintenance)."""
    if vehicle_id is None:
        vehicle_id = get_default_vehicle_id()

    # Normalize type to Title Case
    normalized_type = "Fuel" if "fuel" in type.lower() or "petrol" in type.lower() or "diesel" in type.lower() else "Maintenance"

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO expenses (vehicle_id, type, amount_pkr, liters)
        VALUES (?, ?, ?, ?);
    """, (vehicle_id, normalized_type, float(amount_pkr), float(liters or 0.0)))
    conn.commit()
    expense_id = cursor.lastrowid
    conn.close()

    return {
        "status": "success",
        "action": "add_expense",
        "id": expense_id,
        "vehicle_id": vehicle_id,
        "type": normalized_type,
        "amount_pkr": float(amount_pkr),
        "liters": float(liters or 0.0)
    }


def add_trip(
    start_location: str,
    end_location: str,
    distance_km: float,
    vehicle_id: Optional[int] = None
) -> Dict[str, Any]:
    """Adds a trip record with start, end, and distance."""
    if vehicle_id is None:
        vehicle_id = get_default_vehicle_id()

    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO trips (vehicle_id, start_location, end_location, distance_km)
        VALUES (?, ?, ?, ?);
    """, (vehicle_id, start_location.strip(), end_location.strip(), float(distance_km)))
    conn.commit()
    trip_id = cursor.lastrowid
    conn.close()

    return {
        "status": "success",
        "action": "add_trip",
        "id": trip_id,
        "vehicle_id": vehicle_id,
        "start_location": start_location,
        "end_location": end_location,
        "distance_km": float(distance_km)
    }


def get_vehicles_df() -> pd.DataFrame:
    """Returns all vehicles as a pandas DataFrame."""
    conn = get_connection()
    df = pd.read_sql_query("SELECT * FROM vehicles ORDER BY id DESC;", conn)
    conn.close()
    return df


def get_expenses_df(vehicle_id: Optional[int] = None) -> pd.DataFrame:
    """Returns expenses as a pandas DataFrame."""
    conn = get_connection()
    if vehicle_id:
        query = "SELECT * FROM expenses WHERE vehicle_id = ? ORDER BY created_at DESC;"
        df = pd.read_sql_query(query, conn, params=(vehicle_id,))
    else:
        query = """
            SELECT e.id, e.vehicle_id, (v.make || ' ' || v.model) as vehicle_name,
                   e.type, e.amount_pkr, e.liters, e.created_at
            FROM expenses e
            LEFT JOIN vehicles v ON e.vehicle_id = v.id
            ORDER BY e.created_at DESC;
        """
        df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def get_trips_df(vehicle_id: Optional[int] = None) -> pd.DataFrame:
    """Returns trips as a pandas DataFrame."""
    conn = get_connection()
    if vehicle_id:
        query = "SELECT * FROM trips WHERE vehicle_id = ? ORDER BY created_at DESC;"
        df = pd.read_sql_query(query, conn, params=(vehicle_id,))
    else:
        query = """
            SELECT t.id, t.vehicle_id, (v.make || ' ' || v.model) as vehicle_name,
                   t.start_location, t.end_location, t.distance_km, t.created_at
            FROM trips t
            LEFT JOIN vehicles v ON t.vehicle_id = v.id
            ORDER BY t.created_at DESC;
        """
        df = pd.read_sql_query(query, conn)
    conn.close()
    return df


def get_analytics_metrics(vehicle_id: Optional[int] = None) -> Dict[str, Any]:
    """Calculates total expenses, fuel consumed, km driven, and average fuel efficiency."""
    conn = get_connection()
    cursor = conn.cursor()

    exp_query = "SELECT SUM(amount_pkr), SUM(liters) FROM expenses"
    trip_query = "SELECT SUM(distance_km) FROM trips"
    params = ()

    if vehicle_id:
        exp_query += " WHERE vehicle_id = ?"
        trip_query += " WHERE vehicle_id = ?"
        params = (vehicle_id,)

    cursor.execute(exp_query, params)
    exp_row = cursor.fetchone()
    total_expense = exp_row[0] or 0.0
    total_liters = exp_row[1] or 0.0

    cursor.execute(trip_query, params)
    trip_row = cursor.fetchone()
    total_km = trip_row[0] or 0.0

    conn.close()

    # Fuel Efficiency = total km driven / total liters logged
    fuel_efficiency = (total_km / total_liters) if total_liters > 0 else 0.0

    return {
        "total_expenses_pkr": round(total_expense, 2),
        "total_distance_km": round(total_km, 2),
        "total_fuel_liters": round(total_liters, 2),
        "avg_fuel_efficiency_km_per_l": round(fuel_efficiency, 2),
    }
