import data from "./data.json"
import { Callout, Card, Reveal, Section, Stat } from "./components/ui.jsx"
import {
  FailureChart, GridChart, PositionChart, PriceRankChart, QualityChart,
} from "./components/Charts.jsx"
import DescriptionBrowser from "./components/DescriptionBrowser.jsx"

// repo this page belongs to
const REPO = "https://github.com/kishan244/hotel-search-ai-content"

const fmt = (n) => n.toLocaleString("en-GB")
const at = (p) => data.position.find((d) => d.position === p)?.ctr ?? 0
const cell = (slot, price) =>
  data.grid.find((d) => d.slot === slot && d.price === price)?.ctr ?? 0
const slotRow = (s) => data.completeness.find((d) => d.slot === s) ?? {}

export default function App() {
  const top = slotRow("slot 1-5")
  const bottom = slotRow("slot 11+")
  const unratedCatalogue = Math.round(
    1000 * data.ratingDist.find((r) => r.level === 0).hotels / data.headline.hotels) / 10
  const q = data.qualityOverall

  return (
    <div className="min-h-screen">
      {/* hero */}
      <header className="mx-auto max-w-5xl px-6 pb-16 pt-20 md:pb-24 md:pt-28">
        <Reveal>
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.14em] text-muted">
            trivago RecSys 2019 dataset · {fmt(data.headline.rows)} user actions
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-[1.1] md:text-6xl">
            What actually makes someone click a hotel
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Everyone assumes it is price. It is not. I went through
            {" "}{fmt(data.headline.sessions)} real hotel searches to find out what does,
            then tested whether an AI can write hotel descriptions anyone would trust.
          </p>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat value={`${at(1)}%`} tone="accent" label="click rate for the hotel in slot 1" />
            <Stat value="22x" label="more clicks in slot 1 than slot 25" />
            <Stat value="3.3x" label="an expensive hotel at the top beats a cheap one buried" />
            <Stat value={`${q.passRate}%`} tone="primary"
                  label={`of ${q.n} AI descriptions were usable`} />
          </div>
        </Reveal>

        <Reveal delay={0.16}>
          <div className="mt-10 flex flex-wrap gap-3 text-sm">
            <a href="#position" className="rounded-full border border-line bg-surface px-4 py-2 hover:border-muted">
              the findings
            </a>
            <a href="#content" className="rounded-full border border-line bg-surface px-4 py-2 hover:border-muted">
              browse the AI descriptions
            </a>
            <a href={REPO} target="_blank" rel="noreferrer"
               className="rounded-full border border-line bg-surface px-4 py-2 hover:border-muted">
              code on GitHub
            </a>
          </div>
        </Reveal>
      </header>

      {/* 1. position */}
      <Section
        id="position"
        eyebrow="finding 01"
        title="Slot 1 takes a third of every click"
        lede={`One slot out of twenty-five collects ${at(1)}% of all clicks. Slot 2 gets
               ${at(2)}%. Falling one place costs two thirds of your traffic.`}
      >
        <PositionChart data={data.position} />
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <Stat value="50.4%" label="of clicks land in the top three slots" />
          <Stat value="78%" label="land in the top ten" />
          <Stat value={`${at(25)}%`} label="click rate at slot 25" />
          <Stat value="+19%" label="slot 25 beats slot 24, people reach the bottom" />
        </div>
        <Callout>
          Where a hotel sits decides whether anyone sees it. That makes the ranking
          the most valuable surface in the product.
        </Callout>
      </Section>

      {/* 2. price */}
      <Section
        id="price"
        eyebrow="finding 02"
        title="Price matters far less than anyone assumes"
        lede="The cheapest hotel on a page is clicked three times more than the priciest.
              Position swings clicks seven times harder than that."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <PriceRankChart data={data.priceRank} />
          <GridChart data={data.grid} />
        </div>
        <Callout>
          An expensive hotel in the top five is clicked {cell("slot 1-5", "pricier")}% of
          the time. The cheapest hotel below slot ten is clicked{" "}
          {cell("slot 11+", "cheapest 5")}%. Placement beats a good deal by more than three to one.
        </Callout>
        <p className="mt-6 max-w-2xl leading-relaxed text-muted">
          Price also stops working early. Between the fifteenth cheapest and the
          twenty-fifth cheapest the click rate does not move at all. Being the cheapest
          option is worth something. Being moderately cheap is worth nothing.
        </p>
      </Section>

      {/* 3. completeness */}
      <Section
        id="completeness"
        eyebrow="finding 03"
        title="The ranking rewards complete listings, not better hotels"
        lede="My first pass said top hotels were better rated. That result came from
              treating hotels with no rating as if they scored zero. They are not zero.
              They are unknown."
      >
        <Card className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="p-4 font-medium">position on page</th>
                <th className="p-4 font-medium">guest rating (rated only)</th>
                <th className="p-4 font-medium">no rating at all</th>
                <th className="p-4 font-medium">amenities listed</th>
              </tr>
            </thead>
            <tbody>
              {data.completeness.map((r) => (
                <tr key={r.slot} className="border-b border-line last:border-0">
                  <td className="p-4 font-medium">{r.slot}</td>
                  <td className="p-4 tabular-nums text-muted">{r.avgRating}</td>
                  <td className="p-4 tabular-nums text-muted">{r.pctUnrated}%</td>
                  <td className="p-4 tabular-nums text-muted">{r.avgAmenities}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Stat value={`${top.avgRating} vs ${bottom.avgRating}`}
                label="guest rating, top vs bottom. On a four point scale, that is nothing." />
          <Stat value={`${top.pctUnrated}% vs ${bottom.pctUnrated}%`} tone="accent"
                label="hotels with no rating. Missing data sinks a listing." />
          <Stat value={`${top.avgAmenities} vs ${bottom.avgAmenities}`} tone="accent"
                label="amenities listed. Completeness rises with position." />
        </div>

        <Callout>
          Across the whole catalogue {unratedCatalogue}% of hotels have no rating. Among
          hotels that actually reach a results page, only 15.6% do. An unrated hotel is
          about 2.7 times less likely to be shown at all.
        </Callout>
      </Section>

      {/* 4. AI content */}
      <Section
        id="content"
        eyebrow="finding 04"
        title="AI descriptions fail in two opposite directions"
        lede={`I wrote four rules first, then generated descriptions for ${q.n} hotels,
               then scored them. Writing the rules before generating is what makes the
               number honest.`}
      >
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <Stat value={`${q.passRate}%`} tone="primary" label={`passed all four rules (${q.passed} of ${q.n})`} />
          {data.quality.filter((b) => b.band !== "6-15").slice(0, 1).map((b) => (
            <Stat key={b.band} value={`${b.passRate}%`} tone="accent"
                  label={`pass rate with only ${b.band} facts to work with`} />
          ))}
          {data.quality.filter((b) => b.band === "6-15").map((b) => (
            <Stat key={b.band} value={`${b.passRate}%`} label="pass rate at 6-15 facts, the sweet spot" />
          ))}
          <Stat value="14" label={`descriptions invented a fact that did not exist`} />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <QualityChart data={data.quality} />
          <FailureChart data={data.quality} />
        </div>

        <Callout>
          Quality is a hill, not a line. With almost nothing to work with the model
          refuses to write or produces filler. With a long list it tries to use all of
          it and overruns the card. The two failures cross in the middle.
        </Callout>

        <div className="mt-8 rounded-[--radius-card] border border-line bg-surface p-6">
          <h3 className="text-lg font-semibold">The surprise</h3>
          <p className="mt-3 max-w-2xl leading-relaxed text-muted">
            The model invents least when it knows least. Invention runs at 2% in the
            sparsest band and 17% in the 6-15 band. Given nothing, it hedges. Given some
            material, it writes confident prose, and confident prose is where things get
            embroidered.
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed text-muted">
            One real case. Hotel 7234886 lists <em>WiFi (Rooms)</em> and{" "}
            <em>WiFi (Public Areas)</em>. The description said{" "}
            <span className="bg-accent/12 px-1 font-medium text-accent">free WiFi</span>.
            The data never said free. One adjective, and a traveller arrives to a charge
            nobody promised.
          </p>
        </div>

        <div className="mt-14">
          <h3 className="text-xl font-semibold">Read them yourself</h3>
          <p className="mt-2 max-w-2xl leading-relaxed text-muted">
            Every description the model wrote, with the rules it broke and the hotel's
            real facts underneath. Filter and open a few.
          </p>
          <div className="mt-6">
            <DescriptionBrowser descriptions={data.descriptions} />
          </div>
        </div>
      </Section>

      {/* the thread */}
      <Section
        eyebrow="the thread"
        title="Sparse listings fail twice"
        lede="Content completeness decides whether a hotel gets seen, and it decides
              whether AI-generated content about it is usable. Two questions, opposite
              routes, same root cause."
      >
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Position is nearly everything", `Slot 1 is clicked ${Math.round(at(1)/at(25))}x more than slot 25.`],
            ["Position follows completeness", "Not guest rating. Listings with gaps sink, and often never appear."],
            ["Sparse listings break the AI too", "Below six facts the output is unusable 97% of the time."],
          ].map(([h, p], i) => (
            <Reveal key={h} delay={i * 0.06}>
              <Card className="h-full p-6">
                <div className="display mb-3 text-sm font-bold text-primary">0{i + 1}</div>
                <h3 className="font-semibold">{h}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{p}</p>
              </Card>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* recommendations */}
      <Section eyebrow="what I would do" title="Six things this points at">
        <ol className="max-w-3xl space-y-5">
          {[
            "Ranking is the highest-leverage surface in the product. A slot-1 placement is worth more than any price advantage a hotel can offer.",
            "Price promotion only works at the very top of the range. Moving a hotel from 20th cheapest to 15th changes nothing measurable.",
            "Fill content gaps before improving hotel selection. Completeness predicts placement. Quality does not.",
            "The AI content failures need a tighter prompt with a hard length limit, not a bigger model. That alone removes 52 of the 109 failures.",
            "Hotels below roughly six recorded facts should not get AI descriptions at all. In that band the output is unusable 97% of the time.",
            "Rules catch known failure types cheaply and at scale. They cannot catch unknown ones. Human review on a sample covers the rest, and both are needed.",
          ].map((t, i) => (
            <Reveal key={i} delay={i * 0.04}>
              <li className="flex gap-4">
                <span className="display shrink-0 text-sm font-bold text-primary">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="leading-relaxed">{t}</span>
              </li>
            </Reveal>
          ))}
        </ol>
      </Section>

      {/* limits */}
      <Section eyebrow="honesty" title="What this analysis cannot tell you">
        <ul className="max-w-3xl space-y-4 text-muted">
          {[
            "The data is from 2018. It describes that period, not trivago today.",
            "90.8% of sessions here contain a click-out. That is not a conversion rate. The dataset was built for a click-out prediction challenge, so sessions were selected around click-outs.",
            "Position and clicks move together. This cannot show that position causes clicks, because the ranking may simply be good at its job. Separating them needs randomised ranking, which observational data cannot provide.",
            "Amenity count stands in for listing completeness, but it also tracks hotel size.",
            "The content scorer checks a fixed list of about 45 claim phrases. It catches commercially important inventions, not every possible one.",
            "There is no booking-partner column, so this says nothing about how trivago's partners compare on price.",
          ].map((t, i) => (
            <Reveal key={i} delay={i * 0.03}>
              <li className="flex gap-3 leading-relaxed">
                <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-muted" />
                {t}
              </li>
            </Reveal>
          ))}
        </ul>
      </Section>

      <footer className="border-t border-line py-14">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-6 text-sm text-muted md:flex-row md:items-center md:justify-between">
          <p>
            Built by Kishan Korat. Data:{" "}
            <a className="text-primary hover:underline"
               href="https://recsys.trivago.cloud/challenge/dataset/"
               target="_blank" rel="noreferrer">
              trivago RecSys Challenge 2019
            </a>. Not affiliated with trivago.
          </p>
          <a className="text-primary hover:underline" href={REPO} target="_blank" rel="noreferrer">
            source and queries on GitHub
          </a>
        </div>
      </footer>
    </div>
  )
}
