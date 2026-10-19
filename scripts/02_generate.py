"""Generate a short highlight for each sampled hotel."""
import csv
import anthropic

MODEL    = "claude-haiku-4-5"   # check docs.claude.com for the current small model
IN_FILE  = "output/tables/sample_hotels.csv"
OUT_FILE = "output/tables/generated.csv"

PROMPT = """You are writing a short highlight for a hotel search results card.

These are the ONLY facts known about this hotel:
{facts}

Write 1-2 sentences that would help a traveller decide.

Rules:
- Use only the facts listed above. Do not mention anything not on that list.
- Maximum 220 characters.
- No prices, no availability, no claims about being the best.
- Plain, natural English.

Return only the sentences, nothing else."""

client = anthropic.Anthropic()

rows = list(csv.DictReader(open(IN_FILE)))
print(f"{len(rows)} hotels to describe")

with open(OUT_FILE, "w", newline="") as f:
    w = csv.writer(f)
    w.writerow(["item_id", "n_properties", "properties", "generated"])

    for i, row in enumerate(rows, 1):
        facts = row["properties"].replace("|", ", ")
        msg = client.messages.create(
            model=MODEL,
            max_tokens=150,
            messages=[{"role": "user", "content": PROMPT.format(facts=facts)}],
        )
        w.writerow([row["item_id"], row["n_properties"],
                    row["properties"], msg.content[0].text.strip()])
        f.flush()
        if i % 20 == 0:
            print(f"  {i}/{len(rows)}")

print(f"wrote {OUT_FILE}")