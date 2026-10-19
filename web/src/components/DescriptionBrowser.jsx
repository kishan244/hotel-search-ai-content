import { useMemo, useState } from "react"
import { AnimatePresence, motion } from "motion/react"
import { Card, EASE } from "./ui.jsx"

const BANDS = ["1-5", "6-15", "16-30", "31+"]

function Chip({ active, onClick, children, count }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-surface text-muted hover:border-muted hover:text-ink"
      }`}
    >
      {children}
      {count !== undefined && (
        <span className={active ? "ml-1.5 opacity-70" : "ml-1.5 opacity-60"}>{count}</span>
      )}
    </button>
  )
}

function Row({ d }) {
  const [open, setOpen] = useState(false)
  return (
    <Card className="overflow-hidden">
      <div className="p-5">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              d.passed ? "bg-third/12 text-third" : "bg-accent/12 text-accent"
            }`}
          >
            {d.passed ? "passed" : "failed"}
          </span>
          <span className="text-xs text-muted">hotel {d.id}</span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs text-muted">{d.nProps} facts available</span>
          <span className="text-xs text-muted">·</span>
          <span className="text-xs tabular-nums text-muted">{d.chars} chars</span>
        </div>

        <p className="text-[15px] leading-relaxed">{d.text}</p>

        {d.reasons.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-1.5">
            {d.reasons.map((r) => (
              <li key={r}
                  className="rounded bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                {r}
              </li>
            ))}
          </ul>
        )}

        <button
          onClick={() => setOpen((v) => !v)}
          className="mt-4 text-sm font-medium text-primary hover:underline"
        >
          {open ? "hide the real facts" : `show the ${d.props.length} real facts`}
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: EASE }}
            className="overflow-hidden border-t border-line bg-bg"
          >
            <div className="flex flex-wrap gap-1.5 p-5">
              {d.props.length === 0 && (
                <span className="text-sm text-muted">no properties recorded</span>
              )}
              {d.props.map((p) => (
                <span key={p}
                      className="rounded border border-line bg-surface px-2 py-0.5 text-xs text-muted">
                  {p}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  )
}

export default function DescriptionBrowser({ descriptions }) {
  const [status, setStatus] = useState("failed")
  const [band, setBand] = useState("all")
  const [limit, setLimit] = useState(9)

  const counts = useMemo(() => ({
    all: descriptions.length,
    passed: descriptions.filter((d) => d.passed).length,
    failed: descriptions.filter((d) => !d.passed).length,
  }), [descriptions])

  const shown = useMemo(() => descriptions.filter((d) =>
    (status === "all" || (status === "passed") === d.passed) &&
    (band === "all" || d.band === band)
  ), [descriptions, status, band])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {["failed", "passed", "all"].map((s) => (
          <Chip key={s} active={status === s} count={counts[s]}
                onClick={() => { setStatus(s); setLimit(9) }}>
            {s}
          </Chip>
        ))}
      </div>

      <div className="mb-8 flex flex-wrap items-center gap-2">
        <span className="mr-1 text-sm text-muted">facts available:</span>
        <Chip active={band === "all"} onClick={() => { setBand("all"); setLimit(9) }}>any</Chip>
        {BANDS.map((b) => (
          <Chip key={b} active={band === b} onClick={() => { setBand(b); setLimit(9) }}>{b}</Chip>
        ))}
      </div>

      <p className="mb-4 text-sm text-muted">
        {shown.length} description{shown.length === 1 ? "" : "s"}
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {shown.slice(0, limit).map((d) => <Row key={d.id} d={d} />)}
      </div>

      {shown.length > limit && (
        <button
          onClick={() => setLimit((n) => n + 12)}
          className="mx-auto mt-8 block rounded-full border border-line bg-surface px-5 py-2.5 text-sm font-medium hover:border-muted"
        >
          show more
        </button>
      )}

      {shown.length === 0 && (
        <p className="py-10 text-center text-sm text-muted">
          nothing matches that combination
        </p>
      )}
    </div>
  )
}
