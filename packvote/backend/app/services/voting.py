from typing import List, Dict, Optional, Tuple
from pryrankvote import Candidate, Ballot, instant_runoff_voting
from sqlalchemy.orm import Session
from ..models import Vote, Recommendation, User
import logging

logger = logging.getLogger(__name__)


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
                "total_candidates": len(candidates)
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
                name=rec.destination_name
            )
            candidates.append(candidate)

        return candidates

    def _format_rounds(self, rounds: List) -> List[Dict]:
        """Format voting rounds for JSON response"""
        formatted_rounds = []

        for round_num, round_data in enumerate(rounds, 1):
            formatted_round = {
                "round": round_num,
                "vote_counts": {},
                "eliminated": None,
                "winner": None
            }

            # Add vote counts for each candidate
            for candidate_id, vote_count in round_data.get("vote_counts", {}).items():
                formatted_round["vote_counts"][candidate_id] = vote_count

            # Add eliminated candidate if any
            if round_data.get("eliminated"):
                formatted_round["eliminated"] = round_data["eliminated"]

            # Add winner if final round
            if round_data.get("winner"):
                formatted_round["winner"] = round_data["winner"]

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
            # Check if user has already voted
            existing_votes = self.db.query(Vote).filter(
                Vote.user_id == user_id,
                Vote.trip_id == trip_id
            ).first()

            if existing_votes:
                return False  # User has already voted

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

            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Error casting vote: {str(e)}")
            self.db.rollback()
            return False