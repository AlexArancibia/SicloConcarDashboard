"use client"
import { Search, Filter, Calendar as CalendarIcon, X, RotateCcw, ChevronDown, ChevronUp, Sliders } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import { cn } from "@/lib/utils"
import { useState } from "react"

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
  priority?: "high" | "medium" | "low"
  icon?: React.ComponentType<{ className?: string }>
}

interface FiltersBarProps {
  filters: FilterConfig[]
  values: Record<string, any>
  onChange: (key: string, value: any) => void
  className?: string
  showResetButton?: boolean
  defaultExpanded?: boolean
}

// Mock MultiSelect component for demo
const MultiSelect = ({ options, selected, onChange, placeholder, className }: any) => {
  const [isOpen, setIsOpen] = useState(false)
  
  const handleToggle = (value: string) => {
    const newSelected = selected.includes(value)
      ? selected.filter((item: string) => item !== value)
      : [...selected, value]
    onChange(newSelected)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className={cn("justify-between h-9 text-sm", className)}
        >
          {selected.length > 0 ? (
            <span className="truncate">
              {selected.length === 1 
                ? options.find((opt: any) => opt.value === selected[0])?.label
                : `${selected.length} seleccionados`
              }
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <div className="max-h-60 overflow-y-auto p-1">
          {options.map((option: any) => (
            <div
              key={option.value}
              className="flex items-center space-x-2 p-2 cursor-pointer hover:bg-accent rounded-sm"
              onClick={() => handleToggle(option.value)}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={() => {}}
                className="h-4 w-4"
              />
              <span className="text-sm">{option.label}</span>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

export function FiltersBar({ 
  filters, 
  values, 
  onChange, 
  className, 
  showResetButton = true,
  defaultExpanded = false 
}: FiltersBarProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const handleReset = () => {
    filters.forEach((filter) => {
      if (filter.type === "daterange") {
        onChange(filter.key, { from: undefined, to: undefined })
      } else if (filter.type === "multiselect") {
        onChange(filter.key, [])
      } else if (filter.key === "type" || filter.key === "status" || filter.key === "currency" || filter.key === "hasRetention" || filter.key === "hasDetraction") {
        // Para filtros de selección, establecer "all" en lugar de string vacío
        onChange(filter.key, "all")
      } else {
        onChange(filter.key, "")
      }
    })
  }

  const getActiveFiltersCount = () => {
    return filters.filter((filter) => {
      if (filter.type === "daterange") {
        return values[filter.key]?.from || values[filter.key]?.to
      } else if (filter.type === "multiselect") {
        return values[filter.key] && values[filter.key].length > 0
      } else {
        return values[filter.key] && values[filter.key] !== ""
      }
    }).length
  }

  const hasActiveFilters = () => getActiveFiltersCount() > 0

  // Separar filtros estratégicamente
  const searchFilters = filters.filter(f => f.type === "search")
  const primaryFilters = filters.filter(f => f.priority === "high" && f.type !== "search")
  const secondaryFilters = filters.filter(f => f.priority !== "high" && f.type !== "search")

  const getFilterValue = (filter: FilterConfig) => {
    if (filter.type === "daterange") {
      return values[filter.key]?.from || values[filter.key]?.to
    } else if (filter.type === "multiselect") {
      return values[filter.key] && values[filter.key].length > 0
    } else {
      return values[filter.key] && values[filter.key] !== ""
    }
  }

  const renderFilter = (filter: FilterConfig, variant: "default" | "compact" | "extended" = "default") => {
    const isActive = getFilterValue(filter)

    switch (filter.type) {
      case "search":
        return (
          <div className="relative flex-1 min-w-0" key={filter.key}>
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={filter.placeholder}
              className={cn(
                "pl-10 h-10 text-sm transition-all duration-200",
                isActive && "ring-2 ring-primary/20 border-primary/50"
              )}
              value={values[filter.key] || ""}
              onChange={(e) => onChange(filter.key, e.target.value)}
            />
            {values[filter.key] && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-muted/80"
                onClick={() => onChange(filter.key, "")}
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )

      case "select":
        const selectWidth = variant === "extended" ? "w-56" : variant === "compact" ? "w-36" : "w-44"
        return (
          <div className={cn("flex-shrink-0", selectWidth)} key={filter.key}>
            <Select
              value={values[filter.key] || "all"}
              onValueChange={(value) => onChange(filter.key, value === "all" ? "" : value)}
            >
              <SelectTrigger className={cn(
                "h-9 text-sm transition-all duration-200",
                isActive && "ring-2 ring-primary/20 border-primary/50"
              )}>
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
        const multiselectWidth = variant === "extended" ? "w-64" : variant === "compact" ? "w-40" : "w-48"
        return (
          <div className={cn("flex-shrink-0", multiselectWidth)} key={filter.key}>
            <MultiSelect
              options={filter.options || []}
              selected={values[filter.key] || []}
              onChange={(value: any) => onChange(filter.key, value)}
              placeholder={filter.placeholder}
              className={cn(
                "w-full transition-all duration-200",
                isActive && "ring-2 ring-primary/20 border-primary/50"
              )}
            />
          </div>
        )

      case "daterange":
        const dateWidth = variant === "extended" ? "w-72" : variant === "compact" ? "w-48" : "w-52"
        return (
          <div className={cn("flex-shrink-0", dateWidth)} key={filter.key}>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal h-9 text-sm w-full transition-all duration-200",
                    !values[filter.key]?.from && "text-muted-foreground",
                    isActive && "ring-2 ring-primary/20 border-primary/50"
                  )}
                >
                  <CalendarIcon className="mr-3 h-4 w-4" />
                  <span className="truncate">
                    {values[filter.key]?.from ? (
                      values[filter.key]?.to ? (
                        <>
                          {format(values[filter.key].from, "dd/MM/yy", { locale: es })} -{" "}
                          {format(values[filter.key].to, "dd/MM/yy", { locale: es })}
                        </>
                      ) : (
                        format(values[filter.key].from, "dd/MM/yyyy", { locale: es })
                      )
                    ) : (
                      filter.placeholder
                    )}
                  </span>
                  {values[filter.key]?.from && (
                    <X 
                      className="ml-auto h-3 w-3 hover:scale-110 transition-transform" 
                      onClick={(e) => {
                        e.stopPropagation()
                        onChange(filter.key, { from: undefined, to: undefined })
                      }}
                    />
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
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Barra principal con búsqueda y filtros clave */}
      <div className="flex items-center gap-4">
        {/* Búsqueda principal - ocupa el espacio disponible */}
        {searchFilters.map(filter => renderFilter(filter))}
        
        {/* Filtros primarios */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {primaryFilters.map(filter => renderFilter(filter))}
        </div>

        {/* Controles de la derecha */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Botón de filtros adicionales */}
          {secondaryFilters.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className={cn(
                "h-10 px-4 transition-all duration-200 hover:scale-[1.02]",
                isExpanded && "bg-primary/10 border-primary/30"
              )}
            >
              <Sliders className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Filtros</span>
              {getActiveFiltersCount() > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 min-w-[20px] p-1 text-xs">
                  {getActiveFiltersCount()}
                </Badge>
              )}
              <ChevronDown className={cn(
                "w-3 h-3 ml-1 transition-transform duration-200",
                isExpanded && "rotate-180"
              )} />
            </Button>
          )}

          {/* Botón de reset */}
          {showResetButton && hasActiveFilters() && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-10 px-3 text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-all duration-200"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Limpiar</span>
            </Button>
          )}
        </div>
      </div>

      {/* Panel expandible de filtros adicionales - Versión compacta */}
      {isExpanded && secondaryFilters.length > 0 && (
        <div className="bg-muted/30 backdrop-blur-sm rounded-lg border border-border/50 shadow-sm animate-in slide-in-from-top-2 duration-300">
          {/* Header compacto */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/40">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filtros adicionales</span>
              {secondaryFilters.some(f => getFilterValue(f)) && (
                <Badge variant="secondary" className="text-xs h-5 ml-2">
                  {secondaryFilters.filter(f => getFilterValue(f)).length}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center gap-1">
              {secondaryFilters.some(f => getFilterValue(f)) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    secondaryFilters.forEach(filter => {
                      if (filter.type === "daterange") {
                        onChange(filter.key, { from: undefined, to: undefined })
                      } else if (filter.type === "multiselect") {
                        onChange(filter.key, [])
                      } else if (filter.key === "type" || filter.key === "status" || filter.key === "currency" || filter.key === "hasRetention" || filter.key === "hasDetraction") {
                        // Para filtros de selección, establecer "all" en lugar de string vacío
                        onChange(filter.key, "all")
                      } else {
                        onChange(filter.key, "")
                      }
                    })
                  }}
                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
                >
                  <RotateCcw className="w-3 h-3 mr-1" />
                  Reset
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(false)}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
          
          {/* Contenido con flex wrap */}
          <div className="p-4">
            <div className="flex flex-wrap gap-3">
              {secondaryFilters.map(filter => (
                <div key={filter.key} className="flex-none">
                  {renderFilter(filter, "extended")}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Ejemplo de uso con datos de demostración
function FiltersBarDemo() {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})

  const sampleFilters: FilterConfig[] = [
    {
      key: "search",
      type: "search",
      placeholder: "Buscar productos, clientes, pedidos...",
      priority: "high"
    },
    {
      key: "status",
      type: "select",
      placeholder: "Estado",
      priority: "high",
      options: [
        { value: "all", label: "Todos los estados" },
        { value: "active", label: "Activo" },
        { value: "pending", label: "Pendiente" },
        { value: "inactive", label: "Inactivo" }
      ]
    },
    {
      key: "dateRange",
      type: "daterange",
      placeholder: "Rango de fechas",
      priority: "high"
    },
    {
      key: "category",
      type: "multiselect",
      placeholder: "Categorías",
      priority: "medium",
      options: [
        { value: "electronics", label: "Electrónicos" },
        { value: "clothing", label: "Ropa" },
        { value: "books", label: "Libros" },
        { value: "home", label: "Hogar" }
      ]
    },
    {
      key: "price",
      type: "select",
      placeholder: "Rango de precio",
      priority: "medium",
      options: [
        { value: "all", label: "Todos los precios" },
        { value: "0-50", label: "$0 - $50" },
        { value: "50-100", label: "$50 - $100" },
        { value: "100+", label: "$100+" }
      ]
    },
    {
      key: "supplier",
      type: "multiselect",
      placeholder: "Proveedores",
      priority: "low",
      options: [
        { value: "supplier1", label: "Proveedor Alpha" },
        { value: "supplier2", label: "Proveedor Beta" },
        { value: "supplier3", label: "Proveedor Gamma" }
      ]
    }
  ]

  const handleFilterChange = (key: string, value: any) => {
    setFilterValues(prev => ({
      ...prev,
      [key]: value
    }))
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Sistema de Filtros Mejorado</h2>
        <p className="text-muted-foreground">
          Layout intuitivo que prioriza la búsqueda y organiza los filtros de manera jerárquica
        </p>
      </div>
      
      <FiltersBar
        filters={sampleFilters}
        values={filterValues}
        onChange={handleFilterChange}
        className="bg-background border rounded-lg p-4 shadow-sm"
      />
      
      {/* Vista previa de valores actuales */}
      <div className="bg-muted/50 rounded-lg p-4 space-y-2">
        <h3 className="text-sm font-semibold text-muted-foreground">Valores actuales:</h3>
        <pre className="text-xs bg-background rounded p-3 overflow-auto">
          {JSON.stringify(filterValues, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default FiltersBarDemo