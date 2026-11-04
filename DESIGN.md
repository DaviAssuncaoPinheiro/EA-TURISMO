# Vet Domicílio · Design system do protótipo

Protótipo clicável (100% mock, sem backend) de um SaaS para veterinários que atendem **em domicílio em Manaus/AM**. Ele vai ser enviado ao dono da clínica para que ele clique, sinta o sistema e decida se faz sentido. Tem que parecer **produto real em produção**, nunca template.

## Mundo visual: "caderno de campo do veterinário"
- Papel osso (`bg-paper`), cartões em `bg-card` com borda `border-line` e `shadow-card`. Nada de glassmorphism, gradiente roxo, neon ou emoji decorativo.
- Tinta verde-sálvia profunda (`sage-700/800/900`) para estrutura e ações primárias.
- **Terracota (`terra-500/600`) é o único acento de ação/atenção por tela.** Use pouco.
- Status: `ok`, `warn`, `late`, `info` (+ `-bg`). Zonas de Manaus: `z-oeste`, `z-centrosul`, `z-sul`, `z-norte`, `z-leste`, `z-centrooeste` (hex em `src/data/geo.ts`).
- O **Rio Negro** (`river`, chá escuro) e o **Solimões** (`solimoes`, barro) aparecem só no mapa: é o elemento de lugar.

## Tipografia
- `font-display` (Fraunces SOFT): títulos de página, nomes de pacientes em destaque, números grandes. Peso 500–600. Nunca em texto corrido nem em botões.
- `font-sans` (Instrument Sans): toda a interface. Tamanhos base de 12–15px. A densidade é de ferramenta profissional (Linear e Notion Calendar como referência).
- `font-mono` (IBM Plex Mono): lote de vacina, CRMV, microchip, horários em tabela e a classe `.eyebrow` (rótulo pequeno em caixa alta).
- Use a classe `.num` (tabular-nums) em qualquer número que se alinhe ou anime.

## Componentes compartilhados (`src/components/ui/index.tsx`), só leitura
`Button` (primary | accent | outline | ghost | subtle | danger; xs | sm | md | lg), `Badge` (tones), `Card`, `CardHeader`, `PetAvatar` (foto com fallback), `VetAvatar`, `Tip` (tooltip), `Segmented`, `NumberTicker`, `CountUp`, `Ring`, `Kbd`, `Divider`, `PageHeader`, `Empty`.
- Helpers: `src/lib/utils.ts` (`cn`, `brl`, `kg`, `pct`, `firstName`, `fill`) e `src/lib/status.ts` (labels e tons de status, `dueState`).
- Datas: `src/data/time.ts` (`day`, `iso`, `fmt.*`, `relDays`, `daysFromToday`, `ageLabel`). Toda data é relativa a hoje.
- Dados: `src/data/mock.ts` e `src/data/geo.ts`.
- Estado da demo (zustand persistido): `src/store.ts`, que guarda status das visitas, rota otimizada, lembretes, eventos, doses e pesos novos registrados em campo e o modo offline. **Uma ação feita numa tela precisa refletir nas outras.** Exemplo: finalizar o atendimento do Bob no app de campo cria um evento na ficha dele e lembretes novos.
- Ícones: `lucide-react` com `strokeWidth={1.8}`, tamanho 16–18px na interface.
- Movimento: `motion/react`. Use easing out-quart/expo, 150–400ms, e anime apenas transform/opacity. Use stagger leve em listas. Nada de bounce exagerado. Respeite reduced-motion (já global).
- Toast: `import { toast } from 'sonner'`.

## Regras de craft
- Espaçamento de página: `px-4 md:px-8 py-6 md:py-8`, largura máxima ~1320px. Use `PageHeader` no topo das páginas desktop.
- Hierarquia por peso, tamanho e cor de texto (`ink`, `ink-2`, `ink-3`), não por caixas dentro de caixas. Evite cards aninhados.
- Hover em todo elemento clicável, `focus-visible` já é global e o alvo de toque mínimo no mobile é 44px.
- Escreva copy real, em português do Brasil, no tom de clínica: direto e acolhedor. Nada de lorem ipsum nem placeholders do tipo "Item 1".
- A interface tem que funcionar em 390px de largura (celular) e em 1440px (desktop).
- Não pode haver scroll horizontal na página, a não ser em faixas intencionais com `overflow-x-auto no-scrollbar`.
- Não instale dependências novas sem necessidade forte. As disponíveis são react-router-dom, motion, lucide-react, recharts, vaul, cmdk, sonner, zustand e os pacotes radix (tooltip, dialog, popover, switch, tabs).
