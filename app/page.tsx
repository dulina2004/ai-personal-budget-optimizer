import { BudgetOptimizer } from "@/components/budget-optimizer"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl md:text-5xl">AI Personal Budget Optimizer</h1>
          <p className="mt-4 text-muted-foreground">Optimize your spending and achieve your financial goals</p>
        </header>
        <BudgetOptimizer />
      </div>
    </div>
  )
}
