"""Score generated hotel highlights against rules defined before generation."""
import csv, re
from collections import defaultdict

IN_FILE   = "output/tables/generated.csv"
OUT_FILE  = "output/tables/scored.csv"
MAX_CHARS = 220
MIN_REAL  = 2

# claim phrase -> property strings that would justify it
CLAIMS = {
    "free wifi": ["Free WiFi"], "wifi": ["WiFi"],
    "swimming pool": ["Swimming Pool"], "outdoor pool": ["Swimming Pool (Outdoor)"],
    "indoor pool": ["Swimming Pool (Indoor)"], "pool": ["Swimming Pool", "Pool Table"],
    "gym": ["Gym", "Fitness"], "fitness": ["Gym", "Fitness"],
    "parking": ["Car Park", "Parking"], "car park": ["Car Park", "Parking"],
    "restaurant": ["Restaurant"], "bar": ["Bar"],
    "spa": ["Spa"], "sauna": ["Sauna"], "steam room": ["Steam Room"],
    "air conditioning": ["Air Conditioning"], "air-conditioned": ["Air Conditioning"],
    "pet friendly": ["Pet Friendly"], "pet-friendly": ["Pet Friendly"],
    "breakfast": ["Breakfast", "Bed & Breakfast"],
    "kitchen": ["Kitchen", "Self Catering"], "self catering": ["Self Catering"],
    "self-catering": ["Self Catering"],
    "balcony": ["Balcony"], "terrace": ["Terrace"],
    "airport shuttle": ["Airport Shuttle"], "room service": ["Room Service"],
    "jacuzzi": ["Jacuzzi"], "beach": ["Beach"], "golf": ["Golf"],
    "washing machine": ["Washing Machine"], "microwave": ["Microwave"],
    "fridge": ["Fridge"], "lift": ["Lift"], "elevator": ["Lift"],
    "massage": ["Massage"], "conference room": ["Conference Rooms"],
    "24/7 reception": ["Reception (24/7)"], "laundry": ["Laundry"],
    "flat-screen": ["Flatscreen"], "flatscreen": ["Flatscreen"],
    "hairdryer": ["Hairdryer"], "desk": ["Desk"], "bathtub": ["Bathtub"],
    "table tennis": ["Table Tennis"], "bike rental": ["Bike Rental"],
    "nightclub": ["Nightclub"], "wheelchair": ["Wheelchair"],
}

REFUSAL = re.compile(
    r"(i don'?t see|could you (please )?provide|i need (more )?(details|information)|please provide)",
    re.I)

def analyse(props, text):
    p, t = props.lower(), text.lower()
    invented, supported = [], []
    for phrase, justifiers in CLAIMS.items():
        if re.search(r"\b" + re.escape(phrase) + r"\b", t):
            (supported if any(j.lower() in p for j in justifiers) else invented).append(phrase)
    return invented, supported

def words(t):
    return set(re.findall(r"[a-z]{4,}", t.lower()))

rows = list(csv.DictReader(open(IN_FILE)))

# rule 4: near-duplicates
dupes = set()
w = [words(r["generated"]) for r in rows]
for i in range(len(rows)):
    for j in range(i + 1, len(rows)):
        if w[i] and w[j] and len(w[i] & w[j]) / len(w[i] | w[j]) > 0.8:
            dupes.add(i); dupes.add(j)

BANDS = [(0, 5, "1-5 facts"), (6, 15, "6-15"), (16, 30, "16-30"), (31, 999, "31+")]
band_stats = defaultdict(lambda: [0, 0])
fail_counts = defaultdict(int)
npass = 0

with open(OUT_FILE, "w", newline="") as f:
    out = csv.writer(f)
    out.writerow(["item_id", "n_properties", "chars", "refused", "too_long",
                  "invented", "n_supported", "duplicate", "passed", "generated"])

    for i, r in enumerate(rows):
        inv, sup = analyse(r["properties"], r["generated"])
        n        = int(r["n_properties"])
        refused  = bool(REFUSAL.search(r["generated"]))
        too_long = len(r["generated"]) > MAX_CHARS
        thin     = len(sup) < MIN_REAL
        dup      = i in dupes
        ok = not (refused or too_long or inv or thin or dup)

        if refused:  fail_counts["refused to write"] += 1
        if too_long: fail_counts["over 220 chars"] += 1
        if inv:      fail_counts["invented a fact"] += 1
        if thin:     fail_counts["fewer than 2 real facts"] += 1
        if dup:      fail_counts["near-duplicate of another"] += 1

        npass += ok
        for lo, hi, lab in BANDS:
            if lo <= n <= hi:
                band_stats[lab][0] += 1
                band_stats[lab][1] += ok
                break

        out.writerow([r["item_id"], n, len(r["generated"]), refused, too_long,
                      "; ".join(inv), len(sup), dup, ok, r["generated"]])

print(f"\nOVERALL PASS RATE: {npass}/{len(rows)} = {100*npass/len(rows):.1f}%\n")

print("why they failed (a description can fail more than one rule):")
for reason, c in sorted(fail_counts.items(), key=lambda x: -x[1]):
    print(f"  {reason:<28} {c:>4}")

print(f"\n{'facts available':<18}{'hotels':>7}{'passed':>8}{'pass rate':>11}")
for lo, hi, lab in BANDS:
    tot, ok = band_stats[lab]
    if tot:
        print(f"{lab:<18}{tot:>7}{ok:>8}{100*ok/tot:>10.1f}%")

print(f"\nwrote {OUT_FILE}")