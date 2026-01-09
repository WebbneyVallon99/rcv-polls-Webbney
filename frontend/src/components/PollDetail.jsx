import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./PollDetailStyles.css";

const PollDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState(null);
  const [rankings, setRankings] = useState({}); // { optionId: rank }
  const [linkCopied, setLinkCopied] = useState(false);

  useEffect(() => {
    fetchPollData();
  }, [id, user]);

  const fetchPollData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch poll details
      const pollResponse = await axios.get(`${API_URL}/api/polls/${id}`, {
        withCredentials: true,
      });
      setPoll(pollResponse.data.poll);

      // If poll is closed, fetch results
      if (pollResponse.data.poll.status === "closed") {
        try {
          const resultsResponse = await axios.get(
            `${API_URL}/api/votes/poll/${id}/results`,
            { withCredentials: true }
          );
          setResults(resultsResponse.data);
        } catch (err) {
          console.error("Error fetching results:", err);
          // Results might not be available yet
        }
      }

      // Check if user has voted (only for open polls and logged-in users)
      if (user && pollResponse.data.poll.status === "open") {
        try {
          const voteStatusResponse = await axios.get(
            `${API_URL}/api/votes/poll/${id}/status`,
            { withCredentials: true }
          );
          setHasVoted(voteStatusResponse.data.hasVoted);
        } catch (err) {
          console.error("Error checking vote status:", err);
        }
      }
    } catch (err) {
      console.error("Error fetching poll:", err);
      setError(err.response?.data?.error || "Failed to load poll");
    } finally {
      setLoading(false);
    }
  };

  const handleRankChange = (optionId, rank) => {
    setRankings((prev) => {
      const newRankings = { ...prev };

      // If this rank is already taken by another option, swap them
      const existingOptionId = Object.keys(newRankings).find(
        (id) => newRankings[id] === rank
      );
      if (existingOptionId && existingOptionId !== optionId.toString()) {
        newRankings[existingOptionId] = newRankings[optionId] || null;
      }

      // Set the new rank
      if (rank === "") {
        delete newRankings[optionId];
      } else {
        newRankings[optionId] = parseInt(rank);
      }

      return newRankings;
    });
  };

  const handleSubmitVote = async (e) => {
    e.preventDefault();

    if (!user) {
      navigate("/login");
      return;
    }

    // Validate that all options are ranked
    if (!poll || !poll.options) return;

    const optionIds = poll.options.map((opt) => opt.id);
    const rankedOptionIds = Object.keys(rankings).map((id) => parseInt(id));
    const ranks = Object.values(rankings);

    // Check all options are ranked
    if (rankedOptionIds.length !== optionIds.length) {
      alert("Please rank all options before submitting your vote.");
      return;
    }

    // Check ranks are sequential (1, 2, 3, ...)
    const sortedRanks = [...ranks].sort((a, b) => a - b);
    for (let i = 0; i < sortedRanks.length; i++) {
      if (sortedRanks[i] !== i + 1) {
        alert("Ranks must be sequential (1, 2, 3, ...).");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const preferences = Object.keys(rankings).map((optionId) => ({
        optionId: parseInt(optionId),
        rank: rankings[optionId],
      }));

      await axios.post(
        `${API_URL}/api/votes`,
        {
          pollId: parseInt(id),
          preferences,
        },
        { withCredentials: true }
      );

      setHasVoted(true);
      alert("Vote submitted successfully!");
      // Refresh poll data
      fetchPollData();
    } catch (err) {
      console.error("Error submitting vote:", err);
      alert(err.response?.data?.error || "Failed to submit vote. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async () => {
    const pollUrl = `${window.location.origin}/poll/${id}`;
    console.log("Copying poll URL:", pollUrl);
    try {
      await navigator.clipboard.writeText(pollUrl);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 3000);
      console.log("Link copied successfully:", pollUrl);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = pollUrl;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setLinkCopied(true);
        setTimeout(() => setLinkCopied(false), 3000);
      } catch (err) {
        alert("Failed to copy link. Please copy manually: " + pollUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  if (loading) {
    return (
      <div className="poll-detail-container">
        <div className="loading-message">Loading poll...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="poll-detail-container">
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={() => navigate("/")} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!poll) {
    return (
      <div className="poll-detail-container">
        <div className="error-message">
          <p>Poll not found</p>
          <button onClick={() => navigate("/")} className="back-button">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="poll-detail-container">
      <button onClick={() => navigate("/")} className="back-button">
        ← Back to Polls
      </button>

      <div className="poll-detail">
        <div className="poll-detail-header">
          <h1>{poll.title}</h1>
          <div className="poll-header-actions">
            <button
              onClick={handleCopyLink}
              className={`share-poll-button ${linkCopied ? "copied" : ""}`}
              title="Copy shareable link"
            >
              {linkCopied ? "✓ Link Copied!" : "🔗 Share Poll"}
            </button>
            <span className={`poll-status ${poll.status === "open" ? "open" : "closed"}`}>
              {poll.status === "open" ? "Open" : "Closed"}
            </span>
          </div>
        </div>

        {poll.description && <p className="poll-description">{poll.description}</p>}

        {poll.creator && (
          <p className="poll-creator">
            Created by: <strong>{poll.creator.username}</strong>
          </p>
        )}

        {poll.closeDate && (
          <p className="poll-close-date">
            {poll.status === "open" ? "Closes: " : "Closed: "}
            {new Date(poll.closeDate).toLocaleDateString()}
          </p>
        )}

        {poll.imageUrl && (
          <img
            src={`${API_URL}${poll.imageUrl}`}
            alt={poll.title}
            className="poll-detail-image"
          />
        )}

        {poll.status === "open" ? (
          <div className="voting-section">
            {hasVoted ? (
              <div className="already-voted-message">
                <h2>✅ You've already voted on this poll!</h2>
                <p>Thank you for participating. Results will be available once the poll closes.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitVote} className="voting-form">
                <h2>Cast Your Vote</h2>
                <p className="vote-instructions">
                  Rank all options in order of preference (1 = most preferred, {poll.options?.length} = least preferred)
                </p>

                {!user && (
                  <div className="login-prompt">
                    <p>You must be logged in to vote.</p>
                    <button
                      type="button"
                      onClick={() => navigate("/login")}
                      className="login-button"
                    >
                      Log In
                    </button>
                  </div>
                )}

                <div className="options-ranking">
                  {poll.options &&
                    poll.options.map((option) => (
                      <div key={option.id} className="ranking-option">
                        <div className="option-content">
                          {option.imageUrl && (
                            <img
                              src={`${API_URL}${option.imageUrl}`}
                              alt={option.text}
                              className="option-image-small"
                            />
                          )}
                          <span className="option-text">{option.text}</span>
                        </div>
                        <select
                          value={rankings[option.id] || ""}
                          onChange={(e) => handleRankChange(option.id, e.target.value)}
                          disabled={!user || hasVoted}
                          className="rank-select"
                          required
                        >
                          <option value="">Select rank...</option>
                          {poll.options.map((_, index) => (
                            <option key={index + 1} value={index + 1}>
                              {index + 1}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                </div>

                {user && !hasVoted && (
                  <button
                    type="submit"
                    className="submit-vote-button"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Submitting..." : "Submit Vote"}
                  </button>
                )}
              </form>
            )}
          </div>
        ) : (
          <div className="results-section">
            <h2>Poll Results</h2>
            {results ? (
              <div className="irv-results">
                <div className="winner-section">
                  <h3>🏆 Winner</h3>
                  <div className="winner-card">
                    <p className="winner-text">{results.results.winner.optionText}</p>
                    <p className="winner-stats">
                      {results.results.winner.votes} votes ({results.results.winner.percentage}%)
                    </p>
                  </div>
                </div>

                <div className="rounds-section">
                  <h3>Voting Rounds</h3>
                  <p className="total-voters">Total Voters: {results.totalVoters}</p>
                  {results.results.rounds.map((round, index) => (
                    <div key={index} className="round-card">
                      <h4>Round {round.round}</h4>
                      <div className="round-votes">
                        {Object.values(round.voteCounts).map((voteCount) => (
                          <div
                            key={voteCount.optionId}
                            className={`vote-count-item ${
                              round.winner?.optionId === voteCount.optionId ? "winner" : ""
                            } ${
                              round.eliminated?.optionId === voteCount.optionId ? "eliminated" : ""
                            }`}
                          >
                            <span className="option-name">{voteCount.optionText}</span>
                            <span className="vote-info">
                              {voteCount.votes} votes ({voteCount.percentage}%)
                            </span>
                          </div>
                        ))}
                      </div>
                      {round.eliminated && (
                        <p className="eliminated-text">
                          ❌ {round.eliminated.optionText} eliminated
                        </p>
                      )}
                      {round.winner && (
                        <p className="winner-announcement">
                          🎉 {round.winner.optionText} wins with majority!
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="no-results">
                <p>Results are not yet available for this poll.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollDetail;

