-- UNDC RSU: migración 12 — cuenta de acceso para Pedro Flores (Docente 2)
-- Responsable (asesor) de los PEP 2 y 5: sin usuario no puede entrar ni
-- resolver solicitudes de unión. Hash = clave inicial undc2026 (misma que
-- el seed usa para el admin). Idempotente.
INSERT INTO "RSU_Usuario" (correo, nombre, password_hash, rol, tipo_usuario, id_persona, activo)
VALUES ('colaborador@undc.edu.pe', 'Pedro Flores',
        '$2a$10$6as1j3fRrRguoNVZjssnFuwY4UzDW0K4mIbcI.gpy8tdYp1WX9nOG',
        'DOCENTE_RESP', 'DOCENTE', 2, true)
ON CONFLICT (correo) DO NOTHING;

-- Módulos demo (el admin los restringe después, igual que al resto).
INSERT INTO "RSU_Usuario_Permiso" (id_usuario, modulo)
SELECT u.id_usuario, m.clave
FROM "RSU_Usuario" u
CROSS JOIN (VALUES
    ('proyectos'),('bandeja'),('entregables'),('evidencias'),('beneficiarios'),
    ('presupuesto'),('encuestas'),('monitoreo'),('reportes'),('personas'),
    ('estructura'),('catalogos'),('documentos'),('auditoria')
) AS m(clave)
WHERE u.correo = 'colaborador@undc.edu.pe'
ON CONFLICT (id_usuario, modulo) DO NOTHING;

SELECT setval(pg_get_serial_sequence('"RSU_Usuario"', 'id_usuario'),
              (SELECT COALESCE(MAX(id_usuario), 0) + 1 FROM "RSU_Usuario"), false);
