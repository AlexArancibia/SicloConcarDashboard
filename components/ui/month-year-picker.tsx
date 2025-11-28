"use client"

import * as React from "react"
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

interface MonthYearPickerProps {
  month: string
  year: string
  onMonthChange: (month: string) => void
  onYearChange: (year: string) => void
  className?: string
  placeholder?: string
}

const MONTHS = [
  { value: "01", label: "Enero", short: "Ene" },
  { value: "02", label: "Febrero", short: "Feb" },
  { value: "03", label: "Marzo", short: "Mar" },
  { value: "04", label: "Abril", short: "Abr" },
  { value: "05", label: "Mayo", short: "May" },
  { value: "06", label: "Junio", short: "Jun" },
  { value: "07", label: "Julio", short: "Jul" },
  { value: "08", label: "Agosto", short: "Ago" },
  { value: "09", label: "Septiembre", short: "Sep" },
  { value: "10", label: "Octubre", short: "Oct" },
  { value: "11", label: "Noviembre", short: "Nov" },
  { value: "12", label: "Diciembre", short: "Dic" },
]

export function MonthYearPicker({
  month,
  year,
  onMonthChange,
  onYearChange,
  className,
  placeholder = "Seleccionar mes y año",
}: MonthYearPickerProps) {
  const [open, setOpen] = React.useState(false)
  // Inicializar la vista: si no hay año, empezar con año; si hay año pero no mes, empezar con mes
  const [view, setView] = React.useState<"month" | "year">(() => {
    return year ? "month" : "year"
  })
  
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 20 }, (_, i) => currentYear - 10 + i)
  
  const selectedMonthLabel = month 
    ? MONTHS.find(m => m.value === month)?.label 
    : null

  const displayText = month && year
    ? `${selectedMonthLabel} ${year}`
    : placeholder

  // Cuando se abre el popover, ajustar la vista según el estado actual
  React.useEffect(() => {
    if (open) {
      if (!year) {
        setView("year")
      } else {
        setView("month")
      }
    }
  }, [open, year])

  const handleMonthSelect = (monthValue: string) => {
    onMonthChange(monthValue)
    // Si ya hay año seleccionado, cerrar el popover
    if (year) {
      setOpen(false)
    } else {
      // Si no hay año, ir a seleccionar año
      setView("year")
    }
  }

  const handleYearSelect = (yearValue: string) => {
    onYearChange(yearValue)
    // Siempre cambiar a la vista de mes después de seleccionar el año
    setView("month")
    // No cerrar el popover, esperar a que se seleccione el mes
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-10",
              !month && !year && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            <span className="flex-1">{displayText}</span>
            {month && year && (
              <span className="text-xs text-muted-foreground ml-2">
                {format(new Date(parseInt(year), parseInt(month) - 1, 1), "MMM yyyy", { locale: es })}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-4">
            {/* Header con navegación */}
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setView(view === "month" ? "year" : "month")}
                className="h-8 px-2"
              >
                {view === "month" ? (
                  <>
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Año
                  </>
                ) : (
                  <>
                    <ChevronRight className="h-4 w-4 mr-1" />
                    Mes
                  </>
                )}
              </Button>
              {view === "month" && year && (
                <div className="text-sm font-semibold px-3 py-1 bg-muted rounded-md">
                  {year}
                </div>
              )}
              {view === "year" && (
                <div className="text-sm font-semibold px-3 py-1 bg-muted rounded-md">
                  Seleccionar año
                </div>
              )}
            </div>

            {/* Vista de meses */}
            {view === "month" && (
              <div className="grid grid-cols-3 gap-2 w-[280px]">
                {MONTHS.map((m) => (
                  <Button
                    key={m.value}
                    variant={month === m.value ? "default" : "outline"}
                    className={cn(
                      "h-12 flex flex-col items-center justify-center text-xs",
                      month === m.value && "bg-primary text-primary-foreground"
                    )}
                    onClick={() => handleMonthSelect(m.value)}
                  >
                    <span className="font-medium">{m.short}</span>
                    <span className="text-[10px] opacity-70">{m.label}</span>
                  </Button>
                ))}
              </div>
            )}

            {/* Vista de años */}
            {view === "year" && (
              <ScrollArea className="h-[280px] w-[280px]">
                <div className="grid grid-cols-3 gap-2 p-2">
                  {years.map((y) => (
                    <Button
                      key={y}
                      variant={year === y.toString() ? "default" : "outline"}
                      className={cn(
                        "h-12",
                        year === y.toString() && "bg-primary text-primary-foreground"
                      )}
                      onClick={() => handleYearSelect(y.toString())}
                    >
                      {y}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            )}

            {/* Footer con información */}
            {month && year && (
              <div className="mt-4 pt-4 border-t text-xs text-muted-foreground text-center">
                Período: {format(new Date(parseInt(year), parseInt(month) - 1, 1), "dd MMM", { locale: es })} -{" "}
                {format(new Date(parseInt(year), parseInt(month), 0), "dd MMM yyyy", { locale: es })}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

