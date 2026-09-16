import { CalendarDays } from "lucide-react"

/**
 * The student dashboard's opening block.
 *
 * A large, soft-blue field rather than a white card: it is the first thing on
 * the page and the only element allowed to be this big, which is what gives
 * the rest of the page something to be measured against.
 *
 * The greeting line and the class/roll/session line are rendered as single
 * text nodes on purpose — the portal E2E suite asserts on both strings, and
 * a student's own name and class are the two facts this screen exists to
 * confirm, so they should not be split across decorative chips.
 */
export function StudentHero({
  greeting,
  studentName,
  metaLine,
  today,
}: {
  greeting: string
  studentName: string
  metaLine: string
  today: string
}) {
  return (
    <section className="hero-wash relative isolate overflow-hidden rounded-3xl bg-surface-blue px-6 py-9 sm:px-10 sm:py-12">
      <CampusArt />

      <div className="relative max-w-xl">
        <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-surface-blue-foreground/75">
          <CalendarDays className="size-3.5" />
          {today}
        </p>

        <h1 className="mt-3 font-heading text-[2rem] font-bold leading-[1.05] tracking-[-0.035em] text-surface-blue-foreground sm:text-[2.6rem]">
          {greeting}, {studentName}
        </h1>

        <p className="mt-5 inline-flex rounded-full bg-card/70 px-4 py-2 text-[13px] font-semibold text-surface-blue-foreground">
          {metaLine}
        </p>
      </div>
    </section>
  )
}

/**
 * Decorative campus mark. Purely ornamental, so it is hidden from assistive
 * technology and drawn from the surface tokens rather than fixed hex values.
 * Hidden below `sm`, where the space belongs to the greeting.
 */
function CampusArt() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 320 200"
      className="pointer-events-none absolute -right-6 bottom-0 top-0 hidden h-full w-[320px] text-surface-blue-foreground sm:block"
      fill="none"
    >
      {/* sun */}
      <circle cx="248" cy="46" r="20" className="fill-warning/45" />
      {/* main block */}
      <path d="M150 196V108l52-34 52 34v88H150Z" className="fill-current opacity-[0.2]" />
      {/* roof */}
      <path d="M190 74h24v-22h-24z" className="fill-current opacity-[0.26]" />
      <path d="M202 34l16 18h-32l16-18Z" className="fill-current opacity-[0.32]" />
      {/* windows */}
      <rect x="166" y="124" width="16" height="18" rx="2" className="fill-card/70" />
      <rect x="194" y="124" width="16" height="18" rx="2" className="fill-card/70" />
      <rect x="222" y="124" width="16" height="18" rx="2" className="fill-card/70" />
      {/* door */}
      <path d="M192 196v-30a10 10 0 0 1 20 0v30h-20Z" className="fill-card/80" />
      {/* side wing */}
      <path d="M262 196v-58h44v58h-44Z" className="fill-current opacity-[0.14]" />
      {/* trees */}
      <circle cx="122" cy="150" r="22" className="fill-success/35" />
      <rect x="119" y="166" width="6" height="30" rx="3" className="fill-current opacity-[0.22]" />
      <circle cx="90" cy="168" r="14" className="fill-success/30" />
      <rect x="87" y="178" width="6" height="18" rx="3" className="fill-current opacity-[0.2]" />
      {/* ground */}
      <rect x="60" y="194" width="260" height="6" rx="3" className="fill-current opacity-[0.18]" />
    </svg>
  )
}
