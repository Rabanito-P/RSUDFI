package storage

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
	"time"
)

type Saved struct {
	URL      string
	Hash     string
	Size     int
	Filename string
}

type Storage interface {
	Driver() string
	Save(file *multipart.FileHeader, subdir string) (*Saved, error)
}

func Driver() string {
	d := strings.ToLower(os.Getenv("STORAGE_DRIVER"))
	if d == "" {
		return "local"
	}
	return d
}

func UploadDir() string {
	if v := os.Getenv("UPLOAD_DIR"); v != "" {
		return v
	}
	return "./uploads"
}

// New devuelve el driver según STORAGE_DRIVER:
//
//	local (default) → disco en UPLOAD_DIR, URLs públicas /uploads/...
//	b2               → Backblaze B2 API nativa (bucket PRIVADO). Las URLs
//	                   guardadas son keys lógicos servidos por
//	                   GET /api/v1/archivos?key=... (con token de cuenta).
func New() Storage {
	switch strings.ToLower(Driver()) {
	case "b2", "s3", "backblaze":
		return &B2Bucket{}
	default:
		return &LocalStorage{Dir: UploadDir()}
	}
}

// EsCloud reporta si el driver activo guarda en la nube (Backblaze B2). Los
// handlers que antes servían /uploads estático deben resolver la descarga por
// key cuando esto es true.
func EsCloud() bool {
	switch strings.ToLower(Driver()) {
	case "b2", "s3", "backblaze":
		return true
	}
	return false
}

// PrefijoProyecto devuelve la carpeta raíz de un proyecto en el bucket B2
// (proyectos/<id>/). B2 no tiene carpetas reales: el "/" en el nombre del
// objeto se muestra como carpeta en la consola, igual que en un disco.
// Estructura del bucket:
//
//	proyectos/<id_proyecto>/documentos/<archivo>   informes, entregables
//	proyectos/<id_proyecto>/evidencias/<archivo>   fotos de campo
//	proyectos/<id_proyecto>/firmas/<archivo>       firmas de asistencia
//	formatos/<archivo>                             formatos RSU (admin)
//	plantillas/<archivo>                           guías oficiales
func PrefijoProyecto(idProyecto uint) string {
	return fmt.Sprintf("proyectos/%d", idProyecto)
}

// AbrirArchivo resuelve un key/URL guardado en BD a un stream + content-type
// para servir la descarga. Prioridad:
//  1. Si la URL es /uploads/... y el archivo existe en disco → local (así
//     los archivos que quedaron por fallback siguen descargando aunque el
//     driver activo sea b2).
//  2. Si no, se baja del bucket B2 con el token de la cuenta.
func AbrirArchivo(url string) (io.ReadCloser, string, error) {
	if url == "" {
		return nil, "", fmt.Errorf("sin archivo asociado")
	}
	// Fallback local: URL antigua o subida guardada por respaldo.
	if strings.HasPrefix(url, "/uploads/") {
		ruta := filepath.Join(UploadDir(), strings.TrimPrefix(url, "/uploads/"))
		if _, err := os.Stat(ruta); err == nil {
			f, err := os.Open(ruta)
			if err != nil {
				return nil, "", err
			}
			return f, "", nil
		}
	}
	if EsCloud() {
		key := strings.TrimPrefix(url, "/")
		if strings.HasPrefix(key, "uploads/") {
			key = strings.TrimPrefix(key, "uploads/")
		}
		return (&B2Bucket{}).Descargar(key)
	}
	ruta := filepath.Join(UploadDir(), strings.TrimPrefix(url, "/uploads/"))
	f, err := os.Open(ruta)
	if err != nil {
		return nil, "", err
	}
	return f, "", nil
}

// ExisteLocal reporta si una URL /uploads/... está en el disco local.
func ExisteLocal(url string) bool {
	if !strings.HasPrefix(url, "/uploads/") {
		return false
	}
	_, err := os.Stat(filepath.Join(UploadDir(), strings.TrimPrefix(url, "/uploads/")))
	return err == nil
}

// GuardarBytes guarda un documento generado por el sistema (por ejemplo el
// Oficio de Elevación del Decano) usando el driver activo. Recibe bytes, no un
// multipart: los documentos que crea el sistema no pasan por el formulario.
// Sigue la misma estructura de rutas y el mismo saneamiento que Save, y
// devuelve el error real si el driver de nube no está disponible.
func GuardarBytes(datos []byte, nombre, subdir string) (*Saved, error) {
	if len(datos) == 0 {
		return nil, fmt.Errorf("el documento está vacío")
	}
	if !strings.HasPrefix(string(datos[:4]), "%PDF") {
		return nil, fmt.Errorf("el contenido no es un PDF válido")
	}
	safe := fmt.Sprintf("%d_%s", time.Now().UnixNano(), SaveName(nombre))
	if EsCloud() {
		return (&B2Bucket{}).subirBytes(datos, safe, subdir)
	}
	dir := UploadDir()
	if subdir != "" {
		dir = filepath.Join(UploadDir(), SaveName(subdir))
	}
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	ruta := filepath.Join(dir, safe)
	if err := os.WriteFile(ruta, datos, 0o644); err != nil {
		return nil, err
	}
	h := sha256.Sum256(datos)
	url := "/uploads/" + safe
	if subdir != "" {
		url = "/uploads/" + SaveName(subdir) + "/" + safe
	}
	return &Saved{URL: url, Hash: hex.EncodeToString(h[:]), Size: len(datos), Filename: safe}, nil
}

// ── Local (activo) ────────────────────────────────────────────

type LocalStorage struct{ Dir string }

func (l *LocalStorage) Driver() string { return "local" }

// SaveName reduce el nombre recibido a caracteres seguros para el disco y
// la URL. filepath.Base ya evita el path traversal; esto además quita espacios,
// acentos y símbolos que rompen algunos sistemas de archivos y clientes.
// Es pública porque los handlers que guardan sus propios archivos (por ejemplo
// los formatos RSU) necesitan el mismo saneamiento.
func SaveName(nombre string) string {
	b := filepath.Base(strings.ReplaceAll(nombre, "\\", "/"))
	// Se conserva solo lo permitido; el resto se vuelve guion bajo.
	var sb strings.Builder
	for _, r := range b {
		switch {
		case r >= 'a' && r <= 'z', r >= 'A' && r <= 'Z', r >= '0' && r <= '9':
			sb.WriteRune(r)
		case r == '.', r == '-', r == '_':
			sb.WriteRune(r)
		default:
			sb.WriteRune('_')
		}
	}
	out := strings.Trim(sb.String(), "._")
	if out == "" {
		out = "archivo"
	}
	// Se acorta para no superar el límite de 255 bytes del sistema de archivos.
	if len(out) > 120 {
		if i := strings.LastIndex(out, "."); i > 0 && len(out)-i <= 6 {
			ext := out[i:]
			out = out[:120-len(ext)] + ext
		} else {
			out = out[:120]
		}
	}
	return out
}

func (l *LocalStorage) Save(file *multipart.FileHeader, subdir string) (*Saved, error) {
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()
	safe := fmt.Sprintf("%d_%s", time.Now().UnixNano(), SaveName(file.Filename))
	// La subcarpeta es controlada por el código, pero se sanea igual.
	dir := l.Dir
	if subdir != "" {
		dir = filepath.Join(l.Dir, SaveName(subdir))
	}
	_ = os.MkdirAll(dir, 0o755)
	dstPath := filepath.Join(dir, safe)
	dst, err := os.Create(dstPath)
	if err != nil {
		return nil, err
	}
	defer dst.Close()
	h := sha256.New()
	n, err := io.Copy(dst, io.TeeReader(src, h))
	if err != nil {
		return nil, err
	}
	hash := hex.EncodeToString(h.Sum(nil))
	// URL pública estable: /uploads/<subdir>/<file>
	url := "/uploads/" + safe
	if subdir != "" {
		url = "/uploads/" + subdir + "/" + safe
	}
	return &Saved{URL: url, Hash: hash, Size: int(n), Filename: safe}, nil
}
