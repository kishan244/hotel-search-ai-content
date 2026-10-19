"""
Day 1. Builds trivago.duckdb from the raw CSVs.

Why a sample: train.csv is 2.1 GB. Running every experiment on the whole file
means waiting minutes for each query, which kills a 4-day project. We work on a
10% sample while exploring, then re-run the final numbers on the full data.

Why hash the session_id: a session is a whole story (search, look, look, click).
If you take random ROWS you cut sessions in half and every behaviour number you
compute afterwards is wrong. Hashing the session_id keeps every session whole,
and it gives the same sample every time you run it, so your results reproduce.
"""
import os, duckdb

HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(HERE, "data")
DB   = os.path.join(HERE, "trivago.duckdb")

SAMPLE_PCT = 10  # change to 100 on day 4 for the final numbers

con = duckdb.connect(DB)

con.execute(f"""
CREATE OR REPLACE VIEW train_raw AS
SELECT * FROM read_csv_auto('{DATA}/train.csv', header=true);
""")

con.execute(f"""
CREATE OR REPLACE TABLE events AS
SELECT * FROM train_raw
WHERE abs(hash(session_id)) % 100 < {SAMPLE_PCT};
""")

con.execute(f"""
CREATE OR REPLACE TABLE items AS
SELECT * FROM read_csv_auto('{DATA}/item_metadata.csv', header=true);
""")

# One row per (clickout, position). This is the table days 2 and 3 run on.
con.execute("""
CREATE OR REPLACE TABLE clickouts AS
WITH co AS (
  SELECT session_id, user_id, step, platform, city, device, current_filters,
         reference AS clicked_item,
         str_split(impressions,'|') AS imps,
         str_split(prices,'|')      AS prcs
  FROM events
  WHERE action_type = 'clickout item' AND impressions IS NOT NULL
)
SELECT session_id, user_id, step, platform, city, device, current_filters,
       clicked_item,
       imps[i]                  AS impressed_item,
       CAST(prcs[i] AS INTEGER) AS price,
       i                        AS position,
       (imps[i] = clicked_item) AS was_clicked
FROM co, generate_series(1, len(imps)) AS g(i);
""")

for t in ("events", "items", "clickouts"):
    n = con.execute(f"SELECT count(*) FROM {t}").fetchone()[0]
    print(f"{t:12} {n:>12,} rows")

s = con.execute("SELECT count(DISTINCT session_id) FROM events").fetchone()[0]
u = con.execute("SELECT count(DISTINCT user_id) FROM events").fetchone()[0]
print(f"{'sessions':12} {s:>12,}")
print(f"{'users':12} {u:>12,}")
print(f"\nwrote {DB}")
con.close()
