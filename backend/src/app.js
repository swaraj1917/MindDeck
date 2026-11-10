
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "MindDeck API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "MindDeck backend is healthy",
  });
});

app.use("/api/decks", require("./routes/decks"));
app.use("/api/cards", require("./routes/cards"));
app.use("/api/reviews", require("./routes/reviews"));
app.use("/api/study", require("./routes/study"));
app.use("/api/stats", require("./routes/stats"));

module.exports = app;
