import { motion } from "motion/react"

export const EASE = [0.22, 1, 0.36, 1]

export function Reveal({ children, delay = 0, className = "" }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.4, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}

export function Section({ id, eyebrow, title, lede, children }) {
  return (
    <section id={id} className="border-t border-line py-20 md:py-28">
      <div className="mx-auto max-w-5xl px-6">
        <Reveal>
          {eyebrow && (
            <p className="mb-3 text-xs font-medium uppercase tracking-[0.14em] text-muted">
              {eyebrow}
            </p>
          )}
          <h2 className="max-w-3xl text-3xl font-bold leading-[1.15] md:text-4xl">
            {title}
          </h2>
          {lede && (
            <p className="mt-5 max-w-2xl text-[17px] leading-relaxed text-muted">{lede}</p>
          )}
        </Reveal>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  )
}

export function Stat({ value, label, tone = "ink" }) {
  const colour = { ink: "text-ink", primary: "text-primary", accent: "text-accent" }[tone]
  return (
    <div className="rounded-[--radius-card] border border-line bg-surface p-5">
      <div className={`display text-3xl font-bold tabular-nums ${colour}`}>{value}</div>
      <div className="mt-1.5 text-sm leading-snug text-muted">{label}</div>
    </div>
  )
}

export function Card({ children, className = "" }) {
  return (
    <div className={`rounded-[--radius-card] border border-line bg-surface ${className}`}>
      {children}
    </div>
  )
}

export function Callout({ children }) {
  return (
    <Reveal>
      <div className="my-8 border-l-2 border-primary bg-surface py-4 pl-5 pr-4">
        <p className="text-[17px] leading-relaxed">{children}</p>
      </div>
    </Reveal>
  )
}

export function Tip({ active, payload, label, unit = "%", labelPrefix = "" }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-md border border-line bg-surface px-3 py-2 text-sm shadow-sm">
      <div className="mb-1 font-medium">{labelPrefix}{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-muted">
          <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="ml-auto tabular-nums text-ink">
            {typeof p.value === "number" ? p.value.toFixed(2) : p.value}{unit}
          </span>
        </div>
      ))}
    </div>
  )
}
