import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Lock, ShieldCheck, KeyRound, AlertCircle, Loader2, IndianRupee } from 'lucide-react'

export default function Login() {
  const { hasPassword, login, setup } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const isSetup = !hasPassword

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password.length < 4) {
      setError('Password must be at least 4 characters long')
      return
    }

    if (isSetup && password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      if (isSetup) {
        await setup(password)
      } else {
        await login(password)
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please check your password.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-50/70 p-4">
      <div className="w-full max-w-md">
        {/* Brand logo header */}
        <div className="flex flex-col items-center mb-6 text-center">
          <div className="h-12 w-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-3 shadow-sm border border-primary/20">
            <IndianRupee className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            My<span className="text-primary">Spend</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Personal Expense & Finance Tracker
          </p>
        </div>

        <Card className="border-border shadow-md">
          <CardHeader className="space-y-1.5 pb-4">
            <div className="flex items-center gap-2">
              {isSetup ? (
                <ShieldCheck className="h-5 w-5 text-primary" />
              ) : (
                <Lock className="h-5 w-5 text-primary" />
              )}
              <CardTitle className="text-xl">
                {isSetup ? 'Setup Master Password' : 'Sign in to MySpend'}
              </CardTitle>
            </div>
            <CardDescription className="text-xs">
              {isSetup
                ? 'Create a secure master password to encrypt and manage your expense history on Neon Database.'
                : 'Enter your master password to access your dashboard, budget, and transactions.'}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  {isSetup ? 'New Master Password' : 'Password'}
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoFocus
                    className="pr-10"
                  />
                  <KeyRound className="h-4 w-4 text-muted-foreground absolute right-3 top-3" />
                </div>
              </div>

              {isSetup && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              )}
            </CardContent>

            <CardFooter className="pt-2">
              <Button
                type="submit"
                className="w-full font-medium"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isSetup ? 'Creating Setup...' : 'Authenticating...'}
                  </>
                ) : isSetup ? (
                  'Create Password & Continue'
                ) : (
                  'Sign In'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-4">
          Powered by Neon PostgreSQL & shadcn/ui
        </p>
      </div>
    </div>
  )
}
