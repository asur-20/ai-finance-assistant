import { Agent } from "@mastra/core/agent";
import { groq } from "@ai-sdk/groq";

import {
  getTotalSpending,
  getTopMerchants,
  getBiggestExpense,
  getMonthlySpending,
  compareCategorySpending,
  getRecurringSubscriptions,
  getNetSpending,
  getPortfolioValue,
  getPortfolioReturns
} from "../tools/spending-tool";

export const financeAgent = new Agent({
  id: "finance-agent",

  name: "Finance Agent",

  instructions: `
    You are a helpful finance assistant.
  `,

  model: groq("llama-3.1-8b-instant"),
});

export async function askFinanceAgent(userMessage: string) {

  const message = userMessage.toLowerCase();

  if (message.includes("food")) {

    const result = await getTotalSpending("food");

    return `Total food spending is ₹${result.total}`;
  }
  if (message.includes("biggest expense")) {

    const result =
      await getBiggestExpense();
  
    return `
  Biggest expense was ₹${result.amount}
  spent at ${result.merchant}
  under ${result.category}.
    `;
  }
  if (
    message.includes("top merchants")
  ) {
  
    const result =
      await getTopMerchants();
  
      return result
      .map(
        (item, index) =>
          `${index + 1}. ${item.merchant}
    - Total Spend: ₹${item.total}`
      )
      .join("\n\n");
  }
  if (
    message.includes("subscription") ||
    message.includes("recurring")
  ) {
  
    const result =
      await getRecurringSubscriptions();
  
      return result
  .map(
    (item, index) =>
      `${index + 1}. ${item.merchant}
- Transactions: ${item.transaction_count}
- Avg Amount: ₹${item.average_amount}`
  )
  .join("\n\n");
  }
  if (
    message.includes("portfolio return") ||
    message.includes("portfolio returns") ||
    message.includes("profit")
  ) {
  
    const result =
      await getPortfolioReturns();
  
    return `
  Total portfolio profit is ₹${result.totalProfit}
    `;
  }
  if (
    message.includes("food") &&
    message.includes("travel")
  ) {
  
    const result =
      await compareCategorySpending(
        "food",
        "travel"
      );
  
      return result
  .map(
    item =>
      `${item.category}: ₹${item.total}`
  )
  .join("\n");
  }
  if (message.includes("biggest expense")) {

    const result = await getBiggestExpense();
  
    return `
  Biggest expense was ₹${result.amount}
  spent at ${result.merchant}
  under ${result.category} category.
    `;
  }
  if (
    message.includes("food") &&
    message.includes("travel")
  ) {
  
    const result =
      await compareCategorySpending(
        "food",
        "travel"
      );
  
    return JSON.stringify(result, null, 2);
  }

  if (message.includes("spending")) {

    const result = await getTotalSpending();

    return `Total spending is ₹${result.total}`;
  }

  return "I could not understand the question.";
}