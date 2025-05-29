"use client"

import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Target,
  DollarSign,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { BudgetChart } from "./budget-chart"
import type { AIRecommendation } from "@/app/actions/budget-ai"

interface BudgetResultsProps {
  results: {
    success: boolean
    message: string
    income: number
    totalFixedExpenses: number
    remainingIncome: number
    allocations: Array<{
      category: string
      amount: number
      percent: number
    }>
    fixedExpenses: Array<{
      category: string
      amount: number
    }>
    totalGoalAmount?: number
    totalGoalPercent?: number
    discretionaryAmount?: number
    discretionaryPercent?: number
  }
  aiRecommendation: AIRecommendation | null
  isLoading: boolean
}

export function BudgetResults({ results, aiRecommendation, isLoading }: BudgetResultsProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent.toFixed(1)}%`
  }

  // Calculate budget health score
  const getBudgetHealthScore = () => {
    const fixedExpenseRatio = (results.totalFixedExpenses / results.income) * 100
    if (fixedExpenseRatio > 70) return { score: "Poor", color: "destructive", message: "Fixed expenses too high" }
    if (fixedExpenseRatio > 50) return { score: "Fair", color: "secondary", message: "Consider reducing expenses" }
    if (fixedExpenseRatio > 30) return { score: "Good", color: "default", message: "Healthy expense ratio" }
    return { score: "Excellent", color: "default", message: "Great financial position" }
  }

  const budgetHealth = getBudgetHealthScore()

  // Budget management guidelines
  const budgetGuidelines = [
    {
      icon: <DollarSign className="h-4 w-4" />,
      title: "50/30/20 Rule",
      description: "50% needs, 30% wants, 20% savings & debt repayment",
      status: results.totalFixedExpenses / results.income <= 0.5 ? "good" : "warning",
    },
    {
      icon: <Target className="h-4 w-4" />,
      title: "Emergency Fund",
      description: "Save 3-6 months of expenses for emergencies",
      status: "info",
    },
    {
      icon: <TrendingUp className="h-4 w-4" />,
      title: "Savings Rate",
      description: "Aim to save at least 20% of your income",
      status: results.remainingIncome / results.income >= 0.2 ? "good" : "warning",
    },
  ]

  return (
    <Card className="h-full border-border bg-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Budget Results</CardTitle>
          <Badge variant={budgetHealth.color === "default" ? "default" : "destructive"}>{budgetHealth.score}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant={results.success ? "default" : "destructive"} className="border-border">
          {results.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{results.success ? "Success" : "Warning"}</AlertTitle>
          <AlertDescription>{results.message}</AlertDescription>
        </Alert>

        {/* Budget Health Overview */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Budget Health Overview
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{formatCurrency(results.income)}</div>
              <div className="text-sm text-muted-foreground">Monthly Income</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">
                {formatPercent((results.totalFixedExpenses / results.income) * 100)}
              </div>
              <div className="text-sm text-muted-foreground">Fixed Expenses</div>
            </div>
            <div className="text-center p-3 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-foreground">{formatCurrency(results.remainingIncome)}</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Budget Guidelines */}
        <div className="space-y-4">
          <h3 className="font-medium flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Budget Management Guidelines
          </h3>
          <div className="grid gap-3">
            {budgetGuidelines.map((guideline, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                <div className="mt-0.5">{guideline.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{guideline.title}</span>
                    <Badge
                      variant={
                        guideline.status === "good"
                          ? "default"
                          : guideline.status === "warning"
                            ? "destructive"
                            : "secondary"
                      }
                      className="text-xs"
                    >
                      {guideline.status === "good" ? "✓" : guideline.status === "warning" ? "!" : "i"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{guideline.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {results.success && results.allocations.length > 0 && (
          <Tabs defaultValue="basic">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Plan</TabsTrigger>
              <TabsTrigger value="ai" disabled={!aiRecommendation && !isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    AI Analyzing...
                  </>
                ) : (
                  "AI Recommendations"
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6 pt-4">
              <div>
                <h3 className="font-medium mb-4">Budget Allocation</h3>
                <div className="space-y-4">
                  {results.allocations.map((allocation, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{allocation.category}</span>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(allocation.amount)}</div>
                          <div className="text-xs text-muted-foreground">{formatPercent(allocation.percent)}</div>
                        </div>
                      </div>
                      <Progress value={allocation.percent} className="h-2" />
                    </div>
                  ))}
                </div>
              </div>

              <BudgetChart
                fixedExpenses={results.fixedExpenses}
                allocations={results.allocations}
                income={results.income}
              />
            </TabsContent>

            <TabsContent value="ai" className="space-y-6 pt-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-lg font-medium">AI is analyzing your budget...</p>
                  <p className="text-sm text-muted-foreground">This may take a few seconds</p>
                </div>
              ) : aiRecommendation ? (
                <div className="space-y-6">
                  {/* AI Budget Plan */}
                  <div>
                    <h3 className="font-medium mb-4 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4 text-amber-500" />
                      AI-Optimized Budget Plan
                    </h3>
                    <div className="space-y-4">
                      {aiRecommendation.budgetPlan.map((item, index) => (
                        <div key={index} className="space-y-2 p-4 bg-muted/30 rounded-lg">
                          <div className="flex justify-between">
                            <span className="font-medium">{item.category}</span>
                            <div className="text-right">
                              <div className="font-semibold">{formatCurrency(item.amount)}</div>
                              <div className="text-xs text-muted-foreground">{formatPercent(item.percent)}</div>
                            </div>
                          </div>
                          <Progress value={item.percent} className="h-2" />
                          <p className="text-xs text-muted-foreground italic">{item.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {/* AI Insights */}
                  {aiRecommendation.insights.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <h3 className="font-medium">Personalized Insights</h3>
                      </div>
                      <div className="grid gap-2">
                        {aiRecommendation.insights.map((insight, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm">{insight}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Warnings */}
                  {aiRecommendation.warnings.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        <h3 className="font-medium">Important Warnings</h3>
                      </div>
                      <div className="grid gap-2">
                        {aiRecommendation.warnings.map((warning, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/20 rounded-lg"
                          >
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <p className="text-sm">{warning}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* AI Summary */}
                  <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border-blue-200 dark:border-blue-800">
                    <Lightbulb className="h-4 w-4" />
                    <AlertTitle>AI Summary</AlertTitle>
                    <AlertDescription className="mt-2">{aiRecommendation.summary}</AlertDescription>
                  </Alert>

                  {/* AI Chart */}
                  <BudgetChart
                    fixedExpenses={results.fixedExpenses}
                    allocations={aiRecommendation.budgetPlan.map((item) => ({
                      category: item.category,
                      amount: item.amount,
                      percent: item.percent,
                    }))}
                    income={results.income}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">AI Analysis Unavailable</p>
                  <p className="text-sm text-muted-foreground text-center">
                    Unable to load AI recommendations at this time. Please try again later.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Error State */}
        {!results.success && (
          <div className="space-y-4">
            <h3 className="font-medium">Fixed Expenses Breakdown</h3>
            <div className="space-y-2">
              {results.fixedExpenses.map((expense, index) => (
                <div key={index} className="flex justify-between p-2 bg-muted rounded">
                  <span>{expense.category}</span>
                  <span className="font-medium">{formatCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>

            {results.totalGoalAmount && (
              <>
                <Separator />
                <h3 className="font-medium">Goal Analysis</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Goal Amount:</span>
                    <span className="font-medium">{formatCurrency(results.totalGoalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available After Fixed Expenses:</span>
                    <span className="font-medium">{formatCurrency(results.remainingIncome)}</span>
                  </div>
                  <div className="flex justify-between text-destructive font-medium">
                    <span>Shortfall:</span>
                    <span>{formatCurrency(results.totalGoalAmount - results.remainingIncome)}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
