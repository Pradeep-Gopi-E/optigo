from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class VoteCreate(BaseModel):
    recommendation_id: str
    rank: int = Field(..., ge=1, description="Rank preference (1=first choice, 2=second choice, etc.)")


class BulkVoteCreate(BaseModel):
    votes: List[VoteCreate] = Field(..., min_items=1, description="List of ranked recommendations")


class VoteResponse(BaseModel):
    id: str
    trip_id: str
    user_id: str
    recommendation_id: str
    rank: int
    created_at: Optional[datetime] = None
    destination_name: Optional[str] = None

    class Config:
        from_attributes = True


class VotingResult(BaseModel):
    winner: Optional[Dict[str, Any]] = None
    rounds: List[Dict[str, Any]] = []
    total_voters: int
    total_candidates: int
    message: Optional[str] = None


class UserVoteSummary(BaseModel):
    user_id: str
    user_name: str
    has_voted: bool
    vote_count: int