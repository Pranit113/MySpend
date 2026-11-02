import { NavLink } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  ReceiptText,
  PlusCircle,
  Settings as SettingsIcon,
  LogOut,
  IndianRupee,
  Database,
} from 'lucide-react'

export default function Sidebar() {
  const { logout } = useAuth()

  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/transactions', label: 'Transactions', icon: ReceiptText },
    { to: '/add', label: 'Add Entry', icon: PlusCircle },
    { to: '/settings', label: 'Settings', icon: SettingsIcon },
  ]

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-border bg-card flex flex-col md:h-screen md:sticky md:top-0 shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-sm">
            <IndianRupee className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight leading-none text-foreground">
              My<span className="text-primary">Spend</span>
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <Database className="h-2.5 w-2.5 text-primary" /> Neon Datastore
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1 flex-1 overflow-y-auto flex md:flex-col flex-row gap-1">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      {/* Footer / Logout */}
      <div className="p-3 border-t border-border mt-auto hidden md:block">
        <Button
          variant="ghost"
          size="sm"
          onClick={logout}
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
