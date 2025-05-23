"use server"

import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"

export interface BudgetData {
  income: number
  fixedExpenses: Array<{
    category: string
    amount: number
  }>
  goals: Array<{
    category: string
    target_percent: number
  }>
  remainingIncome?: number
  totalFixedExpenses?: number
}

export interface AIRecommendation {
  budgetPlan: {
    category: string
    amount: number
    percent: number
    reasoning: string
  }[]
  insights: string[]
  warnings: string[]
  summary: string
}

export async function getAIBudgetRecommendations(budgetData: BudgetData): Promise<AIRecommendation> {
  // Calculate some values to help the AI
  const totalFixedExpenses = budgetData.fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remainingIncome = budgetData.income - totalFixedExpenses

  // Prepare the prompt with all the budget information
  const prompt = `
    You are an AI financial advisor specializing in personal budget optimization.
    
    USER'S FINANCIAL INFORMATION:
    - Monthly Income: $${budgetData.income}
    - Total Fixed Expenses: $${totalFixedExpenses}
    - Remaining Income: $${remainingIncome}
    
    FIXED EXPENSES:
    ${budgetData.fixedExpenses.map((expense) => `- ${expense.category}: $${expense.amount}`).join("\n")}
    
    FINANCIAL GOALS:
    ${budgetData.goals.map((goal) => `- ${goal.category}: ${goal.target_percent}% of income`).join("\n")}
    
    Based on this information, provide:
    1. An optimized budget plan with specific allocations for each category
    2. Key insights about their financial situation
    3. Warnings if any goals are unrealistic or if there are potential issues
    4. A brief summary of the overall budget health
    
    Format your response as a JSON object with the following structure:
    {
      "budgetPlan": [
        {
          "category": "Category name",
          "amount": 123.45,
          "percent": 12.3,
          "reasoning": "Brief explanation for this allocation"
        }
      ],
      "insights": ["Insight 1", "Insight 2"],
      "warnings": ["Warning 1", "Warning 2"],
      "summary": "Overall budget summary"
    }
    
    Only return the JSON object, nothing else.
  `

  try {
    // Generate text using the Groq model
    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.3,
      maxTokens: 2048,
    })

    // Parse the JSON response
    return JSON.parse(text) as AIRecommendation
  } catch (error) {
    console.error("Error getting AI budget recommendations:", error)
    return {
      budgetPlan: [],
      insights: ["Unable to generate AI recommendations at this time."],
      warnings: [],
      summary: "Please try again later.",
    }
  }
}
