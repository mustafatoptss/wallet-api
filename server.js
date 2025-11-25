import express from "express";
import dotenv from "dotenv";
import { sql } from "./config/db.js";
import rateLimiter from "./middleware/rateLimiter.js";
import transactionsRoute from "./routes/transactionsRoute.js";
import job from "./config/cron.js"

dotenv.config();

const app = express();
  if(process.env.NODE.ENV==="production") job.start();
// GLOBAL MIDDLEWARES
app.use(rateLimiter);
app.use(express.json());

app.use("/api/transactions", transactionsRoute);

const PORT = process.env.PORT || 5001;

app.get("/api/health", (req,res)=>{
  res.status(200).json({status:"ok"})
})

// TABLE INIT
const initDB = async () => {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        category VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `;
    console.log("Database initialized");
  } catch (error) {
    console.error("Database error:", error);
    process.exit(1);
  }
};

// START SERVER
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});