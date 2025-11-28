# API de Exportación CONCAR

## Descripción

Este endpoint genera un formato de exportación compatible con CONCAR (sistema contable) basado en las entradas contables (`AccountingEntry` y `AccountingEntryLine`) del sistema. El formato incluye 39 columnas (A a AD) que pueden ser exportadas directamente a CONCAR.

## Endpoint

```
GET /accounting-entries/concar-export
```

## Autenticación

El endpoint requiere autenticación mediante JWT. Incluye el token en el header:

```
Authorization: Bearer <tu-token-jwt>
```

## Parámetros de Query

### Parámetros Requeridos

| Parámetro | Tipo | Descripción | Ejemplo |
|-----------|------|-------------|---------|
| `companyId` | string | ID de la compañía | `comp_abc123` |
| `bankAccountIds` | string[] | Array de IDs de cuentas bancarias (separados por coma) | `bank_001,bank_002` |
| `conciliationType` | enum | Tipo de conciliación | `DOCUMENTS` o `DETRACTIONS` |
| `documentType` | string | Tipo de documento/libro | `15` (RH) o `11` (FACTURAS) |

### Parámetros Opcionales

| Parámetro | Tipo | Descripción | Rango | Ejemplo |
|-----------|------|-------------|-------|---------|
| `year` | number | Año para filtrar | 2000-2100 | `2025` |
| `month` | number | Mes para filtrar | 1-12 | `8` (Agosto) |
| `startDay` | number | Día de inicio del rango | 1-31 | `1` |
| `endDay` | number | Día de fin del rango | 1-31 | `31` |

**Nota:** Si no se proporcionan los parámetros de fecha (`year`, `month`, `startDay`, `endDay`), el endpoint retornará todos los registros sin filtrar por fecha.

## Descripción Detallada de Parámetros

### companyId
- **Tipo:** string
- **Requerido:** Sí
- **Descripción:** Identificador único de la compañía en el sistema.
- **Validación:** No puede estar vacío.

### bankAccountIds
- **Tipo:** array de strings
- **Requerido:** Sí
- **Descripción:** Lista de IDs de cuentas bancarias a incluir en la exportación.
- **Formato:** Puede ser enviado como:
  - Múltiples valores separados por coma: `bank_001,bank_002,bank_003`
  - Array en formato JSON: `["bank_001", "bank_002"]`
- **Validación:** Debe contener al menos un elemento.

### conciliationType
- **Tipo:** enum
- **Requerido:** Sí
- **Valores permitidos:**
  - `DOCUMENTS`: Para conciliaciones de documentos
  - `DETRACTIONS`: Para conciliaciones de detracciones

### documentType
- **Tipo:** string
- **Requerido:** Sí
- **Valores permitidos:**
  - `15`: Recibos por Honorarios (RH)
  - `11`: Facturas/Compras (FACTURAS)
- **Mapeo interno:**
  - `15` → `RECEIPT` (DocumentType)
  - `11` → `INVOICE` (DocumentType)

### year
- **Tipo:** number
- **Requerido:** No
- **Rango:** 2000-2100
- **Descripción:** Año para filtrar las entradas contables. Solo tiene efecto si se proporcionan todos los parámetros de fecha.

### month
- **Tipo:** number
- **Requerido:** No
- **Rango:** 1-12
- **Descripción:** Mes para filtrar (1=Enero, 12=Diciembre). Solo tiene efecto si se proporcionan todos los parámetros de fecha.

### startDay
- **Tipo:** number
- **Requerido:** No
- **Rango:** 1-31
- **Descripción:** Día de inicio del rango dentro del mes seleccionado. Solo tiene efecto si se proporcionan todos los parámetros de fecha.

### endDay
- **Tipo:** number
- **Requerido:** No
- **Rango:** 1-31
- **Descripción:** Día de fin del rango dentro del mes seleccionado. Solo tiene efecto si se proporcionan todos los parámetros de fecha.

**Importante sobre el filtro de fechas:**
- El filtro se aplica sobre `AccountingEntryLine.createdAt`
- Si se proporcionan todos los parámetros (`year`, `month`, `startDay`, `endDay`), se filtra por ese rango específico
- Si no se proporcionan, se obtienen todos los registros que cumplan los otros filtros

## Ejemplos de Requests

### Ejemplo 1: Exportar RH de un mes específico

```http
GET /accounting-entries/concar-export?companyId=comp_abc123&year=2025&month=8&startDay=1&endDay=31&bankAccountIds=bank_001,bank_002&conciliationType=DOCUMENTS&documentType=15
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ejemplo 2: Exportar FACTURAS sin filtro de fecha (todos los registros)

```http
GET /accounting-entries/concar-export?companyId=comp_abc123&bankAccountIds=bank_001&conciliationType=DOCUMENTS&documentType=11
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ejemplo 3: Exportar RH con detracciones

```http
GET /accounting-entries/concar-export?companyId=comp_abc123&year=2025&month=8&startDay=1&endDay=15&bankAccountIds=bank_001&conciliationType=DETRACTIONS&documentType=15
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ejemplo 4: Usando cURL

```bash
curl -X GET "http://localhost:8000/accounting-entries/concar-export?companyId=comp_abc123&year=2025&month=8&startDay=1&endDay=31&bankAccountIds=bank_001&conciliationType=DOCUMENTS&documentType=15" \
  -H "Authorization: Bearer tu-token-jwt-aqui"
```

## Formato de Respuesta

### Estructura General

```json
{
  "data": [
    {
      // Objeto ConcarExportRowDto (39 columnas)
    }
  ],
  "summary": {
    "totalRecords": 0,
    "totalEntries": 0,
    "period": "string",
    "subDiario": "string"
  }
}
```

### Campos del Summary

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `totalRecords` | number | Número total de filas/registros retornados |
| `totalEntries` | number | Número total de entradas contables (`AccountingEntry`) procesadas |
| `period` | string | Período del reporte. Formato: `MM/YYYY` o `"Todos"` si no se filtró por fecha |
| `subDiario` | string | Tipo de subdiario (`15` o `11`) |

### Campos de Cada Fila (ConcarExportRowDto)

Cada objeto en el array `data` contiene 39 campos correspondientes a las columnas A-AD del formato CONCAR:

| Campo | Columna | Tipo | Descripción | Fuente de Datos |
|-------|---------|------|-------------|-----------------|
| `campo` | A | string | Identificador único del registro | `{documentType}-{numeroComprobante}` |
| `subDiario` | B | string | Código del subdiario | Parámetro `documentType` ("15" o "11") |
| `numeroComprobante` | C | string | Número de comprobante | Formato: `MMNNNN` (mes + correlativo de 4 dígitos) |
| `fechaComprobante` | D | string | Fecha del comprobante | `AccountingEntryLine.createdAt` (formato: dd/mm/yyyy) |
| `codigoMoneda` | E | string | Código de moneda | `BankAccount.currency` ("PEN" → "MN", resto igual) |
| `glosaPrincipal` | F | string | Descripción principal | `Document.description` (concatenado con "; " si hay múltiples) |
| `tipoCambio` | G | string | Tipo de cambio | Vacío (pendiente de implementación) |
| `tipoConversion` | H | string | Tipo de conversión | "V" (fijo) |
| `flagConversionMoneda` | I | string | Flag de conversión de moneda | "S" (fijo) |
| `fechaTipoCambio` | J | string | Fecha del tipo de cambio | Vacío (pendiente de implementación) |
| `cuentaContable` | K | string | Código de cuenta contable | `AccountingEntryLine.accountCode` |
| `codigoAnexo` | L | string | Código anexo/auxiliar | `AccountingEntryLine.auxiliaryCode` o "0000" si está vacío |
| `centroCosto` | M | string | Centro de costo | Vacío (pendiente de implementación) |
| `debeHaber` | N | string | Tipo de movimiento | "D" (Débito) o "H" (Haber) según `AccountingEntryLine.movementType` |
| `importeOriginal` | O | string | Importe original | `AccountingEntryLine.amount` (formato: 1,234.56) |
| `importeDolares` | P | string | Importe en dólares | Vacío (pendiente de implementación) |
| `importeSoles` | Q | string | Importe en soles | Vacío (pendiente de implementación) |
| `tipoDocumento` | R | string | Tipo de documento | "RH" o "FACTURA" según `documentType` |
| `numeroDocumento` | S | string | Número de documento | `Document.fullNumber` (concatenado con "; " si hay múltiples) |
| `fechaDocumento` | T | string | Fecha de emisión del documento | `Document.issueDate` (formato: dd/mm/yyyy, concatenado) |
| `fechaVencimiento` | U | string | Fecha de vencimiento | `Document.dueDate` (formato: dd/mm/yyyy, concatenado o vacío) |
| `codigoArea` | V | string | Código de área | Vacío (pendiente de implementación) |
| `glosaDetalle` | W | string | Glosa detalle | Igual que `glosaPrincipal` |
| `codigoAnexoAuxiliar` | X | string | Código anexo auxiliar | Vacío (pendiente de implementación) |
| `medioPago` | Y | string | Medio de pago | Vacío (pendiente de implementación) |
| `tipoDocumentoReferencia` | Z | string | Tipo de documento de referencia | Vacío (pendiente de implementación) |
| `numeroDocumentoReferencia` | AA | string | Número de documento de referencia | Vacío (pendiente de implementación) |
| `fechaDocumentoReferencia` | AB | string | Fecha de documento de referencia | Vacío (pendiente de implementación) |
| `nroRegRegistradorTipoDocRef` | AC | string | Número de registro registrador | Vacío (pendiente de implementación) |
| `baseImponibleDocumentoReferencia` | AD | string | Base imponible de documento de referencia | Vacío (pendiente de implementación) |

### Formato de Números

- **Formato de números:** Separador de miles con coma, decimales con punto (ejemplo: `1,234.56`)
- **Formato de fechas:** `dd/mm/yyyy` (ejemplo: `15/08/2025`)

### Lógica de Correlativo de Comprobantes

El número de comprobante (`numeroComprobante`) sigue el formato `MMNNNN`:
- `MM`: Mes en 2 dígitos (ejemplo: `08` para agosto)
- `NNNN`: Correlativo de 4 dígitos que se incrementa por cada `AccountingEntry`

**Reglas:**
- Todas las líneas (`AccountingEntryLine`) del mismo `AccountingEntry` comparten el mismo número de comprobante
- El correlativo se reinicia en 0001 para cada mes
- Si no se proporciona mes, se usa el mes del `createdAt` de cada entry

### Concatenación de Múltiples Documentos

Si un `AccountingEntry` está relacionado con múltiples documentos (a través de `ConciliationItem`):
- `glosaPrincipal`: Descripciones concatenadas con `"; "`
- `numeroDocumento`: Números de documento concatenados con `"; "`
- `fechaDocumento`: Fechas concatenadas con `"; "`
- `fechaVencimiento`: Fechas concatenadas con `"; "`

## Ejemplos de Respuestas

### Respuesta Exitosa - Con Datos

```json
{
  "data": [
    {
      "campo": "15-080001",
      "subDiario": "15",
      "numeroComprobante": "080001",
      "fechaComprobante": "01/08/2025",
      "codigoMoneda": "MN",
      "glosaPrincipal": "Pago a proveedor por servicios profesionales",
      "tipoCambio": "",
      "tipoConversion": "V",
      "flagConversionMoneda": "S",
      "fechaTipoCambio": "",
      "cuentaContable": "4210001",
      "codigoAnexo": "0000",
      "centroCosto": "",
      "debeHaber": "D",
      "importeOriginal": "1,400.00",
      "importeDolares": "",
      "importeSoles": "",
      "tipoDocumento": "RH",
      "numeroDocumento": "RH-001-000123",
      "fechaDocumento": "01/08/2025",
      "fechaVencimiento": "15/08/2025",
      "codigoArea": "",
      "glosaDetalle": "Pago a proveedor por servicios profesionales",
      "codigoAnexoAuxiliar": "",
      "medioPago": "",
      "tipoDocumentoReferencia": "",
      "numeroDocumentoReferencia": "",
      "fechaDocumentoReferencia": "",
      "nroRegRegistradorTipoDocRef": "",
      "baseImponibleDocumentoReferencia": ""
    },
    {
      "campo": "15-080001",
      "subDiario": "15",
      "numeroComprobante": "080001",
      "fechaComprobante": "01/08/2025",
      "codigoMoneda": "MN",
      "glosaPrincipal": "Pago a proveedor por servicios profesionales",
      "tipoCambio": "",
      "tipoConversion": "V",
      "flagConversionMoneda": "S",
      "fechaTipoCambio": "",
      "cuentaContable": "1041011",
      "codigoAnexo": "0000",
      "centroCosto": "",
      "debeHaber": "H",
      "importeOriginal": "1,400.00",
      "importeDolares": "",
      "importeSoles": "",
      "tipoDocumento": "RH",
      "numeroDocumento": "RH-001-000123",
      "fechaDocumento": "01/08/2025",
      "fechaVencimiento": "15/08/2025",
      "codigoArea": "",
      "glosaDetalle": "Pago a proveedor por servicios profesionales",
      "codigoAnexoAuxiliar": "",
      "medioPago": "",
      "tipoDocumentoReferencia": "",
      "numeroDocumentoReferencia": "",
      "fechaDocumentoReferencia": "",
      "nroRegRegistradorTipoDocRef": "",
      "baseImponibleDocumentoReferencia": ""
    }
  ],
  "summary": {
    "totalRecords": 2,
    "totalEntries": 1,
    "period": "08/2025",
    "subDiario": "15"
  }
}
```

### Respuesta Exitosa - Sin Datos (Filtrado)

```json
{
  "data": [],
  "summary": {
    "totalRecords": 0,
    "totalEntries": 0,
    "period": "08/2025",
    "subDiario": "15"
  }
}
```

### Respuesta Exitosa - Sin Filtro de Fecha

```json
{
  "data": [
    // ... registros
  ],
  "summary": {
    "totalRecords": 150,
    "totalEntries": 75,
    "period": "Todos",
    "subDiario": "15"
  }
}
```

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| `200 OK` | La solicitud fue exitosa. Retorna datos o un array vacío si no hay registros. |
| `400 Bad Request` | Error de validación en los parámetros. Ver mensaje de error para detalles. |
| `401 Unauthorized` | Token de autenticación no proporcionado o inválido. |
| `500 Internal Server Error` | Error interno del servidor. |

## Ejemplos de Errores

### Error 400 - Parámetro Faltante

```json
{
  "message": [
    "companyId should not be empty",
    "bankAccountIds must be an array"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error 400 - Valor Inválido

```json
{
  "message": [
    "documentType must be one of the following values: 15, 11"
  ],
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error 400 - Rango de Fechas Inválido

```json
{
  "message": "Start date must be before end date",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error 400 - Fechas Inválidas

```json
{
  "message": "Invalid date range",
  "error": "Bad Request",
  "statusCode": 400
}
```

### Error 401 - No Autenticado

```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

## Relaciones de Datos

El endpoint obtiene datos de las siguientes entidades relacionadas:

```
AccountingEntryLine
  ├── AccountingEntry (entryId)
  │     └── Conciliation (conciliationId)
  │           ├── BankAccount (bankAccountId)
  │           │     └── currency
  │           └── ConciliationItem[] (items)
  │                 └── Document (documentId)
  │                       ├── description
  │                       ├── fullNumber
  │                       ├── issueDate
  │                       ├── dueDate
  │                       └── documentType
```

**Filtros aplicados:**
- Filtro por `companyId` en `AccountingEntryLine`
- Filtro por rango de fechas en `AccountingEntryLine.createdAt` (opcional)
- Filtro por `bankAccountId` en `Conciliation`
- Filtro por `type` en `Conciliation`
- Filtro por `documentType` en `Document` (a través de `ConciliationItem`)

## Notas Importantes

1. **Filtro de Tipo de Documento:** Solo se incluyen documentos del tipo especificado (`RECEIPT` para `documentType=15`, `INVOICE` para `documentType=11`). Si una conciliación tiene múltiples documentos de diferentes tipos, solo se incluyen los del tipo solicitado.

2. **Ordenamiento:** Los registros se ordenan por:
   - `AccountingEntry.createdAt` (ascendente)
   - `AccountingEntryLine.lineNumber` (ascendente)

3. **Formato de Moneda:** 
   - Si la moneda es `PEN`, se representa como `"MN"` en el código de moneda
   - Cualquier otra moneda se mantiene tal cual (ej: `USD`, `EUR`)

4. **Campos Vacíos:** Muchos campos están marcados como "Vacío (pendiente de implementación)". Estos campos están incluidos en la respuesta para mantener la estructura completa del formato CONCAR, pero no contienen datos por ahora.

5. **Manejo de Nulos:** Si algún campo relacionado es nulo o no existe:
   - `auxiliaryCode` → se usa `"0000"`
   - `description` → se usa string vacío
   - `dueDate` → se usa string vacío

6. **Rendimiento:** Si se omite el filtro de fechas y hay muchos registros, la consulta puede tomar más tiempo. Se recomienda siempre proporcionar filtros de fecha cuando sea posible.

## Limitaciones Actuales

- Los campos de conversión de moneda (G, J, P, Q) no están implementados
- Los campos de centro de costo (M) no están implementados
- Los campos de documento de referencia (Z-AD) no están implementados
- El filtro solo soporta dos tipos de documentos: RH (15) y FACTURAS (11). Futuros tipos (22, 21, 31) aún no están soportados.

## Versión

**Versión del endpoint:** 1.0.0  
**Última actualización:** 2025-01-XX

