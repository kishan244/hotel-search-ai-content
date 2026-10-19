"""Build the four charts for the README. Reads from trivago.duckdb and scored.csv."""
import duckdb, numpy as np
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

OUT = "output/charts"
con = duckdb.connect("trivago.duckdb")

SURFACE, INK, INK2, GRID = "#fcfcfb", "#0b0b0b", "#52514e", "#e3e2df"
BLUE, ORANGE, AQUA = "#2a78d6", "#eb6834", "#1baf7a"

plt.rcParams.update({
    "font.size": 10, "figure.facecolor": SURFACE, "axes.facecolor": SURFACE,
    "text.color": INK, "axes.labelcolor": INK2, "xtick.color": INK2,
    "ytick.color": INK2, "axes.edgecolor": GRID, "axes.spines.top": False,
    "axes.spines.right": False, "axes.spines.left": False, "axes.grid": True,
    "grid.color": GRID, "grid.linewidth": 0.8, "axes.axisbelow": True,
})

def finish(fig, ax, title, sub, ylab, xlab=None):
    fig.text(0.012, 0.965, title, fontsize=13.5, fontweight="bold", color=INK, va="top")
    fig.text(0.012, 0.895, sub, fontsize=9.5, color=INK2, va="top")
    ax.set_ylabel(ylab, fontsize=9.5)
    if xlab: ax.set_xlabel(xlab, fontsize=9.5)
    ax.tick_params(length=0)
    ax.xaxis.grid(False)
    fig.tight_layout(rect=[0, 0, 1, 0.86])

# ---- 1. click rate by page position -----------------------------------------
d = con.execute("""
    SELECT position, round(100.0*sum(was_clicked::INT)/count(*), 2) AS ctr
    FROM clickouts WHERE position <= 25 GROUP BY position ORDER BY position
""").fetchall()
pos = [r[0] for r in d]; ctr = [r[1] for r in d]

fig, ax = plt.subplots(figsize=(8, 4.6))
ax.bar(pos, ctr, color=BLUE, width=0.68)
for p in (1, 2, 10, 25):
    v = ctr[p-1]
    ax.annotate(f"{v}%", (p, v), ha="center", va="bottom", fontsize=9,
                color=INK, fontweight="bold", xytext=(0, 4), textcoords="offset points")
ax.set_xticks([1, 5, 10, 15, 20, 25])
finish(fig, ax, "Slot 1 takes a third of every click",
       "Click rate by position on the results page, 1.59M click-outs",
       "click rate", "position on page")
fig.savefig(f"{OUT}/01_position.png", dpi=150); plt.close(fig)

# ---- 2. position vs price ----------------------------------------------------
d = con.execute("""
    WITH ranked AS (
      SELECT *, rank() OVER (PARTITION BY session_id, step ORDER BY price) AS price_rank
      FROM clickouts
    )
    SELECT CASE WHEN position<=5 THEN 0 WHEN position<=10 THEN 1 ELSE 2 END AS pb,
           CASE WHEN price_rank<=5 THEN 0 WHEN price_rank<=10 THEN 1 ELSE 2 END AS cb,
           round(100.0*sum(was_clicked::INT)/count(*), 2) AS ctr
    FROM ranked GROUP BY 1,2 ORDER BY 1,2
""").fetchall()
g = {(r[0], r[1]): r[2] for r in d}
series = [("cheapest 5 on page", BLUE, 0), ("middle", ORANGE, 1), ("pricier", AQUA, 2)]
x = np.arange(3); w = 0.26

fig, ax = plt.subplots(figsize=(8, 4.6))
for label, colour, cb in series:
    vals = [g[(pb, cb)] for pb in range(3)]
    bars = ax.bar(x + (cb-1)*w, vals, w-0.02, label=label, color=colour)
    for r in bars:
        ax.annotate(f"{r.get_height()}", (r.get_x()+r.get_width()/2, r.get_height()),
                    ha="center", va="bottom", fontsize=8.5, color=INK2,
                    xytext=(0, 3), textcoords="offset points")
ax.set_xticks(x); ax.set_xticklabels(["slot 1-5", "slot 6-10", "slot 11+"])
ax.legend(frameon=False, fontsize=9.5, loc="upper right")
finish(fig, ax, "An expensive hotel at the top beats a cheap one further down",
       "Click rate by page position and price rank",
       "click rate")
fig.savefig(f"{OUT}/02_position_vs_price.png", dpi=150); plt.close(fig)

# ---- 3 & 4. AI content quality ----------------------------------------------
BANDS = "CASE WHEN n_properties<=5 THEN '1-5' WHEN n_properties<=15 THEN '6-15' " \
        "WHEN n_properties<=30 THEN '16-30' ELSE '31+' END"
d = con.execute(f"""
    SELECT {BANDS} AS band, count(*) AS n,
           round(100.0*sum(CASE WHEN passed THEN 1 ELSE 0 END)/count(*),1) AS pass_rate,
           round(100.0*sum(CASE WHEN n_supported<2 THEN 1 ELSE 0 END)/count(*),0) AS too_thin,
           round(100.0*sum(CASE WHEN too_long   THEN 1 ELSE 0 END)/count(*),0) AS too_long
    FROM 'output/tables/scored.csv'
    GROUP BY 1
    ORDER BY CASE band WHEN '1-5' THEN 1 WHEN '6-15' THEN 2 WHEN '16-30' THEN 3 ELSE 4 END
""").fetchall()
labs = [r[0] for r in d]; n = [r[1] for r in d]
rate = [r[2] for r in d]; thin = [r[3] for r in d]; long_ = [r[4] for r in d]

fig, ax = plt.subplots(figsize=(7, 4.6))
bars = ax.bar(labs, rate, color=BLUE, width=0.55)
for r, v, c in zip(bars, rate, n):
    ax.annotate(f"{v}%", (r.get_x()+r.get_width()/2, v), ha="center", va="bottom",
                fontsize=10, fontweight="bold", color=INK, xytext=(0, 4), textcoords="offset points")
    ax.annotate(f"n={c}", (r.get_x()+r.get_width()/2, 0), ha="center", va="bottom",
                fontsize=8.5, color=INK2, xytext=(0, 4), textcoords="offset points")
finish(fig, ax, "AI description quality is a hill, not a line",
       f"Share passing all four rules, by how many facts the hotel listed. {sum(n)} hotels",
       "pass rate", "facts available to the model")
fig.savefig(f"{OUT}/03_ai_quality.png", dpi=150); plt.close(fig)

fig, ax = plt.subplots(figsize=(7, 4.6))
ax.plot(labs, thin, marker="o", ms=8, lw=2, color=BLUE, label="too thin (under 2 real facts)")
ax.plot(labs, long_, marker="o", ms=8, lw=2, color=ORANGE, label="too long (over 220 chars)")
for i, (a, b) in enumerate(zip(thin, long_)):
    ax.annotate(f"{a:.0f}%", (i, a), color=INK2, fontsize=8.5, ha="center",
                xytext=(0, 8), textcoords="offset points")
    ax.annotate(f"{b:.0f}%", (i, b), color=INK2, fontsize=8.5, ha="center",
                xytext=(0, -14), textcoords="offset points")
ax.legend(frameon=False, fontsize=9.5)
finish(fig, ax, "Two failures pulling in opposite directions",
       "Too little to say at one end, too much at the other",
       "% of hotels in band", "facts available to the model")
fig.savefig(f"{OUT}/04_failure_modes.png", dpi=150); plt.close(fig)

print("wrote 4 charts to", OUT)
