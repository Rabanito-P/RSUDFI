"""
Generador de plantillas del sistema RSU UNDC.

Crea los archivos base que el estudiante descarga al crear o modificar un
proyecto. Se ejecuta manualmente:

    python documentos/generar_plantillas.py

Salida en documentos/plantillas/:
  - 01-propuesta-de-proyecto.docx        (perfil del proyecto)
  - 02-planificacion-de-actividades.xlsx (cronograma semana/fecha/horario)
  - 03-primer-entregable.docx
  - 04-segundo-entregable.docx
  - 05-tercer-entregable.docx
  - 06-encuesta-satisfaccion.docx
  - 07-informe-final.docx

El Excel de planificación usa exactamente las columnas que luego lee
documentos/lector_excel.py, de modo que lo que el estudiante llena es lo que
el sistema vuelca a la base de datos.
"""

from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Pt, RGBColor
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from openpyxl.utils import get_column_letter

AZUL = RGBColor(0x0F, 0x2B, 0x24)
GRIS = RGBColor(0x64, 0x74, 0x8B)

SALIDA = Path(__file__).resolve().parent / "plantillas"

# Columnas del Excel: el lector depende de este orden exacto.
COLUMNAS = [
    "SEMANA",
    "FECHA",
    "HORARIO",
    "ACTIVIDAD",
    "DESCRIPCIÓN DE LA ACTIVIDAD",
]

EJEMPLOS = [
    ("Semana 1", "miércoles, 13 de mayo del 2026", "9:30 a.m. – 10:30 a.m.",
     "Diagnóstico y propuesta de proyecto a desarrollar",
     "Revisión de la problemática y recopilación de información para plantear la propuesta de proyecto."),
    ("Semana 1", "jueves, 14 de mayo del 2026", "3:30 p.m. – 4:30 p.m.",
     "Coordinaciones con los grupos de interés para el desarrollo del Proyecto",
     "Reunión con las partes interesadas para definir objetivos, roles y responsabilidades."),
    ("Semana 1", "jueves, 14 de mayo del 2026", "6:00 p.m. – 8:00 p.m.",
     "Coordinaciones y consolidación en informe inicial",
     "Ajuste de actividades, recopilación de acuerdos y elaboración del informe inicial del proyecto."),
    ("Semana 1", "viernes, 15 de mayo del 2026", "2:00 p.m. – 3:00 p.m.",
     "Inscripción de Proyecto",
     "Registro formal del proyecto en la plataforma institucional SERUS."),
]


# ── Utilidades Word ────────────────────────────────────────────────

def _encabezado(doc: Document, titulo: str, subtitulo: str) -> None:
    p = doc.add_paragraph()
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = p.add_run("UNIVERSIDAD NACIONAL DE CAÑETE\nFacultad de Ingeniería de Sistemas")
    r.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = AZUL

    t = doc.add_paragraph()
    t.alignment = WD_ALIGN_PARAGRAPH.CENTER
    tr = t.add_run(titulo)
    tr.bold = True
    tr.font.size = Pt(18)
    tr.font.color.rgb = AZUL

    s = doc.add_paragraph()
    s.alignment = WD_ALIGN_PARAGRAPH.CENTER
    sr = s.add_run(subtitulo)
    sr.font.size = Pt(10)
    sr.font.color.rgb = GRIS


def _campo(doc: Document, etiqueta: str, lineas: int = 1) -> None:
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    r = p.add_run(etiqueta)
    r.bold = True
    r.font.size = Pt(10)
    for _ in range(lineas):
        b = doc.add_paragraph("_" * 78)
        b.paragraph_format.space_after = Pt(8)


def _instrucciones(doc: Document, lineas: list[str]) -> None:
    p = doc.add_paragraph()
    r = p.add_run("Instrucciones")
    r.bold = True
    r.font.size = Pt(10)
    r.font.color.rgb = AZUL
    for linea in lineas:
        b = doc.add_paragraph(linea, style="List Bullet")
        b.paragraph_format.space_after = Pt(2)


def _word_propuesta(path: Path) -> None:
    doc = Document()
    _encabezado(doc, "Perfil del Proyecto de Responsabilidad Social",
                "Documento obligatorio en la etapa de formulación")

    _campo(doc, "Código del proyecto")
    _campo(doc, "Título del proyecto", 2)
    _campo(doc, "Escuela profesional")
    _campo(doc, "Líder del equipo")
    _campo(doc, "Docente asesor")
    _campo(doc, "Integrantes del equipo", 3)
    _campo(doc, "Línea de acción ODS")
    _campo(doc, "Tipo de proyecto")
    _campo(doc, "Lugar de intervención")
    _campo(doc, "Población beneficiaria")
    _campo(doc, "Presupuesto solicitado (S/)")

    doc.add_paragraph()
    for titulo, lineas in [
        ("1. Problema", [
            "Describe la situación que afecta a la comunidad.",
            "Incluye datos que respalden la problemática.",
        ]),
        ("2. Objetivos", [
            "Objetivo general: qué se busca lograr.",
            "Objetivos específicos: resultados medibles.",
        ]),
        ("3. Justificación", [
            "Por qué el proyecto es pertinente para la comunidad y la universidad.",
        ]),
        ("4. Metodología", [
            "Cómo se ejecutará el proyecto y con quiénes.",
        ]),
        ("5. Cronograma", [
            "Detalla las actividades en el archivo Excel de planificación (se sube junto a este documento).",
        ]),
        ("6. Presupuesto", [
            "Detalla los gastos previstos y su justificación.",
        ]),
    ]:
        h = doc.add_paragraph()
        hr = h.add_run(titulo)
        hr.bold = True
        hr.font.size = Pt(12)
        hr.font.color.rgb = AZUL
        for linea in lineas:
            doc.add_paragraph(linea)
        doc.add_paragraph("_" * 78)
        doc.add_paragraph("_" * 78)
        doc.add_paragraph("_" * 78)

    doc.add_page_break()
    _instrucciones(doc, [
        " Completa todos los campos antes de enviar a revisión de Escuela.",
        "Guarda este archivo como PDF para subirlo a la plataforma.",
        "Las actividades y fechas se cargan en el Excel de planificación.",
    ])
    doc.save(str(path))


def _word_entregable(path: Path, numero: int, contenido: list[str]) -> None:
    doc = Document()
    _encabezado(doc, f"{numero}° Entregable del Proyecto RSU",
                "Adjuntar en la etapa que corresponda del flujo de aprobación")
    _campo(doc, "Código del proyecto")
    _campo(doc, "Título del proyecto", 2)
    _campo(doc, "Fecha de presentación")
    _campo(doc, "Responsable")

    doc.add_paragraph()
    h = doc.add_paragraph()
    hr = h.add_run("Contenido mínimo")
    hr.bold = True
    hr.font.size = Pt(12)
    hr.font.color.rgb = AZUL
    for i, linea in enumerate(contenido, 1):
        doc.add_paragraph(f"{i}. {linea}")

    doc.add_paragraph()
    _instrucciones(doc, [
        "Sube este documento en formato PDF.",
        "El estado pasa a ENVIADO y queda a la espera de verificación.",
        "Si el verificador lo observa, podrás corregirlo y volver a enviarlo.",
    ])
    doc.save(str(path))


def _word_encuesta(path: Path) -> None:
    doc = Document()
    _encabezado(doc, "Encuesta de Satisfacción del Beneficiario",
                "Escala Likert 1 a 5 · Preguntas P01 a P06")
    _campo(doc, "Proyecto")
    _campo(doc, "Beneficiario")
    _campo(doc, "Modalidad (presencial / telefónica / virtual / WhatsApp)")
    _campo(doc, "Fecha de aplicación")

    doc.add_paragraph()
    h = doc.add_paragraph()
    hr = h.add_run("Preguntas")
    hr.bold = True
    hr.font.size = Pt(12)
    hr.font.color.rgb = AZUL

    preguntas = [
        "¿Utilidad del proyecto para resolver su necesidad? (UTILIDAD)",
        "¿Calidad de las actividades realizadas? (CALIDAD)",
        "¿Trato recibido por docentes y estudiantes? (TRATO)",
        "¿El proyecto respondió a lo que realmente necesitaba? (PERTINENCIA)",
        "¿Recomendaría el proyecto a otras personas? (IMPACTO)",
        "¿Impacto del proyecto en su vida diaria? (IMPACTO)",
    ]
    for i, p in enumerate(preguntas, 1):
        doc.add_paragraph(f"P0{i}. {p}")
        fila = doc.add_paragraph()
        fila.add_run("1 Muy malo    2 Malo    3 Regular    4 Bueno    5 Muy bueno")
        doc.add_paragraph("_" * 78)

    _instrucciones(doc, [
        "Marca una sola opción por pregunta.",
        "Un beneficiario responde una sola encuesta por proyecto.",
        "El promedio y la etiqueta se calculan automáticamente en el sistema.",
    ])
    doc.save(str(path))


def _word_informe_final(path: Path) -> None:
    doc = Document()
    _encabezado(doc, "Informe Final del Proyecto RSU",
                "Se presenta al concluir la ejecución, antes del cierre")
    _campo(doc, "Código del proyecto")
    _campo(doc, "Título del proyecto", 2)
    _campo(doc, "Escuela profesional")
    _campo(doc, "Líder del equipo")
    _campo(doc, "Docente asesor")

    doc.add_paragraph()
    for titulo in [
        "1. Resumen ejecutivo",
        "2. Resultados frente a los objetivos planteados",
        "3. Evidencias finales",
        "4. Lecciones aprendidas",
        "5. Horas totales del equipo",
        "6. Recomendaciones",
    ]:
        h = doc.add_paragraph()
        hr = h.add_run(titulo)
        hr.bold = True
        hr.font.size = Pt(12)
        hr.font.color.rgb = AZUL
        for _ in range(4):
            doc.add_paragraph("_" * 78)

    _instrucciones(doc, [
        "Guarda como PDF y súbelo en la pestaña Entregables (orden 5).",
        "El proyecto pasa a INFORME_FINAL_PRESENTADO y espera conformidad.",
    ])
    doc.save(str(path))


# ── Excel de planificación ─────────────────────────────────────────

def _excel_planificacion(path: Path) -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Planificación"

    # Título
    ws["A1"] = "PLANIFICACIÓN DE ACTIVIDADES"
    ws["A1"].font = Font(bold=True, size=14, color="0F2B24")
    ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=len(COLUMNAS))
    ws["A1"].alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 26

    ws["A2"] = ("Una fila por actividad. La fecha acepta formato libre "
                "(miércoles, 13 de mayo del 2026) y el horario 9:30 a.m. – 10:30 a.m.")
    ws["A2"].font = Font(italic=True, size=9, color="64748B")
    ws.merge_cells(start_row=2, start_column=1, end_row=2, end_column=len(COLUMNAS))

    # Cabecera
    relleno = PatternFill("solid", fgColor="0F2B24")
    borde = Border(
        left=Side(style="thin", color="CBD5E1"),
        right=Side(style="thin", color="CBD5E1"),
        top=Side(style="thin", color="CBD5E1"),
        bottom=Side(style="thin", color="CBD5E1"),
    )
    fila_cab = 4
    for col, nombre in enumerate(COLUMNAS, start=1):
        celda = ws.cell(row=fila_cab, column=col, value=nombre)
        celda.font = Font(bold=True, color="FFFFFF", size=10)
        celda.fill = relleno
        celda.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        celda.border = borde
    ws.row_dimensions[fila_cab].height = 32

    # Filas de ejemplo
    for i, fila in enumerate(EJEMPLOS):
        fila_datos = fila_cab + 1 + i
        for col, valor in enumerate(fila, start=1):
            celda = ws.cell(row=fila_datos, column=col, value=valor)
            celda.alignment = Alignment(vertical="top", wrap_text=True)
            celda.border = borde
            celda.font = Font(size=10)
        ws.row_dimensions[fila_datos].height = 42

    # Filas vacías listas para llenar
    for i in range(len(EJEMPLOS), len(EJEMPLOS) + 16):
        fila_datos = fila_cab + 1 + i
        for col in range(1, len(COLUMNAS) + 1):
            celda = ws.cell(row=fila_datos, column=col)
            celda.border = borde
            celda.alignment = Alignment(vertical="top", wrap_text=True)

    anchos = [12, 30, 24, 38, 52]
    for col, ancho in enumerate(anchos, start=1):
        ws.column_dimensions[get_column_letter(col)].width = ancho

    ws.freeze_panes = "A5"
    wb.save(str(path))


def main() -> None:
    SALIDA.mkdir(parents=True, exist_ok=True)
    trabajos = [
        ("01-propuesta-de-proyecto.docx", lambda p: _word_propuesta(p)),
        ("02-planificacion-de-actividades.xlsx", lambda p: _excel_planificacion(p)),
        ("03-primer-entregable.docx",
         lambda p: _word_entregable(p, 1, [
             "Carátula: código, título, escuela, ciclo y equipo.",
             "Avance de actividades ejecutadas a la fecha.",
             "Evidencias iniciales (fotos con fecha y lugar).",
             "Dificultades encontradas y cómo se resolvieron.",
             "Horas acumuladas por integrante.",
         ])),
        ("04-segundo-entregable.docx",
         lambda p: _word_entregable(p, 2, [
             "Carátula: código, título y semestre.",
             "Objetivos específicos y actividades del periodo.",
             "Registro de asistencia de beneficiarios.",
             "Fotografías con fecha, lugar y responsable.",
             "Horas acumuladas por integrante.",
         ])),
        ("05-tercer-entregable.docx",
         lambda p: _word_entregable(p, 3, [
             "Carátula: código, título y semestre.",
             "Consolidado de avance físico.",
             "Cuadro de indicadores del proyecto.",
             "Evidencia del cumplimiento por entregable.",
             "Horas acumuladas por integrante.",
         ])),
        ("06-encuesta-satisfaccion.docx", lambda p: _word_encuesta(p)),
        ("07-informe-final.docx", lambda p: _word_informe_final(p)),
    ]

    for nombre, fn in trabajos:
        ruta = SALIDA / nombre
        fn(ruta)
        print(f"creado {ruta.relative_to(SALIDA.parent)}")


if __name__ == "__main__":
    main()
