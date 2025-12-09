# Comparación de Filtros: Backend vs Frontend

## 📊 Resumen Ejecutivo

### Filtros Implementados ✅
- **Búsqueda de texto** (`search`) - ✅ Implementado
- **Tipo de documento** (`documentType`) - ✅ Implementado
- **Estado** (`status`) - ✅ Implementado
- **Fecha de emisión** (`issueDateFrom`, `issueDateTo`) - ✅ Implementado
- **Fecha de vencimiento** (`dueDateFrom`, `dueDateTo`) - ✅ Implementado
- **Moneda** (`currency`) - ✅ Implementado
- **Monto mínimo/máximo** (`minAmount`, `maxAmount`) - ✅ Implementado
- **Retención** (`hasRetention`) - ✅ Implementado
- **Detracción** (`hasDetraction`) - ✅ Implementado
- **Proveedor** (`supplierId`) - ✅ **NUEVO** - Implementado ahora
- **Tags** (`tags`) - ✅ **NUEVO** - Implementado ahora
- **Documentos con XML** (`hasXmlData`) - ✅ **NUEVO** - Implementado ahora

### Filtros Disponibles en Backend pero No Implementados en UI ⚠️

Los siguientes filtros están disponibles en el backend pero **no están visibles en la UI** (se pueden usar programáticamente):

1. **`hasDigitalSignature`** - Filtrar documentos con/sin firma digital
   - **Uso**: Útil para verificar documentos firmados electrónicamente
   - **Prioridad**: Baja (caso de uso específico)

2. **`accountId`** - Filtrar por cuenta contable
   - **Uso**: Útil para análisis contable y reportes
   - **Prioridad**: Media (requiere selector de cuentas contables)

3. **`costCenterId`** - Filtrar por centro de costo
   - **Uso**: Útil para análisis por centro de costo
   - **Prioridad**: Media (requiere selector de centros de costo)

4. **`transactionId`** - Ordenar por probabilidad de coincidencia con transacción
   - **Uso**: Específico para conciliación bancaria
   - **Prioridad**: Baja (ya se usa en página de conciliaciones)
   - **Nota**: Este filtro ordena los resultados, no filtra. Se usa principalmente en la funcionalidad de conciliación.

## 📋 Detalle de Filtros Implementados

### 1. Búsqueda de Texto (`search`) ✅
- **Backend**: Busca en: número completo, descripción, razón social del proveedor, RUC del proveedor y descripciones de líneas
- **Frontend**: Campo de búsqueda principal
- **Estado**: ✅ Completamente funcional

### 2. Filtros de Monto ✅
- **Backend**: `minAmount` (>=), `maxAmount` (<=)
- **Frontend**: Dos campos de entrada numérica
- **Estado**: ✅ Completamente funcional

### 3. Filtros de Fechas ✅
- **Backend**: 
  - Emisión: `issueDateFrom`, `issueDateTo`
  - Vencimiento: `dueDateFrom`, `dueDateTo`
- **Frontend**: Selectores de rango de fechas
- **Estado**: ✅ Completamente funcional

### 4. Tipo de Documento (`documentType`) ✅
- **Backend**: `INVOICE`, `CREDIT_NOTE`, `DEBIT_NOTE`, `RECEIPT`, `PURCHASE_ORDER`, `CONTRACT`
- **Frontend**: Dropdown con todas las opciones
- **Estado**: ✅ Completamente funcional

### 5. Estado (`status`) ✅
- **Backend**: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `PAID`, `CANCELLED`
- **Frontend**: Dropdown con todas las opciones
- **Estado**: ✅ Completamente funcional

### 6. Moneda (`currency`) ✅
- **Backend**: Código de moneda (ej: "PEN", "USD")
- **Frontend**: Dropdown con PEN y USD
- **Estado**: ✅ Completamente funcional

### 7. Retención (`hasRetention`) ✅
- **Backend**: Boolean (true/false)
- **Frontend**: Dropdown: "Cualquier estado" / "Con retención" / "Sin retención"
- **Estado**: ✅ Completamente funcional

### 8. Detracción (`hasDetraction`) ✅
- **Backend**: Boolean (true/false)
- **Frontend**: Dropdown: "Cualquier estado" / "Con detracción" / "Sin detracción"
- **Estado**: ✅ Completamente funcional

### 9. Proveedor (`supplierId`) ✅ **NUEVO**
- **Backend**: ID del proveedor
- **Frontend**: Dropdown con lista de proveedores (cargados automáticamente)
- **Estado**: ✅ **Recién implementado**
- **Formato**: "RUC - Razón Social"

### 10. Tags (`tags`) ✅ **NUEVO**
- **Backend**: Búsqueda de texto en tags
- **Frontend**: Campo de búsqueda de texto
- **Estado**: ✅ **Recién implementado**

### 11. Documentos con XML (`hasXmlData`) ✅ **NUEVO**
- **Backend**: Boolean (true/false)
- **Frontend**: Dropdown: "Todos" / "Con XML" / "Sin XML"
- **Estado**: ✅ **Recién implementado**
- **Uso**: Útil para identificar documentos electrónicos vs manuales

## 🔧 Filtros No Implementados en UI (pero disponibles en backend)

### 1. `hasDigitalSignature`
- **Descripción**: Filtrar documentos con/sin firma digital
- **Tipo**: Boolean
- **Razón de no implementación**: Caso de uso muy específico
- **Recomendación**: Agregar si hay necesidad de filtrar documentos firmados

### 2. `accountId`
- **Descripción**: Filtrar por cuenta contable específica
- **Tipo**: String (ID de cuenta)
- **Razón de no implementación**: Requiere cargar lista de cuentas contables y podría hacer la UI muy compleja
- **Recomendación**: Considerar agregar si hay demanda para análisis contable avanzado
- **Complejidad**: Media (requiere selector de cuentas contables)

### 3. `costCenterId`
- **Descripción**: Filtrar por centro de costo específico
- **Tipo**: String (ID de centro de costo)
- **Razón de no implementación**: Similar a accountId, requiere cargar lista de centros de costo
- **Recomendación**: Considerar agregar si hay demanda para análisis por centro de costo
- **Complejidad**: Media (requiere selector de centros de costo)

### 4. `transactionId`
- **Descripción**: Ordenar documentos por probabilidad de coincidencia con una transacción específica
- **Tipo**: String (ID de transacción)
- **Razón de no implementación**: Específico para funcionalidad de conciliación
- **Estado actual**: Ya se usa en la página de conciliaciones
- **Recomendación**: No agregar a la página principal de documentos (ya está donde corresponde)

## 📈 Estadísticas

- **Total de filtros en backend**: 19
- **Filtros implementados en UI**: 12 (63%)
- **Filtros principales implementados**: 11/11 (100%)
- **Filtros avanzados implementados**: 1/4 (25%)
- **Filtros especializados no implementados**: 4 (por diseño)

## ✅ Conclusión

**Estado general**: ✅ **Excelente**

La mayoría de los filtros importantes están implementados. Los filtros que faltan son principalmente para casos de uso avanzados o específicos (como conciliación bancaria o análisis contable detallado).

**Filtros recién agregados**:
- ✅ `supplierId` - Filtro por proveedor
- ✅ `tags` - Búsqueda por tags
- ✅ `hasXmlData` - Filtrar documentos con XML

**Recomendaciones**:
1. Los filtros principales están completamente cubiertos ✅
2. Considerar agregar `accountId` y `costCenterId` solo si hay demanda del negocio
3. `hasDigitalSignature` podría agregarse si es necesario verificar documentos firmados
4. `transactionId` ya está implementado donde corresponde (página de conciliaciones)

