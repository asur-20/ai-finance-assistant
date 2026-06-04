
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Client } = pkg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  await client.connect();

  console.log("Connected to PostgreSQL 🚀");

  // TRANSACTIONS TABLE

  await client.query(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      date DATE,
      merchant TEXT,
      category TEXT,
      amount NUMERIC,
      currency TEXT,
      memo TEXT
    );
  `);

  // FUNDS TABLE

  await client.query(`
    CREATE TABLE IF NOT EXISTS funds (
      id TEXT PRIMARY KEY,
      name TEXT,
      category TEXT
    );
  `);

  // FUND NAV TABLE

  await client.query(`
    CREATE TABLE IF NOT EXISTS fund_nav (
      fund_id TEXT,
      date DATE,
      nav NUMERIC
    );
  `);

  // HOLDINGS TABLE

  await client.query(`
    CREATE TABLE IF NOT EXISTS holdings (
      fund_id TEXT,
      fund_name TEXT,
      units NUMERIC,
      purchase_date DATE,
      purchase_nav NUMERIC
    );
  `);

  console.log("Tables created ✅");

  // LOAD JSON FILES

  const basePath = path.join(
    process.cwd(),
    "data",
    "sample_a"
  );

  const transactions = JSON.parse(
    fs.readFileSync(
      path.join(basePath, "transactions.json"),
      "utf-8"
    )
  );

  const funds = JSON.parse(
    fs.readFileSync(
      path.join(basePath, "funds.json"),
      "utf-8"
    )
  );

  const holdings = JSON.parse(
    fs.readFileSync(
      path.join(basePath, "holdings.json"),
      "utf-8"
    )
  );

  console.log("JSON loaded ✅");

  // INSERT TRANSACTIONS

  for (const txn of transactions) {
    await client.query(
      `
      INSERT INTO transactions
      (id, date, merchant, category, amount, currency, memo)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        txn.id,
        txn.date,
        txn.merchant,
        txn.category,
        txn.amount,
        txn.currency,
        txn.memo,
      ]
    );
  }

  console.log("Transactions inserted ✅");

  // INSERT FUNDS + NAV HISTORY

  for (const fund of funds) {
    await client.query(
      `
      INSERT INTO funds
      (id, name, category)
      VALUES ($1, $2, $3)
      ON CONFLICT (id) DO NOTHING
      `,
      [
        fund.id,
        fund.name,
        fund.category,
      ]
    );

    for (const nav of fund.nav){
      await client.query(
        `
        INSERT INTO fund_nav
        (fund_id, date, nav)
        VALUES ($1, $2, $3)
        `,
        [
          fund.id,
          nav.date,
          nav.value,
        ]
      );
    }
  }

  console.log("Funds inserted ✅");

  // INSERT HOLDINGS

  for (const holding of holdings) {
    await client.query(
      `
      INSERT INTO holdings
      (fund_id, fund_name, units, purchase_date, purchase_nav)
      VALUES ($1, $2, $3, $4, $5)
      `,
      [
        holding.fund_id,
        holding.fund_name,
        holding.units,
        holding.purchase_date,
        holding.purchase_nav,
      ]
    );
  }

  console.log("Holdings inserted ✅");

  await client.end();

  console.log("Database ingestion complete 🎉");
}

main().catch((err) => {
  console.error(err);
});
