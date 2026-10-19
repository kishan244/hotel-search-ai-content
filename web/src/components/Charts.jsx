import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts"
import { Card, Tip } from "./ui.jsx"

const PRIMARY = "#2a78d6"
const ACCENT = "#eb6834"
const THIRD = "#1baf7a"
const LINE = "#e3e2df"
const MUTED = "#52514e"

const axis = { stroke: LINE, tick: { fill: MUTED, fontSize: 12 }, tickLine: false }

function Frame({ title, children, height = 320 }) {
  return (
    <Card className="p-5 pb-3">
      <p className="mb-4 text-sm font-medium text-muted">{title}</p>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">{children}</ResponsiveContainer>
      </div>
    </Card>
  )
}

export function PositionChart({ data }) {
  return (
    <Frame title="Click rate by position on the results page">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="position" {...axis} interval={4} />
        <YAxis {...axis} unit="%" />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.035)" }}
                 content={<Tip labelPrefix="slot " />} />
        <Bar dataKey="ctr" name="click rate" radius={[4, 4, 0, 0]}>
          {data.map((d) => (
            <Cell key={d.position} fill={d.position === 1 ? ACCENT : PRIMARY} />
          ))}
        </Bar>
      </BarChart>
    </Frame>
  )
}

export function PriceRankChart({ data }) {
  return (
    <Frame title="Click rate by price rank, cheapest on the page is rank 1">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="rank" {...axis} interval={4} />
        <YAxis {...axis} unit="%" domain={[0, 33]} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.035)" }}
                 content={<Tip labelPrefix="price rank " />} />
        <Bar dataKey="ctr" name="click rate" fill={THIRD} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  )
}

export function GridChart({ data }) {
  const slots = ["slot 1-5", "slot 6-10", "slot 11+"]
  const rows = slots.map((slot) => {
    const pick = (p) => data.find((d) => d.slot === slot && d.price === p)?.ctr ?? 0
    return {
      slot,
      "cheapest 5": pick("cheapest 5"),
      middle: pick("middle"),
      pricier: pick("pricier"),
    }
  })
  return (
    <Frame title="Click rate by page position and price rank together">
      <BarChart data={rows} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="slot" {...axis} />
        <YAxis {...axis} unit="%" />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.035)" }} content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 13, color: MUTED, paddingTop: 8 }} />
        <Bar dataKey="cheapest 5" fill={PRIMARY} radius={[4, 4, 0, 0]} />
        <Bar dataKey="middle" fill={ACCENT} radius={[4, 4, 0, 0]} />
        <Bar dataKey="pricier" fill={THIRD} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  )
}

export function QualityChart({ data }) {
  return (
    <Frame title="Share of AI descriptions passing all four rules">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="band" {...axis} />
        <YAxis {...axis} unit="%" domain={[0, 80]} />
        <Tooltip cursor={{ fill: "rgba(0,0,0,0.035)" }}
                 content={<Tip labelPrefix="" />} />
        <Bar dataKey="passRate" name="pass rate" fill={PRIMARY} radius={[4, 4, 0, 0]} />
      </BarChart>
    </Frame>
  )
}

export function FailureChart({ data }) {
  return (
    <Frame title="Two failure types, by how many facts the model was given">
      <LineChart data={data} margin={{ top: 8, right: 12, left: -18, bottom: 4 }}>
        <CartesianGrid stroke={LINE} vertical={false} />
        <XAxis dataKey="band" {...axis} />
        <YAxis {...axis} unit="%" />
        <Tooltip content={<Tip />} />
        <Legend wrapperStyle={{ fontSize: 13, color: MUTED, paddingTop: 8 }} />
        <Line type="monotone" dataKey="tooThinPct" name="too thin"
              stroke={PRIMARY} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="tooLongPct" name="too long"
              stroke={ACCENT} strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
      </LineChart>
    </Frame>
  )
}
