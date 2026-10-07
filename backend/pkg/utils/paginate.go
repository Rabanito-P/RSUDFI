package utils

import (
	"strconv"

	"github.com/gin-gonic/gin"
)

type Pagination struct {
	Page  int `json:"page"`
	Limit int `json:"limit"`
	Total int64 `json:"total"`
	Pages int `json:"pages"`
}

func GetPagination(c *gin.Context) (page, limit, offset int) {
	page, _ = strconv.Atoi(c.DefaultQuery("page", "1"))
	limit, _ = strconv.Atoi(c.DefaultQuery("limit", "20"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 20
	}
	offset = (page - 1) * limit
	return
}

func BuildMeta(page, limit int, total int64) Pagination {
	pages := int((total + int64(limit) - 1) / int64(limit))
	return Pagination{Page: page, Limit: limit, Total: total, Pages: pages}
}
