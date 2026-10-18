package dto

// ── Beneficiario ────────────────────────────────────────────────
type CreateBeneficiarioReq struct {
	TipoBeneficiario string  `json:"tipo_beneficiario" binding:"required,oneof=PERSONA_NATURAL INSTITUCION COMUNIDAD"`
	DNI              *string `json:"dni"`
	Nombres          *string `json:"nombres"`
	Apellidos        *string `json:"apellidos"`
	RUC              *string `json:"ruc"`
	RazonSocial      *string `json:"razon_social"`
	Celular          *string `json:"celular"`
	Correo           *string `json:"correo_electronico"`
	Direccion        *string `json:"direccion"`
	Distrito         *string `json:"distrito"`
	Sexo             *string `json:"sexo"`
	Condicion        *string `json:"condicion_vulnerabilidad"`
}
type VincularBeneficiarioReq struct {
	IDProyecto     uint    `json:"id_proyecto" binding:"required"`
	IDBeneficiario uint    `json:"id_beneficiario" binding:"required"`
	RolEnProyecto  *string `json:"rol_en_proyecto"`
}
