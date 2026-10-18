package repository

import (
	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Auditoría (M09) ─────────────────────────────────────

type AuditoriaRepo struct{ db *gorm.DB }

func NewAuditoriaRepo(db *gorm.DB) *AuditoriaRepo { return &AuditoriaRepo{db} }

func (r *AuditoriaRepo) FindAll(page, limit int, idProyecto *uint, accion *string) ([]domain.RSUAuditoriaLog, int64, error) {
	var list []domain.RSUAuditoriaLog
	var total int64
	q := r.db.Model(&domain.RSUAuditoriaLog{})
	if idProyecto != nil {
		q = q.Where("id_proyecto = ?", *idProyecto)
	}
	if accion != nil {
		q = q.Where("accion = ?", *accion)
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Order("fecha_hora DESC").Offset((page - 1) * limit).Limit(limit).Find(&list).Error
	return list, total, err
}

// ── Notificaciones (M08) ────────────────────────────────
// Implementación canónica en notificacion.go (List, CountUnreadByRoles).
// (Se eliminó el bloque duplicado NotificacionRepo/FindByRol que impedía compilar.)
