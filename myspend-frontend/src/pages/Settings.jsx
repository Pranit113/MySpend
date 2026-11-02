import { useState, useEffect } from 'react'
import { api } from '@/api/api'
import { useAuth } from '@/context/AuthContext'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import {
  Settings as SettingsIcon,
  FileDown,
  KeyRound,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
} from 'lucide-react'

const today = () => new Date().toISOString().split('T')[0]
const firstOfMonth = () => {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export default function Settings() {
  const { logout } = useAuth()

  // General Settings State
  const [settings, setSettings] = useState({
    monthlyBudget: '',
    openingBalance: '',
    currency: 'INR',
  })
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMsg, setSettingsMsg] = useState('')
  const [settingsError, setSettingsError] = useState('')

  // Export PDF State
  const [exportDates, setExportDates] = useState({
    startDate: firstOfMonth(),
    endDate: today(),
  })
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState('')

  // Password Change State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState('')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    api.getSettings()
      .then((s) => {
        setSettings({
          monthlyBudget: s.monthlyBudget ?? '',
          openingBalance: s.openingBalance ?? '',
          currency: s.currency ?? 'INR',
        })
      })
      .catch((e) => setSettingsError(e.message))
  }, [])

  const handleSaveSettings = async (e) => {
    e.preventDefault()
    setSettingsError('')
    setSettingsMsg('')
    setSavingSettings(true)
    try {
      await api.updateSettings({
        monthlyBudget: parseFloat(settings.monthlyBudget) || 0,
        openingBalance: parseFloat(settings.openingBalance) || 0,
        currency: settings.currency || 'INR',
      })
      setSettingsMsg('Financial settings saved to Neon database!')
      setTimeout(() => setSettingsMsg(''), 4000)
    } catch (err) {
      setSettingsError(err.message || 'Failed to save settings')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleExport = async (e) => {
    e.preventDefault()
    setExportError('')
    if (!exportDates.startDate || !exportDates.endDate) {
      setExportError('Please select both a start date and an end date.')
      return
    }
    if (exportDates.startDate > exportDates.endDate) {
      setExportError('Start date must be before or equal to end date.')
      return
    }

    setExporting(true)
    try {
      await api.exportPdf(exportDates.startDate, exportDates.endDate)
    } catch (err) {
      setExportError(err.message || 'PDF export failed.')
    } finally {
      setExporting(false)
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    setPasswordError('')
    setPasswordMsg('')

    if (passwordForm.newPassword.length < 4) {
      setPasswordError('New password must be at least 4 characters long')
      return
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword)
      setPasswordMsg('Password changed successfully! Redirecting to login...')
      setTimeout(() => {
        logout()
      }, 1500)
    } catch (err) {
      setPasswordError(err.message || 'Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Configuration & Reports</h2>
        <p className="text-xs text-muted-foreground">
          Manage your monthly budget, opening balance, security credentials, and export PDF statements.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Budget & Opening Balance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Budget & Opening Balance</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Defines monthly spending threshold and initial starting funds.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSaveSettings}>
            <CardContent className="space-y-4">
              {settingsMsg && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-xs font-medium text-emerald-800 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{settingsMsg}</span>
                </div>
              )}
              {settingsError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{settingsError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="monthlyBudget">Monthly Budget (₹)</Label>
                <Input
                  id="monthlyBudget"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 5000"
                  value={settings.monthlyBudget}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, monthlyBudget: e.target.value }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  Your target expense limit per calendar month.
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="openingBalance">Opening Balance (₹)</Label>
                <Input
                  id="openingBalance"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="e.g. 10000"
                  value={settings.openingBalance}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, openingBalance: e.target.value }))
                  }
                />
                <p className="text-[11px] text-muted-foreground">
                  The initial funds you started tracking with before adding transactions.
                </p>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={savingSettings} className="w-full sm:w-auto">
                {savingSettings ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* PDF Statement Export */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileDown className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Export Financial PDF</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Generate a downloadable PDF with opening balance, date-wise subtotals, and closing balance.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleExport}>
            <CardContent className="space-y-4">
              {exportError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{exportError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="exportStart">From Date</Label>
                <Input
                  id="exportStart"
                  type="date"
                  value={exportDates.startDate}
                  onChange={(e) =>
                    setExportDates((d) => ({ ...d, startDate: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exportEnd">To Date</Label>
                <Input
                  id="exportEnd"
                  type="date"
                  value={exportDates.endDate}
                  onChange={(e) =>
                    setExportDates((d) => ({ ...d, endDate: e.target.value }))
                  }
                  required
                />
              </div>

              <p className="text-[11px] text-muted-foreground">
                The generated PDF is formatted cleanly and ready for parents or personal auditing.
              </p>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                variant="outline"
                disabled={exporting}
                className="w-full sm:w-auto"
              >
                {exporting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <FileDown className="mr-2 h-4 w-4" />
                    Download PDF Report
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Master Password Management */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              <CardTitle className="text-lg">Security & Master Password</CardTitle>
            </div>
            <CardDescription className="text-xs">
              Update the master authentication password stored in your Neon database.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleChangePassword}>
            <CardContent className="space-y-4 max-w-xl">
              {passwordMsg && (
                <div className="flex items-center gap-2 rounded-md bg-emerald-500/15 p-3 text-xs font-medium text-emerald-800 border border-emerald-500/20">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{passwordMsg}</span>
                </div>
              )}
              {passwordError && (
                <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-xs font-medium text-destructive border border-destructive/20">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Master Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  placeholder="••••••••"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                  <Input
                    id="confirmNewPassword"
                    type="password"
                    placeholder="••••••••"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    required
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" variant="secondary" disabled={changingPassword}>
                {changingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating Password...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Update Password
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
