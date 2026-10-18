package service

import (
	"fmt"
	"strings"
)

// ─────────────────────────────────────────────────────────────────
// Fase 1 · Creación — cupo del asesor y control de estados
// Base: rules (3) §3.1 punto 2 y §5 CAMINO 3 · info/objetivo.txt R06
// ─────────────────────────────────────────────────────────────────

// estadosFase1 son los estados que pertenecen a la Fase 1 (Creación).
// El proyecto nace en BORRADOR (decisión E1 del usuario) y recorre el
// bucle del docente asesor antes de pasar a la Fase 2.
var estadosFase1 = map[string]bool{
	"BORRADOR":              true,
	"ENVIADO_ASESOR":        true,
	"OBSERVADO_ASESOR":      true,
	"ACEPTADO_ASESOR":       true,
	"ARCHIVADO_VENCIMIENTO": true,
}

// EstadoFase1Valido indica si un código de estado pertenece a la Fase 1.
func EstadoFase1Valido(codigo string) bool { return estadosFase1[codigo] }

// validarCupoAsesor aplica el tope de assessorías del docente (CA-4.2).
//
// El tope NO se lee aquí desde la BD: llega ya resuelto por el
// service, que lo toma de RSU_Configuracion.maximo_proyectos_ssu_docente.
// La función es pura para poder probar el límite sin base de datos.
func validarCupoAsesor(asesorados, maximo int) error {
	if asesorados >= maximo {
		return fmt.Errorf("el docente ya asesora %d proyecto(s) y el máximo permitido es %d en el ciclo: "+
			"elige otro asesor o espera al ciclo siguiente", asesorados, maximo)
	}
	return nil
}

// validarReactivacionArchivado aplica el estándar de cupo del usuario:
// un proyecto archivado por vencimiento solo se reactiva cuando el docente
// vuelve a tener cupo libre (CA-7.3 / CA-7.4).
func validarReactivacionArchivado(cupoLibre bool) error {
	if !cupoLibre {
		return fmt.Errorf("el proyecto está archivado por vencimiento y no puede reenviarse " +
			"hasta que el docente asesor tenga cupo libre en este ciclo")
	}
	return nil
}

// contarAsesoradosParaCupo cuenta los proyectos que ocupan cupo al asesor.
// Un proyecto archivado por vencimiento NO ocupa cupo: ese es el mecanismo
// por el cual el docente recupera un cupo (CA-7.2).
func contarAsesoradosParaCupo(estados []string) int {
	n := 0
	for _, e := range estados {
		if !ocupaCupoAsesor(e) {
			continue
		}
		n++
	}
	return n
}

// ocuparCupoAsesor indica si un estado del proyecto mantiene ocupado el
// cupo de asesoría del docente.
func ocupaCupoAsesor(estado string) bool {
	switch strings.ToUpper(strings.TrimSpace(estado)) {
	case "ARCHIVADO_VENCIMIENTO", "RECHAZADO":
		// Un proyecto archivado libera el cupo del docente (CA-7.2).
		return false
	case "CERRADO", "REPORTADO_SUNEDU", "EVALUACION_VALIDADA":
		// Proyectos ya concluidos no compiten por el tope del ciclo.
		return false
	default:
		return true
	}
}

// contarAsesoradosEnCiclo cuenta los proyectos del docente que ocupan cupo
// dentro de un ciclo concreto (regla R43 corregida a "por ciclo").
//
// `entradas` sigue el formato "MODALIDAD|CICLO|ESTADO".
func contarAsesoradosEnCiclo(entradas []string, ciclo string) int {
	n := 0
	for _, e := range entradas {
		partes := strings.Split(e, "|")
		if len(partes) != 3 {
			continue
		}
		modalidad, c, estado := partes[0], partes[1], partes[2]
		if !ocupaCupoAsesor(estado) {
			continue
		}
		if !consumeCupoAsesoria(modalidad) {
			continue
		}
		if c != ciclo {
			continue
		}
		n++
	}
	return n
}

// consumeCupoAsesoria indica si una modalidad consume el cupo de asesoría.
// Solo el SSU lo hace: los PEP los propone el propio docente responsable
// o el Comité, así que no compiten con el tope de "asesorados" (R42).
func consumeCupoAsesoria(modalidad string) bool {
	return strings.ToUpper(strings.TrimSpace(modalidad)) == "SSU"
}

// contenidoTecnicoEditable indica si el líder puede modificar el contenido
// técnico del proyecto en el estado dado (CA-6.1).
//
// En OBSERVADO_ASESOR el contenido queda CONGELADO: el único cambio
// permitido es elegir otro docente asesor.
func contenidoTecnicoEditable(estado string) bool {
	switch strings.ToUpper(strings.TrimSpace(estado)) {
	case "BORRADOR":
		return true
	default:
		return false
	}
}

// selectorAsesorHabilitado indica si se puede cambiar el docente asesor.
// Solo tras un rechazo, para permitir el reintento ilimitado de rules (3)
// §5 CAMINO 1 (CA-6.2).
func selectorAsesorHabilitado(estado string) bool {
	return strings.ToUpper(strings.TrimSpace(estado)) == "OBSERVADO_ASESOR"
}
