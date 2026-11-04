// Mapa estilizado de Manaus (viewBox 1000 x 680). Não é cartografia exata:
// é uma leitura editorial das zonas, com o Rio Negro ao sul e o Encontro das Águas a leste.

export type ZoneId = 'oeste' | 'centro-oeste' | 'sul' | 'centro-sul' | 'norte' | 'leste'

export interface Zone {
  id: ZoneId
  name: string
  short: string
  color: string // var css
  hex: string
  polygon: [number, number][]
  label: [number, number]
}

export const VIEWBOX = { w: 1000, h: 680 }

export const ZONES: Zone[] = [
  {
    id: 'oeste',
    name: 'Zona Oeste',
    short: 'Oeste',
    color: 'var(--color-z-oeste)',
    hex: '#2eb46c',
    polygon: [[70, 262], [330, 200], [372, 330], [392, 470], [334, 584], [238, 566], [150, 528], [96, 470], [72, 380]],
    label: [196, 300],
  },
  {
    id: 'centro-oeste',
    name: 'Zona Centro-Oeste',
    short: 'Centro-Oeste',
    color: 'var(--color-z-centrooeste)',
    hex: '#1fa7a0',
    polygon: [[330, 200], [520, 214], [532, 330], [470, 400], [372, 330]],
    label: [446, 236],
  },
  {
    id: 'sul',
    name: 'Zona Sul',
    short: 'Sul',
    color: 'var(--color-z-sul)',
    hex: '#f5b83d',
    polygon: [[392, 470], [470, 400], [604, 420], [682, 470], [694, 600], [604, 628], [480, 630], [400, 604], [334, 584]],
    label: [468, 470],
  },
  {
    id: 'centro-sul',
    name: 'Zona Centro-Sul',
    short: 'Centro-Sul',
    color: 'var(--color-z-centrosul)',
    hex: '#7b6cf0',
    polygon: [[470, 400], [532, 330], [520, 214], [652, 230], [704, 320], [682, 470], [604, 420]],
    label: [618, 292],
  },
  {
    id: 'norte',
    name: 'Zona Norte',
    short: 'Norte',
    color: 'var(--color-z-norte)',
    hex: '#3d7afa',
    polygon: [[330, 200], [356, 78], [470, 46], [620, 38], [736, 62], [802, 96], [782, 230], [652, 230], [520, 214]],
    label: [612, 96],
  },
  {
    id: 'leste',
    name: 'Zona Leste',
    short: 'Leste',
    color: 'var(--color-z-leste)',
    hex: '#f2694c',
    polygon: [[652, 230], [782, 230], [802, 96], [884, 132], [936, 186], [956, 300], [946, 424], [908, 540], [878, 598], [790, 604], [694, 600], [682, 470], [704, 320]],
    label: [840, 410],
  },
]

export const ZONE = Object.fromEntries(ZONES.map((z) => [z.id, z])) as Record<ZoneId, Zone>

export interface Bairro {
  id: string
  name: string
  zone: ZoneId
  x: number
  y: number
}

export const BAIRROS: Bairro[] = [
  // Oeste
  { id: 'ponta-negra', name: 'Ponta Negra', zone: 'oeste', x: 150, y: 482 },
  { id: 'taruma', name: 'Tarumã', zone: 'oeste', x: 136, y: 334 },
  { id: 'santo-agostinho', name: 'Santo Agostinho', zone: 'oeste', x: 232, y: 430 },
  { id: 'lirio-do-vale', name: 'Lírio do Vale', zone: 'oeste', x: 300, y: 404 },
  { id: 'compensa', name: 'Compensa', zone: 'oeste', x: 330, y: 520 },
  // Centro-Oeste
  { id: 'planalto', name: 'Planalto', zone: 'centro-oeste', x: 396, y: 254 },
  { id: 'redencao', name: 'Redenção', zone: 'centro-oeste', x: 474, y: 262 },
  { id: 'dom-pedro', name: 'Dom Pedro', zone: 'centro-oeste', x: 424, y: 310 },
  { id: 'alvorada', name: 'Alvorada', zone: 'centro-oeste', x: 458, y: 362 },
  // Sul
  { id: 'sao-raimundo', name: 'São Raimundo', zone: 'sul', x: 420, y: 544 },
  { id: 'centro', name: 'Centro', zone: 'sul', x: 522, y: 592 },
  { id: 'praca-14', name: 'Praça 14', zone: 'sul', x: 556, y: 528 },
  { id: 'cachoeirinha', name: 'Cachoeirinha', zone: 'sul', x: 604, y: 560 },
  { id: 'petropolis', name: 'Petrópolis', zone: 'sul', x: 648, y: 506 },
  // Centro-Sul
  { id: 'vieiralves', name: 'N. S. das Graças', zone: 'centro-sul', x: 532, y: 462 },
  { id: 'adrianopolis', name: 'Adrianópolis', zone: 'centro-sul', x: 594, y: 446 },
  { id: 'chapada', name: 'Chapada', zone: 'centro-sul', x: 524, y: 394 },
  { id: 'aleixo', name: 'Aleixo', zone: 'centro-sul', x: 648, y: 384 },
  { id: 'parque-10', name: 'Parque 10', zone: 'centro-sul', x: 594, y: 334 },
  { id: 'flores', name: 'Flores', zone: 'centro-sul', x: 578, y: 262 },
  // Norte
  { id: 'monte-oliveiras', name: 'Monte das Oliveiras', zone: 'norte', x: 418, y: 132 },
  { id: 'santa-etelvina', name: 'Santa Etelvina', zone: 'norte', x: 500, y: 92 },
  { id: 'cidade-nova', name: 'Cidade Nova', zone: 'norte', x: 590, y: 152 },
  { id: 'novo-aleixo', name: 'Novo Aleixo', zone: 'norte', x: 706, y: 176 },
  // Leste
  { id: 'jorge-teixeira', name: 'Jorge Teixeira', zone: 'leste', x: 852, y: 228 },
  { id: 'zumbi', name: 'Zumbi', zone: 'leste', x: 790, y: 300 },
  { id: 'tancredo-neves', name: 'Tancredo Neves', zone: 'leste', x: 878, y: 338 },
  { id: 'coroado', name: 'Coroado', zone: 'leste', x: 736, y: 380 },
  { id: 'sao-jose', name: 'São José Operário', zone: 'leste', x: 800, y: 456 },
]

export const BAIRRO = Object.fromEntries(BAIRROS.map((b) => [b.id, b])) as Record<string, Bairro>

/** Base da Vet Domicílio (ponto de saída das rotas) */
export const BASE = { name: 'Base Vet Domicílio', bairro: 'Adrianópolis', x: 572, y: 420 }

/** Rio Negro: margem norte (a cidade fica acima desta linha) */
export const RIVER_PATH =
  'M0,232 C40,300 52,380 84,452 C116,520 186,560 262,580 C350,604 420,628 500,640 C590,652 660,640 742,622 C820,606 880,604 940,612 C970,616 990,620 1000,622 L1000,680 L0,680 Z'

/** Rio Solimões entrando pelo sudeste (água barrenta), o Encontro das Águas */
export const SOLIMOES_PATH =
  'M760,680 C820,664 880,650 940,648 C970,647 990,648 1000,650 L1000,680 Z'

/** Igarapés (afluentes urbanos) */
export const IGARAPES = [
  'M70,262 C100,250 120,232 150,200 C170,180 190,170 214,162', // Tarumã
  'M424,560 C430,520 440,480 452,450 C462,424 470,404 470,400', // São Raimundo
  'M560,620 C566,590 574,560 590,530 C604,504 620,486 640,470 C664,450 690,430 704,400', // Educandos / Quarenta
  'M880,600 C900,560 930,520 960,500 C980,490 990,486 1000,484', // Puraquequara
]

/** Avenidas estilizadas */
export const AVENIDAS: { name: string; d: string }[] = [
  { name: 'Av. Coronel Teixeira', d: 'M150,482 C190,462 240,448 300,438 C340,432 380,436 420,446' },
  { name: 'Av. Constantino Nery', d: 'M522,592 C500,540 480,480 470,420 C462,360 448,300 430,240 C420,200 400,150 390,100' },
  { name: 'Av. Djalma Batista', d: 'M540,560 C548,500 556,440 566,380 C576,320 590,260 600,200 C606,170 612,140 616,110' },
  { name: 'Av. Torquato Tapajós', d: 'M430,240 C400,200 372,160 356,110' },
  { name: 'Av. Grande Circular', d: 'M600,200 C660,210 720,240 770,280 C810,312 840,350 860,400' },
  { name: 'Av. das Torres', d: 'M616,110 C660,140 700,170 736,210 C760,236 780,262 790,300' },
  { name: 'Av. Efigênio Salles', d: 'M594,446 C626,420 660,400 700,384 C730,372 760,368 790,370' },
  { name: 'Estrada da Ponta Negra', d: 'M150,482 C170,430 200,380 240,340 C280,300 320,270 372,250' },
]
