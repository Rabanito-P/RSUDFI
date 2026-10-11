# Arquitectura del Sistema UNDC RSU

**Universidad Nacional de Cañete · Facultad de Ingeniería**
Sistema de Gestión de Responsabilidad Social Universitaria

---

## 1. Visión general

El sistema gestiona el ciclo completo de los proyectos de Responsabilidad Social Universitaria: propuesta, aprobación institucional, ejecución en campo, evaluación del impacto y reporte a SUNEDU.

Está compuesto por tres servicios orquestados con Docker Compose que se comunican exclusivamente por HTTP interno:

| Servicio | Tecnología | Puerto | Responsabilidad |
|----------|------------|--------|-----------------|
| `undc_rsu_db` | PostgreSQL 18 Alpine | 5432 | Persistencia, integridad referencial, vistas de reporte |
| `undc_rsu_api` | Go 1.22 + Gin | 8080 | API REST, reglas de negocio, almacenamiento |
| `undc_rsu_web` | Node 20 + Nginx 1.27 | 80 → 5173 | Interfaz de usuario y proxy inverso |

```
┌──────────────────────────────────────────────────────────────────────┐
│                          NAVEGADOR (cliente)                         │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│  NGINX  (undc_rsu_web · puerto 80)                                   │
│                                                                      │
│   /            → SPA React (build estático)                          │
│   /api/*       → http://undc_rsu_api:8080                            │
│   /uploads/*   → http://undc_rsu_api:8080                            │
│   /swagger/*   → http://undc_rsu_api:8080                            │
│                                                                      │
│   Cabeceras: X-Frame-Options · HSTS · CSP · nosniff · Referrer-Policy │
└───────────────────────────────┬──────────────────────────────────────┘
                                │
┌───────────────────────────────▼──────────────────────────────────────┐
│  BACKEND Go  (undc_rsu_api · puerto 8080)                            │
│                                                                      │
│   router → middleware → handler → service → repository → GORM        │
└──────┬───────────────────────────────┬───────────────────────────────┘
       │                               │
┌──────▼───────────────┐   ┌───────────▼────────────────────────────┐
│ PostgreSQL 18        │   │ Volúmenes Docker                       │
│  51 tablas           │   │   backend_uploads  /app/uploads        │
│  4 vistas            │   │   ./documentos      /app/documentos    │
│  TimeZone Peru/Lima  │   │     ├── plantillas/ (7 formatos)       │
└──────────────────────┘   │     └── lector_excel.py                │
                           └────────────────────────────────────────┘
```

---

## 2. Backend — Clean Architecture

El backend aplica Clean Architecture con dependencias unidireccionales: **las capas externas dependen de las internas, nunca al contrario**. El dominio no importa nada de Go externo al proyecto salvo la biblioteca estándar.

```
internal/
├── config/          Carga de variables de entorno y construcción del DSN
├── domain/          Entidades del negocio y sus reglas de forma (21 archivos)
├── dto/             Contratos de entrada/salida con validación
├── repository/      Acceso a datos, uno por entidad (23 repositorios)
├── service/         Reglas de negocio transversales (5 servicios)
├── handler/         Controladores HTTP, uno por entidad (28)
├── router/          Definición de rutas y documentación Swagger
├── middleware/      Cadena de preocupaciones transversales
├── auth/            Proveedor de autenticación contra base de datos
├── storage/         Almacenamiento de archivos (driver local)
└── formato/         (incluido en handler) — catálogo de formatos
```

### Camino de una petición

```
HTTP request
    │
    ▼
┌─────────────┐
│   router    │  Registra la ruta, aplica la cadena de middleware
└──────┬──────┘
       ▼
┌─────────────┐
│ middleware  │  CORS → Seguridad → RateLimit → TamañoDeCuerpo
└──────┬──────┘   → AuthMiddleware (JWT) → Logger → AuditMiddleware
       ▼
┌─────────────┐
│  handler    │  Valida el DTO, traduce HTTP ↔ dominio, responde JSON
└──────┬──────┘
       ▼
┌─────────────┐
│  service    │  Aplica las reglas de negocio
└──────┬──────┘
       ▼
┌─────────────┐
│ repository  │  Construye y ejecuta las consultas GORM
└──────┬──────┘
       ▼
┌─────────────┐
│ PostgreSQL  │  51 tablas, 4 vistas, restricciones CHECK y FK
└─────────────┘
```

### Responsabilidad de cada capa

| Capa | Sabe de | No sabe de |
|------|---------|------------|
| `handler` | HTTP, JSON, códigos de estado | SQL, reglas de negocio |
| `service` | Reglas del negocio | HTTP, SQL |
| `repository` | GORM, modelo de datos | HTTP, reglas de negocio |
| `domain` | Estructura del negocio | Todo lo demás |

---

## 3. Middleware — cadena de transversalidad

Implementado en `internal/middleware/middleware.go`:

| Middleware | Función |
|------------|---------|
| `CORS()` | Lista blanca de orígenes desde `CORS_ORIGINS` |
| `Seguridad()` | Cabeceras de seguridad y `Cache-Control: no-store` |
| `RateLimit(max, ventana)` | Ventana deslizante en memoria por IP |
| `TamañoDeCuerpo(max)` | Rechaza cuerpos que superan el límite |
| `AuthMiddleware()` | Valida el JWT e inyecta `user_id`, `rol`, `rol_actor` |
| `Logger()` | Registro estructurado de peticiones |
| `AuditMiddleware()` | Persiste acción, entidad, usuario e IP |

Cabeceras aplicadas por `Seguridad()`:

```
X-Frame-Options:            DENY
Strict-Transport-Security:  max-age=31536000; includeSubDomains
X-Content-Type-Options:     nosniff
Referrer-Policy:            strict-origin-when-cross-origin
Permissions-Policy:         geolocation=(self), microphone=(), camera=(self), payment=()
Content-Security-Policy:    default-src 'none'; frame-ancestors 'none'; base-uri 'none'
Cache-Control:              no-store
```

### Autenticación y autorización

El token JWT se emite con reclamos `iss`, `aud`, `nbf` y `exp` (8 horas de vigencia), y se valida con:

```go
jwt.WithValidMethods([]string{"HS256"})   // rechaza "none" y algoritmos externos
jwt.WithIssuer("undc-rsu")
jwt.WithAudience("undc-rsu-api")
```

La autorización por endpoint usa dos fuentes:

1. **Identidad** — `tokenUserID(c)` lee `user_id` del contexto. Es la única fuente confiable: los identificadores que lleguen en el cuerpo o el *query* se ignoran.
2. **Rol** — `esAdmin(c)` lee el reclamo `rol_actor` para habilitar rutas administrativas.

Verificación de credenciales con mitigación de *timing attack*: cuando el correo no existe se compara contra un hash ficticio, de modo que el tiempo de respuesta no revele la existencia de la cuenta.

---

## 4. Dominio — modelo del negocio

Cada dominio reside en un archivo propio dentro de `internal/domain/`:

| Archivo | Entidades |
|---------|-----------|
| `estructura` | `Facultad`, `Escuela`, `Ciclo_Academico` |
| `personas` | `Persona`, `Docente`, `Estudiante`, `EstudianteCiclo` |
| `usuario` | `RSUUsuario`, `RSUUsuarioPermiso` |
| `proyecto` | `RSUProyecto`, `RSUTipoProyecto`, `RSURolProyecto` |
| `asignacion` | `RSUAsignacionDocente`, `RSUParticipanteEstudiante` |
| `ejecucion` | `RSUActividadCampo`, `RSUActividadFoto`, `RSUEntregable` |
| `beneficiario` | `RSUBeneficiario`, `RSUProyectoBeneficiario` |
| `impacto` | `RSUPreguntaEncuesta`, `RSUEncuestaBeneficiario`, `RSURespuestaEncuesta`, `RSUIndicadorImpacto` |
| `presupuesto` | `RSUPresupuestoMovimiento` |
| `flujo` | `RSUEstadoProyecto`, `RSUTransicionEstado`, `RSUFlujoAprobacion` |
| `formato` | `RSUFormato` |
| `catalogos` | `RSUModalidad`, `RSULineaAccion`, `RSUEstado` |
| `notificacion` | `RSUNotificacion` |
| `auditoria` | `RSUAuditoria` |
| `constancia` | `RSUSolicitudConstancia` |
| `justificacion` | `RSUJustificacion` |
| `comite_rsu` | `RSUComiteRSU` |
| `configuracion` | `RSUConfiguracion` |
| `documento` | `RSUDocumento` |
| `proyecto_rol` | `RSUProyectoRol` |
| `vistas` | Modelos sobre las vistas del esquema |

Convenciones de mapeo GORM: nombre de tabla con prefijo `RSU_` o entidad académica correcta en español, columnas en `snake_case` mediante etiquetas `gorm:"column:..."`, y `json` para la serialización de la API.

---

## 5. Flujo de aprobación (BPMN)

El flujo es la pieza central del sistema. La validez de una transición no se decide en el frontend: se comprueba en el backend contra la tupla almacenada.

```
BORRADOR
   │  ESTUDIANTE_PROP crea el proyecto
   ▼
EN_REVISION_ESCUELA
   │  DIR_ESCUELA revisa
   ├───────────────► RECHAZADO
   ▼
CON_VB_ESCUELA
   │  DIR_ESCUELA emite visto bueno
   ▼
EN_PRIORIZACION_FACULTAD
   │  DIR_RS_FACULTAD prioriza
   ▼
EN_DICTAMEN_CONSEJO
   │  CONSEJO_FACULTAD dictamina
   ▼
APROBADO_CON_RESOLUCION
   │  resolución de aprobación
   ▼
EN_ASIGNACION_CARGA
   │  DOCENTE_RESP asume carga lectiva
   ▼
REGISTRADO_OFICIAL
   ▼
EN_EJECUCION ────────► EN_MONITOREO
   │  actividades, entregables, evidencias
   ▼
INFORME_FINAL_PRESENTADO
   │  CONSEJO revisa el informe
   ▼
CON_CONFORMIDAD_ESCUELA
   ▼
CERRADO
   │
   ▼
EN_EVALUACION_IMPACTO ───► EVALUACION_VALIDADA ───► REPORTADO_SUNEDU
```

**Regla de validación**: una transición del estado A al estado B para el rol R solo procede si existe la tupla `(A, B, R)` en `RSU_Transicion_Estado`. Cualquier otra combinación devuelve `409`. Hoy existen 22 transiciones autorizadas.

Cuando el destino no se indica explícitamente, el backend resuelve la única salida válida para el rol; si hubiera ambigüedad responde con la lista de opciones.

---

## 6. Gestión de formatos oficiales

Los 7 formatos oficiales son un **catálogo fijo**: no se crean ni se eliminan. El administrador solo reemplaza el archivo de ejemplo que se ofrece al usuario.

```
   db/07_formatos.sql                 backend (FormatoHandler)
   ┌──────────────────┐               ┌─────────────────────────────┐
   │ RSU_Formato      │◄──────────────│ asegurarCatalogo()          │
   │  codigo (único)  │               │  crea los 7 si faltan       │
   │  archivo_base    │               ├─────────────────────────────┤
   │  ruta            │               │ List / Codigos / Descargar  │
   │  version         │               │ Subir / Restaurar (ADMIN)   │
   └──────────────────┘               └──────────────┬──────────────┘
                                                     │
                          ruta vacía                 │  ruta definida
                    ┌──────────────────┐             ▼
                    │ documentos/      │     ┌──────────────┐
                    │ plantillas/*.docx│     │ uploads/     │
                    │ *.xlsx   (fábrica)    │ formatos/    │
                    └──────────────────┘     └──────────────┘
```

| Código | Formato | Tipo |
|--------|---------|------|
| `PROPUESTA` | Propuesta de proyecto | Word |
| `PLANIFICACION` | Planificación de actividades | Excel |
| `PRIMER_ENTREGABLE` | Primer entregable | Word |
| `SEGUNDO_ENTREGABLE` | Segundo entregable | Word |
| `TERCER_ENTREGABLE` | Tercer entregable | Word |
| `ENCUESTA` | Encuesta de satisfacción | Word |
| `INFORME_FINAL` | Informe final | Word |

El frontend solicita los archivos por **código**, nunca por nombre de archivo. De ese modo, reemplazar un formato en Administración se refleja de inmediato en todas las pantallas que lo consumen, sin despliegue de código.

---

## 7. Pipeline de planificación desde Excel

```
   Estudiante                     Backend Go                  Python
   ┌──────────┐   POST /planificacion ┌──────────────┐  exec   ┌────────────────┐
   │ descarga │ ────────────────────► │ FormFile     │ ──────► │ lector_excel.py│
   │ xlsx     │                       │ exec.Command │         │  openpyxl      │
   └──────────┘                       └──────┬───────┘         └───────┬────────┘
                                             │ JSON ◄─────────────────┘
                                             ▼
                                    ┌─────────────────┐
                                    │ preview o guardar│
                                    │ (crea actividades│
                                    │  PROGRAMADA,     │
                                    │  evita duplicados│
                                    └─────────────────┘
```

El lector interpreta fechas en español, notación `a.m.`/`p.m.` y rangos con guion largo, y calcula la duración en minutos. El resultado se devuelve como JSON que el backend valida antes de persistir.

---

## 8. Frontend — arquitectura

```
frontend/src/
├── main.tsx              Punto de entrada
├── App.tsx               Rutas con React.lazy + Suspense (code splitting)
├── api/client.ts         Cliente HTTP, manejo de token, respuesta normalizada
├── components/
│   ├── ui/               11 componentes base (Button, Card, Modal, Badge…)
│   └── layout/           AppShell, Sidebar, Header (notificaciones y búsqueda)
├── context/
│   ├── AuthContext.tsx   Sesión, usuario, expiración de token
│   └── LayoutContext.tsx Estado de la interfaz
├── hooks/
│   └── useCatalogoBpmn.ts Catálogo de estados y transiciones
├── lib/
│   ├── roles.ts          Catálogo de los 6 roles y su presentación
│   ├── permisos.ts       Reglas de capacidad del estudiante sobre su proyecto
│   └── utils.ts          Utilidades de presentación (clsx + tailwind-merge)
└── pages/                32 pantallas
```

### División del bundle

El `App.tsx` carga cada ruta con `React.lazy` y la envuelve en `Suspense` con un componente de carga. Vite agrupa las dependencias mayores en fragmentos independientes:

| Fragmento | Contenido |
|-----------|-----------|
| `react-*.js` | Núcleo de React y React Router |
| `charts-*.js` | Recharts (solo en pantallas con gráficos) |
| `icons-*.js` | Iconos de Lucide |
| `index-*.js` | Código de la aplicación |
| `Administracion-*.js` | Pantalla de administración bajo demanda |

### Sesión y seguridad del cliente

El token se conserva con la sesión del usuario; el cliente detecta el `401`, limpia la sesión y redirige al login. La comprobación de expiración se hace en el arranque usando `isTokenExpired()`.

---

## 9. Persistencia

### Principios

- **Integridad referencial** — claves foráneas reales con `ON DELETE` explícito.
- **Restricciones de dominio** — `CHECK` sobre estados, porcentajes y valores Likert.
- **Desnormalización mínima** — los indicadores (`promedio_general`, `calificacion_cualitativa`) se almacenan calculados para evitar agregaciones repetidas y servir la API sin recalcular.
- **Huso horario** — `America/Lima` tanto en el DSN como en el contenedor (`TZ` y `PGTZ`).
- **Vistas de reporte** — cuatro vistas materializan los indicadores de SUNEDU y SINEACE.

### Vistas

| Vista | Propósito |
|-------|-----------|
| `vw_rsu_proyectos_resumen` | Estado y avance agregado por proyecto |
| `vw_rsu_trazabilidad_aprobacion` | Historia de aprobaciones para expediente |
| `vw_rsu_satisfaccion_dimension` | Promedio Likert por dimensión |
| `vw_rsu_cobertura_anual` | Cobertura de beneficiarios por periodo |

### Orden de inicialización

Los scripts se montan en `/docker-entrypoint-initdb.d` y se ejecutan por orden alfabético **solo en el primer arranque del volumen**:

```
01-init.sql              esquema + catálogos + 17 estados + 22 transiciones
03-seed-demo.sql         datos de demostración
05-usuario-permisos.sql  permisos por usuario y módulo
07-formatos.sql          catálogo fijo de los 7 formatos
09-sin-creditos.sql      eliminación de campos obsoletos
```

Para reaplicar desde cero:

```bash
docker compose down -v
docker compose up -d
```

---

## 10. Almacenamiento de archivos

```
UPLOAD_DIR/
├── documentos/     PDF de entregables y justificaciones
├── fotos/          Evidencia fotográfica de actividades
└── formatos/       Formatos oficiales reemplazados por el administrador
```

Reglas aplicadas en `internal/storage` y en los handlers de subida:

- `filepath.Base` y saneamiento de caracteres sobre cada nombre recibido.
- Prefijo temporal (`UnixNano`) para evitar colisiones.
- Extensión permitida validada contra el tipo declarado del formato.
- Límite de tamaño por tipo de archivo.
- Hash SHA-256 persistido junto al registro para verificación de integridad.
- El `id_usuario_subida` proviene **siempre** del token.

---

## 11. Despliegue

### Docker Compose

| Servicio | Imagen base | Healthcheck |
|----------|-------------|-------------|
| `postgres` | `postgres:18-alpine` | `pg_isready` |
| `backend` | `golang:1.22-alpine` | `GET /health` |
| `frontend` | `node:20` → `nginx:1.27-alpine` | `GET /` |

El backend declara `depends_on` con `condition: service_healthy`, de modo que no intenta conectar antes de que PostgreSQL acepte conexiones.

### Multi-stage build (frontend)

```
node:20-alpine   →  npm ci && npm run build      (genera dist/)
nginx:alpine     →  copia dist/ + nginx.conf     (sirve la SPA)
```

### Multi-stage build (backend)

```
golang:1.22-alpine → go build -o server           (compila)
alpine            → instala ca-certificates + curl (runtime mínimo)
```

---

## 12. Decisiones técnicas

| Decisión | Justificación |
|----------|---------------|
| Clean Architecture | Aísla las reglas del negocio de Gin y de GORM; permite pruebas por capa |
| Formato por código, no por ruta | Reemplazar un archivo en Administración no requiere despliegue |
| Catálogo de formatos fijo | El negocio solo autoriza 7 formatos; evitar altas accidentales |
| Control BPMN en el backend | El cliente no puede bypasear la validación de rol |
| Identidad desde el token | Evita que un usuario suplante otro en subidas o consultas |
| JWT con `iss`/`aud`/método fijo | Reduce superficie de ataque contra la validación |
| Rate limit en memoria | Suficiente para despliegue de una sola instancia institucional |
| Código dividido por ruta | La pantalla de administración y los gráficos no pesan en el arranque |
| Indicadores calculados | La API de encuestas responde sin agregar en cada petición |
| Python aislado para Excel | `openpyxl` interpreta el formato sin arrastrar la dependencia a Go |

---

## 13. Verificación

```bash
# Backend
cd backend && go vet ./... && go build ./cmd/server

# Documentación de la API
swag init -g cmd/server/main.go -o docs --parseDependency --parseInternal

# Frontend
cd frontend && npm run lint && npm run build

# Estado del stack
docker compose ps
```

Estado actual comprobado: 3 contenedores *healthy*, 85 operaciones documentadas, 114 rutas registradas, 7/7 inicios de sesión exitosos y 51 tablas con datos coherentes.

---

## 14. Estructura de carpetas completa

```
.
├── backend/
│   ├── cmd/server/main.go
│   ├── internal/{config,domain,dto,repository,service,handler,router,middleware,auth,storage}
│   ├── docs/                     # Swagger generado
│   └── documentos/               # plantillas + lector_excel.py
├── frontend/
│   ├── src/{api,components,context,hooks,lib,pages}
│   ├── nginx.conf
│   └── vite.config.ts
├── db/                           # esquema, seed y migraciones
├── documentos/plantillas/        # 7 formatos de fábrica
├── docker-compose.yml
├── .env
├── README.md
├── ARCHITECTURE.md
└── HU_RSU.md
```

---

**UNDC Cañete · Facultad de Ingeniería**
Responsabilidad Social Universitaria — Ley N.º 30220, Art. 124-125
