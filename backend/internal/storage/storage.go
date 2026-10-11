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

// New devuelve el driver según STORAGE_DRIVER (local por defecto).
func New() Storage {
	return &LocalStorage{Dir: UploadDir()}
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


