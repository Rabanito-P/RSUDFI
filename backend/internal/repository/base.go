package repository

import (
	"gorm.io/gorm"
)

// ── Generic CRUD helpers ─────────────────────────────────────

type BaseRepo[T any] struct {
	db *gorm.DB
}

func NewBaseRepo[T any](db *gorm.DB) *BaseRepo[T] {
	return &BaseRepo[T]{db: db}
}

func (r *BaseRepo[T]) DB() *gorm.DB { return r.db }
