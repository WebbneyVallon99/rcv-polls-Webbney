import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./HomeStyles.css";

const Home = ({ user }) => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPollId, setDeletingPollId] = useState(null);
  const [copiedPollId, setCopiedPollId] = useState(null);

  useEffect(() => {
    fetchPolls();
  }, []);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/polls`, {
        withCredentials: true,
      });
      setPolls(response.data.polls || []);
    } catch (err) {
      console.error("Error fetching polls:", err);
      setError(
        err.response?.data?.error || "Failed to load polls. Is the backend running?"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to delete this poll? This action cannot be undone.")) {
      return;
    }

    try {
      setDeletingPollId(pollId);
      await axios.delete(`${API_URL}/api/polls/${pollId}`, {
        withCredentials: true,
      });
      // Remove the poll from the local state
      setPolls(polls.filter((poll) => poll.id !== pollId));
    } catch (err) {
      console.error("Error deleting poll:", err);
      alert(err.response?.data?.error || "Failed to delete poll. Please try again.");
    } finally {
      setDeletingPollId(null);
    }
  };

  const isPollOwner = (poll) => {
    return user && poll.userId === user.id;
  };

  const handleCopyPollLink = async (pollId, e) => {
    e.preventDefault();
    e.stopPropagation();
    const pollUrl = `${window.location.origin}/poll/${pollId}`;
    try {
      await navigator.clipboard.writeText(pollUrl);
      setCopiedPollId(pollId);
      setTimeout(() => setCopiedPollId(null), 3000);
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
        setCopiedPollId(pollId);
        setTimeout(() => setCopiedPollId(null), 3000);
      } catch (err) {
        alert("Failed to copy link. Please copy manually: " + pollUrl);
      }
      document.body.removeChild(textArea);
    }
  };

  const getGreeting = () => {
    if (user) {
      return `Welcome back, ${user.username}!`;
    }
    return "Welcome! Explore and vote on polls.";
  };

  if (loading) {
    return (
      <div className="home">
        <h1 className="greeting">{getGreeting()}</h1>
        <div className="loading-message">Loading polls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <h1 className="greeting">{getGreeting()}</h1>
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchPolls} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const openPolls = polls.filter((poll) => poll.status === "open");
  const closedPolls = polls.filter((poll) => poll.status === "closed");

  const renderPollCard = (poll) => (
    <Link key={poll.id} to={`/poll/${poll.id}`} className="poll-card-link">
      <div className="poll-card">
        <div className="poll-header">
          <h2 className="poll-name">{poll.title}</h2>
          <div className="poll-header-right">
            <button
              onClick={(e) => handleCopyPollLink(poll.id, e)}
              className={`share-poll-btn ${copiedPollId === poll.id ? "copied" : ""}`}
              title="Copy shareable link"
            >
              {copiedPollId === poll.id ? "✓" : "🔗"}
            </button>
            <span className={`poll-status ${poll.status === "open" ? "open" : "closed"}`}>
              {poll.status === "open" ? "Open" : "Closed"}
            </span>
            {isPollOwner(poll) && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleDeletePoll(poll.id);
                }}
                className="delete-poll-btn"
                disabled={deletingPollId === poll.id}
                title="Delete this poll"
              >
                {deletingPollId === poll.id ? "Deleting..." : "🗑️"}
              </button>
            )}
          </div>
        </div>
        {poll.description && (
          <p className="poll-description">{poll.description}</p>
        )}
        {poll.creator && (
          <p className="poll-creator">
            Created by: <strong>{poll.creator.username}</strong>
          </p>
        )}
        {poll.closeDate && (
          <p className="poll-close-date">
            Closes: {new Date(poll.closeDate).toLocaleDateString()}
          </p>
        )}
        <div className="poll-options">
          <h3>Options:</h3>
          <ul>
            {poll.options && poll.options.length > 0 ? (
              poll.options.map((option) => (
                <li key={option.id}>{option.text}</li>
              ))
            ) : (
              <li>No options available</li>
            )}
          </ul>
        </div>
      </div>
    </Link>
  );

  return (
    <div className="home">
      <h1 className="greeting">{getGreeting()}</h1>
      {polls.length === 0 ? (
        <div className="no-polls-message">
          <p>No polls found. Create your first poll to get started!</p>
        </div>
      ) : (
        <div className="polls-sections">
          {openPolls.length > 0 && (
            <div className="poll-section">
              <h2 className="section-title">Open Polls</h2>
              <div className="polls-container">
                {openPolls.map(renderPollCard)}
              </div>
            </div>
          )}
          {closedPolls.length > 0 && (
            <div className="poll-section">
              <h2 className="section-title">Closed Polls</h2>
              <div className="polls-container">
                {closedPolls.map(renderPollCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Home;
