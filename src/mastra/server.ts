import express from "express";

import { askFinanceAgent } from "./agents/finance-agent";

const app = express();

app.use(express.json());

app.post("/ask", async (req, res) => {

  try {

    const { question } = req.body;

    if (!question) {
      return res.status(400).json({
        error: "Question is required",
      });
    }

    const answer = await askFinanceAgent(question);

    return res.json({
      answer,
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});