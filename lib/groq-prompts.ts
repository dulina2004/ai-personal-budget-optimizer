/**
 * Groq LLM Prompt Engineering Guide and Templates
 *
 * This file contains centralized prompts, instructions, and best practices
 * for interacting with the Groq LLM in the AI Personal Budget Optimizer.
 *
 * PROMPT ENGINEERING BEST PRACTICES:
 *
 * 1. CLARITY AND SPECIFICITY
 *    - Use clear, specific language
 *    - Define exact output formats
 *    - Provide concrete examples
 *
 * 2. STRUCTURED PROMPTS
 *    - Use consistent formatting
 *    - Separate instructions from data
 *    - Include role definition
 *
 * 3. CONTEXT MANAGEMENT
 *    - Provide relevant background information
 *    - Include constraints and limitations
 *    - Specify the target audience
 *
 * 4. OUTPUT FORMATTING
 *    - Request specific JSON structures
 *    - Define required fields
 *    - Include validation criteria
 *
 * 5. ERROR HANDLING
 *    - Account for edge cases
 *    - Provide fallback responses
 *    - Include validation instructions
 */

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

/**
 * MAIN BUDGET ANALYSIS PROMPT TEMPLATE
 *
 * This is the primary prompt used for comprehensive budget analysis.
 * It follows a structured approach with clear sections and specific output requirements.
 */
export function createBudgetAnalysisPrompt(budgetData: BudgetData): string {
  const totalFixedExpenses = budgetData.fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remainingIncome = budgetData.income - totalFixedExpenses
  const fixedExpenseRatio = (totalFixedExpenses / budgetData.income) * 100

  return `You are an AI financial advisor. Analyze the budget data and respond with ONLY a valid JSON object.

FINANCIAL DATA:
- Monthly Income: $${budgetData.income}
- Fixed Expenses: $${totalFixedExpenses} (${fixedExpenseRatio.toFixed(1)}% of income)
- Available for Allocation: $${remainingIncome}

FIXED EXPENSES:
${budgetData.fixedExpenses.map((expense) => `- ${expense.category}: $${expense.amount}`).join("\n")}

FINANCIAL GOALS:
${budgetData.goals.map((goal) => `- ${goal.category}: ${goal.target_percent}% of income`).join("\n")}

CRITICAL INSTRUCTIONS:
1. Respond with ONLY a JSON object - no explanatory text before or after
2. Do not include markdown formatting or code blocks
3. Ensure all numbers are valid (no NaN, null, or undefined)
4. Budget allocations must total exactly $${remainingIncome}

Required JSON format:
{
  "budgetPlan": [
    {
      "category": "Savings",
      "amount": 600.00,
      "percent": 20.0,
      "reasoning": "Emergency fund and long-term goals"
    }
  ],
  "insights": [
    "Your fixed expenses are ${fixedExpenseRatio.toFixed(1)}% of income, which is ${fixedExpenseRatio > 50 ? "above" : "within"} recommended limits"
  ],
  "warnings": [
    ${remainingIncome < 0 ? '"Your fixed expenses exceed your income"' : '"No major warnings detected"'}
  ],
  "summary": "Overall budget assessment in 1-2 sentences"
}`
}

/**
 * QUICK BUDGET TIPS PROMPT
 *
 * Used for generating quick financial tips based on budget analysis
 */
export function createQuickTipsPrompt(budgetData: BudgetData): string {
  return `As a financial advisor, provide 3-5 quick, actionable tips for someone with:
- Income: $${budgetData.income}
- Fixed expenses: $${budgetData.fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)}

Focus on practical advice they can implement immediately. Return as a simple JSON array of strings:
["Tip 1", "Tip 2", "Tip 3"]`
}

/**
 * EXPENSE CATEGORIZATION PROMPT
 *
 * Used for helping users categorize their expenses
 */
export function createExpenseCategorizationPrompt(expenses: string[]): string {
  return `Categorize these expenses into standard budget categories (Housing, Transportation, Food, Utilities, Entertainment, Healthcare, Personal Care, Savings, Debt Payment, Other):

Expenses: ${expenses.join(", ")}

Return as JSON object:
{
  "categorized": {
    "Housing": ["expense1", "expense2"],
    "Transportation": ["expense3"]
  },
  "suggestions": ["Suggestion for better categorization"]
}`
}

/**
 * GOAL VALIDATION PROMPT
 *
 * Used for validating if financial goals are realistic
 */
export function createGoalValidationPrompt(
  income: number,
  goals: Array<{ category: string; target_percent: number }>,
): string {
  const totalGoalPercent = goals.reduce((sum, goal) => sum + goal.target_percent, 0)

  return `Evaluate these financial goals for someone earning $${income}/month:

Goals:
${goals.map((goal) => `- ${goal.category}: ${goal.target_percent}%`).join("\n")}

Total goal percentage: ${totalGoalPercent}%

Assess if these goals are:
1. Mathematically possible
2. Realistic based on typical budget guidelines
3. Balanced across different life areas

Return JSON:
{
  "feasible": true/false,
  "issues": ["Issue 1", "Issue 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"]
}`
}

/**
 * EMERGENCY FUND CALCULATOR PROMPT
 *
 * Specialized prompt for emergency fund recommendations
 */
export function createEmergencyFundPrompt(monthlyExpenses: number, currentSavings = 0): string {
  return `Calculate emergency fund recommendations for someone with:
- Monthly expenses: $${monthlyExpenses}
- Current emergency savings: $${currentSavings}

Provide recommendations for 3, 6, and 12-month emergency funds.

Return JSON:
{
  "recommendations": {
    "basic": {"months": 3, "amount": 0, "timeline": "6 months"},
    "standard": {"months": 6, "amount": 0, "timeline": "12 months"},
    "comprehensive": {"months": 12, "amount": 0, "timeline": "24 months"}
  },
  "current_status": "Assessment of current emergency fund",
  "priority_level": "High/Medium/Low"
}`
}

/**
 * DEBT PAYOFF STRATEGY PROMPT
 *
 * For users with debt obligations
 */
export function createDebtPayoffPrompt(
  debts: Array<{ name: string; balance: number; minPayment: number; interestRate: number }>,
  extraPayment: number,
): string {
  return `Create a debt payoff strategy for:

Debts:
${debts.map((debt) => `- ${debt.name}: $${debt.balance} balance, $${debt.minPayment} minimum, ${debt.interestRate}% APR`).join("\n")}

Extra payment available: $${extraPayment}/month

Compare avalanche vs snowball methods and recommend the best approach.

Return JSON:
{
  "recommended_method": "avalanche/snowball",
  "payoff_order": ["debt1", "debt2"],
  "total_interest_saved": 0,
  "payoff_timeline": "X months",
  "strategy_explanation": "Why this method is recommended"
}`
}

/**
 * PROMPT VALIDATION UTILITIES
 */
export function validatePromptResponse(response: string): boolean {
  try {
    JSON.parse(response)
    return true
  } catch {
    return false
  }
}

export function sanitizePromptInput(input: string): string {
  return input.replace(/[^\w\s\-.,()$%]/g, "").trim()
}

/**
 * PROMPT PERFORMANCE OPTIMIZATION TIPS
 *
 * 1. TOKEN EFFICIENCY
 *    - Keep prompts concise but complete
 *    - Use bullet points for lists
 *    - Avoid redundant information
 *
 * 2. RESPONSE CONSISTENCY
 *    - Always specify exact JSON structure
 *    - Include field validation requirements
 *    - Provide examples when needed
 *
 * 3. ERROR PREVENTION
 *    - Include constraints and limitations
 *    - Specify data types and ranges
 *    - Handle edge cases explicitly
 *
 * 4. CONTEXT OPTIMIZATION
 *    - Provide relevant background only
 *    - Use consistent terminology
 *    - Maintain professional tone
 */

/**
 * EXAMPLE SUCCESSFUL PROMPTS
 *
 * These examples demonstrate effective prompt structures that have
 * produced high-quality responses from the Groq LLM:
 *
 * EXAMPLE 1: Clear Role Definition
 * "You are a certified financial planner with 10 years of experience..."
 *
 * EXAMPLE 2: Structured Data Presentation
 * "USER PROFILE:\n- Income: $X\n- Expenses: $Y\n\nANALYSIS REQUIRED:\n1. ..."
 *
 * EXAMPLE 3: Specific Output Format
 * "Return as JSON with exact structure: {\"field1\": value, \"field2\": [...]}"
 *
 * EXAMPLE 4: Constraint Specification
 * "CONSTRAINTS:\n- Total must equal $X\n- Percentages must sum to 100%\n- No negative values"
 */

/**
 * ENHANCED JSON VALIDATION AND CLEANING
 */
export function cleanAndValidateJSON(response: string): string {
  // Remove common LLM response artifacts
  let cleaned = response.trim()

  // Remove markdown code blocks
  cleaned = cleaned.replace(/```json\s*/gi, "")
  cleaned = cleaned.replace(/```\s*/g, "")

  // Remove any text before the first {
  const jsonStart = cleaned.indexOf("{")
  if (jsonStart > 0) {
    cleaned = cleaned.substring(jsonStart)
  }

  // Remove any text after the last }
  const jsonEnd = cleaned.lastIndexOf("}")
  if (jsonEnd !== -1 && jsonEnd < cleaned.length - 1) {
    cleaned = cleaned.substring(0, jsonEnd + 1)
  }

  return cleaned
}

export function validateAIRecommendation(obj: any): obj is AIRecommendation {
  return (
    obj &&
    typeof obj === "object" &&
    Array.isArray(obj.budgetPlan) &&
    Array.isArray(obj.insights) &&
    Array.isArray(obj.warnings) &&
    typeof obj.summary === "string"
  )
}

export function createFallbackRecommendation(budgetData: BudgetData, error?: string): AIRecommendation {
  const totalFixedExpenses = budgetData.fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
  const remainingIncome = budgetData.income - totalFixedExpenses

  return {
    budgetPlan:
      remainingIncome > 0
        ? [
            {
              category: "Emergency Savings",
              amount: remainingIncome * 0.2,
              percent: ((remainingIncome * 0.2) / budgetData.income) * 100,
              reasoning: "Build emergency fund first",
            },
            {
              category: "Discretionary",
              amount: remainingIncome * 0.8,
              percent: ((remainingIncome * 0.8) / budgetData.income) * 100,
              reasoning: "Flexible spending allocation",
            },
          ]
        : [],
    insights: [
      "AI analysis temporarily unavailable",
      `Available after fixed expenses: $${remainingIncome.toFixed(2)}`,
      remainingIncome > 0 ? "Focus on building an emergency fund" : "Consider reducing expenses",
    ],
    warnings: [
      error || "AI service temporarily unavailable",
      ...(remainingIncome < 0 ? ["Income insufficient to cover fixed expenses"] : []),
    ],
    summary:
      remainingIncome < 0
        ? "Budget shows deficit - immediate action needed"
        : "Basic budget allocation provided - AI analysis pending",
  }
}
