"""
Lector del Excel de planificación de actividades.

Convierte el archivo que llena el estudiante en datos estructurados que el
backend guarda en RSU_Actividad_Campo. Tolera el formato libre del Excel:

    SEMANA | FECHA | HORARIO | ACTIVIDAD | DESCRIPCIÓN
    Semana 1 | miércoles, 13 de mayo del 2026 | 9:30 a.m. – 10:30 a.m. | ... | ...

Uso:
    python documentos/lector_excel.py ruta/al/archivo.xlsx [--json]
    python documentos/lector_excel.py ruta/al/archivo.xlsx --id-proyecto 1

Salida: JSON por stdout con las actividades normalizadas.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date, datetime
from pathlib import Path
from typing import Any

from openpyxl import load_workbook

MESES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "septiembre": 9, "setiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}

COLUMNAS = ["SEMANA", "FECHA", "HORARIO", "ACTIVIDAD", "DESCRIPCIÓN DE LA ACTIVIDAD"]


# ── Fecha ─────────────────────────────────────────────────────────

def _normalizar_fecha(valor: Any) -> date | None:
    """Acepta fecha real de Excel o texto libre en español."""
    if valor is None:
        return None
    if isinstance(valor, datetime):
        return valor.date()
    if isinstance(valor, date):
        return valor

    texto = str(valor).strip()
    if not texto:
        return None

    # Formato ISO directo: 2026-05-13
    m = re.search(r"(\d{4})-(\d{1,2})-(\d{1,2})", texto)
    if m:
        try:
            return date(int(m.group(1)), int(m.group(2)), int(m.group(3)))
        except ValueError:
            pass

    # "13 de mayo del 2026" / "miércoles, 13 de mayo de 2026"
    m = re.search(r"(\d{1,2})\s+de\s+([a-záéíóúñ]+)(?:\s+del?\s+(\d{4}))?", texto, re.IGNORECASE)
    if m:
        dia = int(m.group(1))
        mes = MESES.get(m.group(2).lower().strip())
        anio = int(m.group(3)) if m.group(3) else date.today().year
        if mes:
            try:
                return date(anio, mes, dia)
            except ValueError:
                return None

    # Último intento: dd/mm/yyyy
    m = re.search(r"(\d{1,2})/(\d{1,2})/(\d{4})", texto)
    if m:
        try:
            return date(int(m.group(3)), int(m.group(2)), int(m.group(1)))
        except ValueError:
            return None
    return None


# ── Horario ────────────────────────────────────────────────────────

def _parse_hora(fragmento: str) -> str | None:
    """'9:30 a.m.' / '14:00' / '3:30 pm' → '09:30' / '14:00' / '15:30'."""
    if not fragmento:
        return None
    f = fragmento.strip().lower()

    m = re.search(r"(\d{1,2})[:.](\d{2})?", f)
    if not m:
        m2 = re.search(r"(\d{1,2})", f)
        if not m2:
            return None
        hora, minuto = int(m2.group(1)), 0
    else:
        hora = int(m.group(1))
        minuto = int(m.group(2) or 0)

    # a.m./p.m. solo ajustan si la hora está en formato 12h
    if re.search(r"\b(p\.?\s?m\.?|pm|tarde|noche)\b", f) and hora < 12:
        hora += 12
    elif re.search(r"\b(a\.?\s?m\.?|am|mañana)\b", f) and hora == 12:
        hora = 0

    if not (0 <= hora <= 23 and 0 <= minuto <= 59):
        return None
    return f"{hora:02d}:{minuto:02d}"


def _normalizar_horario(valor: Any) -> tuple[str | None, str | None, int]:
    """Devuelve (hora_inicio, hora_fin, minutos)."""
    if valor is None:
        return None, None, 0
    texto = str(valor).strip()
    if not texto:
        return None, None, 0

    # Separadores de rango: – — - a ... hasta
    partes = re.split(r"\s*(?:–|—|−|-{1,2}|\ba\b|\bhasta\b)\s*", texto)
    partes = [p.strip() for p in partes if p.strip()]

    horas = [_parse_hora(p) for p in partes]
    horas = [h for h in horas if h]

    if len(horas) >= 2:
        inicio, fin = horas[0], horas[1]
    elif len(horas) == 1:
        inicio, fin = horas[0], None
    else:
        return None, None, 0

    minutos = 0
    if inicio and fin:
        h1, m1 = map(int, inicio.split(":"))
        h2, m2 = map(int, fin.split(":"))
        minutos = (h2 * 60 + m2) - (h1 * 60 + m1)
        if minutos < 0:
            minutos += 24 * 60  # cruza medianoche
    return inicio, fin, minutos


# ── Lectura ────────────────────────────────────────────────────────

def leer_planificacion(ruta: Path) -> dict[str, Any]:
    wb = load_workbook(filename=str(ruta), data_only=True, read_only=True)
    ws = wb.active

    filas = list(ws.iter_rows(values_only=True))
    wb.close()

    # Localiza la fila de cabecera (la que tiene SEMANA y FECHA).
    inicio_datos = None
    indice_col = {}
    for i, fila in enumerate(filas[:15]):
        textos = [str(c).strip().upper() if c is not None else "" for c in fila]
        if "SEMANA" in textos and "FECHA" in textos:
            inicio_datos = i + 1
            for j, t in enumerate(textos):
                if t:
                    indice_col[t] = j
            break

    if inicio_datos is None:
        return {
            "ok": False,
            "error": "No se encontró la fila de encabezado (SEMANA, FECHA, HORARIO, ACTIVIDAD, DESCRIPCIÓN).",
            "actividades": [],
        }

    def col(nombre: str) -> int | None:
        for clave, idx in indice_col.items():
            if clave.startswith(nombre):
                return idx
        return None

    c_semana, c_fecha = col("SEMANA"), col("FECHA")
    c_hora, c_act, c_desc = col("HORARIO"), col("ACTIVIDAD"), col("DESCRIP")

    if c_fecha is None or c_act is None:
        return {
            "ok": False,
            "error": "El archivo no tiene las columnas mínimas: FECHA y ACTIVIDAD.",
            "actividades": [],
        }

    actividades: list[dict[str, Any]] = []
    omitidas: list[int] = []

    for n, fila in enumerate(filas[inicio_datos:], start=inicio_datos + 1):
        def valor(idx: int | None) -> Any:
            if idx is None or idx >= len(fila):
                return None
            return fila[idx]

        nombre = str(valor(c_act) or "").strip()
        if not nombre:
            continue

        fecha = _normalizar_fecha(valor(c_fecha))
        if fecha is None:
            omitidas.append(n)
            continue

        hora_inicio, hora_fin, minutos = _normalizar_horario(valor(c_hora))
        desc = str(valor(c_desc) or "").strip()

        actividades.append({
            "orden": len(actividades) + 1,
            "semana": str(valor(c_semana) or "").strip(),
            "fecha": fecha.isoformat(),
            "hora_inicio": hora_inicio,
            "hora_fin": hora_fin,
            "minutos": minutos,
            "nombre": nombre,
            "descripcion": desc or None,
        })

    return {
        "ok": True,
        "total": len(actividades),
        "omitidas_sin_fecha": omitidas,
        "actividades": actividades,
    }


def main() -> int:
    ap = argparse.ArgumentParser(description="Lee el Excel de planificación de actividades RSU.")
    ap.add_argument("archivo", type=Path, help="Ruta del .xlsx con la planificación")
    ap.add_argument("--json", action="store_true", help="Imprime solo el JSON")
    args = ap.parse_args()

    if not args.archivo.exists():
        print(json.dumps({"ok": False, "error": f"No existe el archivo {args.archivo}"}))
        return 1

    resultado = leer_planificacion(args.archivo)
    print(json.dumps(resultado, ensure_ascii=False, indent=2))

    if not resultado["ok"]:
        return 1
    if not args.json:
        print(f"\n{resultado['total']} actividad(es) leídas.", file=sys.stderr)
        for a in resultado["actividades"]:
            rango = ""
            if a["hora_inicio"]:
                rango = f" {a['hora_inicio']}" + (f"–{a['hora_fin']}" if a["hora_fin"] else "")
                rango += f" ({a['minutos']} min)"
            print(f"  {a['fecha']}{rango} · {a['nombre']}", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
