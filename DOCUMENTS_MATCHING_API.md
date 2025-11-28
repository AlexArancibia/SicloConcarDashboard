# Documentación: Ordenamiento de Documentos por Probabilidad de Coincidencia

## 📋 Resumen

Se ha agregado funcionalidad al endpoint de documentos que permite ordenar los resultados por probabilidad de coincidencia con una transacción bancaria específica. Esto facilita la identificación de qué documentos podrían estar relacionados con una transacción.

## 🎯 Casos de Uso

Esta funcionalidad es útil para:
- **Conciliación bancaria**: Identificar qué documentos podrían ser pagados por una transacción
- **Búsqueda inteligente**: Encontrar documentos relacionados a una transacción específica
- **Automatización**: Sugerir matches automáticos basados en probabilidad

## 🔌 Endpoint

### GET `/documents/company/:companyId`

**Endpoint existente** con nuevo parámetro opcional.

### Parámetros de Query

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `transactionId` | `string` | No | ID de la transacción para ordenar por probabilidad de coincidencia |
| `page` | `number` | No | Número de página (default: 1) |
| `limit` | `number` | No | Cantidad de resultados por página (default: 10) |
| ...otros parámetros existentes... | - | - | Todos los filtros existentes siguen funcionando |

### Ejemplo de Request

```http
GET /documents/company/cmp_a454f59f-2f19?transactionId=tran_43303c86-2fea&page=1&limit=20&status=APPROVED
```

## 📤 Estructura de la Respuesta

### Respuesta Normal (sin `transactionId`)

```json
{
  "data": [
    {
      "id": "doc_xxx",
      "fullNumber": "E001-21",
      "pendingAmount": "2505.62",
      // ... otros campos del documento
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8
}
```

### Respuesta con Ordenamiento por Probabilidad (con `transactionId`)

```json
{
  "data": [
    {
      "id": "doc_xxx",
      "fullNumber": "E001-21",
      "pendingAmount": "708.43",
      "matchProbability": 0.95,  // ← NUEVO: Probabilidad de coincidencia (0-1)
      "supplier": {
        "id": "spp_xxx",
        "businessName": "PROVEEDOR XYZ",
        "documentNumber": "12345678901",
        "documentType": "RUC",
        "supplierBankAccounts": [
          {
            "id": "sba_xxx",
            "accountNumber": "191-71517482-0-43",
            "bank": {
              "name": "Banco de Crédito del Perú",
              "code": "BCP"
            }
          }
        ]
      },
      // ... otros campos del documento
    },
    {
      "id": "doc_yyy",
      "fullNumber": "E001-22",
      "pendingAmount": "710.00",
      "matchProbability": 0.75,  // ← Menor probabilidad
      // ...
    }
  ],
  "page": 1,
  "limit": 20,
  "total": 150,
  "totalPages": 8,
  "sortedBy": {  // ← NUEVO: Información de la transacción usada
    "transactionId": "tran_43303c86-2fea",
    "transactionAmount": "708.43",
    "transactionDescription": "A 191 71517482 0"
  }
}
```

## 🔍 Campos Nuevos en la Respuesta

### `matchProbability` (opcional)

- **Tipo**: `number`
- **Rango**: `0` a `1`
- **Descripción**: Probabilidad de que el documento coincida con la transacción especificada
- **Solo presente cuando**: Se proporciona `transactionId` en el query
- **Interpretación**:
  - `0.9 - 1.0`: Coincidencia muy probable (alta confianza)
  - `0.7 - 0.9`: Coincidencia probable (media-alta confianza)
  - `0.5 - 0.7`: Coincidencia posible (media confianza)
  - `0.0 - 0.5`: Coincidencia poco probable (baja confianza)

### `sortedBy` (opcional)

- **Tipo**: `object`
- **Descripción**: Información sobre la transacción usada para ordenar
- **Solo presente cuando**: Se proporciona `transactionId` en el query
- **Campos**:
  - `transactionId`: ID de la transacción
  - `transactionAmount`: Monto de la transacción
  - `transactionDescription`: Descripción de la transacción

## 🧮 Cálculo de Probabilidad

La probabilidad se calcula basándose en 4 criterios:

1. **Coincidencia de Monto** (peso: 30%)
   - Monto exacto: +30%
   - Diferencia ≤ 5 soles: +20-25%
   - Diferencia ≤ 10 soles: +10%

2. **Coincidencia de Número de Cuenta** (peso: 50%)
   - Si la transacción tiene número de cuenta en la descripción (formato: "A XXX YYYYYYYY 0")
   - Y coincide con alguna cuenta bancaria del proveedor del documento: +50%

3. **Coincidencia de Fecha** (peso: 15%)
   - Diferencia ≤ 7 días: +15%
   - Diferencia ≤ 30 días: escala decreciente

4. **Coincidencia de Proveedor** (peso: 5%)
   - Si el nombre del proveedor aparece en la descripción de la transacción: +5%

## 💡 Ejemplos de Uso en Frontend

### Ejemplo 1: Lista de Documentos con Ordenamiento por Transacción

```typescript
// Componente React/Vue/Angular
const fetchDocumentsWithTransaction = async (companyId: string, transactionId: string) => {
  const response = await fetch(
    `/documents/company/${companyId}?transactionId=${transactionId}&page=1&limit=20`
  );
  const data = await response.json();
  
  // Los documentos ya vienen ordenados por probabilidad descendente
  return data.data.map(doc => ({
    ...doc,
    matchPercentage: doc.matchProbability ? (doc.matchProbability * 100).toFixed(1) : null
  }));
};
```

### Ejemplo 2: Mostrar Badge de Probabilidad

```tsx
// React Component
const DocumentCard = ({ document }) => {
  const getProbabilityColor = (prob) => {
    if (!prob) return 'gray';
    if (prob >= 0.9) return 'green';
    if (prob >= 0.7) return 'blue';
    if (prob >= 0.5) return 'yellow';
    return 'orange';
  };

  return (
    <div className="document-card">
      <h3>{document.fullNumber}</h3>
      <p>Monto pendiente: {document.pendingAmount}</p>
      
      {document.matchProbability !== undefined && (
        <span 
          className={`badge badge-${getProbabilityColor(document.matchProbability)}`}
        >
          {Math.round(document.matchProbability * 100)}% de coincidencia
        </span>
      )}
    </div>
  );
};
```

### Ejemplo 3: Filtro por Probabilidad Mínima

```typescript
// Filtrar solo documentos con alta probabilidad
const highProbabilityDocs = documents.filter(
  doc => doc.matchProbability && doc.matchProbability >= 0.7
);
```

### Ejemplo 4: Mostrar Información de Transacción Usada

```tsx
// React Component
const DocumentsList = ({ response }) => {
  return (
    <div>
      {response.sortedBy && (
        <div className="info-banner">
          <p>Ordenado por coincidencia con transacción:</p>
          <p><strong>ID:</strong> {response.sortedBy.transactionId}</p>
          <p><strong>Monto:</strong> {response.sortedBy.transactionAmount}</p>
          <p><strong>Descripción:</strong> {response.sortedBy.transactionDescription}</p>
        </div>
      )}
      
      <DocumentList documents={response.data} />
    </div>
  );
};
```

## ⚠️ Consideraciones Importantes

### 1. Campo Opcional
- `matchProbability` solo está presente cuando se proporciona `transactionId`
- Siempre verificar si existe antes de usarlo: `if (doc.matchProbability !== undefined)`

### 2. Ordenamiento
- Cuando se proporciona `transactionId`, los documentos vienen **ya ordenados** por probabilidad descendente
- No es necesario ordenar manualmente en el frontend
- La paginación se aplica **después** del ordenamiento

### 3. Performance
- Cuando se usa `transactionId`, el backend trae más documentos (hasta 1000) para calcular probabilidades
- Esto puede ser más lento que una consulta normal
- Considerar mostrar un indicador de carga

### 4. Validación
- Si el `transactionId` no existe o no pertenece a la compañía, el endpoint retornará un error 404 o 400
- Manejar estos errores apropiadamente en el frontend

## 🐛 Manejo de Errores

```typescript
try {
  const response = await fetchDocuments(companyId, { transactionId });
  // Procesar respuesta
} catch (error) {
  if (error.status === 404) {
    // Transacción no encontrada
    showError('La transacción especificada no existe');
  } else if (error.status === 400) {
    // Transacción no pertenece a la compañía
    showError('La transacción no pertenece a esta compañía');
  } else {
    // Otro error
    showError('Error al obtener documentos');
  }
}
```

## 📊 Visualización Sugerida

### Opción 1: Badge de Probabilidad
```
[Documento E001-21] [95% Match] [S/ 708.43]
```

### Opción 2: Barra de Progreso
```
Documento E001-21
[████████████████████] 95%
Monto: S/ 708.43
```

### Opción 3: Color Coding
- Verde: 90-100% (muy probable)
- Azul: 70-89% (probable)
- Amarillo: 50-69% (posible)
- Naranja: 0-49% (poco probable)

## 🔄 Flujo de Trabajo Recomendado

1. **Usuario selecciona una transacción** en la interfaz
2. **Frontend hace request** con `transactionId`
3. **Backend retorna documentos ordenados** por probabilidad
4. **Frontend muestra documentos** con indicador de probabilidad
5. **Usuario puede filtrar** por probabilidad mínima (ej: solo > 70%)
6. **Usuario selecciona documento(s)** para conciliar

## 📝 Notas Adicionales

- El cálculo de probabilidad es **heurístico** y no garantiza un match perfecto
- Siempre permitir al usuario **revisar y confirmar** los matches sugeridos
- Los documentos con `matchProbability` alta son **sugerencias**, no confirmaciones
- El sistema puede sugerir múltiples documentos para una transacción (caso de pago múltiple)

## 🔧 Tipos TypeScript (Opcional)

Si estás usando TypeScript, aquí tienes los tipos sugeridos:

```typescript
// Tipos para la respuesta
interface DocumentWithProbability extends Document {
  matchProbability?: number; // 0-1, solo presente cuando se usa transactionId
}

interface SortedByInfo {
  transactionId: string;
  transactionAmount: string;
  transactionDescription: string;
}

interface DocumentsResponse {
  data: DocumentWithProbability[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortedBy?: SortedByInfo; // Solo presente cuando se usa transactionId
}

// Función helper para fetch
async function fetchDocuments(
  companyId: string,
  options: {
    transactionId?: string;
    page?: number;
    limit?: number;
    status?: string;
    // ... otros filtros
  }
): Promise<DocumentsResponse> {
  const params = new URLSearchParams();
  if (options.transactionId) params.append('transactionId', options.transactionId);
  if (options.page) params.append('page', options.page.toString());
  if (options.limit) params.append('limit', options.limit.toString());
  // ... otros parámetros

  const response = await fetch(
    `/documents/company/${companyId}?${params.toString()}`
  );
  
  if (!response.ok) {
    throw new Error(`Error: ${response.status}`);
  }
  
  return response.json();
}
```

## 🚀 Próximos Pasos Sugeridos

1. Implementar UI para mostrar probabilidad de coincidencia
2. Agregar filtro por probabilidad mínima en el frontend
3. Implementar selección múltiple de documentos para conciliación
4. Agregar tooltip explicando cómo se calcula la probabilidad
5. Guardar historial de matches sugeridos para aprendizaje

## 📚 Ejemplo Completo de Integración

### React + TypeScript

```tsx
import React, { useState, useEffect } from 'react';

interface Document {
  id: string;
  fullNumber: string;
  pendingAmount: string;
  matchProbability?: number;
  supplier?: {
    businessName: string;
  };
}

interface DocumentsResponse {
  data: Document[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  sortedBy?: {
    transactionId: string;
    transactionAmount: string;
    transactionDescription: string;
  };
}

const DocumentsMatchingView: React.FC<{ transactionId: string; companyId: string }> = ({
  transactionId,
  companyId,
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortedBy, setSortedBy] = useState<DocumentsResponse['sortedBy']>(null);
  const [minProbability, setMinProbability] = useState(0);

  useEffect(() => {
    fetchDocuments();
  }, [transactionId, companyId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/documents/company/${companyId}?transactionId=${transactionId}&page=1&limit=50`
      );
      const data: DocumentsResponse = await response.json();
      setDocuments(data.data);
      setSortedBy(data.sortedBy);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProbabilityColor = (prob?: number): string => {
    if (!prob) return 'gray';
    if (prob >= 0.9) return 'green';
    if (prob >= 0.7) return 'blue';
    if (prob >= 0.5) return 'yellow';
    return 'orange';
  };

  const getProbabilityLabel = (prob?: number): string => {
    if (!prob) return 'N/A';
    if (prob >= 0.9) return 'Muy Probable';
    if (prob >= 0.7) return 'Probable';
    if (prob >= 0.5) return 'Posible';
    return 'Poco Probable';
  };

  const filteredDocuments = documents.filter(
    doc => !doc.matchProbability || doc.matchProbability >= minProbability
  );

  if (loading) return <div>Cargando documentos...</div>;

  return (
    <div className="documents-matching-view">
      {sortedBy && (
        <div className="info-banner">
          <h3>Ordenado por coincidencia con transacción</h3>
          <p><strong>ID:</strong> {sortedBy.transactionId}</p>
          <p><strong>Monto:</strong> S/ {sortedBy.transactionAmount}</p>
          <p><strong>Descripción:</strong> {sortedBy.transactionDescription}</p>
        </div>
      )}

      <div className="filters">
        <label>
          Filtrar por probabilidad mínima:
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={minProbability}
            onChange={(e) => setMinProbability(parseFloat(e.target.value))}
          />
          <span>{(minProbability * 100).toFixed(0)}%</span>
        </label>
      </div>

      <div className="documents-list">
        {filteredDocuments.map((doc) => (
          <div key={doc.id} className="document-card">
            <div className="document-header">
              <h4>{doc.fullNumber}</h4>
              {doc.matchProbability !== undefined && (
                <span
                  className={`probability-badge probability-${getProbabilityColor(doc.matchProbability)}`}
                  title={`Probabilidad: ${(doc.matchProbability * 100).toFixed(1)}%`}
                >
                  {Math.round(doc.matchProbability * 100)}% - {getProbabilityLabel(doc.matchProbability)}
                </span>
              )}
            </div>
            <div className="document-body">
              <p><strong>Monto pendiente:</strong> S/ {doc.pendingAmount}</p>
              {doc.supplier && (
                <p><strong>Proveedor:</strong> {doc.supplier.businessName}</p>
              )}
              {doc.matchProbability !== undefined && (
                <div className="probability-bar">
                  <div
                    className="probability-fill"
                    style={{
                      width: `${doc.matchProbability * 100}%`,
                      backgroundColor: getProbabilityColor(doc.matchProbability),
                    }}
                  />
                </div>
              )}
            </div>
            <button onClick={() => handleSelectDocument(doc)}>
              Seleccionar para conciliar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentsMatchingView;
```

### CSS Sugerido

```css
.documents-matching-view {
  padding: 20px;
}

.info-banner {
  background: #e3f2fd;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.probability-badge {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.probability-green {
  background-color: #4caf50;
}

.probability-blue {
  background-color: #2196f3;
}

.probability-yellow {
  background-color: #ffc107;
  color: #333;
}

.probability-orange {
  background-color: #ff9800;
}

.probability-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  margin-top: 8px;
  overflow: hidden;
}

.probability-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.document-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.document-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
```

---

**Versión**: 1.0  
**Fecha**: 2025-01-XX  
**Autor**: Backend Team

