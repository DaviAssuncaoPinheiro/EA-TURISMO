import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import {
  CalendarPlus,
  ChevronLeft,
  ClipboardPen,
  Hand,
  Send,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Badge, Button, Card, PetAvatar, VetAvatar } from "@/components/ui";
import {
  VET,
  VETS,
  WEEK_PLAN,
  zoneOfPet,
  type Pet,
  type Tutor,
} from "@/data/mock";
import { BAIRRO, ZONE } from "@/data/geo";
import { ageLabel, day, fmt, relDays } from "@/data/time";
import { cn, firstName } from "@/lib/utils";
import { petFacts, type PatientModel } from "./model";

const nf = (n: number) =>
  n.toLocaleString("pt-BR", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

/** Próximo dia em que algum veterinário está escalado na zona do paciente */
function suggestSlot(pet: Pet) {
  const zone = zoneOfPet(pet);
  for (let i = 1; i <= 14; i++) {
    const d = day(i);
    const wd = d.getDay();
    const vet = VETS.find((v) => WEEK_PLAN[v.id]?.[wd]?.includes(zone));
    if (vet) return { date: d, vet, zone: ZONE[zone] };
  }
  return null;
}

export function PatientHeader({
  pet,
  tutor,
  model,
}: {
  pet: Pet;
  tutor: Tutor;
  model: PatientModel;
}) {
  const nav = useNavigate();
  const f = petFacts(pet);
  const b = BAIRRO[tutor.bairro];

  const schedule = () => {
    const s = suggestSlot(pet);
    if (!s) return toast("Abrindo a agenda");
    toast.success(`Sugestão: ${fmt.weekday(s.date)}, ${fmt.short(s.date)}`, {
      description: `${s.vet.short} estará na ${s.zone.name} (${b?.name}).`,
      action: { label: "Abrir agenda", onClick: () => nav("/agenda") },
    });
  };
  const sendCard = () =>
    toast.success(`Carteira d${f.article} ${pet.name} enviada`, {
      description: `PDF pelo WhatsApp para ${firstName(tutor.name)} · ${tutor.phone}`,
    });

  const vn = model.visitNow;
  const register = () => {
    if (vn) return nav(`/campo/visita/${vn.visit.id}`);
    toast("Sem visita hoje. Agendar?", {
      description: `${pet.name} não tem visita marcada para hoje.`,
      action: { label: "Agendar", onClick: () => nav("/agenda?novo=1") },
    });
  };
  const alerts = pet.alerts ?? [];

  const chips = [
    f.species,
    pet.breed,
    ageLabel(pet.birth),
    `${nf(model.currentKg)} kg`,
    `${f.sex} ${f.neutered.toLowerCase()}`,
  ];

  const actions = (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      <Button
        variant="primary"
        onClick={register}
        className="col-span-2 h-11 sm:h-10"
      >
        <ClipboardPen className="size-4" strokeWidth={2} /> Registrar
        atendimento
      </Button>
      <Button variant="outline" onClick={schedule} className="h-11 sm:h-10">
        <CalendarPlus className="size-4" strokeWidth={2} /> Agendar
      </Button>
      <Button variant="outline" onClick={sendCard} className="h-11 sm:h-10">
        <Send className="size-4" strokeWidth={2} /> Enviar carteira
      </Button>
    </div>
  );

  return (
    <Card className="p-5 md:p-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 text-[13px] font-semibold text-ink-3">
          <Link
            to="/pacientes"
            aria-label="Voltar para pacientes"
            className="inline-flex size-[34px] items-center justify-center rounded-full bg-muted text-ink transition-[background,transform] hover:bg-muted-2 active:scale-95"
          >
            <ChevronLeft className="size-4" strokeWidth={2} />
          </Link>
          <Link to="/pacientes" className="hover:text-ink">
            Pacientes
          </Link>
          <span className="text-ink-4">/</span>
          <span className="text-ink">{pet.name}</span>
        </div>
        <div className="hidden shrink-0 lg:block">{actions}</div>
      </div>

      <div className="mt-4 flex flex-col gap-5 lg:mt-2">
        <div className="flex min-w-0 items-center gap-4 md:gap-5">
          <motion.div
            initial={{ scale: 0.94, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="relative shrink-0"
          >
            <PetAvatar pet={pet} size={112} className="max-md:size-[84px]!" />
            {vn?.status === "em-atendimento" && (
              <span className="absolute right-1 bottom-1.5 flex size-5 items-center justify-center rounded-full bg-lime ring-[3px] ring-card md:right-2 md:bottom-2">
                <span className="absolute inset-0 animate-ping rounded-full bg-lime opacity-60" />
              </span>
            )}
          </motion.div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
              <h1 className="text-[28px] leading-[1.1] font-bold tracking-[-0.03em] text-ink md:text-[32px]">
                {pet.name}
              </h1>
              {vn && vn.status === "em-atendimento" && (
                <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-lime pr-3 pl-1 text-[12px] font-semibold text-lime-ink">
                  <VetAvatar vetId={vn.visit.vetId} size={20} />
                  Em atendimento
                </span>
              )}
              {vn && vn.status === "concluida" && (
                <Badge tone="ok" dot>
                  Atendido hoje
                </Badge>
              )}
              {vn &&
                (vn.status === "agendada" || vn.status === "a-caminho") && (
                  <Badge tone="info" dot>
                    Visita hoje às {fmt.time(vn.visit.start)}
                  </Badge>
                )}
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {chips.map((c) => (
                <span
                  key={c}
                  className="inline-flex h-7 items-center rounded-full bg-muted px-3 text-[12.5px] font-semibold text-ink-2"
                >
                  {c}
                </span>
              ))}
            </div>
            <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[12.5px] font-medium text-ink-3">
              {vn && (
                <span>
                  {VET[vn.visit.vetId]?.short} · {vn.visit.reason}
                </span>
              )}
              {!vn && model.nextVisit && (
                <span>
                  Próxima visita{" "}
                  <span className="text-ink-2">
                    {relDays(model.nextVisit.start)}
                  </span>{" "}
                  · {model.nextVisit.reason}
                </span>
              )}
              {pet.microchip && (
                <span className="num">Microchip {pet.microchip}</span>
              )}
            </div>
          </div>
        </div>

        <div className="lg:hidden">{actions}</div>
      </div>

      {(alerts.length > 0 || pet.temperament) && (
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {alerts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: 0.1,
                duration: 0.3,
                ease: [0.25, 1, 0.5, 1],
              }}
              role="alert"
              className={cn(
                "flex items-center gap-3 rounded-[18px] bg-red-soft px-3.5 py-3",
                !pet.temperament && "md:col-span-2",
              )}
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-red text-white">
                <TriangleAlert className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-red">
                  Alerta clínico
                </div>
                {alerts.map((a) => (
                  <div
                    key={a}
                    className="text-[13.5px] leading-snug font-semibold text-ink"
                  >
                    {a}
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {pet.temperament && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-[18px] bg-surface px-3.5 py-3",
                !alerts.length && "md:col-span-2",
              )}
            >
              <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-card text-ink shadow-pill">
                <Hand className="size-4" strokeWidth={1.9} />
              </span>
              <div className="min-w-0">
                <div className="text-[12px] font-semibold text-ink-3">
                  Manejo
                </div>
                <div className="text-[13.5px] leading-snug font-semibold text-ink">
                  {pet.temperament}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
