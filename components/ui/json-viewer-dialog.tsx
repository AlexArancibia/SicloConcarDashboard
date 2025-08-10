"use client"

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Code, Copy, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface JsonViewerDialogProps {
  title?: string
  description?: string
  data: any
  trigger?: React.ReactNode
  size?: "default" | "sm" | "lg" | "xl" | "full"
}

const sizeClasses = {
  default: "max-w-2xl",
  sm: "max-w-md",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
  full: "max-w-[95vw]"
}

// Función para formatear JSON con colores y saltos de línea
const formatJsonWithColors = (obj: any): string => {
  try {
    const jsonString = JSON.stringify(obj, null, 2)
    return jsonString
  } catch (error) {
    return "Error al formatear JSON"
  }
}

// Componente para renderizar JSON con colores
const JsonRenderer = ({ data }: { data: any }) => {
  const renderValue = (value: any, indent: number = 0): React.ReactElement => {
    const indentStyle = { marginLeft: `${indent * 16}px` }
    
    if (value === null) {
      return <span className="text-blue-600 font-semibold">null</span>
    }
    
    if (typeof value === 'boolean') {
      return <span className="text-purple-600 font-semibold">{value.toString()}</span>
    }
    
    if (typeof value === 'number') {
      return <span className="text-green-600 font-semibold">{value}</span>
    }
    
    if (typeof value === 'string') {
      return <span className="text-orange-600 break-all">"{value}"</span>
    }
    
    if (Array.isArray(value)) {
      return (
        <div style={indentStyle} className="min-w-0">
          <span className="text-gray-600">[</span>
          <div className="ml-3 min-w-0">
            {value.map((item, index) => (
              <div key={index} className="flex items-start min-w-0">
                {renderValue(item, indent + 1)}
                {index < value.length - 1 && <span className="text-gray-600 flex-shrink-0 ml-1">,</span>}
              </div>
            ))}
          </div>
          <span className="text-gray-600">]</span>
        </div>
      )
    }
    
    if (typeof value === 'object') {
      const keys = Object.keys(value)
      return (
        <div style={indentStyle} className="min-w-0">
          <span className="text-gray-600">{'{'}</span>
          <div className="ml-3 min-w-0">
            {keys.map((key, index) => (
              <div key={key} className="flex items-start min-w-0">
                <span className="text-blue-800 font-medium flex-shrink-0">"{key}"</span>
                <span className="text-gray-600 mx-1 flex-shrink-0">:</span>
                {renderValue(value[key], indent + 1)}
                {index < keys.length - 1 && <span className="text-gray-600 flex-shrink-0 ml-1">,</span>}
              </div>
            ))}
          </div>
          <span className="text-gray-600">{'}'}</span>
        </div>
      )
    }
    
    return <span className="text-gray-800">{String(value)}</span>
  }

  return (
    <div className="font-mono text-xs leading-tight min-w-0 w-full">
      {renderValue(data)}
    </div>
  )
}

export function JsonViewerDialog({
  title = "Vista JSON",
  description = "Visualiza los datos en formato JSON",
  data,
  trigger,
  size = "default"
}: JsonViewerDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = async () => {
    try {
      const jsonString = JSON.stringify(data, null, 2)
      await navigator.clipboard.writeText(jsonString)
      setCopied(true)
      toast({
        title: "Copiado",
        description: "JSON copiado al portapapeles",
      })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo copiar al portapapeles",
        variant: "destructive",
      })
    }
  }

  const getDataSize = (obj: any): string => {
    try {
      const jsonString = JSON.stringify(obj)
      const bytes = new Blob([jsonString]).size
      if (bytes < 1024) return `${bytes} B`
      if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    } catch {
      return "N/A"
    }
  }

  const getDataKeys = (obj: any): number => {
    try {
      if (typeof obj === 'object' && obj !== null) {
        return Object.keys(obj).length
      }
      return 0
    } catch {
      return 0
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Ver JSON
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className={`${sizeClasses[size]} max-h-[85vh]`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="secondary" className="text-xs">
              {getDataKeys(data)} propiedades
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {getDataSize(data)}
            </Badge>
          </div>
        </DialogHeader>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Datos formateados con colores y estructura clara
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="flex items-center gap-2"
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 text-green-600" />
                  Copiado
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copiar
                </>
              )}
            </Button>
          </div>
          
          <div className="h-[50vh] w-full rounded-md border bg-gray-50 dark:bg-gray-900/30 overflow-hidden">
            <div className="p-4 h-full">
              <div 
                className="h-full overflow-auto custom-scrollbar" 
                style={{ 
                  scrollbarWidth: 'thin', 
                  scrollbarColor: '#cbd5e1 #f1f5f9' 
                }}
              >
                <div className="min-w-0 w-full">
                  <JsonRenderer data={data} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: #f1f5f9;
        }
      `}</style>
    </Dialog>
  )
} 