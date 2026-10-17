package storage

import (
	"bytes"
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path"
	"strings"
	"sync"
	"time"

	backblaze "gopkg.in/kothar/go-backblaze.v0"
)

// ── Backblaze B2 — API NATIVA (b2_authorize_account) ─────────────
// Las credenciales emitidas por la consola de Backblaze (applicationKeyId +
// applicationKey) son de la API NATIVA, no de la API S3-compatible: con S3
// responden "InvalidAccessKeyId". La librería kothar/go-backblaze envuelve
// b2_authorize_account, b2_get_upload_url, b2_upload_file y
// b2_download_file_by_name. El bucket es PRIVADO: nunca se exponen URLs
// públicas; las descargas se sirven por el backend con el token de la cuenta.

var (
	b2Mu      sync.Mutex
	b2Bucket  *backblaze.Bucket
	b2Activas b2Cred  // credenciales activas (env, BD o las que guardó el admin)
	b2Err     error   // último error de conexión (memorizado hasta reintentar)
	b2Lector  func(clave, defecto string) string
)

// envOMail2 lee una variable de entorno con fallback (local al paquete storage).
func envOMail2(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}

// b2Cred agrupa las credenciales de la API nativa de B2.
type b2Cred struct {
	accountID string
	appKey    string
	bucketID  string
}

func (c b2Cred) completa() bool { return c.accountID != "" && c.appKey != "" && c.bucketID != "" }

// datosB2 lee la configuración desde variables de entorno.
func datosB2() (accountID, appKey, bucketID string) {
	return envOMail2("B2_ACCOUNT_ID", ""),
		envOMail2("B2_APPLICATION_KEY", ""),
		envOMail2("B2_BUCKET_ID", "")
}

// ConfigurarLectorBD permite que el driver lea credenciales guardadas en la
// base de datos (RSU_Configuracion) sin reiniciar el servidor: las pone el
// main al arrancar con una función de consulta.
func ConfigurarLectorBD(f func(clave, defecto string) string) {
	b2Mu.Lock()
	b2Lector = f
	b2Mu.Unlock()
}

// credEfectivas decide qué credenciales usar: las activas (guardadas por el
// admin o ya validadas) > las de la base de datos > las del entorno.
func credEfectivas() b2Cred {
	b2Mu.Lock()
	activas, lector := b2Activas, b2Lector
	b2Mu.Unlock()
	if activas.completa() {
		return activas
	}
	c := b2Cred{}
	c.accountID, c.appKey, c.bucketID = datosB2()
	if lector != nil {
		if v := lector("b2_account_id", ""); v != "" {
			c.accountID = v
		}
		if v := lector("b2_application_key", ""); v != "" {
			c.appKey = v
		}
		if v := lector("b2_bucket_id", ""); v != "" {
			c.bucketID = v
		}
	}
	return c
}

// clienteB2 devuelve el bucket activo, reconectando si aún no se pudo.
// Los errores se memorizan: si la auth falla (401) no se martilla la API en
// cada request — hasta que el admin guarde credenciales nuevas.
func clienteB2() (*backblaze.Bucket, error) {
	b2Mu.Lock()
	bucket, err := b2Bucket, b2Err
	b2Mu.Unlock()
	if err == nil && bucket != nil {
		return bucket, nil
	}
	// (re)intento de conexión con las credenciales efectivas
	b2, c, err2 := conectarCon(credEfectivas())
	b2Mu.Lock()
	if err2 == nil {
		b2Bucket, b2Err, b2Activas = b2, nil, c
		bucket = b2
		err = nil
	} else {
		b2Err = err2
	}
	b2Mu.Unlock()
	if err2 != nil {
		return nil, err2
	}
	return bucket, nil
}

// conectarCon autentica con unas credenciales concretas y resuelve el bucket.
func conectarCon(c b2Cred) (*backblaze.Bucket, b2Cred, error) {
	if !c.completa() {
		return nil, c, errors.New("Backblaze B2 no configurado: faltan B2_ACCOUNT_ID, B2_APPLICATION_KEY o B2_BUCKET_ID")
	}
	client, err := backblaze.NewB2(backblaze.Credentials{
		AccountID:      c.accountID,
		ApplicationKey: c.appKey,
	})
	if err != nil {
		return nil, c, fmt.Errorf("B2 autorizar cuenta: %w", err)
	}
	buckets, err := client.ListBuckets()
	if err != nil {
		return nil, c, fmt.Errorf("B2 listar buckets: %w", err)
	}
	for _, b := range buckets {
		if strings.EqualFold(b.ID, c.bucketID) {
			return b, c, nil
		}
	}
	return nil, c, fmt.Errorf("B2: el bucket %s no existe en la cuenta (¿B2_BUCKET_ID correcto?)", c.bucketID)
}

// AplicarCredenciales valida y activa credenciales nuevas en caliente (las
// guarda el administrador desde el panel). Si no conectan, no se activan y
// se devuelve el error para mostrarlo en la UI.
func AplicarCredenciales(accountID, appKey, bucketID string) error {
	c := b2Cred{accountID: strings.TrimSpace(accountID), appKey: strings.TrimSpace(appKey), bucketID: strings.TrimSpace(bucketID)}
	b2, cOK, err := conectarCon(c)
	b2Mu.Lock()
	defer b2Mu.Unlock()
	if err != nil {
		b2Err = err
		return err
	}
	b2Bucket, b2Err, b2Activas = b2, nil, cOK
	return nil
}

// Verificar comprueba la conexión con Backblaze (credenciales + bucket).
// La usa el healthcheck y el diagnóstico del panel de administración.
func Verificar() error {
	_, err := clienteB2()
	return err
}

// B2Bucket (driver) implementa Storage sobre la API nativa de B2.
type B2Bucket struct{}

func (b *B2Bucket) Driver() string { return "b2" }

// Save sube el archivo al bucket con reintentos para errores transitorios de
// red (los 401/authorization fallan de inmediato: no tiene sentido reintentos).
func (b *B2Bucket) Save(file *multipart.FileHeader, subdir string) (*Saved, error) {
	bucket, err := clienteB2()
	if err != nil {
		return nil, err
	}
	src, err := file.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()
	data, err := io.ReadAll(src)
	if err != nil {
		return nil, err
	}
	key := fmt.Sprintf("%d_%s", time.Now().UnixNano(), SaveName(file.Filename))
	if subdir != "" {
		key = path.Join(SaveName(subdir), key)
	}
	h := sha256.Sum256(data)
	var lastErr error
	for intento := 1; intento <= 3; intento++ {
		_, err = bucket.UploadTypedFile(key, contentTypeDe(key), nil, bytes.NewReader(data))
		if err == nil {
			return &Saved{URL: key, Hash: hex.EncodeToString(h[:]), Size: len(data), Filename: SaveName(file.Filename)}, nil
		}
		lastErr = err
		// Error de credenciales: no reintentar, es de configuración.
		msg := strings.ToLower(err.Error())
		if strings.Contains(msg, "unauthorized") || strings.Contains(msg, "bad_auth_token") || strings.Contains(msg, "auth_token_expired") {
			break
		}
		if intento < 3 {
			time.Sleep(time.Duration(intento) * 400 * time.Millisecond)
		}
	}
	return nil, fmt.Errorf("B2 subir archivo: %w", lastErr)
}

// Descargar baja el objeto desde el bucket privado (stream). Si el token de
// la cuenta expiró, se reautentica una vez y se reintenta.
func (b *B2Bucket) Descargar(key string) (io.ReadCloser, string, error) {
	bucket, err := clienteB2()
	if err != nil {
		return nil, "", err
	}
	file, reader, err := bucket.DownloadFileByName(key)
	if err != nil && esTokenExpirado(err) {
		// Forzar reconexión con credenciales efectivas y reintentar una vez.
		b2Mu.Lock()
		b2Bucket, b2Err = nil, nil
		b2Mu.Unlock()
		if bucket2, err2 := clienteB2(); err2 == nil {
			file, reader, err = bucket2.DownloadFileByName(key)
		}
	}
	if err != nil {
		return nil, "", fmt.Errorf("B2 descargar archivo: %w", err)
	}
	ct := ""
	if file != nil {
		ct = file.ContentType
	}
	return reader, ct, nil
}

// esTokenExpirado detecta los errores de auth que se resuelven reautenticando.
func esTokenExpirado(err error) bool {
	if err == nil {
		return false
	}
	m := strings.ToLower(err.Error())
	return strings.Contains(m, "auth_token_expired") ||
		strings.Contains(m, "bad_auth_token") ||
		strings.Contains(m, "expired") ||
		strings.Contains(m, "unauthorized")
}

// Existe reporta si el objeto está en el bucket (consulta por nombre).
func (b *B2Bucket) Existe(key string) bool {
	bucket, err := clienteB2()
	if err != nil {
		return false
	}
	list, err := bucket.ListFileNames(key, 1)
	if err != nil {
		return false
	}
	for _, f := range list.Files {
		if f.Name == key {
			return true
		}
	}
	return false
}

// Eliminar borra la versión actual del objeto (best-effort).
func (b *B2Bucket) Eliminar(key string) error {
	bucket, err := clienteB2()
	if err != nil {
		return err
	}
	list, err := bucket.ListFileNames(key, 1)
	if err != nil {
		return err
	}
	var fileID string
	for _, f := range list.Files {
		if f.Name == key {
			fileID = f.ID
			break
		}
	}
	if fileID == "" {
		return nil // ya no existe
	}
	_, err = bucket.DeleteFileVersion(key, fileID)
	return err
}

// URLPrefirmada no aplica en la API nativa (bucket privado): las descargas
// pasan por el backend con el token de la cuenta. Se conserva el método para
// cumplir con la interfaz de uso de los handlers.
func (b *B2Bucket) URLPrefirmada(key string, minutos int) (string, error) {
	return "", errors.New("B2 nativo: descargas por el backend (bucket privado)")
}

// contenidoB2Bucket responde al healthcheck con el ID del bucket configurado.
func contenidoB2Bucket() string {
	bucket, err := clienteB2()
	if err != nil {
		return ""
	}
	return bucket.ID
}

// DatosB2Diagnostico expone el bucket configurado para el endpoint de estado
// (sin credenciales: solo el ID, que no es secreto).
func DatosB2Diagnostico() string {
	_, _, bucketID := datosB2()
	return bucketID
}

// contentTypeDe deduce el content-type por extensión.
func contentTypeDe(key string) string {
	switch strings.ToLower(path.Ext(key)) {
	case ".pdf":
		return "application/pdf"
	case ".jpg", ".jpeg":
		return "image/jpeg"
	case ".png":
		return "image/png"
	case ".xlsx":
		return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
	case ".docx":
		return "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
	case ".csv":
		return "text/csv"
	default:
		return "application/octet-stream"
	}
}
