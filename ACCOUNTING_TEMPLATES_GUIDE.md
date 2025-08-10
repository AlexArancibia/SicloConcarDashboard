# Guía de Plantillas de Asientos Contables

## Descripción General

Las plantillas de asientos contables permiten automatizar la generación de asientos contables basándose en documentos como facturas, recibos por honorarios, etc. Cada plantilla define las condiciones que deben cumplirse y las líneas contables que se generarán.

## Tipos de Aplicación

### 1. Monto Fijo
- **Descripción**: Se aplica un valor fijo independientemente del documento
- **Comportamiento**: El campo "Base de Cálculo" se oculta automáticamente
- **Uso**: Para montos constantes como comisiones, gastos administrativos, etc.

### 2. Porcentaje
- **Descripción**: Se calcula como un porcentaje del monto base seleccionado
- **Comportamiento**: Requiere seleccionar una base de cálculo y especificar el porcentaje
- **Uso**: Para impuestos, descuentos, comisiones variables, etc.

### 3. Monto Transacción
- **Descripción**: Se toma el valor completo del monto base seleccionado
- **Comportamiento**: Requiere seleccionar una base de cálculo
- **Uso**: Para registrar el monto total de una transacción específica

## Campos de Monto Base Disponibles

Basándose en la estructura del documento, se pueden seleccionar los siguientes campos como base de cálculo:

| Campo | Descripción | Ejemplo del Documento |
|-------|-------------|----------------------|
| **SUBTOTAL** | Monto sin impuestos | `1076.85` |
| **IGV** | Impuesto General a las Ventas | `193.83` |
| **TOTAL** | Monto total del documento | `1270.68` |
| **RENT** | Retención de renta | `0` (en el ejemplo) |
| **TAX** | Otros impuestos | `0` (en el ejemplo) |
| **RETENTION_AMOUNT** | Monto de retención | `0` (en el ejemplo) |
| **DETRACTION_AMOUNT** | Monto de detracción | `152` |
| **NET_PAYABLE** | Monto neto a pagar | `1270.68` |
| **PENDING_AMOUNT** | Monto pendiente de pago | `1118.68` |
| **CONCILIATED_AMOUNT** | Monto ya conciliado | `0` |
| **OTHER** | Otro campo personalizado | Personalizable |

## Ejemplo Práctico

### Documento de Entrada
```json
{
  "subtotal": "1076.85",
  "igv": "193.83",
  "total": "1270.68",
  "detraction": {
    "amount": "152",
    "percentage": "0.12"
  },
  "pendingAmount": "1118.68"
}
```

### Plantilla de Asiento Contable

#### Línea 1: Registro del Subtotal
- **Cuenta**: 60x - Compras
- **Tipo**: Débito
- **Aplicación**: Monto Transacción
- **Base**: SUBTOTAL
- **Valor**: 0 (se toma automáticamente del documento)

#### Línea 2: Registro del IGV
- **Cuenta**: 63x - Impuestos por Pagar
- **Tipo**: Débito
- **Aplicación**: Monto Transacción
- **Base**: IGV
- **Valor**: 0 (se toma automáticamente del documento)

#### Línea 3: Registro de la Detracción
- **Cuenta**: 42x - Cuentas por Pagar
- **Tipo**: Crédito
- **Aplicación**: Monto Transacción
- **Base**: DETRACTION_AMOUNT
- **Valor**: 0 (se toma automáticamente del documento)

#### Línea 4: Registro del Monto Pendiente
- **Cuenta**: 42x - Cuentas por Pagar
- **Tipo**: Crédito
- **Aplicación**: Monto Transacción
- **Base**: PENDING_AMOUNT
- **Valor**: 0 (se toma automáticamente del documento)

## Casos de Uso Comunes

### 1. Facturas de Compra
- **SUBTOTAL**: Para registrar el valor de los bienes/servicios
- **IGV**: Para registrar el impuesto a pagar
- **TOTAL**: Para registrar la obligación total

### 2. Retenciones
- **RETENTION_AMOUNT**: Para registrar montos retenidos
- **NET_PAYABLE**: Para registrar el monto neto a pagar

### 3. Detracciones
- **DETRACTION_AMOUNT**: Para registrar el monto de detracción
- **PENDING_AMOUNT**: Para registrar el monto pendiente

### 4. Gastos Administrativos
- **FIXED_AMOUNT**: Para gastos fijos como comisiones bancarias

## Validaciones

- **Balance**: El asiento debe estar balanceado (Débitos = Créditos)
- **Cuentas**: Todas las líneas deben tener una cuenta contable asignada
- **Monto Base**: Solo se requiere cuando no es monto fijo
- **Valor**: Solo se requiere para montos fijos o porcentajes

## Consejos de Implementación

1. **Orden de Ejecución**: Las líneas se procesan en el orden especificado
2. **Condiciones**: Use las condiciones para aplicar la plantilla solo a documentos específicos
3. **Monedas**: Configure la moneda según sus necesidades (PEN, USD, o todas)
4. **Filtros**: Use filtros para separar facturas de recibos por honorarios
5. **Pruebas**: Siempre pruebe las plantillas con documentos de ejemplo antes de activarlas

## Solución de Problemas

### Error: "El asiento debe estar balanceado"
- Verifique que la suma de débitos sea igual a la suma de créditos
- Ajuste los valores o agregue líneas de compensación

### Error: "Todas las líneas deben tener cuenta contable"
- Asigne una cuenta contable a cada línea
- Verifique que las cuentas estén activas en su plan contable

### Campo de Base de Cálculo no visible
- Verifique que el tipo de aplicación no sea "Monto Fijo"
- Cambie a "Porcentaje" o "Monto Transacción" para ver el campo 