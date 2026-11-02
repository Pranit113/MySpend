import { useState, useEffect } from 'react'
import { api } from '@/api/api'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { AlertCircle, Loader2, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

const EXPENSE_CATEGORIES = ['Food', 'Travel', 'Shopping', 'Education', 'Bills', 'Health', 'Other']
const INCOME_SOURCES = ['Parents', 'Scholarship', 'Part-time work', 'Refund', 'Other']

const today = () => new Date().toISOString().split('T')[0]

const emptyForm = (type) => ({
  amount: '',
  type,
  category: type === 'EXPENSE' ? 'Food' : '',
  description: '',
  source: type === 'INCOME' ? 'Parents' : '',
  transactionDate: today(),
})

export default function TransactionForm({ onSaved, initial, onCancel }) {
  const isEdit = !!initial
  const [form, setForm] = useState(
    initial
      ? {
          amount: initial.amount,
          type: initial.type,
          category: initial.category || 'Food',
          description: initial.description || '',
          source: initial.source || '',
          transactionDate: initial.transactionDate,
        }
      : emptyForm('EXPENSE')
  )

  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (initial) {
      setForm({
        amount: initial.amount,
        type: initial.type,
        category: initial.category || 'Food',
        description: initial.description || '',
        source: initial.source || '',
        transactionDate: initial.transactionDate,
      })
    }
  }, [initial])

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const switchType = (type) => {
    setForm(emptyForm(type))
  }

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {
        amount: parseFloat(form.amount),
        type: form.type,
        category: form.type === 'EXPENSE' ? form.category : null,
        description: form.description?.trim() || null,
        source: form.type === 'INCOME' ? form.source : null,
        transactionDate: form.transactionDate,
      }
      if (isEdit) {
        await api.updateTransaction(initial.id, payload)
      } else {
        await api.createTransaction(payload)
      }
      onSaved()
      if (!isEdit) setForm(emptyForm(form.type))
    } catch (err) {
      setError(err.message || 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {!isEdit && (
        <div className="grid grid-cols-2 gap-2 p-1 bg-muted rounded-lg">
          <button
            type="button"
            onClick={() => switchType('EXPENSE')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
              form.type === 'EXPENSE'
                ? 'bg-background text-rose-700 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowDownLeft className="h-3.5 w-3.5 text-rose-600" />
            Expense
          </button>
          <button
            type="button"
            onClick={() => switchType('INCOME')}
            className={`flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-md transition-all ${
              form.type === 'INCOME'
                ? 'bg-background text-emerald-700 shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" />
            Money Received
          </button>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="amount">Amount (₹) *</Label>
          <Input
            id="amount"
            type="number"
            min="0.01"
            step="0.01"
            placeholder="0.00"
            value={form.amount}
            onChange={set('amount')}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="transactionDate">Date *</Label>
          <Input
            id="transactionDate"
            type="date"
            value={form.transactionDate}
            onChange={set('transactionDate')}
            required
          />
        </div>
      </div>

      {form.type === 'EXPENSE' && (
        <div className="space-y-1.5">
          <Label htmlFor="category">Category *</Label>
          <select
            id="category"
            value={form.category}
            onChange={set('category')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      )}

      {form.type === 'INCOME' && (
        <div className="space-y-1.5">
          <Label htmlFor="source">Received From *</Label>
          <select
            id="source"
            value={form.source}
            onChange={set('source')}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {INCOME_SOURCES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="description">Description (optional)</Label>
        <Input
          id="description"
          placeholder="Brief note..."
          value={form.description}
          onChange={set('description')}
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={saving}
          className={form.type === 'INCOME' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEdit ? (
            'Save Changes'
          ) : form.type === 'INCOME' ? (
            'Record Income'
          ) : (
            'Record Expense'
          )}
        </Button>
      </div>
    </form>
  )
}
