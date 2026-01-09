const express = require("express");
const router = express.Router();
const { Poll, Option, Vote, User } = require("../database");
const { authenticateJWT } = require("../auth/index");

// Submit votes for a poll (ranked preferences for IRV)
// Body: { pollId, preferences: [{ optionId, rank }, ...] }
router.post("/", authenticateJWT, async (req, res) => {
  try {
    const { pollId, preferences } = req.body;
    const userId = req.user.id;

    if (!pollId || !preferences || !Array.isArray(preferences)) {
      return res.status(400).json({ error: "Poll ID and preferences array are required" });
    }

    // Check if poll exists
    const poll = await Poll.findByPk(pollId, {
      include: [{ model: Option, as: "options" }],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Check if poll is open
    if (poll.status !== "open") {
      return res.status(400).json({ error: "Can only vote on open polls" });
    }

    // Check if user has already voted (only one vote per user per poll)
    const existingVote = await Vote.findOne({
      where: { userId, pollId },
    });

    if (existingVote) {
      return res.status(400).json({ error: "You have already voted on this poll" });
    }

    // Validate preferences
    const optionIds = poll.options.map((opt) => opt.id);
    const providedOptionIds = preferences.map((p) => p.optionId);
    const ranks = preferences.map((p) => p.rank);

    // Check all option IDs are valid
    const invalidOptions = providedOptionIds.filter((id) => !optionIds.includes(id));
    if (invalidOptions.length > 0) {
      return res.status(400).json({ error: "Invalid option IDs provided" });
    }

    // Check ranks are valid (1, 2, 3, ... and each rank used once per option)
    const uniqueRanks = [...new Set(ranks)];
    if (uniqueRanks.length !== ranks.length) {
      return res.status(400).json({ error: "Each rank must be unique" });
    }

    // Sort ranks to ensure they start at 1 and are sequential
    const sortedRanks = [...ranks].sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        return res.status(400).json({
          error: "Ranks must be sequential starting from 1 (1, 2, 3, ...)",
        });
      }
    }

    // Create votes for each preference
    const votes = await Promise.all(
      preferences.map((pref) =>
        Vote.create({
          userId,
          pollId,
          optionId: pref.optionId,
          rank: pref.rank,
        })
      )
    );

    res.status(201).json({
      message: "Vote submitted successfully",
      votes: votes.length,
    });
  } catch (error) {
    console.error("Error submitting vote:", error);
    res.status(500).json({ error: "Failed to submit vote" });
  }
});

// Get voting results for a poll using Instant Runoff Voting
router.get("/poll/:pollId/results", async (req, res) => {
  try {
    const { pollId } = req.params;

    const poll = await Poll.findByPk(pollId, {
      include: [
        {
          model: Option,
          as: "options",
          include: [{ model: Vote, as: "votes" }],
        },
        {
          model: Vote,
          as: "votes",
          include: [{ model: User, as: "user", attributes: ["id", "username"] }],
        },
      ],
    });

    if (!poll) {
      return res.status(404).json({ error: "Poll not found" });
    }

    // Check if poll is closed
    if (poll.status !== "closed") {
      return res.status(400).json({
        error: "Results are only available for closed polls",
      });
    }

    // Calculate IRV results
    const results = calculateIRV(poll);

    res.json({
      poll: {
        id: poll.id,
        title: poll.title,
        description: poll.description,
      },
      totalVoters: poll.votes ? new Set(poll.votes.map((v) => v.userId)).size : 0,
      results,
    });
  } catch (error) {
    console.error("Error getting poll results:", error);
    res.status(500).json({ error: "Failed to get poll results" });
  }
});

// Instant Runoff Voting Algorithm
function calculateIRV(poll) {
  const options = poll.options || [];
  const votes = poll.votes || [];

  if (votes.length === 0) {
    return {
      winner: null,
      rounds: [],
      message: "No votes cast for this poll",
    };
  }

  if (options.length === 0) {
    return {
      winner: null,
      rounds: [],
      message: "No options available",
    };
  }

  // Group votes by user
  const votesByUser = {};
  votes.forEach((vote) => {
    if (!votesByUser[vote.userId]) {
      votesByUser[vote.userId] = [];
    }
    votesByUser[vote.userId].push({
      optionId: vote.optionId,
      rank: vote.rank,
    });
  });

  // Sort each user's votes by rank
  Object.keys(votesByUser).forEach((userId) => {
    votesByUser[userId].sort((a, b) => a.rank - b.rank);
  });

  const rounds = [];
  let remainingOptions = options.map((opt) => opt.id);
  let roundNumber = 1;
  const totalVoters = Object.keys(votesByUser).length;
  const majority = Math.floor(totalVoters / 2) + 1;

  while (remainingOptions.length > 1) {
    // Count first-choice votes for remaining options
    const voteCounts = {};
    remainingOptions.forEach((optId) => {
      voteCounts[optId] = 0;
    });

    Object.values(votesByUser).forEach((userVotes) => {
      // Find the highest-ranked option that's still in the running
      for (const vote of userVotes) {
        if (remainingOptions.includes(vote.optionId)) {
          voteCounts[vote.optionId]++;
          break;
        }
      }
    });

    // Store round data
    const roundData = {
      round: roundNumber,
      voteCounts: {},
      eliminated: null,
      winner: null,
    };

    remainingOptions.forEach((optId) => {
      const option = options.find((opt) => opt.id === optId);
      roundData.voteCounts[option.id] = {
        optionId: option.id,
        optionText: option.text,
        votes: voteCounts[option.id],
        percentage: ((voteCounts[option.id] / totalVoters) * 100).toFixed(2),
      };
    });

    // Check for majority winner
    for (const optId of remainingOptions) {
      if (voteCounts[optId] >= majority) {
        const winnerOption = options.find((opt) => opt.id === optId);
        roundData.winner = {
          optionId: winnerOption.id,
          optionText: winnerOption.text,
          votes: voteCounts[optId],
          percentage: ((voteCounts[optId] / totalVoters) * 100).toFixed(2),
        };
        rounds.push(roundData);
        return {
          winner: roundData.winner,
          rounds,
        };
      }
    }

    // Find option with fewest votes
    let minVotes = Infinity;
    let eliminatedId = null;

    remainingOptions.forEach((optId) => {
      if (voteCounts[optId] < minVotes) {
        minVotes = voteCounts[optId];
        eliminatedId = optId;
      }
    });

    // If there's a tie for last place, eliminate the last one found
    // (In real IRV, there are specific tie-breaking rules, but this is a simple implementation)
    roundData.eliminated = {
      optionId: eliminatedId,
      optionText: options.find((opt) => opt.id === eliminatedId).text,
      votes: minVotes,
      percentage: ((minVotes / totalVoters) * 100).toFixed(2),
    };

    rounds.push(roundData);

    // Remove eliminated option
    remainingOptions = remainingOptions.filter((id) => id !== eliminatedId);
    roundNumber++;
  }

  // Final winner (only one option left)
  const winnerId = remainingOptions[0];
  const winnerOption = options.find((opt) => opt.id === winnerId);
  const finalVoteCount = Object.values(votesByUser).filter((userVotes) => {
    for (const vote of userVotes) {
      if (vote.optionId === winnerId) {
        return true;
      }
    }
    return false;
  }).length;

  return {
    winner: {
      optionId: winnerOption.id,
      optionText: winnerOption.text,
      votes: finalVoteCount,
      percentage: ((finalVoteCount / totalVoters) * 100).toFixed(2),
    },
    rounds,
  };
}

// Check if user has voted on a poll
router.get("/poll/:pollId/status", authenticateJWT, async (req, res) => {
  try {
    const { pollId } = req.params;
    const userId = req.user.id;

    const hasVoted = await Vote.findOne({
      where: { userId, pollId },
    });

    res.json({
      hasVoted: !!hasVoted,
      pollId: parseInt(pollId),
    });
  } catch (error) {
    console.error("Error checking vote status:", error);
    res.status(500).json({ error: "Failed to check vote status" });
  }
});

module.exports = router;

