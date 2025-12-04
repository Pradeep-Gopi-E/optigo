from typing import List, Dict, Optional, Tuple, NamedTuple
from sqlalchemy.orm import Session
from ..models import Vote, Recommendation, User, Trip, Participant
from ..models.participant import ParticipantStatus
import logging

logger = logging.getLogger(__name__)

# Borda Count Voting Implementation
class Candidate:
    def __init__(self, id: str, destination_name: str, description: str = "", estimated_cost: float = 0.0):
        self.id = id
        self.destination_name = destination_name
        self.description = description
        self.estimated_cost = estimated_cost or 0.0

    def __str__(self):
        return self.destination_name

    def __repr__(self):
        return f"Candidate(id={self.id}, name={self.destination_name}, cost={self.estimated_cost})"

class Ballot:
    def __init__(self, ranking: List[str]):
        self.ranking = ranking  # List of candidate IDs in order of preference

    def __repr__(self):
        return f"Ballot(ranking={self.ranking})"

def calculate_borda_count(candidates: List[Candidate], ballots: List[Ballot]) -> Tuple[Optional[Candidate], Dict[str, int]]:
    """
    Implement Borda Count voting algorithm with tie-breaking based on cost.
    
    Points assignment:
    - If there are N candidates:
    - 1st choice gets N points
    - 2nd choice gets N-1 points
    - ...
    - Last choice gets 1 point
    - Unranked candidates get 0 points
    
    Tie-breaker:
    - If scores are equal, the candidate with the LOWER estimated_cost wins.
    
    Args:
        candidates: List of candidates
        ballots: List of ballots with ranked preferences

    Returns:
        Tuple of (winner, scores_dict)
    """
    if not candidates or not ballots:
        return None, {}

    candidate_map = {c.id: c for c in candidates}
    scores = {c.id: 0 for c in candidates}
    n_candidates = len(candidates)

    for ballot in ballots:
        # Calculate points for this ballot
        # We only give points for ranked candidates
        # If a user only ranks top 3 out of 10, they give N, N-1, N-2 points respectively
        
        for i, candidate_id in enumerate(ballot.ranking):
            if candidate_id in scores:
                points = n_candidates - i
                if points > 0:
                    scores[candidate_id] += points

    # Find winner (highest score, then lowest cost)
    if not scores:
        return None, {}
        
    # Sort scores: Primary key = score (desc), Secondary key = cost (asc)
    # We use a tuple for sorting: (score, -cost) if we want both desc, but cost needs to be asc.
    # So we can sort by score desc, then cost asc.
    # Python's sort is stable, so we can sort by cost first, then by score.
    
    # First sort by cost (ascending) - cheaper is better
    sorted_by_cost = sorted(scores.items(), key=lambda x: candidate_map[x[0]].estimated_cost)
    
    # Then sort by score (descending) - higher is better
    # Since sort is stable, candidates with equal scores will remain sorted by cost
    sorted_scores = sorted(sorted_by_cost, key=lambda x: x[1], reverse=True)
    
    # Get winner ID
    winner_id = sorted_scores[0][0]
    winner = candidate_map.get(winner_id)
    
    return winner, scores


class VotingService:
    """Service for handling ranked-choice voting using Borda Count algorithm"""

    def __init__(self, db: Session):
        self.db = db

    def calculate_results(self, trip_id: str) -> Dict:
        """
        Calculate Borda Count voting results for a trip

        Args:
            trip_id: UUID of the trip

        Returns:
            Dict containing voting results with winner and scores
        """
        try:
            # Get all votes for this trip
            votes = self.db.query(Vote).filter(Vote.trip_id == trip_id).all()

            if not votes:
                return {
                    "winner": None,
                    "scores": {},
                    "total_voters": 0,
                    "message": "No votes cast yet"
                }

            # Get unique voters
            unique_voters = len(set(v.user_id for v in votes))

            # Group votes by user and create ballots
            user_ballots = self._create_ballots(votes)

            if not user_ballots:
                return {
                    "winner": None,
                    "scores": {},
                    "total_voters": unique_voters,
                    "message": "No valid ballots found"
                }

            # Get all candidates (recommendations)
            candidates = self._get_candidates(trip_id)

            if not candidates:
                return {
                    "winner": None,
                    "scores": {},
                    "total_voters": unique_voters,
                    "message": "No candidates available"
                }

            # Run Borda Count voting
            winner, scores = calculate_borda_count(candidates, user_ballots)

            return {
                "winner": {
                    "id": winner.id,
                    "destination_name": winner.destination_name,
                    "description": winner.description
                } if winner else None,
                "scores": scores,
                "total_voters": unique_voters,
                "total_candidates": len(candidates),
                "candidates": [{"id": c.id, "name": c.destination_name} for c in candidates]
            }

        except Exception as e:
            logger.error(f"Error calculating voting results for trip {trip_id}: {str(e)}")
            raise

    def _create_ballots(self, votes: List[Vote]) -> List[Ballot]:
        """Convert votes to Ballot objects"""
        user_votes = {}

        # Group votes by user
        for vote in votes:
            if vote.user_id not in user_votes:
                user_votes[vote.user_id] = []
            user_votes[vote.user_id].append(vote)

        ballots = []
        for user_id, user_vote_list in user_votes.items():
            # Sort by rank (1=first choice)
            sorted_votes = sorted(user_vote_list, key=lambda v: v.rank)

            # Create ranking list of candidate IDs
            ranking = [str(vote.recommendation_id) for vote in sorted_votes]

            if ranking:  # Only create ballot if user has ranked candidates
                ballot = Ballot(ranking)
                ballots.append(ballot)

        return ballots

    def _get_candidates(self, trip_id: str) -> List[Candidate]:
        """Get all recommendations as candidates for the trip"""
        recommendations = self.db.query(Recommendation).filter(
            Recommendation.trip_id == trip_id
        ).all()

        candidates = []
        for rec in recommendations:
            candidate = Candidate(
                id=str(rec.id),
                destination_name=rec.destination_name,
                description=rec.description or "",
                estimated_cost=float(rec.estimated_cost) if rec.estimated_cost else 0.0
            )
            candidates.append(candidate)

        return candidates

    def validate_vote(self, user_id: str, trip_id: str, vote_data: List[Dict]) -> bool:
        """
        Validate that a vote is properly formatted and contains valid recommendations
        """
        try:
            # Note: We allow re-voting (updates), so we don't check for existing votes here.
            # The cast_vote method handles replacing existing votes.

            # Get valid recommendations for this trip
            valid_recommendations = self.db.query(Recommendation).filter(
                Recommendation.trip_id == trip_id
            ).all()
            valid_rec_ids = {str(rec.id) for rec in valid_recommendations}

            # Validate vote data
            if not vote_data:
                return False

            # Check that all recommendation_ids are valid
            for vote_item in vote_data:
                rec_id = vote_item.get("recommendation_id")
                rank = vote_item.get("rank")

                if not rec_id or rank is None:
                    return False

                if rec_id not in valid_rec_ids:
                    return False

                if not isinstance(rank, int) or rank < 1:
                    return False

            # Check that ranks are unique and start from 1
            ranks = [item["rank"] for item in vote_data]
            if sorted(ranks) != list(range(1, len(ranks) + 1)):
                return False

            return True

        except Exception as e:
            logger.error(f"Error validating vote: {str(e)}")
            return False

    def cast_vote(self, user_id: str, trip_id: str, vote_data: List[Dict]) -> bool:
        """
        Cast a vote for a user in a trip
        """
        try:
            if not self.validate_vote(user_id, trip_id, vote_data):
                return False

            # Delete any existing votes for this user in this trip (in case)
            self.db.query(Vote).filter(
                Vote.user_id == user_id,
                Vote.trip_id == trip_id
            ).delete()

            # Create new votes
            for vote_item in vote_data:
                vote = Vote(
                    trip_id=trip_id,
                    user_id=user_id,
                    recommendation_id=vote_item["recommendation_id"],
                    rank=vote_item["rank"]
                )
                self.db.add(vote)

            # Update participant vote status
            participant = self.db.query(Participant).filter(
                Participant.trip_id == trip_id,
                Participant.user_id == user_id
            ).first()
            
            if participant:
                participant.vote_status = "voted"

            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error casting vote: {str(e)}")
            self.db.rollback()
            return False

    def skip_vote(self, user_id: str, trip_id: str) -> bool:
        """
        Mark a user as having skipped voting
        """
        try:
            # Delete any existing votes
            self.db.query(Vote).filter(
                Vote.user_id == user_id,
                Vote.trip_id == trip_id
            ).delete()

            # Update participant status
            participant = self.db.query(Participant).filter(
                Participant.trip_id == trip_id,
                Participant.user_id == user_id
            ).first()

            if participant:
                participant.vote_status = "skipped"
                self.db.commit()
                return True
            return False
        except Exception as e:
            logger.error(f"Error skipping vote: {str(e)}")
            self.db.rollback()
            return False

    def check_voting_completion(self, trip_id: str) -> bool:
        """
        Check if all participants have voted or skipped.
        If so, calculate results and update trip status.
        """
        try:
            # Get all joined participants
            participants = self.db.query(Participant).filter(
                Participant.trip_id == trip_id,
                Participant.status == ParticipantStatus.joined
            ).all()

            if not participants:
                return False

            # Check if everyone has voted or skipped
            all_done = all(p.vote_status in ["voted", "skipped"] for p in participants)

            if all_done:
                # Just return True to indicate voting is complete, but don't change status
                return True
            
            return False

        except Exception as e:
            logger.error(f"Error checking voting completion: {str(e)}")
            return False

    def finalize_voting(self, trip_id: str) -> Dict:
        """
        Manually finalize voting, calculate results, and update trip status.
        """
        try:
            # Calculate results to find winner
            results = self.calculate_results(trip_id)
            winner = results.get("winner")

            trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
            if trip:
                trip.status = "confirmed" # Using confirmed as "Decided"
                if winner:
                    trip.destination = winner["destination_name"]
                self.db.commit()
            
            return results

        except Exception as e:
            logger.error(f"Error finalizing voting: {str(e)}")
            self.db.rollback()
            raise

    def reset_votes(self, trip_id: str) -> bool:
        """
        Reset all votes for a trip and set status back to planning/voting
        """
        try:
            # Delete all votes
            self.db.query(Vote).filter(Vote.trip_id == trip_id).delete()

            # Reset participant statuses
            self.db.query(Participant).filter(
                Participant.trip_id == trip_id
            ).update({"vote_status": "not_voted"})

            # Reset trip status
            trip = self.db.query(Trip).filter(Trip.id == trip_id).first()
            if trip:
                trip.status = "voting" # Or planning, but voting makes sense if we are revoting
                trip.destination = None # Clear destination
            
            self.db.commit()
            return True
        except Exception as e:
            logger.error(f"Error resetting votes: {str(e)}")
            self.db.rollback()
            return False