require("dotenv").config();
const express = require("express");
const morgan = require("morgan");
const path = require("path");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const apiRouter = require("./api");
const { router: authRouter } = require("./auth");
const { db } = require("./database");
const cors = require("cors");
const initSocketServer = require("./socket-server");
const PORT = process.env.PORT || 8080;
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

// body parser middleware
app.use(express.json());

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true,
  })
);

// cookie parser middleware
app.use(cookieParser());

app.use(morgan("dev")); // logging middleware
app.use(express.static(path.join(__dirname, "public"))); // serve static files from public folder
app.use("/uploads", express.static(path.join(__dirname, "public/uploads"))); // serve uploaded images
app.use("/api", apiRouter); // mount api router
app.use("/auth", authRouter); // mount auth router

// Serve frontend static files (for production)
// Check if we're in production and frontend dist exists
const fs = require("fs");
const frontendDistPath = path.join(__dirname, "..", "frontend", "dist");
try {
  if (fs.existsSync(frontendDistPath)) {
    app.use(express.static(frontendDistPath));
    
    // Catch-all handler: send back React's index.html file for any non-API routes
    // This must be LAST, after all API routes
    app.get("*", (req, res, next) => {
      // Don't serve React app for API/auth/uploads routes (they should have been handled above)
      if (req.path.startsWith("/api") || req.path.startsWith("/auth") || req.path.startsWith("/uploads")) {
        return next();
      }
      // Send React app for all other routes
      const indexPath = path.join(frontendDistPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.status(404).send("Frontend not found. Please build the frontend first.");
      }
    });
  }
} catch (err) {
  console.log("⚠️  Frontend dist folder not found. Skipping frontend serving.");
  console.log("   (This is normal in development - use the webpack dev server instead)");
}

// error handling middleware (must be LAST, after all routes)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.sendStatus(500);
});

const runApp = async () => {
  try {
    await db.sync();
    console.log("✅ Connected to the database");
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
    });

    initSocketServer(server);
    console.log("🧦 Socket server initialized");
  } catch (err) {
    console.error("❌ Unable to connect to the database:", err);
  }
};

runApp();

module.exports = app;
