"use client"
import { Search, Filter, CalendarIcon, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { MultiSelect } from "@/components/ui/multi-select"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface FilterOption {
  value: string
  label: string
}

interface FilterConfig {
  key: string
  type: "search" | "select" | "multiselect" | "daterange"
  placeholder: string
  options?: FilterOption[]
  className?: string
}

interface FiltersBarProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  className?: string
}

export function FiltersBar({ filters, values, onChange, className }: FiltersBarProps) {
  const renderFilter = (filter: FilterConfig) => {
    switch (filter.type) {
      case "search":
        return (
          <div className="flex-1 min-w-48" key={filter.key}>
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-muted-foreground w-3 h-3" />
              <Input
                placeholder={filter.placeholder}
                className="pl-7 h-8 text-sm"
                value={values[filter.key] || ""}
                onChange={(e) => onChange(filter.key, e.target.value)}
              />
            </div>
          </div>
        )

      case "select":
        return (
          <div className={cn("min-w-32", filter.className)} key={filter.key}>
            <Select
              value={values[filter.key] || "all"}
              onValueChange={(value) => onChange(filter.key, value === "all" ? "" : value)}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue placeholder={filter.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {filter.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value || "all"}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )

      case "multiselect":
        return (
          <div className={cn("min-w-40", filter.className)} key={filter.key}>
            <MultiSelect
              options={filter.options || []}
              selected={values[filter.key] || []}
              onChange={(value) => onChange(filter.key, value)}
              placeholder={filter.placeholder}
              className="w-full"
            />
          </div>
        )

      case "daterange":
        return (
          <div className={cn("min-w-64", filter.className)} key={filter.key}>
            <div className="flex items-center gap-1">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal h-8 text-sm flex-1",
                      !values[filter.key]?.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-3 w-3" />
                    {values[filter.key]?.from ? (
                      values[filter.key]?.to ? (
                        <>
                          {format(values[filter.key].from, "dd/MM/yyyy", { locale: es })} -{" "}
                          {format(values[filter.key].to, "dd/MM/yyyy", { locale: es })}
                        </>
                      ) : (
                        format(values[filter.key].from, "dd/MM/yyyy", { locale: es })
                      )
                    ) : (
                      <span>{filter.placeholder}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={values[filter.key]?.from}
                    selected={{
                      from: values[filter.key]?.from,
                      to: values[filter.key]?.to,
                    }}
                    onSelect={(range) => onChange(filter.key, range || { from: undefined, to: undefined })}
                    numberOfMonths={2}
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
              {values[filter.key]?.from && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => onChange(filter.key, { from: undefined, to: undefined })}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <span className="text-sm font-medium text-card-foreground">Filtros:</span>
        </div>
        {filters.map(renderFilter)}
      </div>
    </div>
  )
}
