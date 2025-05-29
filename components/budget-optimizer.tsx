"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { PlusCircle, Trash2 } from "lucide-react"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { BudgetResults } from "./budget-results"
import { type AIRecommendation, type BudgetData, getAIBudgetRecommendations } from "@/app/actions/budget-ai"

const expenseSchema = z.object({
  category: z.string().min(1, "Category is required"),
  amount: z.coerce.number().min(0, "Amount must be a positive number"),
})

const goalSchema = z.object({
  category: z.string().min(1, "Category is required"),
  target_percent: z.coerce
    .number()
    .min(0, "Percentage must be a positive number")
    .max(100, "Percentage cannot exceed 100%"),
})

const formSchema = z.object({
  income: z.coerce.number().min(1, "Income must be a positive number"),
  fixedExpenses: z.array(expenseSchema),
  goals: z.array(goalSchema),
})

type FormValues = z.infer<typeof formSchema>

export function BudgetOptimizer() {
  const [budgetResults, setBudgetResults] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState<AIRecommendation | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      income: 5000,
      fixedExpenses: [
        { category: "Rent", amount: 1200 },
        { category: "Utilities", amount: 200 },
        { category: "Internet", amount: 80 },
        { category: "Phone", amount: 50 },
      ],
      goals: [
        { category: "Emergency Fund", target_percent: 15 },
        { category: "Retirement", target_percent: 10 },
        { category: "Entertainment", target_percent: 8 },
      ],
    },
  })

  const {
    fields: expenseFields,
    append: appendExpense,
    remove: removeExpense,
  } = useFieldArray({
    control: form.control,
    name: "fixedExpenses",
  })

  const {
    fields: goalFields,
    append: appendGoal,
    remove: removeGoal,
  } = useFieldArray({
    control: form.control,
    name: "goals",
  })

  async function onSubmit(data: FormValues) {
    setIsLoading(true)
    setAiRecommendation(null)

    try {
      // Calculate total fixed expenses
      const totalFixedExpenses = data.fixedExpenses.reduce((sum, expense) => sum + expense.amount, 0)

      // Calculate remaining income after fixed expenses
      const remainingIncome = data.income - totalFixedExpenses

      // Check if we have enough income to cover fixed expenses
      if (remainingIncome < 0) {
        setBudgetResults({
          success: false,
          message: "Your fixed expenses exceed your income. Please adjust your expenses or increase your income.",
          income: data.income,
          totalFixedExpenses,
          remainingIncome: 0,
          allocations: [],
          fixedExpenses: data.fixedExpenses,
        })
        setIsLoading(false)
        return
      }

      // Calculate goal-based allocations
      const goalAllocations: { category: string; amount: number; percent: number }[] = []
      let totalGoalPercent = 0
      let totalGoalAmount = 0

      data.goals.forEach((goal) => {
        totalGoalPercent += goal.target_percent
        const amount = (goal.target_percent / 100) * data.income
        goalAllocations.push({
          category: goal.category,
          amount,
          percent: goal.target_percent,
        })
        totalGoalAmount += amount
      })

      // Check if goals are achievable
      if (totalGoalAmount > remainingIncome) {
        setBudgetResults({
          success: false,
          message: "Your financial goals cannot be met with your current income and fixed expenses.",
          income: data.income,
          totalFixedExpenses,
          remainingIncome,
          allocations: [],
          fixedExpenses: data.fixedExpenses,
          goalAllocations,
          totalGoalAmount,
          totalGoalPercent,
        })
        setIsLoading(false)
        return
      }

      // Calculate flexible spending categories
      const discretionaryAmount = remainingIncome - totalGoalAmount
      const discretionaryPercent = (discretionaryAmount / data.income) * 100

      const allocations = [
        ...goalAllocations,
        {
          category: "Discretionary Spending",
          amount: discretionaryAmount,
          percent: discretionaryPercent,
        },
      ]

      // Set the basic results first
      setBudgetResults({
        success: true,
        message: "Here's your optimized budget plan:",
        income: data.income,
        totalFixedExpenses,
        remainingIncome,
        allocations,
        fixedExpenses: data.fixedExpenses,
        totalGoalAmount,
        totalGoalPercent,
        discretionaryAmount,
        discretionaryPercent,
      })

      // Get AI recommendations (this runs separately and won't block the basic results)
      try {
        const budgetData: BudgetData = {
          income: data.income,
          fixedExpenses: data.fixedExpenses,
          goals: data.goals,
          remainingIncome,
          totalFixedExpenses,
        }

        console.log("Requesting AI recommendations for:", budgetData)
        const aiResult = await getAIBudgetRecommendations(budgetData)
        console.log("AI recommendations received:", aiResult)
        setAiRecommendation(aiResult)
      } catch (error) {
        console.error("Error getting AI recommendations:", error)
        // Set a fallback recommendation
        setAiRecommendation({
          budgetPlan: [],
          insights: ["AI analysis is temporarily unavailable. Please try again later."],
          warnings: ["Unable to connect to AI service"],
          summary: "Basic budget calculation completed successfully.",
        })
      }
    } catch (error) {
      console.error("Error in budget calculation:", error)
      setBudgetResults({
        success: false,
        message: "An error occurred while calculating your budget. Please try again.",
        income: data.income,
        totalFixedExpenses: 0,
        remainingIncome: 0,
        allocations: [],
        fixedExpenses: data.fixedExpenses,
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>Enter Your Financial Information</CardTitle>
          <CardDescription>Provide your monthly income, fixed expenses, and financial goals</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs defaultValue="income" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                  <TabsTrigger value="goals">Goals</TabsTrigger>
                </TabsList>

                <TabsContent value="income" className="space-y-4 pt-4">
                  <FormField
                    control={form.control}
                    name="income"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Income</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                              $
                            </span>
                            <Input className="pl-7" placeholder="5000" {...field} />
                          </div>
                        </FormControl>
                        <FormDescription>Enter your total monthly income after taxes</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="expenses" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Add your fixed monthly expenses (rent, utilities, insurance, etc.)
                    </div>
                    {expenseFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr,auto] gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`fixedExpenses.${index}.category`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Category" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`fixedExpenses.${index}.amount`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">
                                      $
                                    </span>
                                    <Input className="pl-7" placeholder="Amount" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeExpense(index)}
                          disabled={expenseFields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => appendExpense({ category: "", amount: 0 })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Expense
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="goals" className="space-y-4 pt-4">
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Set your financial goals as a percentage of your income
                    </div>
                    {goalFields.map((field, index) => (
                      <div key={field.id} className="grid grid-cols-[1fr,auto] gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <FormField
                            control={form.control}
                            name={`goals.${index}.category`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input placeholder="Category" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name={`goals.${index}.target_percent`}
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <div className="relative">
                                    <Input placeholder="Percentage" {...field} />
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground">
                                      %
                                    </span>
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removeGoal(index)}
                          disabled={goalFields.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => appendGoal({ category: "", target_percent: 0 })}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Add Goal
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Optimizing..." : "Optimize Budget"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <div className="md:col-span-1">
        {budgetResults ? (
          <BudgetResults results={budgetResults} aiRecommendation={aiRecommendation} isLoading={isLoading} />
        ) : (
          <Card className="h-full flex items-center justify-center">
            <CardContent className="text-center p-6">
              <p className="text-muted-foreground">
                Enter your financial information and click "Optimize Budget" to see your personalized budget plan.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
