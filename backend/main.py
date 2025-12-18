from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn
import os
from dotenv import load_dotenv

load_dotenv() # Load env vars from .env file

app = FastAPI(title="AlpeMatch AI Engine", description="AI Scraper & Data Processor for Mountain Services")

# Allow Frontend to communicate with Backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ScrapeRequest(BaseModel):
    location_name: str
    region: Optional[str] = None
    targets: List[str] = ["tourism", "accommodation"]
    user_instructions: Optional[str] = "" 

@app.get("/")
def health_check():
    return {"status": "ok", "service": "AlpeMatch AI Backend", "version": "0.1.0"}

@app.post("/api/ai/research")
async def research_location(request: ScrapeRequest):
    """
    Trigger the AI Research Agent with Gemini.
    """
    print(f"Received request for: {request.location_name}")
    
    # Check for Gemini API Key (set via env var GEMINI_API_KEY)
    api_key = os.environ.get("GEMINI_API_KEY")
    
    if not api_key:
        print("WARNING: GEMINI_API_KEY not found. Returning MOCK data.")
        # MOCK RESPONSE for demo purposes or missing key
        return {
           "status": "success",
           "data": { 
               "name": request.location_name, 
               "description": {
                   "winter": "Descrizione Invernale Mock: La località offre piste perfette.",
                   "summer": "Descrizione Estiva Mock: Sentieri e natura.",
                   "spring": "Descrizione Primaverile Mock.",
                   "autumn": "Descrizione Autunnale Mock."
               },
               "profile": {
                   "target": "famiglie",
                   "priceLevel": "€€",
                   "style": "tradizionale alpino",
                   "vibe": "Rilassata e autentica (Mock)"
               },
               "technicalData": {
                   "totalSkiKm": 50,
                   "minAltitude": 1200,
                   "maxAltitude": 2500,
                   "totalLifts": 15,
                   "seasonStart": "Dicembre",
                   "seasonEnd": "Aprile",
                   "sunHoursYear": 2000
               },
               "accessibility": {
                   "airports": ["Aeroporto Mock (100km)"],
                   "train": "Stazione Mock a 10km",
                   "car": "Accessibile via autostrada",
                   "accessToResort": "Strada comoda"
               },
               "parking": {
                   "mainAreas": [{"name": "P1 Central", "type": "Coperto", "capacity": "500", "price": "Gratis", "distance": "50m", "features": ["Navetta"]}],
                   "tips": "Parcheggia al P1"
               },
               "localMobility": {
                   "skiBus": "Gratuito", 
                   "connections": "Buoni", 
                   "carFreeZones": "Centro", 
                   "nightMobility": "Taxi"
               },
               "infoPoints": { "locations": ["Centro"], "hours": "9-18", "languages": "IT, EN", "services": ["Skipass"] },
               "medical": { "pharmacies": "Farmacia Centrale", "nearestHospital": "Ospedale (30km)", "emergencies": "112" },
               "advancedSkiing": { "slopesPercent": {"blue": "40%", "red": "40%", "black": "20%"}, "crowdLevel": "Medio", "snowMaking": "80%", "connections": "Nessuno" },
               "outdoorNonSki": { "activities": ["Ciaspole"], "iconicTreks": ["Lago Blu"], "wellness": "Aquapark" },
               "family": { "kindergartens": "Si", "kidsSlopes": "Si", "facilities": "Playground", "rating": "8/10" },
               "rentals": { "types": ["Sci", "E-bike"], "services": ["Deposito"], "prices": "€30/giorno", "tips": "Prenota online" },
               "eventsAndSeasonality": { "topEvents": ["Capodanno in Piazza"], "seasonTips": "Gennaio top" },
               "gastronomy": { "typicalDishes": ["Polenta"], "topDining": "Ristorante Vetta", "localProducts": ["Formaggio Malga"] },
               "digital": { "app": "MyResort App", "wifi": "Hotel e Piazze", "remoteWork": "Possibile" },
               "practicalTips": { "crowds": "Natale", "bestTimes": "Gennaio", "criticalIssues": "Freddo" },
               "openingHours": { "lifts": "8:30 - 16:30", "shops": "9-19", "restaurants": "12-14, 19-22" },
               "safety": { "rules": "Casco obbligatorio", "dronePolicy": "Vietati" },
               "sustainability": { "energy": "Idroelettrico", "mobility": "Bus Elettrici", "certifications": "ISO" },
               "services": [] 
            }
        }

    try:
        import google.generativeai as genai
        from prompts import SYSTEM_PROMPT, USER_PROMPT_TEMPLATE
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Inject custom instructions
        instructions = request.user_instructions if request.user_instructions else "Estrai il report completo."
        
        full_prompt = f"{SYSTEM_PROMPT}\n\n{USER_PROMPT_TEMPLATE.format(location_name=request.location_name, user_instructions=instructions)}"
        
        response = model.generate_content(full_prompt)
        text_response = response.text
        
        print(f"DEBUG - Raw AI Response: {text_response}")
        
        # Robust cleanup to extract JSON if wrapped in markdown blocks
        import re
        # Remove markdown code blocks with any language tag (json, JSON, text, etc) or no tag
        clean_text = re.sub(r'```[a-zA-Z]*', '', text_response).replace('```', '').strip()
        
        # Try to find first { and last } if heavy text around
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_text = clean_text[start_idx:end_idx+1]
            
        print(f"DEBUG - Cleaned AI Response (for JSON parsing): {clean_text[:500]}... [TRUNCATED]")

        import json
        try:
            data = json.loads(clean_text)
        except json.JSONDecodeError as e:
            print(f"JSON Parse Error: {e}")
            # Fallback: try to fix common trailing comma issues or comments if any (simple retry)
            # For now just re-raise to hit the main exception handler
            raise e
        
        return {
            "status": "success",
            "data": {
                "name": request.location_name,
                **data
            }
        }

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"AI Error: {e}")
        print(f"Traceback: {error_details}")

        # Log to file for debugging
        with open("backend_debug.log", "a") as f:
            f.write(f"\n\n--- ERROR {os.environ.get('GEMINI_API_KEY') and 'KEY_PRESENT'} ---\n")
            f.write(f"Error: {e}\n")
            f.write(f"Traceback: {error_details}\n")
        
        if "API key" in str(e) or "403" in str(e) or "400" in str(e):
             return {
                "status": "error",
                "message": "GEMINI_API_KEY non valida o scaduta. Controlla il file .env. (Google Error: 400/403 Invalid API Key)"
            }

        # Return error as valid JSON to frontend
        return {
            "status": "error",
            "message": f"{str(e)}"
        }

@app.post("/api/ai/generate-tags")
async def generate_tags(request: ScrapeRequest):
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"status": "error", "message": "API Key missing"}

    try:
        import google.generativeai as genai
        import json
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        Analyze the mountain tourism location: "{request.location_name}".
        
        CRITICAL INSTRUCTION: Output ALL tag values in ENGLISH language only. Do NOT use Italian or any other language.
        
        Generate a set of TAGS to categorize it in JSON format.
        Required format (strictly JSON):
        {{
            "vibe": ["Adjective 1", "Adjective 2"],
            "target": ["Target 1", "Target 2"],
            "highlights": ["Highlight 1", "Highlight 2"],
            "tourism": ["Activity Tags e.g. Freeride, Snowshoeing, MTB"],
            "accommodation": ["Hospitality Tags e.g. Luxury, Glamping, Mountain Huts"],
            "infrastructure": ["Infrastructure Tags e.g. Cable Car, Ski Bus, Rental"],
            "sport": ["Sport Tags e.g. Padel, Tennis, Swimming"],
            "info": ["Info Tags e.g. Guide Office, App, WiFi"],
            "general": ["General Tags e.g. Panoramic, Historic, Food & Wine"]
        }}
        
        Respond ONLY with valid JSON in ENGLISH. No markdown.
        """
        
        response = model.generate_content(prompt)
        text_response = response.text
        
        print(f"DEBUG - TAGS Raw Response: {text_response}")
        
        clean_text = text_response.replace('```json', '').replace('```', '').strip()
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_text = clean_text[start_idx:end_idx+1]
            
        data = json.loads(clean_text)
        
        return {"status": "success", "data": data}

    except Exception as e:
        print(f"Tag Gen Error: {e}")
        return {"status": "error", "message": str(e)}


class TranslateRequest(BaseModel):
    content: dict
    target_language: str = "Italian"

@app.post("/api/ai/translate")
async def translate_content(request: TranslateRequest):
    load_dotenv()
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"status": "error", "message": "API Key missing"}

    try:
        import google.generativeai as genai
        import json
        
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        # Serialize content to string for the prompt
        content_str = json.dumps(request.content, ensure_ascii=False)
        
        prompt = f"""
        You are a professional translator for a mountain tourism portal.
        
        Task: Translate the following JSON content into {request.target_language}.
        
        Rules:
        1. Translate ALL values (descriptions, names where appropriate, labels).
        2. DO NOT translate Keys. Keep the JSON structure exactly the same.
        3. If a value is a URL or a number, keep it as is.
        4. Output ONLY valid JSON. No markdown.
        
        Content to translate:
        {content_str}
        """
        
        response = model.generate_content(prompt)
        text_response = response.text
        
        print(f"DEBUG - TRANSLATE Raw Response: {text_response}")
        
        import re
        clean_text = re.sub(r'```[a-zA-Z]*', '', text_response).replace('```', '').strip()
        start_idx = clean_text.find('{')
        end_idx = clean_text.rfind('}')
        if start_idx != -1 and end_idx != -1:
            clean_text = clean_text[start_idx:end_idx+1]
            
        data = json.loads(clean_text)
        
        return {"status": "success", "data": data}

    except Exception as e:
        print(f"Translation Error: {e}")
        return {"status": "error", "message": str(e)}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=int(os.environ.get("PORT", 8080)))
