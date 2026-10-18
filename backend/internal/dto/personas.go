package dto

type CreateDocenteReq struct {
	CodigoDocente     string  `json:"codigo_docente" binding:"required"`
	DNI               string  `json:"dni" binding:"required,len=8"`
	Nombres           string  `json:"nombres" binding:"required"`
	Apellidos         string  `json:"apellidos" binding:"required"`
	Correo            string  `json:"correo_institucional" binding:"required,email"`
	IDEscuela         uint    `json:"id_escuela" binding:"required"`
	IDDepartamento    *uint   `json:"id_departamento"`
	TipoDocente       string  `json:"tipo_docente" binding:"required,oneof=ORDINARIO_TC ORDINARIO_DE CONTRATADO"`
	Categoria         *string `json:"categoria"`
	CargaLectivaMax   float64 `json:"carga_lectiva_max"`
	CargaNoLectivaMax float64 `json:"carga_no_lectiva_max"`
}
type CreateEstudianteReq struct {
	Codigo       string  `json:"codigo_estudiante" binding:"required"`
	DNI          string  `json:"dni" binding:"required,len=8"`
	Nombres      string  `json:"nombres" binding:"required"`
	Apellidos    string  `json:"apellidos" binding:"required"`
	Correo       string  `json:"correo_institucional" binding:"required,email"`
	IDEscuela    uint    `json:"id_escuela" binding:"required"`
	FechaIngreso *string `json:"fecha_ingreso"`
	// CrearUsuario: además de la persona, da de alta la cuenta de acceso para
	// que el estudiante pueda iniciar sesión (perfil completo).
	CrearUsuario bool   `json:"crear_usuario"`
	Password     string `json:"password"`
	RolActor     string `json:"rol_actor"`
}

// RegistroEstudianteReq es el alta desde la pantalla de login (sin sesión).
type RegistroEstudianteReq struct {
	DNI       string `json:"dni" binding:"required"`
	Nombres   string `json:"nombres" binding:"required,min=2"`
	Apellidos string `json:"apellidos"`
	Correo    string `json:"correo_institucional" binding:"required,email"`
	IDEscuela *uint  `json:"id_escuela"`
	Codigo    string `json:"codigo_estudiante"`
	// Ciclo en el que se matricula el estudiante y su ciclo numérico.
	//
	// Sin esta fila en Estudiante_Ciclo el estudiante no puede crear un SSU:
	// la regla de ciclo mínimo (R01) consulta el ciclo numérico del líder
	// contra RSU_Tipo_Proyecto.ciclo_minimo_estudiante. Antes el registro
	// público no la creaba y toda alta quedaba sin poder proponer proyecto.
	IDCiclo       *uint `json:"id_ciclo"`
	CicloNumerico *int  `json:"ciclo_numerico" binding:"omitempty,min=1,max=12"`
}
