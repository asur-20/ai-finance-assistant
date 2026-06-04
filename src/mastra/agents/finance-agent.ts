import { Agent } from "@mastra/core/agent";
import { groq } from "@ai-sdk/groq";
import {
  totalSpendingTool,
  biggestExpenseTool,
  topMerchantsTool,
  recurringSubscriptionsTool,
  portfolioValueTool,
  portfolioReturnsTool,
  monthlySpendingTool,
  categoryComparisonTool,
} from "../tools/spending-tool";
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
You are an AI finance assistant with access to real financial data.

IMPORTANT:
- Always use tools whenever financial data is needed.
- After tool execution, ALWAYS summarize results naturally for the user.
- Never stop after tool execution.
- Never say you don't have data.
- Always explain tool outputs in simple human language.

Examples:
- "You spent ₹12000 on food."
- "Your biggest expense was ₹34000 at Air India."
- "Your portfolio value is ₹119983."

You can answer questions about:
- spending
- expenses
- subscriptions
- merchants
- portfolio value
- portfolio returns
- investments
- monthly spending
- category comparisons
`,


  model: groq("llama-3.1-8b-instant"),

tools: {
  totalSpendingTool,
  biggestExpenseTool,
  topMerchantsTool,
  recurringSubscriptionsTool,
  portfolioValueTool,
  portfolioReturnsTool,
  monthlySpendingTool,
  categoryComparisonTool,
},

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
    message.includes("portfolio value") ||
    message.includes("portfolio")
  ) {
  
    const result =
      await getPortfolioValue();
  
    return `
  Total portfolio value is ₹${result.totalPortfolioValue}
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