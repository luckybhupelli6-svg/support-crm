require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

// Initialize DB (runs table creation on first launch)
require("./database");

const ticketRoutes = require("./routes/tickets");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend files from /public folder
app.use(express.static(path.join(__dirname, "../public")));

// API routes
app.use("/api/tickets", ticketRoutes);

// Catch-all: serve index.html for any unknown route
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});