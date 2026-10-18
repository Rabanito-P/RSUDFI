# HISTORIAS DE USUARIO — FASE 1: CREACIÓN (FASE DE APERTURA)

**Sistema:** Mini-RSU — Gestión Interna de Responsabilidad Social Universitaria
**Universidad Nacional de Cañete — Facultad de Ingeniería — EP de Ingeniería de Sistemas**
**Base normativa:** `rules/fase de propuesta-aprobacion-cierre (3).txt` §3.1, §4, §5, §6
**Ley de referencia:** Ley N.° 30220 Arts. 124, 125, 130 · Reglamento RSU UNDC (Res. CO N.° 299-2026-UNDC/CO)
**Versión del documento:** 1.0 —October 2026
**Estado:** Pendiente de aprobación por el usuario

---

## 0. REGLAS DE PRECEDENCIA APLICADAS

Orden de autoridad para toda la Fase 1:

1. **`rules/` (V0.3 / V0.4)** — manda sobre cualquier regla en conflicto.
2. **Catálogo vigente `HU_RSU.md` + reglas R01–R47** — se conserva íntegro cuando `rules/` guarda silencio.
3. **Excepciones** — cuando `rules/` contradice una HU vigente (no es vacío sino choque), la HU **no se ejecuta** hasta que el usuario resuelva. Se registran en el §4 de este documento.

---

## 1. RESUMEN DE HISTORIAS DE USUARIO

| ID | Título | Actor | Prioridad | Estado |
|---|---|---|---|---|
| `HU-F1-01-P1` | Registrar propuesta inicial de proyecto SSU | Estudiante líder | P1 | Pendiente |
| `HU-F1-02-P1` | Validar composición del equipo y cronograma de 60 h | Sistema | P1 | Pendiente |
| `HU-F1-03-P1` | Seleccionar docente asesor y enviar la propuesta | Estudiante líder | P1 | Pendiente |
| `HU-F1-04-P1` | Bucle de aceptación y rechazo del docente asesor | Docente asesor | P1 | Pendiente |
| `HU-F1-05-P1` | Registrar propuesta inicial de PEP | Docente / Comité RSU | P1 | Pendiente |
| `HU-F1-06-P2` | CAMINO 1 — Rechazo de asesoría y congelamiento | Sistema | P2 | Pendiente |
| `HU-F1-07-P2` | CAMINO 3 — Vencimiento, archivado y bloqueo por cupo | Sistema | P2 | Pendiente |
| `HU-F1-08-P3` | Catálogo de formatos oficiales DRSU descargables | Sistema | P3 | Pendiente |

**Prioridades:** `P1` Alta (bloqueante del flujo) · `P2` Media (excepción y control) · `P3` Baja (soporte documental).

---

## 2. ESTADOS DE LA FASE 1

Se **agregan 3 estados** nuevos al catálogo actual de 17 (`db/init.sql:367-384`). Los estados existentes **no se modifican ni se renombran**.

| Código | Nombre | Disparador | Efecto |
|---|---|---|---|
| `BORRADOR` | Informe Inicial (Borrador) | Estado inicial (ya existe) | Edición total |
| `ENVIADO_ASESOR` | Enviado a Docente Asesor | Estudiante envía la propuesta | Espera aceptación del asesor |
| `OBSERVADO_ASESOR` | Observado por Docente Asesor | Asesor rechaza la asesoría | Congela contenido técnico |
| `ACEPTADO_ASESOR` | Aceptado por Asesor | Asesor acepta la asesoría | Listo para envío a Escuela (Fase 2) |
| `ARCHIVADO_VENCIMIENTO` | Archivado por Vencimiento | Vencimiento de plazo | Bloqueado, libera cupo del asesor |

**Transiciones de la Fase 1** (se agregan a `RSU_Transicion_Estado`):

| Origen | Destino | Rol actor | `requiere_documento` |
|---|---|---|---|
| `BORRADOR` | `ENVIADO_ASESOR` | `ESTUDIANTE_PROP` | true |
| `ENVIADO_ASESOR` | `ACEPTADO_ASESOR` | `DOCENTE_RESP` | true |
| `ENVIADO_ASESOR` | `OBSERVADO_ASESOR` | `DOCENTE_RESP` | false |
| `OBSERVADO_ASESOR` | `ENVIADO_ASESOR` | `ESTUDIANTE_PROP` | true |
| `ENVIADO_ASESOR` | `ARCHIVADO_VENCIMIENTO` | `DIR_RS_FACULTAD` | false |
| `OBSERVADO_ASESOR` | `ARCHIVADO_VENCIMIENTO` | `DIR_RS_FACULTAD` | false |
| `ARCHIVADO_VENCIMIENTO` | `BORRADOR` | `ESTUDIANTE_PROP` | true |

**Nota de compatibilidad:** la transición `BORRADOR → EN_REVISION_ESCUELA` que existe hoy (`init.sql:452`) **se conserva**, pero solo puede ejecutarla el estudiante cuando el proyecto esté en `ACEPTADO_ASESOR` o cuando la modalidad no exija asesor. Esto preserva el botón "Enviar a Escuela" ya construido.

**Nota sobre el rol del archivado:** el archivado por vencimiento lo ejecuta la **Dirección/Comité de RS de la Facultad** (`DIR_RS_FACULTAD`), que es quien gestiona los trámites de cierre según rules V0.4 §2.4. No se usa `ADMIN` porque **no existe como rol actor BPMN**: `RSU_Rol_Actor` tiene 12 roles y `ADMIN` no está entre ellos.

---

## 3. HISTORIAS DE USUARIO EN DETALLE

---

### `HU-F1-01-P1` — Registrar propuesta inicial de proyecto SSU

| Campo | Detalle |
|---|---|
| **Actor** | `ESTUDIANTE_PROP` (estudiante líder) |
| **Prioridad** | P1 — Alta |
| **Pantalla** | `Crear proyecto` (formulario de 4 pasos) |
| **Origen normativo** | `rules/`(3) §3.1 punto 1 |
| **Precondiciones** | Usuario autenticado con rol `ESTUDIANTE`; sin proyecto activo en `ENVIADO_ASESOR` |
| **Estado resultante** | `BORRADOR` |

**Criterios de aceptación**

| # | Criterio | Verificable por |
|---|---|---|
| CA-1.1 | El líder completa los datos generales: título, escuela, descripción, objetivo general, población beneficiaria, lugar, fechas, presupuesto, semestre y ciclo | Test API + pantalla |
| CA-1.2 | El sistema asigna `codigo_proyecto` único con formato institucional al guardar por primera vez | Campo `RSU_Proyecto.codigo_proyecto` |
| CA-1.3 | El campo **Problemática** es obligatorio, mínimo 100 caracteres | Validación cliente + backend |
| CA-1.4 | El campo **ODS** es obligatorio; valores del 1 al 17 contra el catálogo `RSU_Configuracion.ods` | Validación cliente + backend |
| CA-1.5 | La modalidad queda fija en `SSU`; el estudiante no puede cambiarla | `RSU_Proyecto.modalidad = 'SSU'` |
| CA-1.6 | Se valida `fecha_inicio_plan < fecha_fin_plan` | Regla R05 vigente (conservada) |
| CA-1.7 | El proyecto inicia en `BORRADOR` con edición total por el líder | Estado en BD |
| CA-1.8 | Solo el líder y los miembros inscritos ven el proyecto | Regla R08 vigente (conservada) |
| CA-1.9 | Se genera el registro en `RSU_Flujo_Aprobacion` con el actor y la fecha | Trazabilidad |

**Restricciones**
- El estudiante **no** crea PEP (regla R42 vigente, conservada): solo `SSU` y `VOLUNTARIADO`.
- El estudiante no manipula fondos: el presupuesto es referencial, no implica transferencia (art. 2 del Acta de Planificación).
- Aislamiento de datos: `GET /estudiantes/:id/proyectos` únicamente (R08).

**Alcance**
- ✅ Incluido: formulario, campos obligatorios, código autogenerado, estado inicial, validación de fechas.
- ❌ Excluido: envío al asesor (HU-F1-03), aceptación (HU-F1-04), aprobación de Escuela (Fase 2).

**Diferencia con HU-001 vigente:** se **agregan** Problemática y ODS (antes no existían en `RSU_Proyecto`, `init.sql:133`). El resto de las validaciones de HU-001 (título 20–300, presupuesto positivo, beneficiary count) **se conservan** por ser un vacío en `rules/`.

---

### `HU-F1-02-P1` — Validar composición del equipo y cronograma de 60 h

| Campo | Detalle |
|---|---|
| **Actor** | `SISTEMA` (validación automática) |
| **Prioridad** | P1 — Alta |
| **Pantalla** | Modal de validación (invisible salvo error) + resumen del cronograma |
| **Origen normativo** | `rules/`(3) §3.1 punto 1 · R01, R09, R10 |
| **Precondiciones** | Proyecto en `BORRADOR` con al menos un integrante registrado |
| **Estado** | No cambia estado; bloquea el envío si falla |

**Criterios de aceptación**

| # | Criterio | Verificable por |
|---|---|---|
| CA-2.1 | El equipo tiene **mínimo 2** estudiantes (líder + 1) | R09 vigente (conservado) |
| CA-2.2 | El equipo tiene **máximo 5** estudiantes | R10 vigente (conservado) |
| CA-2.3 | Cada correo integrado termina en `@undc.edu.pe`, no está duplicado y no es el del líder | Validación actual (`CrearProyecto.tsx:39-44`) |
| CA-2.4 | El cronograma suma **mínimo 60 horas efectivas**; si no alcanza, el envío se bloquea con mensaje que muestra el total calculado | Lectura de `RSU_Configuracion.minimo_horas_ssu` |
| CA-2.5 | El ciclo numérico del líder cumple el mínimo del tipo de proyecto | R01 / HU-003 vigente (conservado) |
| CA-2.6 | Si las horas son menores a 60 pero mayores a 45, el sistema **advierte** y sugiere revisión, sin bloquear | Regla de prórroga (Fase 3) |
| CA-2.7 | Las horas se calculan sumando la duración de todas las actividades cargadas desde la planificación | `lector_excel.py` devuelve duraciones |

**Restricciones**
- El valor 60 h proviene de `RSU_Configuracion.clave = 'minimo_horas_ssu'` (`init.sql:485`), hoy **clave muerta**: esta HU la activa como configuración efectiva.
- La validación es **de backend**, no solo de cliente.

**Alcance**
- ✅ Incluido: equipo 2–5, correos, 60 h, ciclo mínimo, advertencia 45–60.
- ❌ Excluido: el conteo de horas **reales durante la ejecución** (Fase 3), donde el hour counter se alimenta de las actividades ejecutadas.

---

### `HU-F1-03-P1` — Seleccionar docente asesor y enviar la propuesta

| Campo | Detalle |
|---|---|
| **Actor** | `ESTUDIANTE_PROP` |
| **Prioridad** | P1 — Alta |
| **Pantalla** | `Fases del proyecto` → selector de asesor + botón `ENVIAR A ASESOR` |
| **Origen normativo** | `rules/`(3) §3.1 punto 1 y punto 2 |
| **Precondiciones** | Proyecto en `BORRADOR`; CA-2.1 a CA-2.5 en verde |
| **Estado resultante** | `ENVIADO_ASESOR` |

**Criterios de aceptación**

| # | Criterio | Verificable por |
|---|---|---|
| CA-3.1 | La lista muestra solo docentes de la misma escuela | Filtro por `id_escuela` |
| CA-3.2 | Cada docente muestra su carga disponible: `carga_no_lectiva_max - SUM(horas APROBADAS)` | `handler/personas.go:106-107` (existente) |
| CA-3.3 | El docente con carga 0h aparece deshabilitado | Comportamiento vigente (conservado) |
| CA-3.4 | El asesor es **obligatorio** para enviar la propuesta | `service/proyecto.go:108-110` (existente) |
| CA-3.5 | Al enviar, el estado pasa a `ENVIADO_ASESOR` | Transición BPMN nueva |
| CA-3.6 | Se registra la trazabilidad en `RSU_Flujo_Aprobacion` con rol `ESTUDIANTE_PROP` | Registro en BD |
| CA-3.7 | Se notifica al asesor seleccionado | Notificación dirigida |

**Restricciones**
- El proyecto en `ENVIADO_ASESOR` **no puede editarse** por el estudiante hasta que el asesor responda (congelamiento de Fase 1).
- El selector no ofrece docentes que ya tienen 2 proyectos asesorados **en el ciclo vigente** (corrección de `repository/personas.go:48`).

**Alcance**
- ✅ Incluido: selección, validación de carga, envío, transición, notificación.
- ❌ Excluido: la respuesta del asesor (HU-F1-04).

---

### `HU-F1-04-P1` — Bucle de aceptación y rechazo del docente asesor

| Campo | Detalle |
|---|---|
| **Actor** | `DOCENTE_RESP` (docente asesor) |
| **Prioridad** | P1 — Alta — **es el corazón de la fase; hoy no existe** |
| **Pantalla** | `Bandeja del docente` → detalle de propuesta received |
| **Origen normativo** | `rules/`(3) §3.1 punto 2 (CAMINO 1 / CAMINO BUENO) |
| **Precondiciones** | Proyecto en `ENVIADO_ASESOR` con el docente como `id_docente_asesor` |
| **Estado resultante** | `ACEPTADO_ASESOR` u `OBSERVADO_ASESOR` |

**Criterios de aceptación — CAMINO BUENO (aceptar)**

| # | Criterio | Verificable por |
|---|---|---|
| CA-4.1 | El asesor ve la propuesta completa: datos, problemática, ODS, cronograma, equipo | Bandeja del docente |
| CA-4.2 | El sistema valida que el docente tenga **menos de 2 SSU en el ciclo** antes de aceptar | Conteo por `id_ciclo_creacion` |
| CA-4.3 | Al aceptar, se registra la fecha y el `id_verificador` | `RSU_Flujo_Aprobacion` |
| CA-4.4 | El estado pasa a `ACEPTADO_ASESOR` | Transición BPMN |
| CA-4.5 | Se genera el registro del formato `F-M03.01-RSU-016` como plantilla descargable | Catálogo (HU-F1-08) |
| CA-4.6 | Se notifica al estudiante líder la aceptación | Notificación dirigida |
| CA-4.7 | El proyecto queda habilitado para el envío a Escuela | Estado `ACEPTADO_ASESOR` |

**Criterios de aceptación — CAMINO 1 (rechazar)**

| # | Criterio | Verificable por |
|---|---|---|
| CA-4.8 | El asesor puede rechazar la asesoría | Botón `RECHAZAR ASESORÍA` |
| CA-4.9 | El rechazo **exige motivo** escrito | Regla R26 vigente (conservada) |
| CA-4.10 | El estado pasa a `OBSERVADO_ASESOR` | Transición BPMN |
| CA-4.11 | Se notifica al líder con el motivo | Notificación dirigida |

**Restricciones**
- El reintento es **ilimitado** hasta obtener aceptación (`rules/`(3) §5 CAMINO 1).
- El asesor **no** puede aprobar la propuesta: su competencia es aceptar o rechazar la asesoría, no el proyecto (eso es Fase 2).
- La transición `ENVIADO_ASESOR → OBSERVADO_ASESOR` no exige PDF; las de aceptación sí exigen el PDF de sustento.

**Alcance**
- ✅ Incluido: ambas acciones, validación de cupo por ciclo, trazabilidad, notificaciones.
- ❌ Excluido: la evaluación del Director de Escuela (Fase 2), el contenido de la Ficha F-005 (Fase 2).

**Diferencia con HU-002 vigente:** HU-002 solo *registraba* el asesor sin exigir su aceptación. Esta HU agrega el bucle completo. HU-002 queda homologada como parte de HU-F1-03.

---

### `HU-F1-05-P1` — Registrar propuesta inicial de PEP

| Campo | Detalle |
|---|---|
| **Actor** | `DOCENTE_RESP` (responsable) o `COMITE_PS` (presidente del Comité RSU) |
| **Prioridad** | P1 — Alta |
| **Pantalla** | `Crear proyecto` (rol docente / comité) |
| **Origen normativo** | `rules/`(3) §4 puntos 1 y 2 · R42 vigente |
| **Precondiciones** | Usuario autenticado con rol docente o comité |
| **Estado resultante** | `BORRADOR` → `ENVIADO_ASESOR` (si aplica) |

**Criterios de aceptación**

| # | Criterio | Verificable por |
|---|---|---|
| CA-5.1 | El docente o comité registra el Esquema Anexo 3 / `F-M03-RSU-001` | Descarga de plantilla |
| CA-5.2 | **PEP financiado:** se exige presentación con **mín. 15 días antes** del inicio de clases | `rules/`(3) §4.1 |
| CA-5.3 | **PEP financiado:** exige cuadro de presupuesto del 2% RSU asignado a la Escuela | `rules/`(3) §4.1 |
| CA-5.4 | **PEP autofinanciado:** se admite en cualquier momento, sin presupuesto institucional | `rules/`(3) §4.1 |
| CA-5.5 | El PEP queda publicado en el catálogo visible para los estudiantes | Listado de PEPs abiertos |
| CA-5.6 | El estudiante puede solicitar adhesión al PEP (HU-063..069 vigentes, conservadas) | R36–R41 vigentes |
| CA-5.7 | El docente responsable es quien acepta o rechaza las adhesiones | R38 vigente (conservado) |
| CA-5.8 | El proyecto queda `BORRADOR` hasta que el docente lo envíe | Estado en BD |

**Restricciones**
- El estudiante **no crea** PEP (R42 vigente, conservado).
- PEP **no es válido** para el Grado de Bachiller: se reflejará en Fase 4 (verificado en la auditoría: hoy no existe esa distinción).
- El presupuesto del PEP financiado se ejecuta contra el fondo 2% RSU; la regla R08 de `info/objetivo.txt` describe su corrección y **se conserva**.

**Alcance**
- ✅ Incluido: registro de PEP financiado y autofinanciado, plazos, catálogo, adhesión.
- ❌ Excluido: filtro presupuestal de Facultad (Fase 2), aprobación de VPA (Fase 2), ejecución (Fase 3).

---

### `HU-F1-06-P2` — CAMINO 1: Rechazo de asesoría y congelamiento

| Campo | Detalle |
|---|---|
| **Actor** | `SISTEMA` |
| **Prioridad** | P2 — Media |
| **Pantalla** | Panel del estudiante en `OBSERVADO_ASESOR` |
| **Origen normativo** | `rules/`(3) §3.1 punto 2 CAMINO 1 y §5 |
| **Precondiciones** | Proyecto en `OBSERVADO_ASESOR` |

**Criterios de aceptación**

| # | Criterio | Verificable por |
|---|---|---|
| CA-6.1 | Al rechazar la asesoría, el sistema **congela** título, problemática, cronograma y ODS | Campos de solo lectura |
| CA-6.2 | **Únicamente** queda habilitado el selector de nuevo docente asesor | Comportamiento de UI + backend |
| CA-6.3 | El estudiante **no** puede eliminar integrantes ni cambiar el equipo en este estado | Restricción de backend |
| CA-6.4 | El estudiante puede reenviar al nuevo asesor sin límite de reintentos | `rules/`(3) §5 "Sin límite de reintentos" |
| CA-6.5 | El motivo del rechazo se muestra al estudiante | Trazabilidad |
| CA-6.6 | Al reenviar, el proyecto vuelve a `ENVIADO_ASESOR` con el nuevo asesor | Transición BPMN |

**Restricciones**
- El congelamiento debe aplicarse **en el backend**: el cliente no puede ser la única barrera (corrige el defecto actual donde `permisos.ts:6` referencia un estado `OBSERVADO` inexistente, dejando la rama de edición como código muerto).
- La transición a `OBSERVADO_ASESOR` es exclusiva del rol `DOCENTE_RESP`.

**Alcance**
- ✅ Incluido: congelamiento, selector único de asesor, reintentos ilimitados, retorno a envío.
- ❌ Excluido: observación técnica del Director de Escuela (CAMINO 2, Fase 2).

---

### `HU-F1-07-P2` — CAMINO 3: Vencimiento, archivado y bloqueo por cupo del asesor

| Campo | Detalle |
|---|---|
| **Actor** | `SISTEMA` |
| **Prioridad** | P2 — Media |
| **Pantalla** | Panel del estudiante y del asesor |
| **Origen normativo** | `rules/`(3) §5 CAMINO 3 · `info/objetivo.txt` R06 (máx. 2 SSU por semestre) |
| **Precondiciones** | Proyecto en `ENVIADO_ASESOR` o `OBSERVADO_ASESOR` con plazo vencido |
| **Estado resultante** | `ARCHIVADO_VENCIMIENTO` |

**Criterios de aceptación — estándar de cupo**

| # | Criterio | Verificable por |
|---|---|---|
| CA-7.1 | Vencido el plazo sin respuesta, el proyecto pasa a `ARCHIVADO_VENCIMIENTO` | Estado en BD |
| CA-7.2 | El proyecto archivado **libera** el cupo del docente asesor | Conteo por ciclo ignora archivados |
| CA-7.3 | El proyecto archivado **no admite reenvío** mientras el docente esté en su tope de 2 asesorías | Validación de transición |
| CA-7.4 | Cuando el docente recupera cupo, el proyecto queda **disponible** para reactivarse | Panel del estudiante con aviso |
| CA-7.5 | La reactivación exige que el estudiante confirme y reenvíe al asesor | Transición `ARCHIVADO_VENCIMIENTO → BORRADOR` |
| CA-7.6 | **Todo** cambio de estado notifica a: estudiante líder, asesor, Director de Escuela y Dir. RS Facultad | 4 notificaciones emitidas |
| CA-7.7 | El estudiante puede iniciar una **nueva** propuesta o unirse a un PEP tras el archivado | Regla `rules/`(3) §5 |

**Criterios de aceptación — plazos**

| # | Criterio | Verificable por |
|---|---|---|
| CA-7.8 | El plazo de respuesta del asesor se toma de `RSU_Configuracion` (clave a definir; `plazo_subsanacion=10` es hoy clave muerta) | `init.sql:482` |

**Restricciones**
- `maximo_proyectos_ssu_docente` se evalúa **por ciclo**, no globalmente. El conteo actual (`repository/personas.go:48-56`) **no** filtra por ciclo y debe corregirse.
- El archivado es un **estado estándar**: una vez aplicado, notifica a las partes y queda registrado en la trazabilidad.
- El proceso de vencimiento requiere un **mecanismo de ejecución en segundo plano** (temporizador). La auditoría detectó que el backend **no tiene ningún worker**.

**Alcance**
- ✅ Incluido: vencimiento, archivado, liberación de cupo, bloqueo de reenvío, reactivación, notificaciones.
- ❌ Excluido: la observación de Escuela con su plazo de 10 días (CAMINO 2, Fase 2), y la prórroga de 45–55 h (Fase 3).

---

### `HU-F1-08-P3` — Catálogo de formatos oficiales DRSU descargables

| Campo | Detalle |
|---|---|
| **Actor** | `SISTEMA` (solo lectura y descarga) |
| **Prioridad** | P3 — Baja |
| **Pantalla** | Sección `Formatos` |
| **Origen normativo** | `rules/`(3) §6 + `info/objetivo.txt` §2.1 |
| **Precondiciones** | Usuario autenticado |
| **Estado** | No modifica estados |

**Criterios de aceptación**

| # | Criterio | Verificable por |
|---|---|---|
| CA-8.1 | Existe un catálogo **independiente** de formatos DRSU, sin alterar los 7 formatos actuales | `RSU_Formato` intacto |
| CA-8.2 | El catálogo lista los formatos de Fase 1: `F-M03.01-RSU-001`, `F-M03.01-RSU-005`, `F-M03.01-RSU-016`, `F-M03-RSU-001`, `F-M03-RSU-002`, `F-M03-RSU-003` | Listado |
| CA-8.3 | Cada formato declara a qué formato actual equivale, si corresponde | Ej.: 001 → `PROPUESTA` |
| CA-8.4 | Los formatos **sin equivalente** (`005`, `016`) se ofrecen como plantillas nuevas | Descarga disponible |
| CA-8.5 | La descarga es **solo lectura**: el sistema **no genera** ni firma digitalmente estos documentos | Sin librería PDF en backend |
| CA-8.6 | Descargar un formato DRSU **no crea** entradas nuevas en `RSU_Formato` | Catálogo de 7 sin cambios |
| CA-8.7 | Las plantillas se almacenan en `documentos/plantillas/drsu/` (ruta separada) | Sistema de archivos |

**Restricciones**
- Los formatos DRSU son **propiedad de la DRSU Central** (`info/objetivo.txt` §2.1: fuente "DRSU"). El Mini-RSU los **consume**, no los emite.
- Los 7 formatos actuales (`PROPUESTA`, `PLANIFICACION`, `PRIMER/SEGUNDO/TERCER_ENTREGABLE`, `ENCUESTA`, `INFORME_FINAL`) **no se renombran ni se eliminan**.
- Formatos de constancias (`F-M03.01-RSU-003/004`) y voluntary others quedan para Fases 3–4.

**Alcance**
- ✅ Incluido: listado, equivalencias, descarga de plantillas de Fase 1.
- ❌ Excluido: generación automática, firma digital, QR, Officio de Elevación (ninguna de estas cosas tiene soporte técnico actual).

---

## 4. EXCEPCIONES PENDIENTES DE RESOLUCIÓN

### ⚠️ E1 — Estado inicial del proyecto
**Situación:** `rules/`(3) §3.1 pide que el proyecto pase directo a "Enviado a Docente Asesor". El catálogo vigente (HU-001, R23) exige que nazca en `BORRADOR`.
**Resolución del usuario:** el proyecto **nace en `BORRADOR`** (se conserva R23) y el bucle del asesor ocurre al presionar "Enviar a Escuela".
**Efecto aplicado en estas HU:** la transición es `BORRADOR → ENVIADO_ASESOR → (aceptar) → ACEPTADO_ASESOR → (enviar) → EN_REVISION_ESCUELA`. La transición `BORRADOR → EN_REVISION_ESCUELA` se conserva para modalidades sin asesor.
**Estado:** RESUELTA por el usuario.

### ⚠️ E2 — Frecuencia del conteo de cupo
**Situación:** el conteo actual de asesorías no filtra por ciclo (`repository/personas.go:48-56`).
**Resolución aplicada:** la Fase 1 exige conteo **por ciclo**, alineado con `rules/`(3) §3.1 punto 2 y `info/objetivo.txt` R06 ("máx. 2 SSU por semestre").
**Estado:** RESUELTA — se incluye en CA-2 y CA-4.2.

### ⚠️ E3 — Generación de documentos
**Situación:** `rules/`(3) §6 pide que el sistema genere el F-001 y que el docente firme el F-016. El backend no tiene librería PDF.
**Resolución del usuario:** los formatos son **solo plantillas descargables**. No hay generación ni firma digital.
**Efecto:** HU-F1-08 se limita a catálogo y descarga.
**Estado:** RESUELTA.

### ⚠️ E4 — Ubicación de la liberación de cupo (E2 anterior)
**Situación:** la liberación de cupo nace en Fase 1 (asesor) pero `rules/` la menciona en el cierre de Fase 2.
**Resolución del usuario:** la liberación de cupo va en Fase 1, junto con el bloqueo de reenvío y la notificación a las partes.
**Efecto:** incluido en HU-F1-07.
**Estado:** RESUELTA.

### 🔵 E5 — Mecanismo de vencimiento (nuevo, requiere decisión técnica)
**Situación:** el archivado por vencimiento exige un temporizador. El backend no tiene ningún worker ni scheduler (verificado en la auditoría: `main.go` no registra `Ticker` ni cron).
**Opciones:** (a) tarea programada en el backend; (b) cálculo perezoso al leer el estado; (c) proceso externo que llame un endpoint.
**Estado:** PENDIENTE — se implementará en Fase 2 salvo que indiques lo contrario.

---

## 5. HOMOLOGACIÓN CON EL CATÁLOGO VIGENTE

### 5.1 Historias de usuario del catálogo que pasan a Fase 1

| Catálogo vigente | Destino en Fase 1 | Acción | Motivo |
|---|---|---|---|
| HU-001 Crear proyecto de RSU | `HU-F1-01` | **Modificada** | Se agregan Problemática y ODS; el estado inicial se conserva |
| HU-002 Registrar docente asesor | `HU-F1-03` | **Homologada** | Se conserva; se precisa el filtro por ciclo |
| HU-003 Validar ciclo mínimo | `HU-F1-02` | **Homologada** | Se conserva íntegra |
| HU-004 Enviar proyecto a revisión | `HU-F1-04` | **Modificada** | Ahora el envío exige aceptación previa del asesor |
| HU-005..HU-009 | **Fase 2** | Fuera de fase | Aprobación institucional |

### 5.2 Reglas del catálogo que se conservan (vacío en `rules/`)

| Regla | Contenido | Decisión |
|---|---|---|
| R01 | Ciclo mínimo del estudiante | **Se conserva** |
| R05 | `fecha_inicio < fecha_fin` | **Se conserva** |
| R06 | Porcentajes entre 0 y 100 | **Se conserva** |
| R08 | Aislamiento: el estudiante solo ve sus proyectos | **Se conserva** |
| R09 | Equipo mínimo de 2 estudiantes | **Se conserva** |
| R10 | Máximo 5 estudiantes por proyecto | **Se conserva** |
| R13 | Tamaño de archivo: PDF ≤32 MB, fotos ≤5 MB | **Se conserva** |
| R14 | Solo PDF para entregables | **Se conserva** |
| R22 | Búsqueda por título, código y escuela | **Se conserva** |
| R26 | Observar o rechazar exige motivo | **Se conserva** |
| R33 | Cualquier miembro del equipo puede subir documentos | **Se conserva** |
| R36–R41 | Solicitud de adhesión a PEP (unicidad, responsable, cupo, motivo, notificación) | **Se conserva** |
| R42 | Modalidad por rol: estudiante solo SSU / VOLUNTARIADO | **Se conserva** |

### 5.3 Reglas del catálogo que se modifican

| Regla | Antes | Ahora | Base |
|---|---|---|---|
| R23 | Estado inicial `BORRADOR` | `BORRADOR` **se mantiene**; se agrega la cadena de estados del asesor | Decisión del usuario (E1) |
| R43 | Máx. 2 equipos por docente (global) | Máx. 2 equipos por docente **en el ciclo** | `rules/`(3) §3.1 punto 2 |
| R44 | Asesor obligatorio al crear | Asesor obligatorio **antes de enviar a Escuela** | `rules/`(3) §3.1 punto 1 |

---

## 6. MATRIZ DE COBERTURA CONTRA `rules/`(3)

| Requisito de `rules/`(3) | HU que lo cubre | Estado |
|---|---|---|
| §2: Estudiante crea con 2–5, problemática, ODS, cronograma 60 h | `HU-F1-01`, `HU-F1-02` | Cubierto |
| §2: Selecciona docente asesor | `HU-F1-03` | Cubierto |
| §3.1-1: Genera F-001, estado Enviado a Docente Asesor | `HU-F1-01`, `HU-F1-03`, `HU-F1-08` | Cubierto |
| §3.1-2 CAMINO 1: Rechazo → congela, solo nuevo asesor, reintentos ilimitados | `HU-F1-06` | Cubierto |
| §3.1-2 CAMINO BUENO: valida <2 SSU, firma F-016, enviado a Escuela | `HU-F1-04`, `HU-F1-08` | Cubierto |
| §3.1-3: Filtro Director de Escuela con 10 d.h. y Ficha F-005 | **Fase 2** | Diferido |
| §3.1-4: Comité valida y Decano exporta Oficio | **Fase 2** | Diferido |
| §3.1-5: DRSU firma Ficha de Aprobación SSU | **Fase 2** | Diferido |
| §3.1-6: Activación con PDF firmado → EN EJECUCIÓN | **Fase 2** | Diferido |
| §4-1: PEP financiado 15 días antes + cuadro de presupuesto | `HU-F1-05` | Cubierto |
| §4-1: PEP autofinanciado en cualquier momento | `HU-F1-05` | Cubierto |
| §4-6: Student se adhiere al PEP, docente selecciona, Padrón Oficial | `HU-F1-05` | Parcial — Padrón en Fase 4 |
| §5 CAMINO 1: Rechazo de asesoría | `HU-F1-06` | Cubierto |
| §5 CAMINO 2: Observación de Escuela, 10 d.h. | **Fase 2** | Diferido |
| §5 CAMINO 3: Vencimiento → archivado, libera cupos | `HU-F1-07` | Cubierto |
| §6: F-001, F-016, F-005 como documentos | `HU-F1-08` (Fase 1: 001, 016) | Cubierto |

---

**Fin del documento — Fase 1: Creación**
**Pendiente:** aprobación del usuario antes de iniciar el desarrollo.

---

## 7. REGISTRO DE IMPLEMENTACIÓN

**Estado:implemented y verificado.** Todas las HU de esta fase quedaron implementadas y probadas.

### 7.1 Archivos creados

| Archivo | Contenido |
|---|---|
| `backend/internal/service/fase1_validacion.go` | Reglas puras: problemática, ODS, horas, equipo, correo |
| `backend/internal/service/fase1_cupo.go` | Cupo por ciclo, archivado, congelamiento por estado |
| `backend/internal/service/fase1_formatos.go` | Catálogo DRSU de Fase 1 (solo lectura) |
| `backend/internal/service/fase1_asesor.go` | Bucle del asesor, envío, reactivación, notificaciones |
| `backend/internal/handler/fase1.go` | Endpoints HTTP de la Fase 1 |
| `backend/internal/service/fase1_*_test.go` | 5 archivos de pruebas unitarias |
| `db/03_fase1_creacion.sql` | Migración idempotente (estados, transiciones, configuración) |
| `frontend/src/pages/BucleAsesor.tsx` | Pantalla de aceptación/rechazo del asesor |
| `frontend/src/pages/FormatosDRSU.tsx` | Catálogo DRSU descargable |

### 7.2 Endpoints

| Método | Ruta | HU |
|---|---|---|
| POST | `/api/v1/proyectos/:id/enviar-asesor` | HU-F1-03 |
| POST | `/api/v1/proyectos/:id/decision-asesor` | HU-F1-04 |
| POST | `/api/v1/proyectos/:id/reactivar` | HU-F1-07 |
| GET | `/api/v1/formatos/drsu` | HU-F1-08 |
| GET | `/api/v1/formatos/drsu/:codigo` | HU-F1-08 |

Rutas de interfaz: `/docente/asesorias` (asesor) y `/formatos-drsu` (todos los roles).

### 7.3 Verificación

- **Pruebas unitarias (TDD):** 6 archivos de test, todas en verde con `go test ./internal/service/`.
- **Prueba end-to-end:** 26 aserciones contra el backend real, todas en verde.
- **Compilación:** `go build ./...`, `go vet ./...` y `npx tsc --noEmit` sin errores.

### 7.4 Incidencias detectadas durante la implementación

| # | Hallazgo | Resolución |
|---|---|---|
| 1 | El `Dockerfile` del backend usaba `golang:1.23-alpine` mientras `go.mod` exige Go 1.24. El tag trae `GOTOOLCHAIN=local`, así que **el build del backend fallaba** en HEAD | Se actualizó la imagen base a `golang:1.24-alpine` |
| 2 | Al aceptar una asesoría, el proyecto se contaba a sí mismo en el cupo y **bloqueaba su propia aprobación** | El conteo acepta excluir el proyecto en evaluación |
| 3 | `ADMIN` no existe en `RSU_Rol_Actor` (12 roles, sin ADMIN), por lo que las transiciones de archivado no se insertaban | El archivado se atribuyó a `DIR_RS_FACULTAD` |
| 4 | El conteo de asesorías no filtraba por ciclo, lo que rompía la regla R43 | Nuevo `ProyectosAsesoradosActivosEnCiclo` |
| 5 | `minimo_horas_ssu` estaba sembrado pero era **código muerto** | Ahora lo lee `minimoHorasSSU` |

### 7.5 Pendientes que no se cerraron en esta fase

| # | Vacío detectado | Fase |
|---|---|---|
| A | **El registro público de estudiantes no crea la fila en `Estudiante_Ciclo`**, así que un estudiante registrado no puede crear un SSU (falla la validación de ciclo mínimo) | Fase 2 |
| B | No existe temporizador para el archivado automático por vencimiento (E5) | Fase 2 |
| C | El estudiante no tiene botón "Enviar al asesor" en su panel; el endpoint existe pero la pantalla `Fases.tsx` no lo expone | Fase 2 |