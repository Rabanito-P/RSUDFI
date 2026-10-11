-- ── MÓDULO ADMIN: permisos por usuario (activación de funciones/módulos) ──
-- El administrador (ADMIN) decide a qué módulos entra cada usuario.

CREATE TABLE IF NOT EXISTS "RSU_Usuario_Permiso" (
    id_permiso  SERIAL PRIMARY KEY,
    id_usuario  INTEGER NOT NULL REFERENCES "RSU_Usuario"(id_usuario) ON DELETE CASCADE,
    modulo      VARCHAR(50) NOT NULL,
    activo      BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_usuario_permiso UNIQUE (id_usuario, modulo)
);
CREATE INDEX IF NOT EXISTS idx_usuario_permiso_usuario ON "RSU_Usuario_Permiso"(id_usuario);

-- Los usuarios demo arrancan con todos los módulos activos: el sistema debe
-- verse completo al iniciar y el administrador puede restringirlos después.
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('bandeja'),('entregables'),('evidencias'),('beneficiarios'),
    ('presupuesto'),('encuestas'),('monitoreo'),('reportes'),('personas'),
    ('estructura'),('catalogos'),('documentos'),('auditoria')
) AS m(clave)
WHERE NOT EXISTS (SELECT 1 FROM "RSU_Usuario_Permiso" p WHERE p.id_usuario = u.id_usuario);

-- Sincroniza la secuencia con los IDs insertados por el seed: sin esto, el
-- próximo alta de usuario choca con el primary key (duplicate key).
SELECT setval(pg_get_serial_sequence('"RSU_Usuario"', 'id_usuario'),
              (SELECT COALESCE(MAX(id_usuario), 0) + 1 FROM "RSU_Usuario"), false);
