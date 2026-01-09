import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./MyPollsStyles.css";

const MyPolls = ({ user }) => {
  const navigate = useNavigate();
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingPollId, setDeletingPollId] = useState(null);
  const [closingPollId, setClosingPollId] = useState(null);
  const [copiedPollId, setCopiedPollId] = useState(null);
  const [editingPollId, setEditingPollId] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMyPolls();
  }, [user, navigate]);

  const fetchMyPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(`${API_URL}/api/polls`, {
        withCredentials: true,
      });
      // Filter to only show polls created by the logged-in user
      const myPolls = (response.data.polls || []).filter(
        (poll) => poll.userId === user.id
      );
      setPolls(myPolls);
    } catch (err) {
      console.error("Error fetching polls:", err);
      setError(
        err.response?.data?.error || "Failed to load your polls. Is the backend running?"
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
      alert("Poll deleted successfully!");
    } catch (err) {
      console.error("Error deleting poll:", err);
      alert(err.response?.data?.error || "Failed to delete poll. Please try again.");
    } finally {
      setDeletingPollId(null);
    }
  };

  const handleClosePoll = async (pollId) => {
    if (!window.confirm("Are you sure you want to close this poll? Users will no longer be able to vote.")) {
      return;
    }

    try {
      setClosingPollId(pollId);
      await axios.post(
        `${API_URL}/api/polls/${pollId}/close`,
        {},
        {
          withCredentials: true,
        }
      );
      // Update the poll status in local state
      setPolls(
        polls.map((poll) =>
          poll.id === pollId ? { ...poll, status: "closed" } : poll
        )
      );
      alert("Poll closed successfully!");
    } catch (err) {
      console.error("Error closing poll:", err);
      alert(err.response?.data?.error || "Failed to close poll. Please try again.");
    } finally {
      setClosingPollId(null);
    }
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

  const handleStartEdit = (poll) => {
    setEditingPollId(poll.id);
    setEditFormData({
      title: poll.title,
      description: poll.description || "",
      closeDate: poll.closeDate ? new Date(poll.closeDate).toISOString().slice(0, 16) : "",
    });
  };

  const handleCancelEdit = () => {
    setEditingPollId(null);
    setEditFormData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSaveEdit = async (pollId) => {
    try {
      const submitData = new FormData();
      submitData.append("title", editFormData.title);
      if (editFormData.description) {
        submitData.append("description", editFormData.description);
      }
      if (editFormData.closeDate) {
        submitData.append("closeDate", editFormData.closeDate);
      }

      await axios.put(`${API_URL}/api/polls/${pollId}`, submitData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh polls
      await fetchMyPolls();
      setEditingPollId(null);
      setEditFormData({});
      alert("Poll updated successfully!");
    } catch (err) {
      console.error("Error updating poll:", err);
      alert(err.response?.data?.error || "Failed to update poll. Please try again.");
    }
  };

  const openPolls = polls.filter((poll) => poll.status === "open");
  const closedPolls = polls.filter((poll) => poll.status === "closed");

  if (loading) {
    return (
      <div className="my-polls-container">
        <div className="loading-message">Loading your polls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="my-polls-container">
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchMyPolls} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const renderPollCard = (poll) => {
    const isEditing = editingPollId === poll.id;

    return (
      <div key={poll.id} className="my-poll-card">
        {isEditing ? (
          <div className="edit-poll-form">
            <div className="edit-form-group">
              <label>Poll Title</label>
              <input
                type="text"
                name="title"
                value={editFormData.title}
                onChange={handleEditChange}
                className="edit-input"
              />
            </div>
            <div className="edit-form-group">
              <label>Description</label>
              <textarea
                name="description"
                value={editFormData.description}
                onChange={handleEditChange}
                rows="3"
                className="edit-input"
              />
            </div>
            <div className="edit-form-group">
              <label>Close Date</label>
              <input
                type="datetime-local"
                name="closeDate"
                value={editFormData.closeDate}
                onChange={handleEditChange}
                className="edit-input"
              />
            </div>
            <div className="edit-form-actions">
              <button
                onClick={() => handleSaveEdit(poll.id)}
                className="save-edit-btn"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="cancel-edit-btn"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="my-poll-header">
              <Link to={`/poll/${poll.id}`} className="poll-title-link">
                <h2>{poll.title}</h2>
              </Link>
              <div className="poll-actions">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCopyPollLink(poll.id, e);
                  }}
                  className={`action-btn share-btn ${copiedPollId === poll.id ? "copied" : ""}`}
                  title="Copy shareable link"
                >
                  {copiedPollId === poll.id ? "✓" : "🔗"}
                </button>
                <button
                  onClick={() => handleStartEdit(poll)}
                  className="action-btn edit-btn"
                  title="Edit poll"
                >
                  ✏️
                </button>
                {poll.status === "open" && (
                  <button
                    onClick={() => handleClosePoll(poll.id)}
                    className="action-btn close-btn"
                    disabled={closingPollId === poll.id}
                    title="Close poll"
                  >
                    {closingPollId === poll.id ? "..." : "🔒"}
                  </button>
                )}
                <button
                  onClick={() => handleDeletePoll(poll.id)}
                  className="action-btn delete-btn"
                  disabled={deletingPollId === poll.id}
                  title="Delete poll"
                >
                  {deletingPollId === poll.id ? "..." : "🗑️"}
                </button>
              </div>
            </div>

            <div className="my-poll-status">
              <span className={`status-badge ${poll.status === "open" ? "open" : "closed"}`}>
                {poll.status === "open" ? "Open" : "Closed"}
              </span>
              {poll.closeDate && (
                <span className="close-date-info">
                  {poll.status === "open" ? "Closes: " : "Closed: "}
                  {new Date(poll.closeDate).toLocaleDateString()}
                </span>
              )}
            </div>

            {poll.description && (
              <p className="poll-description">{poll.description}</p>
            )}

            <div className="poll-stats">
              <div className="stat-item">
                <span className="stat-label">Options:</span>
                <span className="stat-value">{poll.options?.length || 0}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Votes:</span>
                <span className="stat-value">
                  {poll.votes?.length || poll._count?.votes || 0}
                </span>
              </div>
            </div>

            <div className="poll-view-link">
              <Link to={`/poll/${poll.id}`} className="view-poll-btn">
                {poll.status === "open" ? "View Poll" : "View Results"}
              </Link>
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="my-polls-container">
      <div className="my-polls-header">
        <h1>My Polls</h1>
        <Link to="/create-poll" className="create-new-poll-btn">
          + Create New Poll
        </Link>
      </div>

      {polls.length === 0 ? (
        <div className="no-polls-message">
          <p>You haven't created any polls yet.</p>
          <Link to="/create-poll" className="create-first-poll-btn">
            Create Your First Poll
          </Link>
        </div>
      ) : (
        <div className="my-polls-sections">
          {openPolls.length > 0 && (
            <div className="poll-section">
              <h2 className="section-title">Open Polls ({openPolls.length})</h2>
              <div className="polls-grid">
                {openPolls.map(renderPollCard)}
              </div>
            </div>
          )}
          {closedPolls.length > 0 && (
            <div className="poll-section">
              <h2 className="section-title">Closed Polls ({closedPolls.length})</h2>
              <div className="polls-grid">
                {closedPolls.map(renderPollCard)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyPolls;

