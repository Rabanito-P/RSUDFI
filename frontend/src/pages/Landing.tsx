import { useState } from 'react'
import {
  Clock,
  Code2,
  Facebook,
  Mail,
  MapPin,
  Network,
  Phone,
  ShieldCheck,
  X,
} from 'lucide-react'
import { LluviaBinaria } from '../components/BinRain'

/**
 * Portada pública de la RSU — Facultad de Ingeniería (UNDC).
 *
 * Especificación institucional estricta:
 * - Una sola escuela profesional (EPIS) y una sola modalidad activa (SSU).
 * - Cero métricas inventadas, cero secciones de relleno.
 * - Recursos oficiales servidos desde los dominios UNDC / DRSU.
 */

// ── Recursos oficiales (mantener como constantes) ──────────────────────
const LOGO_FI =
  'https://fi.undc.edu.pe/assets/logo-fi-CvkxA2ej.png'
const LOGO_DRSU =
  'https://drsu.undc.edu.pe/storage/landing-img/logorsuundc2.png'
const IMG_PROYECTO_1 =
  'https://scontent-lim1-1.xx.fbcdn.net/v/t39.99422-6/831033106_2582703872232138_7701424677511771415_n.png?stp=dst-jpg_tt6&cstp=mx1600x1200&ctp=s1600x1200&_nc_cat=111&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_ohc=KJhY4gM_4O4Q7kNvwFAvEIF&_nc_oc=Adp0eFm_BYGv2BErrq7VcrUmGE1f8ffIomHl31pPS_CUYc5yPRV8-BkuwFVkGXsBT4U&_nc_zt=14&_nc_ht=scontent-lim1-1.xx&_nc_gid=iq7bYy5amaSKvZJkz70Qcg&_nc_ss=7b289&oh=00_AQQGaxBFKOusgOnbo-x73zDRrwgRlNcPjZZlO6_2R23gpQ&oe=6B01A625'
const IMG_PROYECTO_2 =
  'https://scontent-lim1-1.xx.fbcdn.net/v/t39.30808-6/790645383_1757725285773965_3182362003185182817_n.jpg?stp=dst-jpg_tt6&cstp=mx2048x1365&ctp=s2048x1365&_nc_cat=106&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_ohc=HtDw1ZN-ae0Q7kNvwGFL0VB&_nc_oc=AdqHcyJ2YEQCIQc_Dm1c2GPzzU8vpKEp_pbnWCNvH2dMr9LIrjz8kQLAwJa2l58KP2g&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&_nc_gid=OjwZsGVF7l2VXxMHCDbt7Q&_nc_ss=7b289&oh=00_AQTiHtPsZ2Bam3t5uHXwUYfQqmTzI2UimyXp2YnCpSwSdQ&oe=6B01B1D4'
const IMG_PROYECTO_3 =
  'https://scontent-lim1-1.xx.fbcdn.net/v/t39.30808-6/588215559_1508955923984237_5033678665163571571_n.jpg?stp=dst-jpg_tt6&cstp=mx940x788&ctp=s940x788&_nc_cat=101&_nc_map=urlgen_bucketless&ccb=1-7&_nc_sid=127cfc&_nc_ohc=26sygZmOwdEQ7kNvwHoVJm5&_nc_oc=Adqv05HgQE7coiP4JvchjdS4lZcaxL0yXNF_cjZ9LDCQg7DUcb97sNUdqu2cFgp6pE4&_nc_zt=23&_nc_ht=scontent-lim1-1.xx&_nc_gid=02w6AcH8Q6Mom1E77mIoUQ&_nc_ss=7b289&oh=00_AQQ7ixniJI6laybfPYIfp1WL0jOQjOUsCn7sihw9iFpRUw&oe=6B01BCD4'
const IMG_DECANO = 'https://sinergiacanetana.com/decanato/c-almidon.webp'
const PDF_REGLAMENTO =
  'https://drsu.undc.edu.pe/storage/landing-img/REGLAMENTORSU.pdf'

// ── Lluvia binaria: componente compartido (components/BinRain.tsx) ─────

/**
 * Foto del collage con resiliencia: si la imagen externa caduca, muestra
 * un contenedor neutro estilizado sin romper la maquetación.
 */
/**
 * Retrato institucional con resiliencia: si la imagen externa caduca,
 * muestra un monograma neutro en vez de una caja vacía.
 */
function Retrato({ src, alt }: { src: string; alt: string }) {
  const [fallo, setFallo] = useState(false)
  return (
    <div className="h-48 w-40 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white sm:h-52 sm:w-44">
      {fallo ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 bg-[#F5F7FA] text-[#0F2D4A]">
          <span className="text-3xl font-bold tracking-wide">CA</span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
            Decano · FI UNDC
          </span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFallo(true)}
          /* eager: si llega tarde por lazy-loading, el visitante ve la caja
             vacía en vez del retrato — este es pequeño y va a media página. */
          className="h-full w-full object-cover object-top"
        />
      )}
    </div>
  )
}

function Foto({
  src,
  alt,
  aspect,
}: {
  src: string
  alt: string
  aspect: string
}) {
  const [fallo, setFallo] = useState(false)
  return (
    <div
      className={`${aspect} overflow-hidden rounded-xl border border-slate-200 shadow-sm bg-[#F5F7FA]`}
    >
      {fallo ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400">
          <ShieldCheck size={22} strokeWidth={1.5} />
          <span className="text-[11px] font-medium">Proyecto SSU — EPIS UNDC</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          onError={() => setFallo(true)}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      )}
    </div>
  )
}

const NAV = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Enfoque y SSU', href: '#enfoque-ssu' },
  { label: 'Decanato', href: '#decanato' },
  { label: 'Reglamento', href: '#reglamento' },
  { label: 'Contacto', href: '#contacto' },
]

export default function Landing() {
  const [menuAbierto, setMenuAbierto] = useState(false)

  return (
    <div className="min-h-screen bg-white text-[#1E293B]">
      {/* ── Sección 1: Header colaborativo ─────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[#E2E8F0] bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          {/* Co-branding: escudo FI + marca "FI UNDC" + DRSU */}
          <a href="#inicio" className="flex shrink-0 items-center gap-2.5">
            <img
              src={LOGO_FI}
              alt="Escudo de la Facultad de Ingeniería — UNDC"
              onError={(e) => {
                // Respaldo local: sello UNDC ya servido desde /public.
                e.currentTarget.src = '/favicon-fi.png'
              }}
              className="h-11 w-auto object-contain"
            />
            <span className="flex flex-col leading-tight">
              <span className="text-[15px] font-bold tracking-tight text-[#0F2D4A]">
                FI UNDC
              </span>
              <span className="hidden text-[10px] font-medium uppercase tracking-widest text-[#475569] sm:inline">
                Facultad de Ingeniería
              </span>
            </span>
            <span className="hidden text-xl font-light text-slate-300 sm:inline">×</span>
            <img
              src={LOGO_DRSU}
              alt="Dirección de Responsabilidad Social Universitaria — UNDC"
              onError={(e) => {
                e.currentTarget.style.display = 'none'
              }}
              className="hidden h-10 w-auto object-contain sm:block"
            />
          </a>

          {/* Navegación plana (escritorio) */}
          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="text-sm font-medium text-[#475569] transition-colors hover:text-[#0F2D4A]"
              >
                {n.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/p/login"
              className="rounded-lg bg-[#0F2D4A] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#18426B]"
            >
              Plataforma RSUFI
            </a>
            {/* Menú móvil */}
            <button
              type="button"
              aria-label="Abrir menú"
              aria-expanded={menuAbierto}
              onClick={() => setMenuAbierto((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden"
            >
              {menuAbierto ? <X size={18} /> : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
        {/* Navegación (móvil) */}
        {menuAbierto && (
          <nav className="border-t border-[#E2E8F0] bg-white lg:hidden">
            <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6">
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setMenuAbierto(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[#475569] transition-colors hover:bg-[#F5F7FA] hover:text-[#0F2D4A]"
                >
                  {n.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>

      {/* ── Sección 2: Hero asimétrico con evidencia real ──────────────── */}
      <section id="inicio" className="relative overflow-hidden scroll-mt-24 bg-white">
        <LluviaBinaria />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          {/* Mensaje sobrio */}
          <div className="lg:col-span-6">
            <span className="inline-block rounded-full border border-slate-200 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-[#0F2D4A]">
              RSU · Facultad de Ingeniería – UNDC
            </span>
            <h1 className="mt-5 text-3xl font-bold leading-tight text-[#1E293B] sm:text-4xl lg:text-[2.75rem]">
              Ingeniería de Sistemas con compromiso ciudadano
            </h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-[#475569]">
              Articulamos la formación académica de nuestra Escuela Profesional con las
              necesidades de nuestro entorno en Cañete, aportando soluciones prácticas desde el
              enfoque sistémico, el desarrollo de software y el Servicio Social Universitario
              (SSU).
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a
                href="#enfoque-ssu"
                className="rounded-lg bg-[#0F2D4A] px-5 py-3 font-medium text-white transition-colors hover:bg-[#18426B]"
              >
                Conocer el SSU
              </a>
              <a
                href="#reglamento"
                className="rounded-lg border border-slate-300 px-5 py-3 font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Ver Reglamento
              </a>
            </div>
          </div>

          {/* Collage bento de fotos reales */}
          <div className="lg:col-span-6">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Foto
                  src={IMG_PROYECTO_1}
                  alt="Estudiantes de Ingeniería de Sistemas en actividad de Servicio Social Universitario"
                  aspect="aspect-[16/10]"
                />
              </div>
              <Foto
                src={IMG_PROYECTO_2}
                alt="Actividad de proyección social de la EPIS en la provincia de Cañete"
                aspect="aspect-[4/3]"
              />
              <Foto
                src={IMG_PROYECTO_3}
                alt="Trabajo de campo del Servicio Social Universitario con la comunidad"
                aspect="aspect-[4/3]"
              />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Actividades de proyección y Servicio Social Universitario desarrolladas por
              estudiantes de Ingeniería de Sistemas.
            </p>
          </div>
        </div>
      </section>

      {/* ── Sección 3: Enfoque sistémico y SSU ─────────────────────────── */}
      <section
        id="enfoque-ssu"
        className="scroll-mt-24 border-y border-[#E2E8F0] bg-[#F5F7FA] py-16"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#1D5B96]">
            Nuestro enfoque
          </p>
          <h2 className="mt-2 text-2xl font-bold text-[#1E293B] sm:text-3xl">
            Aportar a la comunidad desde lo que sabemos hacer
          </h2>

          {/* Ficha del programa activo */}
          <div className="mb-8 mt-8 rounded-xl border border-slate-200 border-l-4 border-l-[#0F2D4A] bg-white p-6 shadow-xs lg:p-8">
            <span className="inline-block rounded-full bg-[#F5F7FA] px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#0F2D4A]">
              Modalidad activa en la facultad
            </span>
            <h3 className="mt-3 text-xl font-bold text-[#1E293B] sm:text-2xl">
              Servicio Social Universitario (SSU)
            </h3>
            <p className="mt-3 max-w-4xl text-sm leading-relaxed text-[#475569] sm:text-base">
              Es el espacio mediante el cual los estudiantes de la Escuela Profesional de
              Ingeniería de Sistemas ponen sus conocimientos técnicos al servicio de instituciones
              educativas, organizaciones sociales y vecinos de la provincia, cumpliendo con su
              formación ciudadana bajo los lineamientos de la DRSU.
            </p>
          </div>

          {/* 3 pilares de aplicación práctica */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#F5F7FA] text-[#0F2D4A]">
                <Network size={20} strokeWidth={1.75} />
              </span>
              <h4 className="mt-4 font-semibold text-[#1E293B]">Mirada Sistémica</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Analizamos procesos y problemas reales de organizaciones locales antes de proponer
                herramientas tecnológicas, entendiendo su contexto y limitaciones.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#F5F7FA] text-[#0F2D4A]">
                <Code2 size={20} strokeWidth={1.75} />
              </span>
              <h4 className="mt-4 font-semibold text-[#1E293B]">Soluciones de Software y Soporte</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Desarrollamos aplicaciones básicas, sitios web o mejoras digitales que ayuden a
                ordenar y facilitar tareas cotidianas en entidades de nuestra comunidad.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-[#F5F7FA] text-[#0F2D4A]">
                <ShieldCheck size={20} strokeWidth={1.75} />
              </span>
              <h4 className="mt-4 font-semibold text-[#1E293B]">Alfabetización y Ciudadanía Digital</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#475569]">
                Brindamos capacitaciones prácticas sobre el uso responsable, seguro y productivo de
                herramientas informáticas a docentes, escolares y ciudadanos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sección 4: Decanato ────────────────────────────────────────── */}
      <section id="decanato" className="scroll-mt-24 bg-white py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-center gap-8 rounded-2xl border border-slate-200 bg-[#F5F7FA] p-6 sm:p-8 md:flex-row lg:p-10">
            <Retrato
              src={IMG_DECANO}
              alt="Dr. Carlos Alcides Almidón Ortiz, Decano de la Facultad de Ingeniería"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1D5B96]">
                Decanato de la Facultad de Ingeniería
              </p>
              <h3 className="mt-2 text-xl font-bold text-[#1E293B] sm:text-2xl">
                Dr. Carlos Alcides Almidón Ortiz
              </h3>
              <blockquote className="mt-4 border-l-2 border-[#E2E8F0] pl-4 text-sm leading-relaxed text-[#475569] sm:text-base">
                "La formación de un ingeniero de sistemas no termina en el aula ni en el código;
                cobra verdadero sentido cuando nuestros estudiantes entienden los problemas de su
                comunidad y aportan soluciones útiles con ética y responsabilidad ciudadana."
              </blockquote>
              <a
                href="mailto:fi@undc.edu.pe"
                className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[#1D5B96] transition-colors hover:text-[#0F2D4A]"
              >
                <Mail size={15} /> fi@undc.edu.pe
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sección 5: Normativa institucional ────────────────────────── */}
      <section
        id="reglamento"
        className="scroll-mt-24 border-t border-[#E2E8F0] bg-[#F5F7FA] py-14"
      >
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex flex-col items-start justify-between gap-6 rounded-xl border border-slate-200 bg-white p-6 sm:p-8 md:flex-row md:items-center">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-widest text-[#1D5B96]">
                Normativa vigente
              </p>
              <h3 className="mt-2 text-lg font-bold text-[#1E293B] sm:text-xl">
                Reglamento de Responsabilidad Social Universitaria
              </h3>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#475569]">
                Consulta el documento oficial de la UNDC que regula la planificación, ejecución y
                validación del Servicio Social Universitario y las actividades de RSU en la
                facultad.
              </p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-3">
              <a
                href={PDF_REGLAMENTO}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-slate-300 px-4 py-2.5 font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                Ver en línea
              </a>
              <a
                href={PDF_REGLAMENTO}
                download="REGLAMENTO-RSU-UNDC.pdf"
                target="_blank"
                className="rounded-lg bg-[#0F2D4A] px-4 py-2.5 font-medium text-white transition-colors hover:bg-[#18426B]"
              >
                Descargar PDF
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── Sección 6: Pie de página institucional ────────────────────── */}
      <footer id="contacto" className="scroll-mt-24 bg-[#0B1F33] pt-14 pb-8 text-slate-300">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid grid-cols-1 gap-10 border-b border-slate-800 pb-10 md:grid-cols-3">
            {/* Colaboración institucional */}
            <div>
              <div className="mb-4 inline-flex items-center gap-3 rounded-lg bg-white/95 px-3 py-2">
                <img
                  src={LOGO_FI}
                  alt="Facultad de Ingeniería — UNDC"
                  className="h-9 w-auto object-contain"
                />
                <span className="text-xl font-light text-slate-300">×</span>
                <img
                  src={LOGO_DRSU}
                  alt="Dirección de Responsabilidad Social Universitaria — UNDC"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <p className="max-w-xs text-sm leading-relaxed">
                Área de Responsabilidad Social Universitaria – Facultad de Ingeniería (Escuela
                Profesional de Ingeniería de Sistemas), Universidad Nacional de Cañete.
              </p>
            </div>

            {/* Horario de atención */}
            <div>
              <h3 className="flex items-center gap-2 font-semibold text-white">
                <Clock size={16} /> Horario de Atención
              </h3>
              <ul className="mt-3 space-y-1.5 text-sm leading-relaxed">
                <li>Lunes a Viernes</li>
                <li>Turno Mañana: 8:00 a.m. – 1:00 p.m.</li>
                <li>Turno Tarde: 2:00 p.m. – 5:00 p.m.</li>
              </ul>
            </div>

            {/* Ubicación y contacto */}
            <div>
              <h3 className="font-semibold text-white">Contacto</h3>
              <ul className="mt-3 space-y-2 text-sm leading-relaxed">
                <li className="flex items-start gap-2">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>Sede: Av. Mariscal Benavides N° 322, San Vicente – Cañete</span>
                </li>
                <li className="flex items-start gap-2">
                  <Mail size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <a href="mailto:fi@undc.edu.pe" className="transition-colors hover:text-white">
                    Correo: fi@undc.edu.pe
                  </a>
                </li>
                <li className="flex items-start gap-2">
                  <Phone size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>Teléfono: +51 949 026 908</span>
                </li>
                <li className="flex items-start gap-2">
                  <Facebook size={15} className="mt-0.5 shrink-0 text-slate-400" />
                  <span>Facebook Oficial: Facultad de Ingeniería UNDC</span>
                </li>
              </ul>
            </div>
          </div>

          <p className="pt-6 text-center text-xs text-slate-400">
            © 2026 Facultad de Ingeniería – Universidad Nacional de Cañete. En coordinación con la
            Dirección de Responsabilidad Social Universitaria.
          </p>
        </div>
      </footer>
    </div>
  )
}
