"""Export every number the web page needs into one JSON file."""
import csv, json, duckdb

con = duckdb.connect("trivago.duckdb", read_only=True)
q = lambda s: con.execute(s).fetchall()

data = {}

data["headline"] = {
    "rows": 15932992, "sessions": 910683, "users": 730803, "hotels": 927142,
    "clickouts": 1586586, "impressions": 36364479,
}

data["position"] = [
    {"position": r[0], "shown": r[1], "clicks": r[2], "ctr": r[3]}
    for r in q("""SELECT position, count(*), sum(was_clicked::INT),
                         round(100.0*sum(was_clicked::INT)/count(*),2)
                  FROM clickouts WHERE position<=25 GROUP BY 1 ORDER BY 1""")
]

data["priceRank"] = [
    {"rank": r[0], "ctr": r[1]}
    for r in q("""WITH ranked AS (SELECT *, rank() OVER
                    (PARTITION BY session_id, step ORDER BY price) AS pr FROM clickouts)
                  SELECT pr, round(100.0*sum(was_clicked::INT)/count(*),2)
                  FROM ranked WHERE pr<=25 GROUP BY 1 ORDER BY 1""")
]

data["grid"] = [
    {"slot": r[0], "price": r[1], "shown": r[2], "ctr": r[3]}
    for r in q("""WITH ranked AS (SELECT *, rank() OVER
                    (PARTITION BY session_id, step ORDER BY price) AS pr FROM clickouts)
                  SELECT CASE WHEN position<=5 THEN 'slot 1-5'
                              WHEN position<=10 THEN 'slot 6-10' ELSE 'slot 11+' END,
                         CASE WHEN pr<=5 THEN 'cheapest 5'
                              WHEN pr<=10 THEN 'middle' ELSE 'pricier' END,
                         count(*), round(100.0*sum(was_clicked::INT)/count(*),2)
                  FROM ranked GROUP BY 1,2 ORDER BY 1,2""")
]

data["completeness"] = [
    {"slot": r[0], "shown": r[1], "pctUnrated": r[2], "avgRating": r[3],
     "avgAmenities": r[4], "avgPrice": r[5]}
    for r in q("""SELECT CASE WHEN position<=5 THEN 'slot 1-5'
                              WHEN position<=10 THEN 'slot 6-10' ELSE 'slot 11+' END,
                         count(*),
                         round(100.0*sum(CASE WHEN q.rating_level=0 THEN 1 ELSE 0 END)/count(*),1),
                         round(avg(CASE WHEN q.rating_level>0 THEN q.rating_level END),2),
                         round(avg(q.n_properties),1), round(avg(c.price),0)
                  FROM clickouts c JOIN item_quality q
                    ON CAST(c.item AS BIGINT)=q.item_id
                  GROUP BY 1 ORDER BY 1""")
]

data["ratingDist"] = [
    {"level": r[0], "hotels": r[1]}
    for r in q("SELECT rating_level, count(*) FROM item_quality GROUP BY 1 ORDER BY 1")
]
data["catalogueAvgProps"] = q(
    "SELECT round(avg(len(str_split(properties,'|'))),1) FROM items")[0][0]

# --- generated descriptions -------------------------------------------------
rows = list(csv.DictReader(open("output/tables/scored.csv")))
def band(n):
    n = int(n)
    return "1-5" if n <= 5 else "6-15" if n <= 15 else "16-30" if n <= 30 else "31+"

descs, stats = [], {}
for r in rows:
    b = band(r["n_properties"])
    reasons = []
    if r["refused"] == "True":  reasons.append("refused to write")
    if r["too_long"] == "True": reasons.append("over 220 chars")
    if r["invented"]:           reasons.append("invented: " + r["invented"])
    if int(r["n_supported"]) < 2: reasons.append("fewer than 2 real facts")
    if r["duplicate"] == "True": reasons.append("near-duplicate")
    descs.append({
        "id": int(r["item_id"]), "nProps": int(r["n_properties"]),
        "band": b, "chars": int(r["chars"]),
        "passed": r["passed"] == "True", "reasons": reasons,
        "text": r["generated"],
        "props": [],
    })
    s = stats.setdefault(b, {"band": b, "n": 0, "passed": 0,
                             "refused": 0, "tooLong": 0, "invented": 0, "tooThin": 0})
    s["n"] += 1
    s["passed"] += r["passed"] == "True"
    s["refused"] += r["refused"] == "True"
    s["tooLong"] += r["too_long"] == "True"
    s["invented"] += bool(r["invented"])
    s["tooThin"] += int(r["n_supported"]) < 2

# attach each hotel's real property list so the page can show input vs output
props = {r[0]: r[1].split("|") for r in q("SELECT item_id, properties FROM items")}
for d in descs:
    d["props"] = props.get(d["id"], [])

order = {"1-5": 0, "6-15": 1, "16-30": 2, "31+": 3}
data["descriptions"] = descs
data["quality"] = sorted(
    [{**s, "passRate": round(100*s["passed"]/s["n"], 1),
      "tooThinPct": round(100*s["tooThin"]/s["n"]),
      "tooLongPct": round(100*s["tooLong"]/s["n"]),
      "inventedPct": round(100*s["invented"]/s["n"]),
      "refusedPct": round(100*s["refused"]/s["n"])} for s in stats.values()],
    key=lambda s: order[s["band"]])
data["qualityOverall"] = {
    "n": len(descs), "passed": sum(d["passed"] for d in descs),
    "passRate": round(100*sum(d["passed"] for d in descs)/len(descs), 1),
}

with open("web/src/data.json", "w") as f:
    json.dump(data, f, indent=1)
print("wrote web/src/data.json")
print("descriptions:", len(descs), "| pass rate:", data["qualityOverall"]["passRate"], "%")
