package repository

import (
	"undc-rsu/backend/internal/domain"
	"gorm.io/gorm"
)

type NotificacionRepo struct{ db *gorm.DB }
func NewNotificacionRepo(db *gorm.DB) *NotificacionRepo { return &NotificacionRepo{db} }

func (r *NotificacionRepo) Create(n *domain.RSUNotificacion) error {
	return r.db.Create(n).Error
}
func (r *NotificacionRepo) List(rolDestino *string, idUsuario *uint, onlyUnread bool, limit int) ([]domain.RSUNotificacion, int64, error) {
	var items []domain.RSUNotificacion
	var total int64
	q := r.db.Model(&domain.RSUNotificacion{})
	if rolDestino != nil && *rolDestino != "" {
		q = q.Where("rol_destino = ?", *rolDestino)
	}
	if idUsuario != nil {
		q = q.Where("id_usuario = ? OR id_usuario IS NULL", *idUsuario)
	}
	if onlyUnread {
		q = q.Where("leido = false")
	}
	q.Session(&gorm.Session{}).Count(&total)
	err := q.Order("created_at DESC").Limit(limit).Preload("Proyecto").Find(&items).Error
	return items, total, err
}
func (r *NotificacionRepo) CountUnread(rolDestino string) (int64, error) {
	var c int64
	err := r.db.Model(&domain.RSUNotificacion{}).Where("rol_destino = ? AND leido = false", rolDestino).Count(&c).Error
	return c, err
}
func (r *NotificacionRepo) CountUnreadByRoles(roles []string) (map[string]int64, error) {
	type row struct{ RolDestino string; Total int64 }
	var rows []row
	err := r.db.Model(&domain.RSUNotificacion{}).Select("rol_destino, COUNT(*) as total").Where("rol_destino IN ? AND leido = false", roles).Group("rol_destino").Scan(&rows).Error
	m := map[string]int64{}
	for _, v := range rows { m[v.RolDestino] = v.Total }
	return m, err
}
func (r *NotificacionRepo) MarkRead(id uint) error {
	return r.db.Model(&domain.RSUNotificacion{}).Where("id_notificacion = ?", id).Update("leido", true).Error
}
func (r *NotificacionRepo) MarkAllRead(rolDestino string) error {
	return r.db.Model(&domain.RSUNotificacion{}).Where("rol_destino = ? AND leido = false", rolDestino).Update("leido", true).Error
}
