import express from "express";
import { sql } from "../config/db.js";

const router = express.Router();

/* ---------------------- SUMMARY (ÖNCE GELMELİ) ---------------------- */

router.get("/summary/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const balanceResult = await sql`
      SELECT COALESCE(SUM(amount), 0) AS balance
      FROM transactions
      WHERE user_id = ${userId}
    `;

    const incomeResult = await sql`
      SELECT COALESCE(SUM(amount), 0) AS income
      FROM transactions
      WHERE user_id = ${userId} AND amount > 0
    `;

    const expensesResult = await sql`
      SELECT COALESCE(SUM(amount), 0) AS expenses
      FROM transactions
      WHERE user_id = ${userId} AND amount < 0
    `;

    res.status(200).json({
      balance: balanceResult[0].balance,
      income: incomeResult[0].income,
      expenses: expensesResult[0].expenses,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ---------------------- GET USER TRANSACTIONS ---------------------- */

router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const transactions = await sql`
      SELECT *
      FROM transactions
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `;

    res.status(200).json(transactions);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

/* ---------------------- CREATE TRANSACTION ---------------------- */

router.post("/", async (req, res) => {
  try {
    const { title, amount, category, user_id } = req.body;

    if (!title || amount === undefined || !category || !user_id) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const result = await sql`
      INSERT INTO transactions (user_id, title, amount, category)
      VALUES (${user_id}, ${title}, ${amount}, ${category})
      RETURNING *
    `;

    res.status(201).json(result[0]);
  } catch (error) {
    console.error("Insert error:", error);
    res.status(500).json({ message: "Internal Error", error: error.message });
  }
});

/* ---------------------- DELETE TRANSACTION ---------------------- */

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const result = await sql`
      DELETE FROM transactions
      WHERE id = ${id}
      RETURNING *
    `;

    if (result.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.status(200).json({
      message: "Deleted successfully",
      deletedTransaction: result[0],
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: error.message });
  }
});

export default router;
