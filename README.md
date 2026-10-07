# UNDC — Sistema de Gestión RSU (Responsabilidad Social Universitaria)

> Base legal Ley 30220 Art. 124-125 · SUNEDU Indicador 29 · SINEACE Estándar 25 — Cañete, Lima

Proyecto **fullstack profesional** generado desde `undc_rsu.sql` (MySQL 8).

---

## 📁 Estructura

```
Nueva carpeta (2)/
├── .sql                # Dump original (copiado a backend/undc_rsu.sql)
├── backend/            # Go 1.22 + Gin + GORM — Clean Architecture
│   ├── cmd/server/main.go
│   ├── internal/
│   │   ├── config/         # env / DSN
│   │   ├── domain/models.go # 30+ entidades mapeadas 1:1 al .sql
│   │   ├── dto/dto.go      # validaciones (binding)
│   │   ├── repository/     # repos GORM por módulo
│   │   ├── service/        # reglas Ley 30220 (ciclo mínimo, carga no lectiva, BPMN, Likert)
│   │   ├── handler/        # controllers
│   │   ├── router/         # /api/v1 (45+ endpoints)
│   │   └── middleware/
│   ├── pkg/database, pkg/utils
│   └── undc_rsu.sql
└── frontend/           # React 18 + Vite + TypeScript + Tailwind + Recharts
    ├── src/
    │   ├── api/client.ts
    │   ├── components/layout/{Sidebar,Header} + ui/Badge
    │   └── pages/{Dashboard,Proyectos,ProyectoDetalle,Beneficiarios,Estructura}
    └── dist/ (build producc.)
```

## 🚀 Quick start

### 1) Base de datos
```sql
-- MySQL 8
SOURCE backend/undc_rsu.sql;
-- crea BD undc_rsu + 30 tablas + seed + 4 vistas
```

### 2) Backend
```bash
cd backend
cp .env.example .env   # ajustar DB_PASS
go mod tidy
go run ./cmd/server
# → http://localhost:8080/health
# → http://localhost:8080/api/v1
```

### 3) Frontend
```bash
cd frontend
npm install
npm run dev     # http://localhost:5173 (proxy → :8080)
npm run build   # producción → dist/
```

## 🔌 API principal

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/v1/auth/login` | Mock: {correo, password: 123456 / undc2026} |
| GET | `/api/v1/dashboard/kpis` | SUNEDU/SINEACE KPIs |
| GET | `/api/v1/catalogos/*` | tipos-proyecto, lineas-accion, estados (16), roles-actor, preguntas P01-P06 |
| CRUD | `/api/v1/facultades`, `/escuelas`, `/ciclos`, `/docentes`, `/estudiantes` | Módulos 1-2 |
| POST | `/api/v1/proyectos` | Crea en `BORRADOR` (valida ciclo mínimo) |
| GET | `/api/v1/proyectos?search=&estado=&escuela=` | Lista paginada |
| GET | `/api/v1/proyectos/resumen` | Vista `vw_rsu_proyectos_resumen` (reporte SUNEDU) |
| POST | `/api/v1/proyectos/:id/transicion` | Avanza BPMN validado contra `RSU_Transicion_Estado` |
| GET | `/api/v1/proyectos/:id/historial` | Trazabilidad `vw_rsu_trazabilidad_aprobacion` |
| POST | `/api/v1/asignaciones/docente` | Valida `carga_no_lectiva_max` Art.86 |
| POST | `/api/v1/beneficiarios` + `/vincular` | Padrón Cañete + vínculo proyecto |
| POST | `/api/v1/actividades` , `/monitoreos`, `/entregables` | Ejecución |
| POST | `/api/v1/documentos/upload` | multipart + hash |
| POST | `/api/v1/encuestas/beneficiario` | Likert 1-5, promedio y deduplicación |
| POST | `/api/v1/indicadores`, `/presupuesto/movimientos` | Impacto y Art.125 |

## 🎨 Frontend — módulos RSU cubiertos

- **Dashboard** — 6 KPIs, gráfico estados BPMN, torta por facultad, avance S/ (Art.125 2%), satisfacción Likert
- **Proyectos** — lista con filtros, tarjetas con avance y `Badge` por `color_ui`, creación → BORRADOR
- **Expediente** — tabs: General · Flujo BPMN (historial 16 estados) · Beneficiarios · Actividades · Presupuesto · Documentos · Encuestas · Indicadores
- **Beneficiarios** — padrón con búsqueda DNI/RUC, distrito Cañete, tipo NATURAL/INSTITUCION/COMUNIDAD, `vw_rsu_cobertura_anual`
- **Estructura** — facultades/escuelas/ciclos (Art.32-36)
- y placeholders conectados para Documentos, Presupuesto, Impacto

> UI: sidebar `undc-700` (#1b5e20), header sticky, tarjetas `rounded-2xl`, Tailwind, Recharts, Lucide.

## 🔒 Validaciones implementadas

- Ciclo mínimo `RSU_Tipo_Proyecto.ciclo_minimo_estudiante` antes de asignar líder
- Suma `horas_asignadas` docente ≤ `carga_no_lectiva_max` (Art.79/86)
- Fechas `inicio < fin`, porcentaje 0-100, DNI/RUC según `tipo_beneficiario`
- Transición solo si existe tupla en `RSU_Transicion_Estado` para el `id_rol_actor`
- Encuesta: no duplicada `(id_proyecto,id_beneficiario)`, beneficiario vinculado, promedio + `MUY_MALO..MUY_BUENO`

## 🔧 Verificado

- `go vet ./...` ✓  `go build ./cmd/server` ✓
- `npm run build` ✓ (Vite 5, 607kB)
- Vistas SQL listas: `vw_rsu_proyectos_resumen`, `vw_rsu_satisfaccion_dimension`, `vw_rsu_cobertura_anual`, `vw_rsu_trazabilidad_aprobacion`

---
Hecho para UNDC Cañete — RSU como función esencial y obligatoria (Art.124).
