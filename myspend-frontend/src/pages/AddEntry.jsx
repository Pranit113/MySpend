import { useState } from 'react'
import { Link } from 'react-router-dom'
import TransactionForm from '@/components/TransactionForm'
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, PlusCircle, ArrowLeft } from 'lucide-react'

export default function AddEntry() {
  const [saved, setSaved] = useState(false)

  const handleSaved = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 4000)
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Record Financial Entry</h2>
          <p className="text-xs text-muted-foreground">
            Log a new expense or money received directly into your Neon PostgreSQL datastore.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/transactions">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            History
          </Link>
        </Button>
      </div>

      {saved && (
        <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-sm font-medium text-emerald-800 border border-emerald-500/20">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
          <span>Transaction recorded successfully in datastore!</span>
        </div>
      )}

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <PlusCircle className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">New Transaction</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Choose whether this is an Expense or Money Received. Balance and monthly budget update automatically.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TransactionForm onSaved={handleSaved} />
        </CardContent>
      </Card>
    </div>
  )
}
