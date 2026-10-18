package storage

import (
	"bytes"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path/filepath"
	"strings"
)

// ── Validación robusta de archivos subidos ─────────────────────
//
// Un único lugar para todas las subidas del sistema (documentos, entregables,
// fotos de evidencia, modificaciones de informe, formatos). Además de tamaño
// y extensión, verifica los MAGIC BYTES: así un .exe renombrado a .pdf o un
// JPG renombrado a .png se rechazan antes de tocar el disco.

// Kind de archivo aceptado por cada endpoint.
type Kind string

const (
	KindPDF    Kind = "pdf"    // %PDF — 32MB (R13)
	KindImagen Kind = "imagen" // JPEG/PNG — 5MB (R13, HU-012)
	KindOffice Kind = "office" // docx/xlsx (ZIP) — 32MB
	KindMixto  Kind = "mixto"  // pdf/docx/xlsx — 32MB (documentos del proyecto)
)

var tamanos = map[Kind]int64{
	KindPDF:    32 << 20, // 32MB
	KindImagen: 5 << 20,  // 5MB
	KindOffice: 32 << 20,
	KindMixto:  32 << 20,
}

var exts = map[Kind][]string{
	KindPDF:    {".pdf"},
	KindImagen: {".jpg", ".jpeg", ".png"},
	KindOffice: {".docx", ".xlsx"},
	KindMixto:  {".pdf", ".docx", ".xlsx"},
}

// magias asocia cada extensión con su firma binaria. Un archivo renombrado
// (p.ej. un .exe llamado informe.pdf) no coincide y se rechaza.
var magias = map[string][]byte{
	".pdf":  []byte("%PDF-"),
	".jpg":  []byte{0xFF, 0xD8, 0xFF},
	".jpeg": []byte{0xFF, 0xD8, 0xFF},
	".png":  []byte{0x89, 'P', 'N', 'G'},
	// docx/xlsx son ZIP: firma PK\x03\x04 (también PK\x05\x06 vacío / PK\x07\x08 span)
	".docx": []byte{'P', 'K', 0x03, 0x04},
	".xlsx": []byte{'P', 'K', 0x03, 0x04},
}

// ErrorValidacion comunica al usuario exactamente qué corrigió.
type ErrorValidacion struct{ Msg string }

func (e *ErrorValidacion) Error() string { return e.Msg }

func errValidacion(format string, args ...any) error {
	return &ErrorValidacion{Msg: fmt.Sprintf(format, args...)}
}

// extensionPermida reporta si la extensión está en la lista del kind.
func extensionPermida(ext string, kind Kind) bool {
	for _, e := range exts[kind] {
		if e == ext {
			return true
		}
	}
	return false
}

// ValidarArchivo aplica todas las reglas del kind. Devuelve *ErrorValidacion
// con mensaje en español listo para el usuario; otros errores son de I/O.
func ValidarArchivo(file *multipart.FileHeader, kind Kind) error {
	if file == nil {
		return errValidacion("archivo requerido")
	}
	if file.Size == 0 {
		return errValidacion("el archivo está vacío (0 bytes). Adjunta un archivo con contenido")
	}
	max := tamanos[kind]
	if max > 0 && file.Size > max {
		return errValidacion("el archivo pesa %s y el límite para %s es %s",
			pesoLegible(file.Size), etiquetaKind(kind), pesoLegible(max))
	}
	ext := strings.ToLower(filepath.Ext(file.Filename))
	if ext == "" {
		return errValidacion("el archivo no tiene extensión. Usa: %s", strings.Join(exts[kind], ", "))
	}
	if !extensionPermida(ext, kind) {
		return errValidacion("extensión «%s» no permitida. Solo se aceptan: %s", ext, strings.Join(exts[kind], ", "))
	}
	magia := magias[ext]
	if magia == nil {
		return errValidacion("extensión «%s» sin validación de contenido disponible", ext)
	}
	ok, err := coincideMagia(file, magia)
	if err != nil {
		return err
	}
	if !ok {
		return errValidacion("el contenido no coincide con la extensión .%s: el archivo pudo haber sido renombrado. Súbelo con su formato original", ext[1:])
	}
	return nil
}

// coincideMagia lee los primeros bytes del archivo y compara con la firma.
func coincideMagia(file *multipart.FileHeader, magia []byte) (bool, error) {
	src, err := file.Open()
	if err != nil {
		return false, err
	}
	defer src.Close()
	buf := make([]byte, len(magia))
	if _, err := io.ReadFull(src, buf); err != nil && err != io.ErrUnexpectedEOF && err != io.EOF {
		return false, err
	}
	return bytes.Equal(buf, magia), nil
}

// pesoLegible formatea bytes a KB/MB para los mensajes.
func pesoLegible(b int64) string {
	const mb = 1 << 20
	if b >= mb {
		return fmt.Sprintf("%.0f MB", float64(b)/float64(mb))
	}
	return fmt.Sprintf("%.0f KB", float64(b)/float64(1024))
}

func etiquetaKind(k Kind) string {
	switch k {
	case KindPDF:
		return "documentos PDF"
	case KindImagen:
		return "fotos de evidencia"
	case KindOffice:
		return "formatos Office"
	case KindMixto:
		return "documentos del proyecto"
	}
	return "archivos"
}

// GuardarSeguro combina validación + guardado. Con el driver B2 activo NO se
// guarda en local: si la nube falla se devuelve el error real para que el
// usuario sepa que el almacenamiento no está disponible (y ningún archivo
// queda "a medias" en dos lugares).
func GuardarSeguro(file *multipart.FileHeader, kind Kind, subdir string) (*Saved, error) {
	if err := ValidarArchivo(file, kind); err != nil {
		return nil, err
	}
	st := New()
	saved, err := st.Save(file, subdir)
	if err != nil {
		// Limpieza del parcial si quedó algo escrito (solo local).
		if saved != nil && saved.Filename != "" && !EsCloud() {
			ruta := filepath.Join(UploadDir(), saved.Filename)
			if subdir != "" {
				ruta = filepath.Join(UploadDir(), subdir, saved.Filename)
			}
			_ = os.Remove(ruta)
		}
		return nil, err
	}
	return saved, nil
}
