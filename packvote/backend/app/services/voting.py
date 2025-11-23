from typing import List, Dict, Optional, Tuple, NamedTuple
from sqlalchemy.orm import Session
from ..models import Vote, Recommendation, User, Trip, Participant
import logging

logger = logging.getLogger(__name__)

# Custom instant-runoff voting implementation
class Candidate:
    def __init__(self, id: str, destination_name: str, description: str = ""):
        self.id = id
        self.destination_name = destination_name
        self.description = description

    def __str__(self):
        return self.destination_name

    def __repr__(self):
        return f"Candidate(id={self.id}, name={self.destination_name})"

class Ballot:
    def __init__(self, ranking: List[str]):
        self.ranking = ranking  # List of candidate IDs in order of preference

    def __repr__(self):
        return f"Ballot(ranking={self.ranking})"

class ElectionRound(NamedTuple):
    round_number: int
    vote_counts: Dict[str, int]  # candidate_id -> votes
    eliminated_candidate: Optional[str] = None
    winner: Optional[str] = None
    total_votes: int = 0
    active_candidates: List[str] = []

class VotingResult:
    def __init__(self, winner: Optional[Candidate], rounds: List[ElectionRound]):
        self.winner = winner
        self.rounds = rounds

def instant_runoff_voting(candidates: List[Candidate], ballots: List[Ballot]) -> Tuple[Optional[Candidate], List[ElectionRound]]:
    """
    Implement instant-runoff voting algorithm

    Args:
        candidates: List of candidates
        ballots: List of ballots with ranked preferences

    Returns:
        Tuple of (winner, list of election rounds)
    """
    if not candidates or not ballots:
        return None, []

    candidate_ids = {c.id for c in candidates}
    candidate_map = {c.id: c for c in candidates}
    active_candidates = candidate_ids.copy()
    rounds = []
    round_num = 1

    while len(active_candidates) > 1:
        # Count votes for current round
        vote_counts = {candidate_id: 0 for candidate_id in active_candidates}
        valid_ballots = 0

        for ballot in ballots:
            # Find the highest-ranked active candidate on this ballot
            for candidate_id in ballot.ranking:
                if candidate_id in active_candidates:
                    vote_counts[candidate_id] += 1
                    valid_ballots += 1
                    break

        # Calculate total votes in this round
        total_votes = sum(vote_counts.values())

        # Check for majority winner
        for candidate_id, votes in vote_counts.items():
            if votes > total_votes / 2:
                winner = candidate_map[candidate_id]
                election_round = ElectionRound(
                    round_number=round_num,
                    vote_counts=vote_counts,
                    winner=candidate_id,
                    total_votes=total_votes,
                    active_candidates=list(active_candidates)
                )
                rounds.append(election_round)
                return winner, rounds

        # Find candidate to eliminate (fewest votes)
        min_votes = min(vote_counts.values())
        candidates_to_eliminate = [
            candidate_id for candidate_id, votes in vote_counts.items()
            if votes == min_votes
        ]

        # In case of tie for elimination, eliminate first one
        eliminated_candidate = candidates_to_eliminate[0]
        active_candidates.remove(eliminated_candidate)

        # Record this round
        election_round = ElectionRound(
            round_number=round_num,
            vote_counts=vote_counts,
            eliminated_candidate=eliminated_candidate,
            total_votes=total_votes,
            active_candidates=list(active_candidates) + [eliminated_candidate]
        )
        rounds.append(election_round)

        round_num += 1

        # Safety check to prevent infinite loop
        if round_num > len(candidates):
            break

    # If we get here, either we have a winner or all remaining candidates are tied
    if active_candidates:
        winner = candidate_map[next(iter(active_candidates))]
    else:
        winner = None

    # Record final round if needed
    if rounds and rounds[-1].winner is None:
        final_round = ElectionRound(
            round_number=round_num,
            vote_counts=rounds[-1].vote_counts,
            winner=next(iter(active_candidates)) if active_candidates else None,
            total_votes=rounds[-1].total_votes,
            active_candidates=active_candidates
        )
        rounds.append(final_round)

    return winner, rounds


class VotingService:
    """Service for handling ranked-choice voting using instant-runoff algorithm"""

    def __init__(self, db: Session):
        self.db = db

    def calculate_results(self, trip_id: str) -> Dict:
        """
        Calculate instant-runoff voting results for a trip

        Args:
            trip_id: UUID of the trip

        Returns:
            Dict containing voting results with winner and elimination rounds
        """
        try:
            # Get all votes for this trip
            votes = self.db.query(Vote).filter(Vote.trip_id == trip_id).all()

            if not votes:
                return {
                    "winner": None,
                    "rounds": [],
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
                    "rounds": [],
                    "total_voters": unique_voters,
                    "message": "No valid ballots found"
                }

            # Get all candidates (recommendations)
            candidates = self._get_candidates(trip_id)

            if not candidates:
                return {
                    "winner": None,
                    "rounds": [],
                    "total_voters": unique_voters,
                    "message": "No candidates available"
                }

            # Run instant-runoff voting
            winner, rounds = instant_runoff_voting(candidates, user_ballots)

            return {
                "winner": {
                    "id": winner.id,
                    "destination_name": winner.destination_name,
                    "description": winner.description
                } if winner else None,
                "rounds": self._format_rounds(rounds),
                "total_voters": unique_voters,
                "total_candidates": len(candidates),
                "candidates": [{"id": c.id, "name": c.destination_name} for c in candidates]
            }

        except Exception as e:
            logger.error(f"Error calculating voting results for trip {trip_id}: {str(e)}")
            raise

    def _create_ballots(self, votes: List[Vote]) -> List[Ballot]:
        """Convert votes to PyRankVote Ballot objects"""
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
                description=rec.description or ""
            )
            candidates.append(candidate)

        return candidates

    def _format_rounds(self, rounds: List[ElectionRound]) -> List[Dict]:
        """Format voting rounds for JSON response"""
        formatted_rounds = []

        for round_data in rounds:
            formatted_round = {
                "round": round_data.round_number,
                "vote_counts": round_data.vote_counts,
                "eliminated": round_data.eliminated_candidate,
                "winner": round_data.winner,
                "total_votes": round_data.total_votes,
                "active_candidates": round_data.active_candidates
            }

            formatted_rounds.append(formatted_round)

        return formatted_rounds

    def validate_vote(self, user_id: str, trip_id: str, vote_data: List[Dict]) -> bool:
        """
        Validate that a vote is properly formatted and contains valid recommendations

        Args:
            user_id: UUID of the user voting
            trip_id: UUID of the trip
            vote_data: List of {recommendation_id, rank} dictionaries

        Returns:
            True if vote is valid, False otherwise
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

        Args:
            user_id: UUID of the user voting
            trip_id: UUID of the trip
            vote_data: List of {recommendation_id, rank} dictionaries

        Returns:
            True if vote was successfully cast, False otherwise
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
                Participant.status == "joined"
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