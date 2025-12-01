import sys
import os
import json
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the parent directory to sys.path to allow imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.utils.database import SessionLocal
from app.models.recommendation import Recommendation

def check_last_recommendation():
    db = SessionLocal()
    try:
        # Get the most recent recommendation
        rec = db.query(Recommendation).order_by(Recommendation.created_at.desc()).first()
        
        if not rec:
            print("No recommendations found.")
            return

        print(f"ID: {rec.id}")
        print(f"Destination: {rec.destination_name}")
        print(f"Created At: {rec.created_at}")
        print("-" * 20)
        print("META FIELD CONTENT:")
        
        if rec.meta:
            print(json.dumps(rec.meta, indent=2))
            
            if "itinerary" in rec.meta:
                print("\nItinerary found in meta!")
                print(f"Itinerary items: {len(rec.meta['itinerary'])}")
            else:
                print("\nWARNING: 'itinerary' key NOT found in meta.")
        else:
            print("Meta field is empty or None.")

    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    check_last_recommendation()
