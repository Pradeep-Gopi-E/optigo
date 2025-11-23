import sys
import os
import uuid
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker

# Add the current directory to sys.path to import app modules
sys.path.append(os.getcwd())

from app.utils.database import Base
from app.models.user import User
from app.models.trip import Trip, TripStatus
from app.models.participant import Participant, ParticipantRole, ParticipantStatus
from app.models.recommendation import Recommendation
from app.services.voting import VotingService
from app.config import settings

# Database URL from settings
DATABASE_URL = settings.DATABASE_URL

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def verify_voting_lifecycle():
    print("Starting voting lifecycle verification...")
    db = SessionLocal()
    try:
        # 1. Create test users
        users = []
        for i in range(3):
            user_id = uuid.uuid4()
            user = User(
                id=user_id,
                email=f"test_voting_{i}_{user_id}@example.com",
                hashed_password="dummy_hash",
                full_name=f"Test User {i}"
            )
            db.add(user)
            users.append(user)
        db.commit()
        print(f"Created {len(users)} users")

        owner = users[0]

        # 2. Create a test trip
        trip_id = uuid.uuid4()
        trip = Trip(
            id=trip_id,
            title="Test Voting Trip",
            created_by=owner.id,
            status=TripStatus.voting # Start in voting phase
        )
        db.add(trip)
        db.commit()
        print(f"Created trip: {trip.title} (Status: {trip.status})")

        # 3. Add users as participants
        for i, user in enumerate(users):
            participant = Participant(
                trip_id=trip_id,
                user_id=user.id,
                role=ParticipantRole.owner if i == 0 else ParticipantRole.member,
                status=ParticipantStatus.joined
            )
            db.add(participant)
        db.commit()
        print("Added users as participants")

        # 4. Create Recommendations
        recs = []
        for i in range(3):
            rec_id = uuid.uuid4()
            rec = Recommendation(
                id=rec_id,
                trip_id=trip_id,
                destination_name=f"Destination {i}",
                ai_generated=False,
                created_by=owner.id
            )
            db.add(rec)
            recs.append(rec)
        db.commit()
        print(f"Created {len(recs)} recommendations")

        # 5. Initialize VotingService
        voting_service = VotingService(db)

        # 6. Cast Votes
        print("Casting votes...")
        # User 0 votes for Rec 0
        voting_service.cast_vote(str(users[0].id), str(trip_id), [{"recommendation_id": str(recs[0].id), "rank": 1}])
        # User 1 votes for Rec 0
        voting_service.cast_vote(str(users[1].id), str(trip_id), [{"recommendation_id": str(recs[0].id), "rank": 1}])
        # User 2 skips
        voting_service.skip_vote(str(users[2].id), str(trip_id))
        print("Votes cast.")

        # 7. Check Voting Completion (Should be True but NOT finalized)
        print("Checking voting completion...")
        completed = voting_service.check_voting_completion(str(trip_id))
        if completed:
            print("SUCCESS: Voting completion check returned True.")
        else:
            print("FAILURE: Voting completion check returned False.")
        
        # Refresh trip to check status - SHOULD STILL BE VOTING
        db.refresh(trip)
        print(f"Trip status after voting complete: {trip.status}")
        if trip.status == TripStatus.voting:
             print("SUCCESS: Trip status remains 'voting' (Manual finalization required).")
        else:
             print(f"FAILURE: Trip status changed to {trip.status} prematurely.")

        # 8. Finalize Voting (Owner Action)
        print("Finalizing voting...")
        results = voting_service.finalize_voting(str(trip_id))
        print(f"Results: Winner is {results.get('winner', {}).get('destination_name')}")

        # Refresh trip to check status - SHOULD BE CONFIRMED
        db.refresh(trip)
        print(f"Trip status after finalization: {trip.status}")
        if trip.status == TripStatus.confirmed:
             print("SUCCESS: Trip status updated to confirmed (Decided).")
        else:
             print(f"FAILURE: Trip status is {trip.status}, expected confirmed.")

        # 9. Reset Votes (Revote)
        print("Resetting votes (Revote)...")
        success = voting_service.reset_votes(str(trip_id))
        if success:
            print("SUCCESS: Votes reset.")
        else:
            print("FAILURE: Could not reset votes.")
            return

        # Refresh trip
        db.refresh(trip)
        print(f"Trip status after reset: {trip.status}")
        if trip.status == TripStatus.voting: # reset_votes sets it to voting
             print("SUCCESS: Trip status updated to voting.")
        else:
             print("FAILURE: Trip status NOT updated to voting.")

    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
    finally:
        # Cleanup
        try:
            # Cleanup logic if needed, but for now we leave it for inspection or DB reset
            pass
        except:
            pass
        db.close()

if __name__ == "__main__":
    verify_voting_lifecycle()
