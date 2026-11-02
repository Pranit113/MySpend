import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/api/api'
import fmt from '@/api/fmt'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  PiggyBank,
  Receipt,
  PlusCircle,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export default function Dashboard() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  const load = useCallback(() => {
    setLoading(true)
    api.getDashboard()
      .then((res) => {
        setData(res)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    load()
  }, [load])

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading dashboard metrics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-medium">{error}</span>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          Retry
        </Button>
      </div>
    )
  }

  if (!data) return null

  const budgetPct =
    data.monthlyBudget > 0
      ? Math.min((data.monthlyExpenses / data.monthlyBudget) * 100, 100)
      : 0
  const isOverBudget = data.remainingBudget < 0

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Dashboard</h2>
          <p className="text-xs text-muted-foreground">
            Current balance, monthly spending, and budget breakdown from Neon PostgreSQL.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild size="sm">
            <Link to="/add">
              <PlusCircle className="mr-1.5 h-4 w-4" />
              New Entry
            </Link>
          </Button>
        </div>
      </div>

      {/* Primary 4 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Available Balance */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Available Balance
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Wallet className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {fmt(data.availableBalance)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Opening Balance + Total Income - Total Expenses
            </p>
          </CardContent>
        </Card>

        {/* This Month's Income */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Month Income
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {fmt(data.monthlyIncome)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Money received this calendar month
            </p>
          </CardContent>
        </Card>

        {/* This Month's Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Month Expenses
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
              <ArrowDownLeft className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">
              {fmt(data.monthlyExpenses)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Total spending this calendar month
            </p>
          </CardContent>
        </Card>

        {/* Opening Balance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Opening Balance
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground">
              <PiggyBank className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {fmt(data.openingBalance)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Configured starting fund
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Budget Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Monthly Budget Tracker</CardTitle>
              <CardDescription className="text-xs">
                Budget limit compared against current month expenses
              </CardDescription>
            </div>
            <Badge variant={isOverBudget ? 'destructive' : 'secondary'} className="text-xs">
              {isOverBudget
                ? `Over budget by ${fmt(Math.abs(data.remainingBudget))}`
                : `${fmt(data.remainingBudget)} remaining`}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          <Progress
            value={budgetPct}
            indicatorClassName={isOverBudget ? 'bg-destructive' : 'bg-primary'}
          />
          <div className="flex justify-between text-xs text-muted-foreground pt-1">
            <span>Spent: <strong className="text-foreground">{fmt(data.monthlyExpenses)}</strong></span>
            <span>Allocated: <strong className="text-foreground">{fmt(data.monthlyBudget)}</strong></span>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-semibold">Recent Transactions</CardTitle>
            <CardDescription className="text-xs">
              Last 10 financial entries recorded in Neon database
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link to="/transactions">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {data.recentTransactions.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Receipt className="mx-auto h-8 w-8 opacity-30 mb-2" />
              <p className="text-sm">No transactions yet recorded.</p>
              <Button asChild size="sm" variant="outline" className="mt-3">
                <Link to="/add">Add your first transaction</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {data.recentTransactions.map((t) => {
                const isIncome = t.type === 'INCOME'
                return (
                  <div
                    key={t.id}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-muted/40 px-2 rounded-md transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/15 text-emerald-600'
                            : 'bg-rose-500/15 text-rose-600'
                        }`}
                      >
                        {isIncome ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownLeft className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">
                            {isIncome ? t.source : t.category}
                          </span>
                          <Badge variant={isIncome ? 'success' : 'expense'}>
                            {t.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t.transactionDate}
                          {t.description && ` • ${t.description}`}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`text-sm font-semibold tracking-tight whitespace-nowrap ${
                        isIncome ? 'text-emerald-600' : 'text-rose-600'
                      }`}
                    >
                      {isIncome ? '+' : '-'} {fmt(t.amount)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
