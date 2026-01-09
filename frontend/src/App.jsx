import React, { useState, useEffect } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./AppStyles.css";
import NavBar from "./components/NavBar";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Home from "./components/Home";
import CreatePoll from "./components/CreatePoll";
import PollDetail from "./components/PollDetail";
import MyPolls from "./components/MyPolls";
import NotFound from "./components/NotFound";
import { API_URL, SOCKETS_URL, NODE_ENV } from "./shared";
import { io } from "socket.io-client";

const socket = io(SOCKETS_URL, {
  withCredentials: NODE_ENV === "production",
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
});

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    socket.on("connect", () => {
      console.log("🔗 Connected to socket");
    });
    
    socket.on("connect_error", (error) => {
      console.warn("⚠️ Socket connection error (this is okay in development):", error.message);
    });

    return () => {
      socket.off("connect");
      socket.off("connect_error");
    };
  }, []);

  const checkAuth = async () => {
    try {
      const response = await axios.get(`${API_URL}/auth/me`, {
        withCredentials: true,
      });
      setUser(response.data.user);
    } catch {
      console.log("Not authenticated");
      setUser(null);
    }
  };

  // Check authentication status on app load
  useEffect(() => {
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      // Logout from our backend
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        }
      );
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div>
      <NavBar user={user} onLogout={handleLogout} />
      <div className="app">
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route exact path="/" element={<Home user={user} />} />
          <Route path="/create-poll" element={<CreatePoll user={user} />} />
          <Route path="/my-polls" element={<MyPolls user={user} />} />
          <Route path="/poll/:id" element={<PollDetail user={user} />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </div>
  );
};

const Root = () => {
  return (
    <Router>
      <App />
    </Router>
  );
};

// Error boundary for rendering
try {
  console.log("🚀 Starting React app...");
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    console.error("❌ Root element not found!");
    document.body.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Error: Root element not found</h1>
        <p>The root div with id="root" was not found in the HTML.</p>
      </div>
    `;
  } else {
    console.log("✅ Root element found, rendering app...");
    const root = createRoot(rootElement);
    root.render(<Root />);
    console.log("✅ React app rendered successfully");
  }
} catch (error) {
  console.error("❌ Error rendering React app:", error);
  console.error("Error stack:", error.stack);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; background: #fff; color: #000;">
      <h1>Error Loading Application</h1>
      <p>There was an error loading the app. Please check the console for details.</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px;">${error.message}\n\n${error.stack}</pre>
    </div>
  `;
}
