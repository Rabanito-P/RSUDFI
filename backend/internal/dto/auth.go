package dto

// ── Login (real — RSU_Usuario + bcrypt) ─────────────────────────
type LoginReq struct {
	Correo   string `json:"correo" binding:"required,email"`
	Password string `json:"password" binding:"required"`
}
type LoginResp struct {
	Token      string `json:"token"`
	Rol        string `json:"rol"`
	RolActor   string `json:"rol_actor"`
	RolActorID uint   `json:"rol_actor_id"`
	TipoActor  string `json:"tipo_actor"`
	ID         uint   `json:"id"`
	PersonaID  uint   `json:"persona_id"`
	Nombre     string `json:"nombre"`
	Correo     string `json:"correo"`
}

// ── Gestión de usuarios (solo ADMIN) ────────────────────────────

// CrearUsuarioReq da de alta un usuario de acceso al sistema.
// La contraseña se guarda hasheada con bcrypt.
type CrearUsuarioReq struct {
	Correo       string `json:"correo" binding:"required,email"`
	Nombre       string `json:"nombre" binding:"required,min=3"`
	Password     string `json:"password" binding:"required,min=6"`
	RolActor     string `json:"rol_actor" binding:"required"`
	IDPersona    *uint  `json:"id_persona"`
	Activo       *bool  `json:"activo"`
	Modulos      []string `json:"modulos"`
}

// ActualizarUsuarioReq edita datos y estado. La contraseña es opcional.
type ActualizarUsuarioReq struct {
	Nombre    *string `json:"nombre"`
	RolActor  *string `json:"rol_actor"`
	IDPersona *uint   `json:"id_persona"`
	Activo    *bool   `json:"activo"`
	Password  *string `json:"password"`
	Modulos   []string `json:"modulos"`
}

// PermisoReq activa o desactiva un módulo puntual para un usuario.
type PermisoReq struct {
	Modulo string `json:"modulo" binding:"required"`
	Activo bool   `json:"activo"`
}

// UsuarioConPermisos es la vista que consume el panel de administración.
type UsuarioConPermisos struct {
	ID          uint      `json:"id_usuario"`
	Correo      string    `json:"correo"`
	Nombre      string    `json:"nombre"`
	Rol         string    `json:"rol"`
	RolActor    string    `json:"rol_actor"`
	TipoUsuario string    `json:"tipo_usuario"`
	IDPersona   *uint     `json:"id_persona"`
	Activo      bool      `json:"activo"`
	UltimoLogin interface{} `json:"ultimo_login"`
	Modulos     []string  `json:"modulos"`
}

// ModuloInfo describe un módulo activable del sistema.
type ModuloInfo struct {
	Clave  string `json:"clave"`
	Nombre string `json:"nombre"`
	Desc   string `json:"desc"`
}
