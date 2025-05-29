"use server"

import { groq } from "@ai-sdk/groq"
import { generateText } from "ai"
import { createBudgetAnalysisPrompt, type BudgetData, type AIRecommendation } from "@/lib/groq-prompts"

export type { BudgetData, AIRecommendation }

export async function getAIBudgetRecommendations(budgetData: BudgetData): Promise<AIRecommendation> {
  try {
    const prompt = createBudgetAnalysisPrompt(budgetData)

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.1,
      maxTokens: 1500,
    })

    // Import utilities dynamically to avoid circular imports
    const { cleanAndValidateJSON, validateAIRecommendation, createFallbackRecommendation } = await import(
      "@/lib/groq-prompts"
    )

    // Clean and parse the response
    const cleanedText = cleanAndValidateJSON(text)
    const recommendation = JSON.parse(cleanedText)

    // Validate the structure
    if (!validateAIRecommendation(recommendation)) {
      throw new Error("Invalid recommendation structure")
    }

    // Ensure numeric values are properly formatted
    recommendation.budgetPlan = recommendation.budgetPlan.map((item: any) => ({
      category: String(item.category || "Miscellaneous"),
      amount: Number(item.amount) || 0,
      percent: Number(item.percent) || 0,
      reasoning: String(item.reasoning || "Budget allocation"),
    }))

    return recommendation as AIRecommendation
  } catch (error) {
    console.error("Error getting AI budget recommendations:", error)

    // Import fallback function
    const { createFallbackRecommendation } = await import("@/lib/groq-prompts")

    return createFallbackRecommendation(budgetData, error instanceof Error ? error.message : "Unknown error occurred")
  }
}

/**
 * Additional AI helper functions using our prompt system
 */

export async function getQuickFinancialTips(budgetData: BudgetData): Promise<string[]> {
  try {
    const { createQuickTipsPrompt } = await import("@/lib/groq-prompts")
    const prompt = createQuickTipsPrompt(budgetData)

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.4,
      maxTokens: 512,
    })

    return JSON.parse(text) as string[]
  } catch (error) {
    console.error("Error getting quick tips:", error)
    return [
      "Track your expenses for a week to identify spending patterns",
      "Set up automatic transfers to your savings account",
      "Review and negotiate your recurring subscriptions",
    ]
  }
}

export async function validateFinancialGoals(
  income: number,
  goals: Array<{ category: string; target_percent: number }>,
) {
  try {
    const { createGoalValidationPrompt } = await import("@/lib/groq-prompts")
    const prompt = createGoalValidationPrompt(income, goals)

    const { text } = await generateText({
      model: groq("llama3-70b-8192"),
      prompt,
      temperature: 0.2,
      maxTokens: 1024,
    })

    return JSON.parse(text)
  } catch (error) {
    console.error("Error validating goals:", error)
    return {
      feasible: true,
      issues: [],
      recommendations: ["Please review your goals and try again"],
    }
  }
}
