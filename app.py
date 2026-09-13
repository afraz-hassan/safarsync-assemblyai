"""
SafarSync AI - Voice Edition
Intelligent Vehicle Expense & Predictive Maintenance Tracker
Built for the AssemblyAI Voice Agent Hackathon

Tech Stack:
- Frontend: Streamlit
- Audio Capture: audio_recorder_streamlit
- Speech-to-Text: AssemblyAI Python SDK
- Intelligence & Tool Calling: Google Gemini API (google-generativeai)
- Database: SQLite3 (via database.py)
- Visualizations: Plotly Express
"""

import os
import io
import json
import tempfile
import streamlit as st
import pandas as pd
import plotly.express as px
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Import Database Layer
import database as db

# Initialize AssemblyAI & Gemini SDKs
import assemblyai as aai
import google.generativeai as genai
from audio_recorder_streamlit import audio_recorder

# --- Page Configuration ---
st.set_page_config(
    page_title="SafarSync AI - Voice Edition",
    page_icon="🚗",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Initialize database tables & seed data
db.init_db()

# --- API Keys Configuration ---
DEFAULT_ASSEMBLY_KEY = "acb88ecbc7ed4ae2b9424f950816e09e"
ASSEMBLYAI_API_KEY = os.getenv("ASSEMBLYAI_API_KEY") or DEFAULT_ASSEMBLY_KEY
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or ""

# Configure AssemblyAI
aai.settings.api_key = ASSEMBLYAI_API_KEY

# Configure Gemini if key is provided
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


# --- Define Gemini Tools (Function Calling) ---
def log_expense(expense_type: str, amount_pkr: float, liters: float = 0.0):
    """
    Log an automotive expense such as Fuel or Maintenance.
    
    Args:
        expense_type: Category of expense. Must be either 'Fuel' or 'Maintenance'.
        amount_pkr: Total cost in PKR (Pakistani Rupees).
        liters: Amount of fuel in liters if this is a fuel expense. Default is 0.0.
    """
    return db.add_expense(type=expense_type, amount_pkr=amount_pkr, liters=liters)


def log_trip(start_location: str, end_location: str, distance_km: float):
    """
    Log a completed trip with origin, destination, and distance in kilometers.
    
    Args:
        start_location: Starting point or city (e.g., Lahore, Islamabad).
        end_location: Destination point or city (e.g., Murree, Karachi).
        distance_km: Total distance driven in kilometers.
    """
    return db.add_trip(start_location=start_location, end_location=end_location, distance_km=distance_km)


def register_vehicle(make: str, model: str, year: int):
    """
    Register a new vehicle into the fleet database.
    
    Args:
        make: Vehicle manufacturer (e.g. Toyota, Honda, Hyundai).
        model: Vehicle model name (e.g. Corolla, Civic, Elantra).
        year: Manufacturing year (e.g. 2022).
    """
    vid = db.add_vehicle(make=make, model=model, year=year)
    return {"status": "success", "action": "register_vehicle", "vehicle_id": vid, "vehicle": f"{year} {make} {model}"}


AVAILABLE_TOOLS = [log_expense, log_trip, register_vehicle]


def transcribe_audio_bytes(audio_bytes: bytes) -> str:
    """Sends recorded audio bytes to AssemblyAI for Speech-to-Text transcription."""
    if not ASSEMBLYAI_API_KEY:
        raise ValueError("AssemblyAI API key is missing. Please set ASSEMBLYAI_API_KEY.")

    with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmp_file:
        tmp_file.write(audio_bytes)
        tmp_path = tmp_file.name

    try:
        transcriber = aai.Transcriber()
        transcript = transcriber.transcribe(tmp_path)

        if transcript.status == aai.TranscriptStatus.error:
            raise RuntimeError(f"AssemblyAI Transcription failed: {transcript.error}")

        return transcript.text or ""
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)


def process_with_gemini(transcription_text: str):
    """
    Passes user voice transcription to Gemini with Tool Calling.
    Executes database functions automatically or extracts structured arguments.
    """
    if not GEMINI_API_KEY:
        # Fallback heuristic parser if Gemini API key isn't provided yet
        return fallback_rule_based_parser(transcription_text)

    try:
        # We configure the model with function tools and automatic function calling
        system_instruction = (
            "You are SafarSync AI, a voice vehicle assistant for drivers. "
            "Your job is to identify automotive intents from voice transcriptions and call the appropriate tool.\n"
            "Currency is Pakistani Rupees (PKR) and distances are in kilometers (km).\n"
            "If the user mentions fuel, petrol, or diesel, call `log_expense` with expense_type='Fuel'.\n"
            "If the user mentions maintenance, service, oil change, tuning, repair, or tires, call `log_expense` with expense_type='Maintenance'.\n"
            "If the user mentions a trip, drive, or traveled distance, call `log_trip`.\n"
            "If the user wants to add or register a car, call `register_vehicle`.\n"
            "After tool execution, respond with a friendly one-sentence confirmation."
        )

        model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            tools=AVAILABLE_TOOLS,
            system_instruction=system_instruction
        )

        chat = model.start_chat(enable_automatic_function_calling=True)
        response = chat.send_message(transcription_text)

        # Retrieve tool call history if executed
        tool_results = []
        for content in chat.history:
            for part in content.parts:
                fn_call = getattr(part, 'function_call', None)
                fn_resp = getattr(part, 'function_response', None)
                if fn_call:
                    tool_results.append({
                        "name": fn_call.name,
                        "args": dict(fn_call.args)
                    })

        return {
            "reply": response.text,
            "tool_calls": tool_results,
            "success": True
        }

    except Exception as e:
        st.warning(f"Gemini Tool Calling notice: {e}. Running fallback structured extraction.")
        return fallback_rule_based_parser(transcription_text)


def fallback_rule_based_parser(text: str):
    """Rule-based extractor used if Gemini API key is missing or offline."""
    import re
    text_lower = text.lower()
    tool_calls = []
    reply = "Processed voice command successfully."

    # Pattern: Spent X rupees on Y liters
    # Example: "I just spent 4000 rupees on 20 liters of petrol"
    amount_match = re.search(r'(\d+[\d,.]*)\s*(?:rupees|rs|pkr)', text_lower)
    liters_match = re.search(r'(\d+[\d,.]*)\s*(?:liters|litre|litres|ltr)', text_lower)
    distance_match = re.search(r'(\d+[\d,.]*)\s*(?:km|kilometers|kilometres)', text_lower)

    if any(k in text_lower for k in ["petrol", "fuel", "diesel", "gas"]):
        amt = float(amount_match.group(1).replace(',', '')) if amount_match else 3000.0
        ltr = float(liters_match.group(1).replace(',', '')) if liters_match else 12.5
        res = log_expense("Fuel", amt, ltr)
        tool_calls.append({"name": "log_expense", "args": {"expense_type": "Fuel", "amount_pkr": amt, "liters": ltr}, "result": res})
        reply = f"Logged fuel expense of PKR {amt:,.0f} for {ltr} liters."

    elif any(k in text_lower for k in ["maintenance", "oil change", "tuning", "service", "repair", "mechanic"]):
        amt = float(amount_match.group(1).replace(',', '')) if amount_match else 2500.0
        res = log_expense("Maintenance", amt, 0.0)
        tool_calls.append({"name": "log_expense", "args": {"expense_type": "Maintenance", "amount_pkr": amt, "liters": 0.0}, "result": res})
        reply = f"Logged maintenance expense of PKR {amt:,.0f}."

    elif any(k in text_lower for k in ["drove", "trip", "travel", "traveled", "from", "to", "highway", "km"]):
        dist = float(distance_match.group(1).replace(',', '')) if distance_match else 50.0
        # Parse start and end if possible
        route_match = re.search(r'from\s+([a-zA-Z\s]+)\s+to\s+([a-zA-Z\s]+)', text_lower)
        start = route_match.group(1).title().strip() if route_match else "Origin"
        end = route_match.group(2).title().strip() if route_match else "Destination"
        res = log_trip(start, end, dist)
        tool_calls.append({"name": "log_trip", "args": {"start_location": start, "end_location": end, "distance_km": dist}, "result": res})
        reply = f"Recorded trip from {start} to {end} ({dist} km)."

    else:
        # Generic fallback expense
        amt = float(amount_match.group(1).replace(',', '')) if amount_match else 1000.0
        res = log_expense("Maintenance", amt, 0.0)
        tool_calls.append({"name": "log_expense", "args": {"expense_type": "Maintenance", "amount_pkr": amt, "liters": 0.0}, "result": res})
        reply = f"Captured vehicle expense of PKR {amt:,.0f}."

    return {"reply": reply, "tool_calls": tool_calls, "success": True}


# --- Sidebar Navigation ---
st.sidebar.image("https://img.icons8.com/isometric/100/car.png", width=70)
st.sidebar.title("SafarSync AI")
st.sidebar.caption("Voice Edition • AssemblyAI Hackathon")

page = st.sidebar.radio(
    "Navigation",
    ["🎙️ Voice Command Center", "📊 Dashboard", "📖 Logbook"],
    index=0
)

st.sidebar.markdown("---")
st.sidebar.subheader("API Status")
if ASSEMBLYAI_API_KEY:
    st.sidebar.success("AssemblyAI SDK: Connected")
else:
    st.sidebar.error("AssemblyAI Key Missing")

if GEMINI_API_KEY:
    st.sidebar.success("Gemini Tool Calling: Active")
else:
    st.sidebar.info("Gemini Key: Fallback Parser Active")
    user_gemini_key = st.sidebar.text_input("Enter Gemini API Key (Optional)", type="password")
    if user_gemini_key:
        GEMINI_API_KEY = user_gemini_key
        genai.configure(api_key=GEMINI_API_KEY)
        st.sidebar.success("Updated Gemini Key!")


# ==========================================================
# PAGE 1: VOICE COMMAND CENTER
# ==========================================================
if page == "🎙️ Voice Command Center":
    st.header("🎙️ Voice Command Center")
    st.markdown(
        "Record your vehicle expense or trip command using natural speech. "
        "Audio is transcribed with **AssemblyAI** and parsed into live database tool calls by **Google Gemini**."
    )

    col1, col2 = st.columns([1, 1], gap="large")

    with col1:
        st.subheader("1. Record Voice Command")
        st.caption("Click microphone to start, speak your command, and click again to submit.")

        # Audio recorder component
        audio_bytes = audio_recorder(
            text="Click to Record Voice Command",
            recording_color="#e63946",
            neutral_color="#1d3557",
            icon_size="2x"
        )

        st.markdown("##### 💡 Example Voice Prompts:")
        example_prompts = [
            "I just spent 4000 rupees on 20 liters of petrol",
            "Paid 6500 rupees for oil change and brake pad service",
            "Drove 180 km from Lahore to Faisalabad",
            "Filled 35 liters of fuel for 9800 PKR at Shell station"
        ]

        selected_example = st.selectbox("Or test with an example command:", ["Select an example..."] + example_prompts)
        test_trigger = st.button("Simulate Voice Command")

    with col2:
        st.subheader("2. Real-Time Processing & Execution")

        input_text_to_process = None

        if audio_bytes:
            st.audio(audio_bytes, format="audio/wav")
            with st.spinner("Transcribing speech with AssemblyAI SDK..."):
                try:
                    transcription = transcribe_audio_bytes(audio_bytes)
                    st.success(f"**AssemblyAI Transcription:** \"{transcription}\"")
                    input_text_to_process = transcription
                except Exception as e:
                    st.error(f"AssemblyAI Error: {e}")

        elif test_trigger and selected_example != "Select an example...":
            st.info(f"**Simulated Voice Input:** \"{selected_example}\"")
            input_text_to_process = selected_example

        if input_text_to_process:
            with st.spinner("Processing intent with Gemini Function Calling..."):
                outcome = process_with_gemini(input_text_to_process)

                if outcome.get("success"):
                    st.markdown("### 🚀 Database Tool Executed")
                    st.success(outcome.get("reply", "Action recorded in SQLite."))

                    if outcome.get("tool_calls"):
                        for tc in outcome["tool_calls"]:
                            st.json({
                                "Function Tool": tc.get("name"),
                                "Parsed Arguments": tc.get("args")
                            })

                    # Success metrics feedback
                    metrics = db.get_analytics_metrics()
                    m1, m2 = st.columns(2)
                    m1.metric("Total Expenses Logged", f"PKR {metrics['total_expenses_pkr']:,.0f}")
                    m2.metric("Avg Fuel Efficiency", f"{metrics['avg_fuel_efficiency_km_per_l']} km/L")


# ==========================================================
# PAGE 2: DASHBOARD
# ==========================================================
elif page == "📊 Dashboard":
    st.header("📊 Vehicle Fleet & Expense Analytics")
    st.markdown("Visualized insights powered by **Plotly Express** and SQLite.")

    metrics = db.get_analytics_metrics()
    c1, c2, c3, c4 = st.columns(4)
    c1.metric("Total Expenses", f"PKR {metrics['total_expenses_pkr']:,.0f}")
    c2.metric("Total Distance Driven", f"{metrics['total_distance_km']:,.1f} km")
    c3.metric("Total Fuel Consumed", f"{metrics['total_fuel_liters']:,.1f} L")
    c4.metric("Avg Fuel Efficiency", f"{metrics['avg_fuel_efficiency_km_per_l']} km/L",
              help="Calculated as: Total Distance (km) ÷ Total Fuel Logged (L)")

    st.markdown("---")

    expenses_df = db.get_expenses_df()
    trips_df = db.get_trips_df()

    col1, col2 = st.columns(2)

    with col1:
        st.subheader("Expenses by Category (PKR)")
        if not expenses_df.empty:
            cat_summary = expenses_df.groupby("type")["amount_pkr"].sum().reset_index()
            fig_pie = px.pie(
                cat_summary,
                names="type",
                values="amount_pkr",
                color="type",
                color_discrete_map={"Fuel": "#2a9d8f", "Maintenance": "#e76f51"},
                hole=0.45,
                title="Fuel vs Maintenance Distribution"
            )
            st.plotly_chart(fig_pie, use_container_width=True)
        else:
            st.info("No expense data recorded yet.")

    with col2:
        st.subheader("Expense History Trend")
        if not expenses_df.empty:
            fig_bar = px.bar(
                expenses_df,
                x="created_at",
                y="amount_pkr",
                color="type",
                color_discrete_map={"Fuel": "#2a9d8f", "Maintenance": "#e76f51"},
                labels={"created_at": "Date / Timestamp", "amount_pkr": "Amount (PKR)"},
                title="Expenses Over Time"
            )
            st.plotly_chart(fig_bar, use_container_width=True)
        else:
            st.info("No expense trends available.")

    st.subheader("Recent Trip Logs & Distance")
    if not trips_df.empty:
        fig_trips = px.bar(
            trips_df,
            x="end_location",
            y="distance_km",
            color="distance_km",
            color_continuous_scale="Blues",
            labels={"end_location": "Destination", "distance_km": "Distance (km)"},
            title="Trip Distances by Destination"
        )
        st.plotly_chart(fig_trips, use_container_width=True)
    else:
        st.info("No trips logged yet.")


# ==========================================================
# PAGE 3: LOGBOOK
# ==========================================================
elif page == "📖 Logbook":
    st.header("📖 SQLite Raw Data Logbook")
    st.markdown("Direct tabular views of the three primary tables in `safarsync.db`.")

    tab1, tab2, tab3 = st.tabs(["💰 Expenses", "🗺️ Trips", "🚘 Vehicles"])

    with tab1:
        st.subheader("Expenses Table (`expenses`)")
        expenses_df = db.get_expenses_df()
        if not expenses_df.empty:
            st.dataframe(expenses_df, use_container_width=True)
        else:
            st.info("No records in expenses table.")

    with tab2:
        st.subheader("Trips Table (`trips`)")
        trips_df = db.get_trips_df()
        if not trips_df.empty:
            st.dataframe(trips_df, use_container_width=True)
        else:
            st.info("No records in trips table.")

    with tab3:
        st.subheader("Vehicles Table (`vehicles`)")
        vehicles_df = db.get_vehicles_df()
        if not vehicles_df.empty:
            st.dataframe(vehicles_df, use_container_width=True)
        else:
            st.info("No vehicles registered.")

        with st.expander("➕ Register a New Vehicle"):
            with st.form("new_vehicle_form"):
                make = st.text_input("Make", "Honda")
                model = st.text_input("Model", "Civic RS")
                year = st.number_input("Year", min_value=1990, max_value=2026, value=2023)
                submit = st.form_submit_button("Add Vehicle")
                if submit:
                    new_id = db.add_vehicle(make, model, year)
                    st.success(f"Vehicle added with ID {new_id}!")
                    st.rerun()
