import React from "react";
import "./HomeStyles.css";

const Home = () => {
  const samplePolls = [
    {
      id: 1,
      name: "Best Programming Language 2024",
      options: ["JavaScript", "Python", "TypeScript", "Rust"],
      isOpen: true,
    },
    {
      id: 2,
      name: "Favorite Pizza Topping",
      options: ["Pepperoni", "Mushrooms", "Extra Cheese", "Peppers"],
      isOpen: true,
    },
    {
      id: 3,
      name: "Weekend Activity Preference",
      options: ["Hiking", "Movies", "Gaming", "Reading"],
      isOpen: false,
    },
    {
      id: 4,
      name: "Preferred Coffee Type",
      options: ["Espresso", "Cappuccino", "Latte", "Americano"],
      isOpen: true,
    },
  ];

  return (
    <div className="home">
      <h1>Welcome to the TTP Winter Frontend!</h1>
      <div className="polls-container">
        {samplePolls.map((poll) => (
          <div key={poll.id} className="poll-card">
            <div className="poll-header">
              <h2 className="poll-name">{poll.name}</h2>
              <span className={`poll-status ${poll.isOpen ? "open" : "closed"}`}>
                {poll.isOpen ? "Open" : "Closed"}
              </span>
            </div>
            <div className="poll-options">
              <h3>Options:</h3>
              <ul>
                {poll.options.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
