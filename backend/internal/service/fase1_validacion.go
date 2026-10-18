package service

import (
	"fmt"
	"strconv"
	"strings"
)

// ─────────────────────────────────────────────────────────────────
// Fase 1 · Creación — validaciones de la propuesta inicial
// Base: rules (3) §3.1 y HU-F1-Creacion.md
//
// Aquí viven las reglas PURAS de la fase: sin base de datos, para que
// se puedan probar de forma aislada y para que el handler y el service
// apliquen exactamente el mismo criterio.
// ─────────────────────────────────────────────────────────────────

const (
	// MinimoCaracteresProblematica — CA-1.3. Una problemática más corta
	// no describe el problema que el proyecto intends atender.
	MinimoCaracteresProblematica = 100

	// ODSMin / ODSMax — CA-1.4. Agenda 2030: 17 objetivos.
	ODSMin = 1
	ODSMax = 17

	// MinimoIntegrantesEquipo / MaximoIntegrantesEquipo — CA-2.1/CA-2.2.
	// rules (3) §2: "Creador e impulsor del proyecto (2 a 5 alumnos)".
	MinimoIntegrantesEquipo = 2
	MaximoIntegrantesEquipo = 5

	// DominioCorreoInstitucional — CA-2.3.
	DominioCorreoInstitucional = "@undc.edu.pe"

	// MinimoHorasSSU — CA-2.4. Valor por defecto de
	// RSU_Configuracion.minimo_horas_ssu (rules (3) §3.1: "cronograma
	// 60h mín."). La clave de configuración, hasta ahora muerta, se lee
	// en minimoHorasSSU y esta constante queda como valor por defecto.
	MinimoHorasSSU = 60

	// UmbralAdvertenciaHoras — CA-2.6. Por debajo del mínimo pero dentro
	// de este rango, el envío se permite y el proyecto queda en condición
	// de prórroga/extemporáneo (rules (3) §5 y rules V0.4 §3.4).
	UmbralAdvertenciaHoras = 45
)

// validarProblematica exige la problemática del proyecto (CA-1.3).
// rules (3) §3.1: el estudiante registra "problemática" entre los datos
// obligatorios de la formulación inicial.
func validarProblematica(v string) error {
	t := strings.TrimSpace(v)
	if t == "" {
		return fmt.Errorf("la problemática es obligatoria: describe el problema que atenderá el proyecto")
	}
	if len([]rune(t)) < MinimoCaracteresProblematica {
		return fmt.Errorf("la problemática debe tener al menos %d caracteres (tiene %d)",
			MinimoCaracteresProblematica, len([]rune(t)))
	}
	return nil
}

// validarODS exige un objetivo de desarrollo sostenible del 1 al 17 (CA-1.4).
func validarODS(v string) error {
	t := strings.TrimSpace(v)
	if t == "" {
		return fmt.Errorf("debes indicar el ODS que se contribuye a desarrollar")
	}
	n, err := strconv.Atoi(t)
	if err != nil {
		return fmt.Errorf("el ODS debe ser un número entre %d y %d", ODSMin, ODSMax)
	}
	if n < ODSMin || n > ODSMax {
		return fmt.Errorf("el ODS debe estar entre %d y %d (indicaste %d)", ODSMin, ODSMax, n)
	}
	return nil
}

// validarHorasCronograma bloquea el envío si la planificación no alcanza
// las horas mínimas del tipo de proyecto (CA-2.4).
//
// Base: rules (3) §3.1 "cronograma (60h mín.)" y R04 de
// info/objetivo.txt. El valor llega por parámetro para que siga
// configurable desde RSU_Configuracion.minimo_horas_ssu.
func validarHorasCronograma(horas float64, minimo float64) error {
	if horas < minimo {
		faltan := minimo - horas
		return fmt.Errorf("el cronograma suma %.2f horas y el mínimo exigido es %.0f: faltan %.2f horas",
			horas, minimo, faltan)
	}
	return nil
}

// revisarHorasCronograma es la versión no bloqueante (CA-2.6): entre el
// umbral de advertencia y el mínimo, el sistema sugiere revisar sin
// impedir el envío. Cubre el caso "En Prórroga / Extemporáneo" de rules (3).
func revisarHorasCronograma(horas, minimo float64) (advertencia string, advierte bool) {
	if horas < minimo && horas >= UmbralAdvertenciaHoras {
		return fmt.Sprintf("el cronograma suma %.2f horas y el mínimo es %.0f: "+
			"puedes enviarlo, pero quedará como proyecto en prórroga/extemporáneo "+
			"y requerirá autorización de la Facultad", horas, minimo), true
	}
	return "", false
}

// validarTamanioEquipo exige entre 2 y 5 integrantes (CA-2.1, CA-2.2).
func validarTamanioEquipo(tamano int) error {
	if tamano < MinimoIntegrantesEquipo {
		return fmt.Errorf("el equipo debe tener al menos %d estudiantes (líder + 1); tienes %d",
			MinimoIntegrantesEquipo, tamano)
	}
	if tamano > MaximoIntegrantesEquipo {
		return fmt.Errorf("el equipo no puede superar los %d estudiantes; tienes %d",
			MaximoIntegrantesEquipo, tamano)
	}
	return nil
}

// correoInstitucionalValido exige el dominio @undc.edu.pe (CA-2.3).
func correoInstitucionalValido(correo string) error {
	c := strings.ToLower(strings.TrimSpace(correo))
	if c == "" {
		return fmt.Errorf("el correo institucional es obligatorio")
	}
	if !strings.HasSuffix(c, DominioCorreoInstitucional) {
		return fmt.Errorf("el correo debe ser institucional y terminar en %s", DominioCorreoInstitucional)
	}
	return nil
}
