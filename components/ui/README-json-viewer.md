# JsonViewerDialog Component (Mejorado)

Un componente reutilizable para mostrar datos en formato JSON con **formateo de colores**, **saltos de línea automáticos** y **scroll horizontal inteligente**.

## ✨ Características Mejoradas

- 🎨 **Formateo de colores**: Diferentes colores para tipos de datos
- 📱 **Responsivo**: Se adapta a diferentes tamaños de pantalla
- 🔄 **Scroll inteligente**: Horizontal y vertical según necesidad
- 📏 **Saltos de línea**: Automáticos para evitar desbordamiento
- 📊 **Métricas visuales**: Propiedades y tamaño de datos
- 📋 **Copiar al portapapeles**: Con confirmación visual
- 🎯 **Reutilizable**: Se puede usar en cualquier parte de la aplicación

## 🎨 Esquema de Colores

| Tipo de Dato | Color | Ejemplo |
|--------------|-------|---------|
| **Strings** | `text-orange-600` | `"valor"` |
| **Numbers** | `text-green-600` | `123.45` |
| **Booleans** | `text-purple-600` | `true` / `false` |
| **Null** | `text-blue-600` | `null` |
| **Keys** | `text-blue-800` | `"nombre"` |
| **Brackets** | `text-gray-600` | `{` `}` `[` `]` |

## 🚀 Uso básico

```tsx
import { JsonViewerDialog } from "@/components/ui/json-viewer-dialog"

// Uso simple con botón por defecto
<JsonViewerDialog
  title="Mi Documento"
  description="Datos del documento en formato JSON"
  data={documentData}
/>
```

## 📋 Props

| Prop | Tipo | Requerido | Por defecto | Descripción |
|------|------|-----------|-------------|-------------|
| `title` | `string` | ❌ | "Vista JSON" | Título del dialog |
| `description` | `string` | ❌ | "Visualiza los datos en formato JSON" | Descripción del dialog |
| `data` | `any` | ✅ | - | Datos a mostrar en formato JSON |
| `trigger` | `React.ReactNode` | ❌ | Botón por defecto | Elemento que activa el dialog |
| `size` | `"sm" \| "default" \| "lg" \| "xl" \| "full"` | ❌ | "default" | Tamaño del dialog |

## 📏 Tamaños disponibles

- `sm`: Máximo ancho de 448px
- `default`: Máximo ancho de 672px
- `lg`: Máximo ancho de 896px
- `xl`: Máximo ancho de 1152px
- `full`: Máximo ancho del 95% de la ventana

## 💡 Ejemplos de uso

### 1. Botón por defecto
```tsx
<JsonViewerDialog
  title="Documento F001-00012345"
  description="Visualiza todos los datos del documento"
  data={document}
/>
```

### 2. Botón personalizado
```tsx
<JsonViewerDialog
  title="Transacción"
  description="Datos de la transacción"
  data={transaction}
  trigger={
    <Button variant="secondary">
      <Database className="h-4 w-4" />
      Ver datos
    </Button>
  }
/>
```

### 3. Diferentes tamaños
```tsx
<JsonViewerDialog
  title="Configuración"
  description="Configuración del sistema"
  data={settings}
  size="xl"
/>
```

### 4. Con badge personalizado
```tsx
<JsonViewerDialog
  title="Documento completo"
  description="Todos los datos del documento"
  data={document}
  trigger={
    <Badge variant="outline" className="cursor-pointer">
      <Code className="h-3 w-3 mr-1" />
      Ver JSON
    </Badge>
  }
/>
```

### 5. Con icono personalizado
```tsx
<JsonViewerDialog
  title="Datos del sistema"
  description="Información del sistema"
  data={systemData}
  trigger={
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
      <FileText className="h-4 w-4" />
    </Button>
  }
/>
```

## 🔧 Funcionalidades técnicas

### Formateo inteligente
- **Indentación automática**: 20px por nivel de anidación
- **Saltos de línea**: Automáticos para evitar desbordamiento horizontal
- **Colores semánticos**: Diferentes colores según el tipo de dato
- **Estructura visual**: Llaves y corchetes claramente diferenciados

### Scroll y responsividad
- **Scroll vertical**: Altura máxima del 50% de la ventana
- **Scroll horizontal**: Automático cuando el contenido es muy ancho
- **Responsivo**: Se adapta a diferentes tamaños de pantalla
- **Break-words**: Las palabras largas se rompen automáticamente

### Métricas de datos
- **Propiedades**: Número de claves en el objeto
- **Tamaño**: Tamaño del JSON en bytes, KB o MB
- **Visualización**: Badges informativos en el header

## 🎯 Casos de uso comunes

1. **Páginas de detalle**: Mostrar datos completos de entidades
2. **Debugging**: Visualizar respuestas de API o estado de la aplicación
3. **Desarrollo**: Ver estructura de datos durante el desarrollo
4. **Auditoría**: Revisar datos completos para auditorías
5. **Soporte técnico**: Compartir datos con el equipo de soporte
6. **Documentación**: Mostrar ejemplos de estructura de datos

## 🔗 Integración en la aplicación

El componente ya está integrado en:
- `document-detail-page.tsx`: Para ver documentos en formato JSON
- Se puede usar en cualquier otra página que necesite mostrar datos JSON

## 📦 Dependencias

- `@/components/ui/dialog`
- `@/components/ui/button`
- `@/components/ui/scroll-area`
- `@/components/ui/badge`
- `@/hooks/use-toast`
- `lucide-react` para iconos

## 🚀 Ventajas sobre la versión anterior

- ✅ **Mejor legibilidad**: Colores diferenciados por tipo de dato
- ✅ **Scroll inteligente**: Horizontal y vertical según necesidad
- ✅ **Saltos de línea**: Automáticos para evitar desbordamiento
- ✅ **Tamaño optimizado**: Altura reducida del 85% al 50% de la ventana
- ✅ **Formateo visual**: Estructura clara con indentación visual
- ✅ **Responsividad**: Mejor adaptación a diferentes pantallas

## 🎨 Personalización de colores

Los colores se pueden personalizar modificando las clases de Tailwind en el componente `JsonRenderer`:

```tsx
// Colores actuales
if (typeof value === 'string') {
  return <span className="text-orange-600">"{value}"</span>
}
if (typeof value === 'number') {
  return <span className="text-green-600 font-semibold">{value}</span>
}
// etc...
``` 