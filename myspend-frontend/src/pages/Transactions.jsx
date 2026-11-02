import { useState, useEffect, useCallback } from 'react'
import { api } from '@/api/api'
import fmt from '@/api/fmt'
import TransactionForm from '@/components/TransactionForm'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  ReceiptText,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  Pencil,
  Trash2,
  RotateCcw,
  AlertCircle,
  Loader2,
} from 'lucide-react'

export default function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [filters, setFilters] = useState({ startDate: '', endDate: '', type: '' })
  const [editing, setEditing] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const load = useCallback(() => {
    setLoading(true)
    api.getTransactions(filters)
      .then((res) => {
        setTransactions(res)
        setError('')
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => {
    load()
  }, [load])

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction record?')) return
    setDeletingId(id)
    try {
      await api.deleteTransaction(id)
      load()
    } catch (e) {
      setError(e.message)
    } finally {
      setDeletingId(null)
    }
  }

  const setFilter = (field) => (e) =>
    setFilters((prev) => ({ ...prev, [field]: e.target.value }))

  const clearFilters = () => {
    setFilters({ startDate: '', endDate: '', type: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Transaction History</h2>
          <p className="text-xs text-muted-foreground">
            Complete datastore records with date filtering, category tags, and edit actions.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Toolbar */}
      <Card>
        <CardContent className="pt-5 pb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
            <div className="space-y-1.5">
              <Label htmlFor="startDate">From Date</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={setFilter('startDate')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="endDate">To Date</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={setFilter('endDate')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="typeFilter">Type</Label>
              <select
                id="typeFilter"
                value={filters.type}
                onChange={setFilter('type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Transactions</option>
                <option value="INCOME">Income / Money Received</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="default"
                onClick={clearFilters}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Reset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions Table/List */}
      <Card>
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ReceiptText className="h-4 w-4 text-primary" />
              <CardTitle className="text-base font-semibold">Records</CardTitle>
            </div>
            <Badge variant="secondary">
              {transactions.length} {transactions.length === 1 ? 'entry' : 'entries'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-16 flex items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Fetching records...</span>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <Filter className="mx-auto h-8 w-8 opacity-30 mb-2" />
              <p className="text-sm font-medium">No transactions match the selected criteria.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try modifying your date filters or add new entries.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-xs uppercase tracking-wider text-muted-foreground font-semibold border-b">
                  <tr>
                    <th className="px-6 py-3">Date</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Source / Category</th>
                    <th className="px-6 py-3">Description</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((t) => {
                    const isIncome = t.type === 'INCOME'
                    return (
                      <tr key={t.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-xs text-muted-foreground font-medium">
                          {t.transactionDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge variant={isIncome ? 'success' : 'expense'}>
                            {t.type}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 font-medium text-foreground">
                          {isIncome ? t.source : t.category}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground max-w-xs truncate">
                          {t.description || '—'}
                        </td>
                        <td
                          className={`px-6 py-4 text-right font-semibold whitespace-nowrap ${
                            isIncome ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {isIncome ? '+' : '-'} {fmt(t.amount)}
                        </td>
                        <td className="px-6 py-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => setEditing(t)}
                              title="Edit transaction"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                              onClick={() => handleDelete(t.id)}
                              disabled={deletingId === t.id}
                              title="Delete transaction"
                            >
                              {deletingId === t.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="h-3.5 w-3.5" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Transaction Modal Dialog */}
      <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Transaction Record</DialogTitle>
            <DialogDescription className="text-xs">
              Update amount, category, or description for this entry.
            </DialogDescription>
          </DialogHeader>
          {editing && (
            <TransactionForm
              initial={editing}
              onSaved={() => {
                setEditing(null)
                load()
              }}
              onCancel={() => setEditing(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
