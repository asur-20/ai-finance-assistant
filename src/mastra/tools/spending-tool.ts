import { Pool } from "pg";
import dotenv from "dotenv";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
function normalizeMerchantName(name: string) {

  const upper = name.toUpperCase();

  if (upper.includes("SWIGGY")) {
    return "Swiggy";
  }

  if (upper.includes("ZOMATO")) {
    return "Zomato";
  }

  if (upper.includes("UBER")) {
    return "Uber";
  }

  if (upper.includes("NETFLIX")) {
    return "Netflix";
  }

  if (upper.includes("SPOTIFY")) {
    return "Spotify";
  }
  if (
    upper.includes("AIR INDIA")
  ) {
    return "Air India";
  }
  
  if (
    upper.includes("INDIGO")
  ) {
    return "IndiGo";
  }

  return name;
}

export async function getTotalSpending(category?: string) {

  let query = `
    SELECT COALESCE(SUM(amount), 0) AS total
    FROM transactions
    WHERE amount > 0
  `;

  const values: string[] = [];

  if (category) {
    query += ` AND LOWER(category) = LOWER($1)`;
    values.push(category);
  }

  const result = await pool.query(query, values);

  return {
    total: result.rows[0].total,
  };
}
export async function getTopMerchants(limit: number = 5) {

  const query = `
    SELECT
      merchant,
      ROUND(SUM(amount)::numeric, 2) AS total
    FROM transactions
    WHERE amount > 0
    AND LOWER(category) != 'transfer'
    GROUP BY merchant
  `;

  const result = await pool.query(query);

  const normalizedMap = new Map<
    string,
    number
  >();

  for (const row of result.rows) {

    const normalized =
      normalizeMerchantName(row.merchant);

    const current =
      normalizedMap.get(normalized) || 0;

    normalizedMap.set(
      normalized,
      current + Number(row.total)
    );
  }

  const finalResult = Array.from(
    normalizedMap.entries()
  )
    .map(([merchant, total]) => ({
      merchant,
      total: total.toFixed(2),
    }))
    .sort(
      (a, b) =>
        Number(b.total) - Number(a.total)
    )
    .slice(0, limit);

  return finalResult;
}
export async function getBiggestExpense() {

  const query = `
    SELECT
      merchant,
      amount,
      date,
      category
    FROM transactions
    WHERE amount > 0
    AND LOWER(category) != 'transfer'
    ORDER BY amount DESC
    LIMIT 1
  `;

  const result = await pool.query(query);

  return result.rows[0];
}
export async function getMonthlySpending() {

  const query = `
    SELECT
      TO_CHAR(date, 'YYYY-MM') AS month,
      ROUND(SUM(amount)::numeric, 2) AS total
    FROM transactions
    WHERE amount > 0
    AND LOWER(category) != 'transfer'
    GROUP BY month
    ORDER BY month ASC
  `;

  const result = await pool.query(query);

  return result.rows;
}
export async function compareCategorySpending(
  category1: string,
  category2: string
) {

  const query = `
    SELECT
      category,
      ROUND(SUM(amount)::numeric, 2) AS total
    FROM transactions
    WHERE amount > 0
    AND LOWER(category) IN (LOWER($1), LOWER($2))
    GROUP BY category
  `;

  const result = await pool.query(query, [
    category1,
    category2,
  ]);

  return result.rows;
}
export async function getRecurringSubscriptions() {

  const query = `
    SELECT
      merchant,
      COUNT(*) AS transaction_count,
      ROUND(AVG(amount)::numeric, 2) AS average_amount
    FROM transactions
    WHERE amount > 0
    AND LOWER(category) != 'transfer'
    GROUP BY merchant
    HAVING COUNT(*) >= 3
    ORDER BY transaction_count DESC
    LIMIT 10
  `;

  const result = await pool.query(query);

  return result.rows;
}
export async function getNetSpending(
  category?: string
) {

  let query = `
    SELECT
      ROUND(SUM(amount)::numeric, 2) AS total
    FROM transactions
    WHERE LOWER(category) != 'transfer'
  `;

  const values: string[] = [];

  if (category) {

    query += `
      AND LOWER(category) = LOWER($1)
    `;

    values.push(category);
  }

  const result = await pool.query(
    query,
    values
  );

  return result.rows[0];
}
export async function getPortfolioValue() {

  const query = `
    SELECT
      h.fund_name,
      h.units,
      latest_nav.nav,
      ROUND(
        (h.units * latest_nav.nav)::numeric,
        2
      ) AS current_value
   FROM (
  SELECT DISTINCT ON (fund_id)
    *
  FROM holdings
) h

    JOIN (
      SELECT DISTINCT ON (fund_id)
        fund_id,
        nav,
        date
      FROM fund_nav
      WHERE nav IS NOT NULL
      ORDER BY fund_id, date DESC
    ) latest_nav

    ON h.fund_id = latest_nav.fund_id
  `;

  const result = await pool.query(query);

  const totalPortfolioValue =
    result.rows.reduce(
      (sum, row) =>
        sum + Number(row.current_value),
      0
    );

  return {
    holdings: result.rows,
    totalPortfolioValue:
      totalPortfolioValue.toFixed(2),
  };
}
export async function getPortfolioReturns() {

  const query = `
    SELECT
      h.fund_name,
      h.units,
      h.purchase_nav,

      latest_nav.nav AS current_nav,

      ROUND(
        (h.units * h.purchase_nav)::numeric,
        2
      ) AS invested_amount,

      ROUND(
        (h.units * latest_nav.nav)::numeric,
        2
      ) AS current_value

    FROM (
      SELECT DISTINCT ON (fund_id)
        *
      FROM holdings
    ) h

    JOIN (
      SELECT DISTINCT ON (fund_id)
        fund_id,
        nav,
        date
      FROM fund_nav
      WHERE nav IS NOT NULL
      ORDER BY fund_id, date DESC
    ) latest_nav

    ON h.fund_id = latest_nav.fund_id
  `;

  const result = await pool.query(query);

  const enriched = result.rows.map(row => {

    const invested =
      Number(row.invested_amount);

    const current =
      Number(row.current_value);

    const profit =
      current - invested;

    return {
      ...row,
      profit: profit.toFixed(2),
    };
  });

  const totalProfit =
    enriched.reduce(
      (sum, row) =>
        sum + Number(row.profit),
      0
    );

  return {
    holdings: enriched,
    totalProfit:
      totalProfit.toFixed(2),
  };
}
export const totalSpendingTool = createTool({

  id: "total-spending-tool",

  description:
    "Get total spending optionally by category",

  inputSchema: z.object({
    category: z.string().optional(),
  }),

  outputSchema: z.object({
    total: z.string(),
  }),

  execute: async ({ category }) => {

    const result =
      await getTotalSpending(category);

    return {
      total: result.total,
    };
  },
});
export const biggestExpenseTool = createTool({

  id: "biggest-expense-tool",

  description:
    "Get the user's biggest expense transaction",

  inputSchema: z.object({}),

  outputSchema: z.object({
    merchant: z.string(),
    amount: z.string(),
    category: z.string(),
  }),

  execute: async () => {

    const result =
      await getBiggestExpense();

    return {
      merchant: result.merchant,
      amount: result.amount,
      category: result.category,
    };
  },
});

export const topMerchantsTool = createTool({

  id: "top-merchants-tool",

  description:
    "Get top spending merchants",

  inputSchema: z.object({}),

  outputSchema: z.array(
    z.object({
      merchant: z.string(),
      total: z.string(),
    })
  ),

  execute: async () => {

    return await getTopMerchants();
  },
});

export const recurringSubscriptionsTool = createTool({

  id: "recurring-subscriptions-tool",

  description:
    "Get recurring subscriptions and repeated merchants",

  inputSchema: z.object({}),

  outputSchema: z.array(
    z.object({
      merchant: z.string(),
      transaction_count: z.string(),
      average_amount: z.string(),
    })
  ),

  execute: async () => {

    return await getRecurringSubscriptions();
  },
});

export const portfolioValueTool = createTool({

  id: "portfolio-value-tool",

  description:
    "Get total portfolio value",

  inputSchema: z.object({}),

  outputSchema: z.object({
    totalPortfolioValue: z.string(),
  }),

  execute: async () => {

    const result =
      await getPortfolioValue();

    return {
      totalPortfolioValue:
        result.totalPortfolioValue,
    };
  },
});

export const portfolioReturnsTool = createTool({

  id: "portfolio-returns-tool",

  description:
    "Get total portfolio profit or returns",

  inputSchema: z.object({}),

  outputSchema: z.object({
    totalProfit: z.string(),
  }),

  execute: async () => {

    const result =
      await getPortfolioReturns();

    return {
      totalProfit:
        result.totalProfit,
    };
  },
});

export const monthlySpendingTool = createTool({

  id: "monthly-spending-tool",

  description:
    "Get monthly spending trends",

  inputSchema: z.object({}),

  outputSchema: z.array(
    z.object({
      month: z.string(),
      total: z.string(),
    })
  ),

  execute: async () => {

    return await getMonthlySpending();
  },
});

export const categoryComparisonTool = createTool({

  id: "category-comparison-tool",

  description:
    "Compare spending between two categories",

  inputSchema: z.object({
    category1: z.string(),
    category2: z.string(),
  }),

  outputSchema: z.array(
    z.object({
      category: z.string(),
      total: z.string(),
    })
  ),

  execute: async ({
    category1,
    category2,
  }) => {

    return await compareCategorySpending(
      category1,
      category2
    );
  },
});

