import { iso } from '@/data/time'
import type { PetPhoto } from '@/store'

/**
 * Fotos clínicas ilustrativas (SVG gerado). Sem fotos reais de lesão no protótipo,
 * desenhamos close-ups convincentes: pelagem, pele e a lesão com intensidade variável,
 * para o comparador de antes e depois fazer sentido.
 */

type Scene = 'patas' | 'orelha' | 'ferida' | 'pele'

function rng(seed: number) {
  let a = seed >>> 0 || 1
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const W = 800
const H = 600
const r1 = (n: number) => Math.round(n * 10) / 10

function fur(rand: () => number, palette: string[], count: number, angle: number, spread: number, len: [number, number], area?: { x: number; y: number; rx: number; ry: number }) {
  let out = ''
  for (let i = 0; i < count; i++) {
    let x: number
    let y: number
    if (area) {
      const t = rand() * Math.PI * 2
      const d = Math.sqrt(rand())
      x = area.x + Math.cos(t) * area.rx * d
      y = area.y + Math.sin(t) * area.ry * d
    } else {
      x = rand() * (W + 80) - 40
      y = rand() * (H + 80) - 40
    }
    const a = ((angle + (rand() - 0.5) * spread) * Math.PI) / 180
    const l = len[0] + rand() * (len[1] - len[0])
    const c = palette[Math.floor(rand() * palette.length)]
    const cx = x + Math.cos(a) * l * 0.5 + (rand() - 0.5) * 6
    const cy = y + Math.sin(a) * l * 0.5 + (rand() - 0.5) * 6
    out += `<path d="M${r1(x)} ${r1(y)}Q${r1(cx)} ${r1(cy)} ${r1(x + Math.cos(a) * l)} ${r1(y + Math.sin(a) * l)}" stroke="${c}" stroke-width="${r1(1.4 + rand() * 1.8)}" stroke-opacity="${r1(0.55 + rand() * 0.4)}"/>`
  }
  return `<g fill="none" stroke-linecap="round">${out}</g>`
}

function dots(rand: () => number, n: number, area: { x: number; y: number; rx: number; ry: number }, color: string, r: [number, number], op: number) {
  let out = ''
  for (let i = 0; i < n; i++) {
    const t = rand() * Math.PI * 2
    const d = Math.sqrt(rand())
    const x = area.x + Math.cos(t) * area.rx * d
    const y = area.y + Math.sin(t) * area.ry * d
    out += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r[0] + rand() * (r[1] - r[0]))}" fill="${color}" fill-opacity="${r1(op * (0.5 + rand() * 0.5))}"/>`
  }
  return out
}

const DEFS = `<defs>
<filter id="b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="22"/></filter>
<filter id="b2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 .5 0"/></filter>
<radialGradient id="v" cx="50%" cy="46%" r="70%"><stop offset="55%" stop-color="#000" stop-opacity="0"/><stop offset="100%" stop-color="#000" stop-opacity=".55"/></radialGradient>
<radialGradient id="l" cx="30%" cy="20%" r="60%"><stop offset="0%" stop-color="#fff" stop-opacity=".22"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="pad" cx="40%" cy="35%" r="70%"><stop offset="0%" stop-color="#5a4d49"/><stop offset="100%" stop-color="#231c1b"/></radialGradient>
<radialGradient id="canal" cx="50%" cy="50%" r="50%"><stop offset="0%" stop-color="#120a08"/><stop offset="70%" stop-color="#3b2220"/><stop offset="100%" stop-color="#8a4f45"/></radialGradient>
<linearGradient id="ear" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f6d3c4"/><stop offset="100%" stop-color="#e2a996"/></linearGradient>
</defs>`

function patas(rand: () => number, s: number) {
  const pads = [
    { x: 228, y: 210, rx: 44, ry: 54 },
    { x: 345, y: 160, rx: 46, ry: 58 },
    { x: 465, y: 160, rx: 46, ry: 58 },
    { x: 582, y: 210, rx: 44, ry: 54 },
  ]
  const gaps = [
    { x: 286, y: 200, rx: 26 + 22 * s, ry: 62 + 18 * s },
    { x: 405, y: 170, rx: 26 + 22 * s, ry: 62 + 18 * s },
    { x: 524, y: 200, rx: 26 + 22 * s, ry: 62 + 18 * s },
    { x: 405, y: 300, rx: 170 + 30 * s, ry: 34 + 14 * s },
  ]
  let g = `<rect width="${W}" height="${H}" fill="#3a2a21"/>`
  g += fur(rand, ['#22170f', '#3f2c20', '#5d4130', '#17100c', '#7a5638', '#2c1f17'], 950, 95, 40, [16, 34])
  /* pele exposta entre os dedos (alopecia) */
  for (const a of gaps) g += `<ellipse cx="${a.x}" cy="${a.y}" rx="${a.rx}" ry="${a.ry}" fill="#e2b0a4" fill-opacity="${r1(0.25 + 0.75 * s)}" filter="url(#b2)"/>`
  /* eritema */
  for (const a of gaps) g += `<ellipse cx="${a.x}" cy="${a.y}" rx="${r1(a.rx * 1.15)}" ry="${r1(a.ry * 1.05)}" fill="#d63b46" fill-opacity="${r1(0.95 * s)}" filter="url(#b)"/>`
  for (const a of gaps) g += `<ellipse cx="${a.x}" cy="${a.y}" rx="${r1(a.rx * 0.55)}" ry="${r1(a.ry * 0.55)}" fill="#e4525b" fill-opacity="${r1(0.8 * s)}" filter="url(#b2)"/>`
  for (const a of gaps) g += dots(rand, Math.round(30 * s), a, '#9e1f2b', [2.5, 6.5], s)
  for (const a of gaps) g += dots(rand, Math.round(12 * s), a, '#d6b06a', [3, 7], 0.85 * s)
  /* pelos voltando a crescer */
  for (const a of gaps) g += fur(rand, ['#3f2c20', '#5d4130', '#22170f'], Math.round(90 * (1 - s)), 95, 50, [10, 24], a)
  /* coxins */
  for (const p of pads) g += `<ellipse cx="${p.x}" cy="${p.y}" rx="${p.rx}" ry="${p.ry}" fill="url(#pad)"/>`
  g += `<path d="M285 440C310 360 500 360 525 440C545 505 490 550 405 550C320 550 265 505 285 440Z" fill="url(#pad)"/>`
  for (const p of pads) g += dots(rand, 36, { x: p.x, y: p.y, rx: p.rx * 0.8, ry: p.ry * 0.8 }, '#6d605b', [1, 2.2], 0.5)
  for (const p of pads) g += `<ellipse cx="${p.x - 10}" cy="${p.y - 18}" rx="${p.rx * 0.4}" ry="${p.ry * 0.22}" fill="#fff" fill-opacity=".09"/>`
  g += `<ellipse cx="380" cy="420" rx="56" ry="18" fill="#fff" fill-opacity=".08"/>`
  return g
}

function orelha(rand: () => number, s: number) {
  let g = `<rect width="${W}" height="${H}" fill="#c58f40"/>`
  g += fur(rand, ['#b07a30', '#d9a756', '#e6bd75', '#9c6a28', '#f0cf8c'], 850, 70, 50, [18, 38])
  g += `<path d="M120 80C260 20 560 30 680 140C760 230 720 470 600 540C470 610 250 590 160 470C80 360 40 150 120 80Z" fill="url(#ear)"/>`
  g += fur(rand, ['#d9a756', '#e6bd75', '#b07a30'], 120, 20, 70, [14, 26], { x: 150, y: 300, rx: 60, ry: 220 })
  /* dobras da cartilagem */
  g += `<g fill="none" stroke="#c98a77" stroke-width="5" stroke-linecap="round" stroke-opacity=".55"><path d="M230 170C300 140 380 150 430 200"/><path d="M220 420C270 470 360 500 450 480"/><path d="M560 190C610 250 620 330 590 400"/></g>`
  /* inflamação ao redor do canal */
  g += `<ellipse cx="430" cy="320" rx="${170 + 50 * s}" ry="${150 + 40 * s}" fill="#d8434c" fill-opacity="${r1(0.8 * s)}" filter="url(#b)"/>`
  g += `<ellipse cx="430" cy="320" rx="${110 + 30 * s}" ry="${100 + 30 * s}" fill="#b52a35" fill-opacity="${r1(0.6 * s)}" filter="url(#b)"/>`
  /* canal (estreita quando inflamado) */
  g += `<ellipse cx="430" cy="322" rx="${r1(70 - 26 * s)}" ry="${r1(92 - 34 * s)}" fill="url(#canal)"/>`
  /* secreção */
  g += dots(rand, Math.round(34 * s), { x: 430, y: 330, rx: 110, ry: 120 }, '#5b3a1c', [4, 11], 0.9 * s)
  g += dots(rand, Math.round(18 * s), { x: 430, y: 330, rx: 90, ry: 100 }, '#8a5e2a', [3, 8], 0.8 * s)
  g += `<ellipse cx="380" cy="240" rx="80" ry="26" fill="#fff" fill-opacity=".14" transform="rotate(-20 380 240)"/>`
  return g
}

function ferida(rand: () => number, s: number) {
  let g = `<rect width="${W}" height="${H}" fill="#eadcc5"/>`
  g += fur(rand, ['#efe3cf', '#e5d4ba', '#f6ecdc', '#d3bd9c', '#c9b18d'], 900, 15, 30, [18, 36])
  /* área tricotomizada */
  g += `<ellipse cx="400" cy="305" rx="300" ry="190" fill="#f0cdbf" filter="url(#b2)"/>`
  g += dots(rand, 380, { x: 400, y: 305, rx: 280, ry: 175 }, '#bf9f88', [0.8, 1.8], 0.7)
  g += fur(rand, ['#e5d4ba', '#d3bd9c'], Math.round(160 * (1 - s)), 15, 40, [6, 12], { x: 400, y: 305, rx: 290, ry: 180 })
  const path = 'M210 318C290 300 360 296 420 300C480 304 540 310 600 296'
  g += `<path d="${path}" stroke="#d9454e" stroke-opacity="${r1(0.25 + 0.6 * s)}" stroke-width="${r1(26 + 70 * s)}" fill="none" stroke-linecap="round" filter="url(#b)"/>`
  g += `<path d="${path}" stroke="#a4434a" stroke-width="${r1(2 + 5 * s)}" fill="none" stroke-linecap="round"/>`
  /* crosta */
  for (let i = 0; i < 9; i++) {
    const x = 230 + i * 42 + rand() * 10
    g += `<ellipse cx="${r1(x)}" cy="${r1(306 + Math.sin(i) * 6)}" rx="${r1(10 + rand() * 9)}" ry="${r1(3 + rand() * 2)}" fill="#6e2a24" fill-opacity="${r1(0.75 * s)}"/>`
  }
  /* pontos (fio azul) */
  if (s > 0.25) {
    for (let i = 0; i < 7; i++) {
      const x = 245 + i * 52
      const y = 308 + Math.sin(i * 0.9) * 5
      g += `<g stroke="#26357d" stroke-width="3.2" stroke-linecap="round" fill="none"><path d="M${x - 12} ${y - 16}L${x + 12} ${y + 16}"/><path d="M${x + 12} ${y - 16}L${x - 12} ${y + 16}"/></g>`
      g += `<circle cx="${x - 12}" cy="${y - 16}" r="3.4" fill="#b23a42" fill-opacity="${r1(0.5 * s)}"/><circle cx="${x + 12}" cy="${y + 16}" r="3.4" fill="#b23a42" fill-opacity="${r1(0.5 * s)}"/>`
    }
  }
  return g
}

function pele(rand: () => number, s: number) {
  let g = `<rect width="${W}" height="${H}" fill="#e7b9aa"/>`
  g += dots(rand, 600, { x: 400, y: 300, rx: 520, ry: 420 }, '#c48f80', [0.8, 2], 0.7)
  g += fur(rand, ['#3a2a21', '#5d4130', '#22170f'], 260, 100, 40, [10, 24])
  const spots = [
    { x: 300, y: 260, rx: 110, ry: 80 },
    { x: 520, y: 330, rx: 130, ry: 90 },
    { x: 420, y: 450, rx: 90, ry: 60 },
  ]
  for (const a of spots) g += `<ellipse cx="${a.x}" cy="${a.y}" rx="${a.rx}" ry="${a.ry}" fill="#d0404a" fill-opacity="${r1(0.75 * s)}" filter="url(#b)"/>`
  for (const a of spots) g += dots(rand, Math.round(30 * s), a, '#a8242f', [2.5, 5.5], s)
  return g
}

const SCENES: Record<Scene, (rand: () => number, s: number) => string> = { patas, orelha, ferida, pele }
const cache = new Map<string, string>()

/** data URL de uma foto clínica ilustrativa. severity: 0 (curado) a 1 (pior) */
export function clinicalPhoto(scene: Scene, severity: number, seed: number) {
  const key = `${scene}:${severity}:${seed}`
  const hit = cache.get(key)
  if (hit) return hit
  const rand = rng(seed * 7919 + Math.round(severity * 1000))
  const rot = r1((rand() - 0.5) * 8)
  const dx = r1((rand() - 0.5) * 30)
  const dy = r1((rand() - 0.5) * 24)
  const k = r1(1.04 + rand() * 0.06)
  const warm = r1(rand() * 0.08)
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">${DEFS}<g transform="translate(${400 + dx} ${300 + dy}) rotate(${rot}) scale(${k}) translate(-400 -300)">${SCENES[scene](rng(seed), severity)}</g><rect width="${W}" height="${H}" filter="url(#n)" opacity=".35"/><rect width="${W}" height="${H}" fill="#ffb070" fill-opacity="${warm}"/><rect width="${W}" height="${H}" fill="url(#l)"/><rect width="${W}" height="${H}" fill="url(#v)"/></svg>`
  const url = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  cache.set(key, url)
  return url
}

/* ───────────── Fotos semeadas no protótipo ───────────── */

function seed(petId: string, subject: string, scene: Scene, rows: [number, string, number, string][]): PetPhoto[] {
  return rows.map(([offset, hhmm, severity, label], i) => ({
    id: `seed-${petId}-${scene}-${i}`,
    petId,
    date: iso(offset, hhmm),
    get src() {
      return clinicalPhoto(scene, severity, (petId.length * 31 + i * 97 + scene.length) | 0)
    },
    label,
    subject,
  }))
}

export const SEED_PHOTOS: PetPhoto[] = [
  ...seed('fred', 'Patas', 'patas', [
    [-28, '09:10', 1, 'Dermatite entre os dedos'],
    [-14, '15:20', 0.62, 'Após 14 dias de banho terapêutico'],
    [0, '08:50', 0.22, 'Pelos voltando a crescer'],
  ]),
  ...seed('fred', 'Abdômen', 'pele', [[-14, '15:25', 0.7, 'Placas avermelhadas na barriga']]),
  ...seed('thor', 'Orelha esquerda', 'orelha', [
    [-60, '18:05', 1, 'Otite com secreção escura'],
    [-46, '10:30', 0.55, 'Reavaliação, 14 dias de tópico'],
    [-14, '09:40', 0.15, 'Canal limpo, sem secreção'],
  ]),
  ...seed('mia', 'Ferida cirúrgica', 'ferida', [
    [-10, '16:00', 0.95, 'Pós-operatório da castração'],
    [-3, '11:15', 0.45, 'Cicatrização no 7º dia'],
  ]),
]
