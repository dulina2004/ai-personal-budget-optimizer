"use client"

import { AlertCircle, CheckCircle2, Lightbulb, Loader2, ShieldAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Budget Results</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert variant={results.success ? "default" : "destructive"}>
          {results.success ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertTitle>{results.success ? "Success" : "Warning"}</AlertTitle>
          <AlertDescription>{results.message}</AlertDescription>
        </Alert>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Monthly Income:</span>
            <span className="font-medium">{formatCurrency(results.income)}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Fixed Expenses:</span>
            <span className="font-medium">{formatCurrency(results.totalFixedExpenses)}</span>
          </div>
          <div className="flex justify-between">
            <span>Remaining Income:</span>
            <span className="font-medium">{formatCurrency(results.remainingIncome)}</span>
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
                    <div key={index} className="space-y-1">
                      <div className="flex justify-between">
                        <span>{allocation.category}</span>
                        <div className="text-right">
                          <div>{formatCurrency(allocation.amount)}</div>
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
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Analyzing your financial data with AI...</p>
                </div>
              ) : aiRecommendation ? (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium mb-4">AI Recommended Budget</h3>
                    <div className="space-y-4">
                      {aiRecommendation.budgetPlan.map((item, index) => (
                        <div key={index} className="space-y-1">
                          <div className="flex justify-between">
                            <span>{item.category}</span>
                            <div className="text-right">
                              <div>{formatCurrency(item.amount)}</div>
                              <div className="text-xs text-muted-foreground">{formatPercent(item.percent)}</div>
                            </div>
                          </div>
                          <Progress value={item.percent} className="h-2" />
                          <p className="text-xs text-muted-foreground mt-1">{item.reasoning}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  {aiRecommendation.insights.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-amber-500" />
                        <h3 className="font-medium">AI Insights</h3>
                      </div>
                      <ul className="space-y-2 pl-6 list-disc">
                        {aiRecommendation.insights.map((insight, index) => (
                          <li key={index} className="text-sm">
                            {insight}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {aiRecommendation.warnings.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-destructive" />
                        <h3 className="font-medium">Warnings</h3>
                      </div>
                      <ul className="space-y-2 pl-6 list-disc">
                        {aiRecommendation.warnings.map((warning, index) => (
                          <li key={index} className="text-sm">
                            {warning}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Alert>
                    <AlertTitle>Summary</AlertTitle>
                    <AlertDescription>{aiRecommendation.summary}</AlertDescription>
                  </Alert>

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
                <div className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground">Unable to load AI recommendations.</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {!results.success && (
          <div className="space-y-4">
            <h3 className="font-medium">Fixed Expenses Breakdown</h3>
            <div className="space-y-2">
              {results.fixedExpenses.map((expense, index) => (
                <div key={index} className="flex justify-between">
                  <span>{expense.category}</span>
                  <span>{formatCurrency(expense.amount)}</span>
                </div>
              ))}
            </div>

            {results.totalGoalAmount && (
              <>
                <h3 className="font-medium">Goal Requirements</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Total Goal Amount:</span>
                    <span>{formatCurrency(results.totalGoalAmount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Goal Percentage:</span>
                    <span>{formatPercent(results.totalGoalPercent || 0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Available After Fixed Expenses:</span>
                    <span>{formatCurrency(results.remainingIncome)}</span>
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
