import { getTotalSpending } from "../src/mastra/tools/spending-tool";

async function financeAgent(userMessage: string) {

  const message = userMessage.toLowerCase();

  if (message.includes("food")) {

    const result = await getTotalSpending("food");

    return `Total food spending is ₹${result.total}`;
  }

  if (message.includes("spending")) {

    const result = await getTotalSpending();

    return `Total spending is ₹${result.total}`;
  }

  return "I could not understand the question.";
}

async function main() {

  const response = await financeAgent(
    "How much did I spend on food?"
  );

  console.log(response);
}

main();