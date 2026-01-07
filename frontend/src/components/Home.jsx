import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_URL } from "../shared";
import "./HomeStyles.css";

const Home = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <div className="home">
        <h1>Welcome to the TTP Winter Frontend!</h1>
        <div className="loading-message">Loading polls...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="home">
        <h1>Welcome to the TTP Winter Frontend!</h1>
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={fetchPolls} className="retry-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      <h1>Welcome to the TTP Winter Frontend!</h1>
      {polls.length === 0 ? (
        <div className="no-polls-message">
          <p>No polls found. Create your first poll to get started!</p>
        </div>
      ) : (
        <div className="polls-container">
          {polls.map((poll) => (
            <div key={poll.id} className="poll-card">
              {poll.imageUrl && (
                <img
                  src={`${API_URL}${poll.imageUrl}`}
                  alt={poll.title}
                  className="poll-image"
                />
              )}
              <div className="poll-header">
                <h2 className="poll-name">{poll.title}</h2>
                <span className={`poll-status ${poll.status === "open" ? "open" : "closed"}`}>
                  {poll.status === "open" ? "Open" : "Closed"}
                </span>
              </div>
              {poll.description && (
                <p className="poll-description">{poll.description}</p>
              )}
              {poll.closeDate && (
                <p className="poll-close-date">
                  Closes: {new Date(poll.closeDate).toLocaleDateString()}
                </p>
              )}
              {poll.creator && (
                <p className="poll-creator">
                  Created by: <strong>{poll.creator.username}</strong>
                </p>
              )}
              <div className="poll-options">
                <h3>Options:</h3>
                <ul>
                  {poll.options && poll.options.length > 0 ? (
                    poll.options.map((option) => (
                      <li key={option.id}>
                        {option.imageUrl && (
                          <img
                            src={`${API_URL}${option.imageUrl}`}
                            alt={option.text}
                            className="option-image"
                          />
                        )}
                        <span>{option.text}</span>
                      </li>
                    ))
                  ) : (
                    <li>No options available</li>
                  )}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
