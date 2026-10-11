package handler

import (
	"bytes"
	"encoding/json"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
	"undc-rsu/backend/pkg/utils"
)

// ── Planificación de actividades desde Excel (HU-010) ──
//
// El estudiante llena la plantilla 02-planificacion-de-actividades.xlsx. Este
// handler la sube, la interpreta con el módulo Python documentos/lector_excel.py
// y crea las actividades programadas en RSU_Actividad_Campo.

type PlanificacionHandler struct{ db *gorm.DB }

func NewPlanificacionHandler(db *gorm.DB) *PlanificacionHandler {
	return &PlanificacionHandler{db: db}
}

type actividadPlan struct {
	Orden       int     `json:"orden"`
	Semana      string  `json:"semana"`
	Fecha       string  `json:"fecha"`
	HoraInicio  *string `json:"hora_inicio"`
	HoraFin     *string `json:"hora_fin"`
	Minutos     int     `json:"minutos"`
	Nombre      string  `json:"nombre"`
	Descripcion *string `json:"descripcion"`
}

type resultadoPlan struct {
	OK                bool            `json:"ok"`
	Error             string          `json:"error"`
	Total             int             `json:"total"`
	Actividades       []actividadPlan `json:"actividades"`
	OmitidasSinFecha  []int           `json:"omitidas_sin_fecha"`
}

// rutaPython localiza el módulo lector dentro del contenedor o en desarrollo.
func rutaPython() string {
	candidatos := []string{
		os.Getenv("RSU_LECTOR_EXCEL"),
		"/app/documentos/lector_excel.py",
		"../documentos/lector_excel.py",
		"../../documentos/lector_excel.py",
	}
	for _, c := range candidatos {
		if c == "" {
			continue
		}
		if _, err := os.Stat(c); err == nil {
			return c
		}
	}
	return "/app/documentos/lector_excel.py"
}

func interprete() string {
	if p := os.Getenv("PYTHON_BIN"); p != "" {
		return p
	}
	for _, p := range []string{"python3", "python"} {
		if _, err := exec.LookPath(p); err == nil {
			return p
		}
	}
	return "python"
}

// Previsualizar lee el Excel y devuelve las actividades sin guardarlas.
// @Tags		Actividades
// @Accept		multipart/form-data
// @Produce	json
// @Param		id_proyecto formData int true "ID del proyecto"
// @Param		archivo formData file true "Excel de planificación (.xlsx)"
// @Success	200 {object} map[string]any "Actividades interpretadas"
// @Router		/api/v1/actividades/planificacion/preview [post]
func (h *PlanificacionHandler) Previsualizar(c *gin.Context) {
	res, archivo, codigoErr := h.interpretar(c)
	if archivo != nil {
		defer os.Remove(archivo.Name())
	}
	if codigoErr != nil {
		utils.Fail(c, codigoErr.codigo, codigoErr.msg, nil)
		return
	}
	utils.Success(c, gin.H{
		"total":       res.Total,
		"actividades": res.Actividades,
		"omitidas":    res.OmitidasSinFecha,
	}, "Planificación interpretada")
}

// Guardar lee el Excel y crea las actividades del proyecto.
// Evita duplicar: si una actividad con el mismo nombre y fecha ya existe en el
// proyecto, se omite en lugar de crear otra igual.
// @Tags		Actividades
// @Accept		multipart/form-data
// @Produce	json
// @Router		/api/v1/actividades/planificacion [post]
func (h *PlanificacionHandler) Guardar(c *gin.Context) {
	res, archivo, codigoErr := h.interpretar(c)
	if archivo != nil {
		defer os.Remove(archivo.Name())
	}
	if codigoErr != nil {
		utils.Fail(c, codigoErr.codigo, codigoErr.msg, nil)
		return
	}
	idProj, _ := strconv.Atoi(c.PostForm("id_proyecto"))
	if idProj == 0 {
		utils.Fail(c, http.StatusBadRequest, "id_proyecto requerido", nil)
		return
	}

	// Actividades existentes para no duplicar (nombre + fecha).
	var previas []domain.RSUActividadCampo
	h.db.Where("id_proyecto = ?", idProj).Find(&previas)
	existe := map[string]bool{}
	for _, p := range previas {
		clave := strings.ToLower(strings.TrimSpace(p.Nombre))
		if p.FechaProgramada != nil {
			clave += "|" + p.FechaProgramada.Format("2006-01-02")
		}
		existe[clave] = true
	}

	creadas := 0
	duplicadas := 0
	for _, a := range res.Actividades {
		fecha, err := time.Parse("2006-01-02", a.Fecha)
		if err != nil {
			continue
		}
		clave := strings.ToLower(strings.TrimSpace(a.Nombre)) + "|" + a.Fecha
		if existe[clave] {
			duplicadas++
			continue
		}
		act := &domain.RSUActividadCampo{
			IDProyecto:      uint(idProj),
			Nombre:          a.Nombre,
			FechaProgramada: &fecha,
			HoraInicio:      a.HoraInicio,
			HoraFin:         a.HoraFin,
			Minutos:         a.Minutos,
			Estado:          "PROGRAMADA",
		}
		if a.Descripcion != nil && *a.Descripcion != "" {
			d := *a.Descripcion
			act.Descripcion = &d
		}
		if err := h.db.Create(act).Error; err == nil {
			creadas++
			existe[clave] = true
		}
	}

	utils.Success(c, gin.H{
		"creadas":     creadas,
		"duplicadas":  duplicadas,
		"total_leido": res.Total,
	}, "Actividades registradas desde la planificación")
}

// errPlan comunica el fallo de interpretación con su código HTTP.
type errPlan struct {
	codigo int
	msg    string
}

func (h *PlanificacionHandler) interpretar(c *gin.Context) (*resultadoPlan, *os.File, *errPlan) {
	idProjStr := c.PostForm("id_proyecto")
	if idProjStr == "" {
		return nil, nil, &errPlan{http.StatusBadRequest, "id_proyecto requerido"}
	}
	if _, err := strconv.Atoi(idProjStr); err != nil {
		return nil, nil, &errPlan{http.StatusBadRequest, "id_proyecto inválido"}
	}

	file, err := c.FormFile("archivo")
	if err != nil {
		return nil, nil, &errPlan{http.StatusBadRequest, "archivo (Excel .xlsx) requerido"}
	}
	nombre := strings.ToLower(file.Filename)
	if !strings.HasSuffix(nombre, ".xlsx") {
		return nil, nil, &errPlan{http.StatusBadRequest, "el archivo debe ser .xlsx"}
	}
	if file.Size > 10<<20 {
		return nil, nil, &errPlan{http.StatusBadRequest, "el archivo excede 10MB"}
	}

	src, err := file.Open()
	if err != nil {
		return nil, nil, &errPlan{http.StatusBadRequest, "no se pudo leer el archivo"}
	}
	defer src.Close()

	tmp, err := os.CreateTemp("", "plan-*.xlsx")
	if err != nil {
		return nil, nil, &errPlan{http.StatusInternalServerError, "no se pudo preparar el archivo temporal"}
	}
	if _, err := tmp.ReadFrom(src); err != nil {
		tmp.Close()
		os.Remove(tmp.Name())
		return nil, nil, &errPlan{http.StatusInternalServerError, "no se pudo copiar el archivo"}
	}
	tmp.Close()

	ruta := rutaPython()
	if _, err := os.Stat(ruta); err != nil {
		os.Remove(tmp.Name())
		return nil, nil, &errPlan{http.StatusNotImplemented,
			"el lector de Excel no está disponible en este entorno (falta documentos/lector_excel.py)"}
	}

	var salida bytes.Buffer
	var errBuf bytes.Buffer
	cmd := exec.Command(interprete(), ruta, tmp.Name())
	cmd.Stdout = &salida
	cmd.Stderr = &errBuf
	if err := cmd.Run(); err != nil {
		os.Remove(tmp.Name())
		msg := "no se pudo interpretar el Excel"
		if strings.TrimSpace(errBuf.String()) != "" {
			msg += ": " + errBuf.String()
		}
		return nil, nil, &errPlan{http.StatusUnprocessableEntity, msg}
	}

	var res resultadoPlan
	if err := json.Unmarshal(salida.Bytes(), &res); err != nil {
		os.Remove(tmp.Name())
		return nil, nil, &errPlan{http.StatusUnprocessableEntity, "el lector devolvió un formato inesperado"}
	}
	if !res.OK {
		os.Remove(tmp.Name())
		msg := res.Error
		if msg == "" {
			msg = "el Excel no tiene actividades válidas"
		}
		return nil, nil, &errPlan{http.StatusUnprocessableEntity, msg}
	}

	return &res, tmp, nil
}

// Plantilla devuelve el Excel base para que el estudiante lo descargue.
// @Tags		Actividades
// @Produce	application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
// @Router		/api/v1/actividades/plantilla-planificacion [get]
func (h *PlanificacionHandler) Plantilla(c *gin.Context) {
	servir(c, "02-planificacion-de-actividades.xlsx")
}

// PlantillaDeDescarga sirve cualquiera de los formatos de documentos/plantillas.
// Solo se permiten los nombres declarados explícitamente: así un usuario no puede
// pedir rutas arbitrarias del disco (path traversal).
// @Tags		Actividades
// @Produce	application/octet-stream
// @Param		archivo path string true "Nombre del archivo de plantilla"
// @Router		/api/v1/plantillas/{archivo} [get]
func (h *PlanificacionHandler) PlantillaDeDescarga(c *gin.Context) {
	nombre := c.Param("archivo")
	permitidos := map[string]bool{
		"01-propuesta-de-proyecto.docx":        true,
		"02-planificacion-de-actividades.xlsx": true,
		"03-primer-entregable.docx":            true,
		"04-segundo-entregable.docx":           true,
		"05-tercer-entregable.docx":            true,
		"06-encuesta-satisfaccion.docx":        true,
		"07-informe-final.docx":                true,
	}
	if !permitidos[nombre] {
		utils.Fail(c, http.StatusNotFound, "plantilla no disponible", nil)
		return
	}
	servir(c, nombre)
}

// servir busca la plantilla en las rutas conocidas y la envía como adjunto.
func servir(c *gin.Context, nombre string) {
	rutas := []string{
		os.Getenv("RSU_PLANTILLAS_DIR"),
		"/app/documentos/plantillas/",
		"../documentos/plantillas/",
		"../../documentos/plantillas/",
	}
	var encontrada string
	for _, dir := range rutas {
		if dir == "" {
			continue
		}
		r := filepath.Join(dir, nombre)
		if _, err := os.Stat(r); err == nil {
			encontrada = r
			break
		}
	}
	if encontrada == "" {
		utils.Fail(c, http.StatusNotFound, "plantilla no disponible en este entorno", nil)
		return
	}
	c.FileAttachment(encontrada, nombre)
}
