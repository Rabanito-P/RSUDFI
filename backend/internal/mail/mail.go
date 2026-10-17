package mail

import (
	"context"
	"log"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/resend/resend-go/v4"
)

// ── Resend — envío de correos transaccionales ──────────────────
// Se usa para avisar por correo lo mismo que llega al panel:
// aprobaciones, devoluciones con motivo, cambio de líder y creación de
// proyectos. El envío es best-effort: un fallo de correo NUNCA debe tumbar
// la transacción BPMN, por eso todo se envía en goroutine y se loguea.

var (
	once   sync.Once
	client *resend.Client
	config Config
)

// Config junta la configuración de correo (variables de entorno).
type Config struct {
	APIKey  string // RESEND_API_KEY
	From    string // EMAIL_FROM (ej: "UNDC RSU <onboarding@resend.dev>")
	ReplyTo string // EMAIL_REPLY_TO
	BaseURL string // FRONTEND_URL — para los botones "Abrir panel"
}

// Cargar devuelve la configuración efectiva (una sola vez).
func Cargar() Config {
	once.Do(func() {
		config = Config{
			APIKey:  strings.TrimSpace(os.Getenv("RESEND_API_KEY")),
			From:    envOMail("EMAIL_FROM", "UNDC RSU <onboarding@resend.dev>"),
			ReplyTo: envOMail("EMAIL_REPLY_TO", ""),
			BaseURL: envOMail("FRONTEND_URL", "http://localhost:5173"),
		}
		if config.APIKey != "" {
			client = resend.NewClient(config.APIKey)
			log.Printf("[mail] Resend configurado (from=%s)", config.From)
		} else {
			log.Printf("[mail] RESEND_API_KEY no definido: los correos se registran solo como log")
		}
	})
	return config
}

// Habilitado reporta si hay API key de Resend disponible.
func Habilitado() bool { return Cargar().APIKey != "" }

type Mensaje struct {
	Para   []string
	Asunto string
	HTML   string
	Texto  string
}

// Enviar entrega el correo por Resend. Devuelve error si falla o si no hay
// API key configurada (los callers usan EnviarAsync para no bloquear).
func Enviar(m Mensaje) error {
	cfg := Cargar()
	if len(m.Para) == 0 {
		return nil
	}
	if client == nil {
		// Sin API key: se deja rastro en el log (útil en desarrollo).
		log.Printf("[mail] (simulado) «%s» → %s", m.Asunto, strings.Join(m.Para, ", "))
		return nil
	}
	params := &resend.SendEmailRequest{
		From:    cfg.From,
		To:      m.Para,
		Subject: m.Asunto,
		Html:    m.HTML,
		Text:    m.Texto,
	}
	if cfg.ReplyTo != "" {
		params.ReplyTo = cfg.ReplyTo
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Second)
	defer cancel()
	sent, err := client.Emails.SendWithContext(ctx, params)
	if err != nil {
		return err
	}
	log.Printf("[mail] enviado id=%s a=%s asunto=%q", sent.Id, strings.Join(m.Para, ", "), m.Asunto)
	return nil
}

// EnviarAsync dispara el envío en segundo plano con un timeout propio: el
// request HTTP sigue su curso aunque Resend tarde o falle.
func EnviarAsync(m Mensaje) {
	if len(m.Para) == 0 {
		return
	}
	go func(m Mensaje) {
		if err := Enviar(m); err != nil {
			log.Printf("[mail] ERROR enviando «%s» a %s: %v", m.Asunto, strings.Join(m.Para, ", "), err)
		}
	}(m)
}

func envOMail(k, def string) string {
	if v := strings.TrimSpace(os.Getenv(k)); v != "" {
		return v
	}
	return def
}
