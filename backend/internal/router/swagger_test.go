package router

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
)

// TestSwaggerUI verifica que la UI y el JSON de Swagger se sirven sin BD.
func TestSwaggerUI(t *testing.T) {
	r := Setup(nil)

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("GET", "/swagger/doc.json", nil)
	req.RequestURI = "/swagger/doc.json"
	r.ServeHTTP(w, req)
	if w.Code != 200 {
		t.Fatalf("doc.json status = %d", w.Code)
	}
	if !strings.Contains(w.Body.String(), `"title":"UNDC RSU API"`) && !strings.Contains(w.Body.String(), `"title": "UNDC RSU API"`) {
		t.Fatalf("doc.json sin titulo esperado")
	}
	if !strings.Contains(w.Body.String(), "/api/v1/proyectos") {
		t.Fatalf("doc.json sin paths de proyectos")
	}

	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/swagger/index.html", nil)
	req2.RequestURI = "/swagger/index.html"
	r.ServeHTTP(w2, req2)
	if w2.Code != 200 {
		t.Fatalf("index.html status = %d", w2.Code)
	}
	if !strings.Contains(w2.Body.String(), "swagger") {
		t.Fatalf("index.html no parece Swagger UI")
	}
}
