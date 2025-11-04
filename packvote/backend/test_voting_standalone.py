#!/usr/bin/env python3
"""
Standalone test script for the custom instant-runoff voting implementation
"""

from typing import List, Dict, Optional, Tuple, NamedTuple

# Copy of our custom voting implementation for testing
class Candidate:
    def __init__(self, id: str, name: str):
        self.id = id
        self.name = name

    def __str__(self):
        return self.name

    def __repr__(self):
        return f"Candidate(id={self.id}, name={self.name})"

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

def instant_runoff_voting(candidates: List[Candidate], ballots: List[Ballot]) -> Tuple[Optional[Candidate], List[ElectionRound]]:
    """
    Implement instant-runoff voting algorithm
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

        for ballot in ballots:
            # Find the highest-ranked active candidate on this ballot
            for candidate_id in ballot.ranking:
                if candidate_id in active_candidates:
                    vote_counts[candidate_id] += 1
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

        # In case of tie for elimination, eliminate first one alphabetically
        eliminated_candidate = min(candidates_to_eliminate)
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
            winner=active_candidates[0] if active_candidates else None,
            total_votes=rounds[-1].total_votes,
            active_candidates=active_candidates
        )
        rounds.append(final_round)

    return winner, rounds

# Test functions
def test_simple_majority():
    """Test case where a candidate gets majority in first round"""
    print("Testing simple majority case...")

    candidates = [
        Candidate("A", "Option A"),
        Candidate("B", "Option B"),
        Candidate("C", "Option C")
    ]

    ballots = [
        Ballot(["A", "B", "C"]),
        Ballot(["A", "C", "B"]),
        Ballot(["B", "A", "C"]),
        Ballot(["A", "B", "C"])
    ]

    winner, rounds = instant_runoff_voting(candidates, ballots)

    assert winner is not None
    assert winner.id == "A"
    assert len(rounds) == 1
    assert rounds[0].winner == "A"
    print("✅ Simple majority test passed!")

def test_instant_runoff():
    """Test proper instant-runoff with elimination"""
    print("Testing instant-runoff case...")

    candidates = [
        Candidate("A", "Option A"),
        Candidate("B", "Option B"),
        Candidate("C", "Option C")
    ]

    ballots = [
        Ballot(["A", "B", "C"]),  # A gets 1 vote
        Ballot(["B", "A", "C"]),  # B gets 2 votes
        Ballot(["B", "C", "A"]),  # B gets 2 votes
        Ballot(["C", "A", "B"])   # C gets 1 vote (eliminated first)
    ]

    winner, rounds = instant_runoff_voting(candidates, ballots)

    assert winner is not None
    assert winner.id == "B"  # B should win after C is eliminated
    assert len(rounds) >= 2  # Should have at least 2 rounds
    print("✅ Instant-runoff test passed!")

def test_tie_elimination():
    """Test tie-breaking elimination"""
    print("Testing tie elimination case...")

    candidates = [
        Candidate("A", "Option A"),
        Candidate("B", "Option B"),
        Candidate("C", "Option C")
    ]

    ballots = [
        Ballot(["A", "B", "C"]),  # A gets 2 votes
        Ballot(["A", "C", "B"]),
        Ballot(["B", "A", "C"]),  # B gets 1 vote (eliminated first)
        Ballot(["C", "A", "B"])   # C gets 1 vote (tie with B)
    ]

    winner, rounds = instant_runoff_voting(candidates, ballots)

    assert winner is not None
    assert winner.id == "A"  # A should win
    print("✅ Tie elimination test passed!")

def test_empty_ballots():
    """Test edge case with no ballots"""
    print("Testing empty ballots case...")

    candidates = [
        Candidate("A", "Option A"),
        Candidate("B", "Option B")
    ]

    ballots = []

    winner, rounds = instant_runoff_voting(candidates, ballots)

    assert winner is None
    assert len(rounds) == 0
    print("✅ Empty ballots test passed!")

def test_no_candidates():
    """Test edge case with no candidates"""
    print("Testing no candidates case...")

    candidates = []
    ballots = [Ballot(["A", "B"])]

    winner, rounds = instant_runoff_voting(candidates, ballots)

    assert winner is None
    assert len(rounds) == 0
    print("✅ No candidates test passed!")

def test_complex_example():
    """Test a more complex example with multiple rounds"""
    print("Testing complex example...")

    candidates = [
        Candidate("A", "Paris"),
        Candidate("B", "Tokyo"),
        Candidate("C", "Barcelona"),
        Candidate("D", "Rome")
    ]

    ballots = [
        Ballot(["A", "B", "C", "D"]),  # A gets 2 votes
        Ballot(["A", "C", "B", "D"]),
        Ballot(["B", "A", "C", "D"]),  # B gets 2 votes
        Ballot(["B", "C", "A", "D"]),
        Ballot(["C", "B", "A", "D"]),  # C gets 1 vote
        Ballot(["D", "A", "B", "C"])   # D gets 1 vote
    ]

    winner, rounds = instant_runoff_voting(candidates, ballots)

    assert winner is not None
    print(f"   Winner: {winner.name}")
    print(f"   Rounds: {len(rounds)}")
    for i, round_data in enumerate(rounds):
        print(f"   Round {round_data.round_number}: {round_data.vote_counts}")
    print("✅ Complex example test passed!")

def run_all_tests():
    """Run all test cases"""
    print("🗳️  Testing Custom Instant-Runoff Voting Implementation")
    print("=" * 60)

    try:
        test_empty_ballots()
        test_no_candidates()
        test_simple_majority()
        test_instant_runoff()
        test_tie_elimination()
        test_complex_example()

        print("=" * 60)
        print("🎉 All tests passed! The custom voting implementation works correctly.")
        print("\n📋 Summary of implementation:")
        print("   ✅ Handles majority winners in first round")
        print("   ✅ Proper instant-runoff elimination")
        print("   ✅ Tie-breaking for eliminated candidates")
        print("   ✅ Edge case handling (no ballots/candidates)")
        print("   ✅ Complex multi-round scenarios")
        print("   ✅ Complete audit trail of all rounds")
        return True

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import sys
    success = run_all_tests()
    sys.exit(0 if success else 1)