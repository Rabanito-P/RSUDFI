package repository

import (
	"time"

	"gorm.io/gorm"
	"undc-rsu/backend/internal/domain"
)

// ── Usuarios de acceso + permisos por módulo (gestión ADMIN) ──

type UsuarioRepo struct{ db *gorm.DB }

func NewUsuarioRepo(db *gorm.DB) *UsuarioRepo { return &UsuarioRepo{db: db} }

// Create inserta un usuario con su hash ya calculado.
func (r *UsuarioRepo) Create(u *domain.RSUUsuario) error {
	return r.db.Create(u).Error
}

func (r *UsuarioRepo) FindAll() ([]domain.RSUUsuario, error) {
	var list []domain.RSUUsuario
	err := r.db.Order("id_usuario ASC").Find(&list).Error
	return list, err
}

func (r *UsuarioRepo) FindByID(id uint) (*domain.RSUUsuario, error) {
	var u domain.RSUUsuario
	if err := r.db.First(&u, "id_usuario = ?", id).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

func (r *UsuarioRepo) FindByCorreo(correo string) (*domain.RSUUsuario, error) {
	var u domain.RSUUsuario
	if err := r.db.First(&u, "correo = ?", correo).Error; err != nil {
		return nil, err
	}
	return &u, nil
}

// Update guarda los cambios de un usuario (campos no cero incluidos).
func (r *UsuarioRepo) Update(u *domain.RSUUsuario) error {
	return r.db.Save(u).Error
}

func (r *UsuarioRepo) Delete(id uint) error {
	return r.db.Delete(&domain.RSUUsuario{}, "id_usuario = ?", id).Error
}

// MarcarUltimoLogin registra el acceso.
func (r *UsuarioRepo) MarcarUltimoLogin(id uint) {
	now := time.Now()
	r.db.Model(&domain.RSUUsuario{}).Where("id_usuario = ?", id).Update("ultimo_login", now)
}

// ── Permisos por módulo ────────────────────────────────────────

func (r *UsuarioRepo) PermisosDe(id uint) ([]domain.RSUUsuarioPermiso, error) {
	var list []domain.RSUUsuarioPermiso
	err := r.db.Where("id_usuario = ?", id).Order("modulo ASC").Find(&list).Error
	return list, err
}

// SetPermiso crea/actualiza el permiso de un módulo para el usuario.
func (r *UsuarioRepo) SetPermiso(idUsuario uint, modulo string, activo bool) error {
	var p domain.RSUUsuarioPermiso
	err := r.db.Where("id_usuario = ? AND modulo = ?", idUsuario, modulo).First(&p).Error
	if err == gorm.ErrRecordNotFound {
		return r.db.Create(&domain.RSUUsuarioPermiso{IDUsuario: idUsuario, Modulo: modulo, Activo: activo}).Error
	}
	if err != nil {
		return err
	}
	p.Activo = activo
	return r.db.Save(&p).Error
}

// ReemplazarPermisos fija la lista exacta de módulos activos del usuario.
func (r *UsuarioRepo) ReemplazarPermisos(idUsuario uint, modulos []string) error {
	if err := r.db.Where("id_usuario = ?", idUsuario).Delete(&domain.RSUUsuarioPermiso{}).Error; err != nil {
		return err
	}
	for _, m := range modulos {
		if m == "" {
			continue
		}
		if err := r.db.Create(&domain.RSUUsuarioPermiso{IDUsuario: idUsuario, Modulo: m, Activo: true}).Error; err != nil {
			return err
		}
	}
	return nil
}

// EliminarPermisos borra todos los permisos de un usuario.
func (r *UsuarioRepo) EliminarPermisos(idUsuario uint) error {
	return r.db.Where("id_usuario = ?", idUsuario).Delete(&domain.RSUUsuarioPermiso{}).Error
}
