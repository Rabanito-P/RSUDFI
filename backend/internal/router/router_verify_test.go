package router

import (
	"testing"

	"gorm.io/gorm"
)

func TestRouterSetupNoPanic(t *testing.T) {
	defer func() {
		if r := recover(); r != nil {
			t.Fatalf("router.Setup panicked: %v", r)
		}
	}()
	db := &gorm.DB{}
	_ = Setup(db)
}
