#!/usr/bin/env python3
"""
Simple test script to verify the custom instant-runoff voting implementation
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our custom voting implementation
from app.services.voting import Candidate, Ballot, instant_runoff_voting

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

def test_incomplete_rankings():
    """Test ballots with incomplete rankings"""
    print("Testing incomplete rankings case...")

    candidates = [
        Candidate("A", "Option A"),
        Candidate("B", "Option B"),
        Candidate("C", "Option C"),
        Candidate("D", "Option D")
    ]

    ballots = [
        Ballot(["A", "B"]),  # Incomplete ranking
        Ballot(["A", "C"]),
        Ballot(["B", "A"]),
        Ballot(["C", "B", "A"])
    ]

    winner, rounds = instant_runoff_voting(candidates, ballots)

    assert winner is not None
    print("✅ Incomplete rankings test passed!")

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
        test_incomplete_rankings()

        print("=" * 60)
        print("🎉 All tests passed! The custom voting implementation works correctly.")
        return True

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)