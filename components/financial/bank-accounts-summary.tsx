import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Wallet, TrendingUp, TrendingDown, Eye, Plus } from "lucide-react"
import Link from "next/link"

interface BankAccount {
  id: string
  bank: string
  accountNumber: string
  accountType: string
  currency: string
  balance: number
  lastMovement: string
  status: "active" | "inactive"
}

export default function BankAccountsSummary() {
  const accounts: BankAccount[] = [
    {
      id: "1",
      bank: "Banco de Crédito del Perú",
      accountNumber: "193-2519100-0-54",
      accountType: "Corriente",
      currency: "PEN",
      balance: 174656.61,
      lastMovement: "2024-01-15",
      status: "active",
    },
    {
      id: "2",
      bank: "BBVA Continental",
      accountNumber: "011-0-123456789",
      accountType: "Ahorros",
      currency: "USD",
      balance: 25430.5,
      lastMovement: "2024-01-14",
      status: "active",
    },
    {
      id: "3",
      bank: "Interbank",
      accountNumber: "898-3001234567",
      accountType: "Corriente",
      currency: "PEN",
      balance: 89234.75,
      lastMovement: "2024-01-13",
      status: "active",
    },
    {
      id: "4",
      bank: "Banco de la Nación",
      accountNumber: "00-000-714151",
      accountType: "Detracciones",
      currency: "PEN",
      balance: 12450.0,
      lastMovement: "2024-01-12",
      status: "active",
    },
  ]

  const totalBalancePEN = accounts.filter((acc) => acc.currency === "PEN").reduce((sum, acc) => sum + acc.balance, 0)

  const totalBalanceUSD = accounts.filter((acc) => acc.currency === "USD").reduce((sum, acc) => sum + acc.balance, 0)

  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
        Activa
      </Badge>
    ) : (
      <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">
        Inactiva
      </Badge>
    )
  }

  const getAccountTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "detracciones":
        return <TrendingDown className="w-4 h-4 text-amber-500" />
      default:
        return <TrendingUp className="w-4 h-4 text-emerald-500" />
    }
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-card-foreground text-base sm:text-lg">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
            Cuentas Bancarias
          </CardTitle>
          <Link href="/bank-accounts">
            <Button variant="outline" size="sm" className="text-xs sm:text-sm">
              <Plus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Gestionar</span>
              <span className="sm:hidden">Ver</span>
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Resumen de Saldos */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="text-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
            <p className="text-xs text-emerald-600 dark:text-emerald-400">Total PEN</p>
            <p className="text-sm sm:text-lg font-bold text-emerald-600 dark:text-emerald-400">
              S/ {totalBalancePEN.toLocaleString("es-PE", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="text-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <p className="text-xs text-blue-600 dark:text-blue-400">Total USD</p>
            <p className="text-sm sm:text-lg font-bold text-blue-600 dark:text-blue-400">
              $ {totalBalanceUSD.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        {/* Lista de Cuentas */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-card-foreground">
            Cuentas Activas ({accounts.filter((acc) => acc.status === "active").length})
          </h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {accounts
              .filter((acc) => acc.status === "active")
              .map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors border border-border"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {getAccountTypeIcon(account.accountType)}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-card-foreground text-sm truncate">{account.bank}</p>
                        {getStatusBadge(account.status)}
                      </div>
                      <p className="font-mono text-xs text-muted-foreground truncate">{account.accountNumber}</p>
                      <p className="text-xs text-muted-foreground">
                        {account.accountType} • {account.lastMovement}
                      </p>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="font-semibold text-card-foreground text-sm">
                      {account.currency}{" "}
                      {account.balance.toLocaleString(account.currency === "PEN" ? "es-PE" : "en-US", {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mt-1">
                      <Eye className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="pt-2 border-t border-border">
          <Link href="/bank-accounts">
            <Button variant="outline" className="w-full text-sm">
              Ver Todas las Cuentas
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
