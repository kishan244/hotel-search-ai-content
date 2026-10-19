-- Day 1: understand the data. Run these one at a time and write the answers
-- into notes/00_PROJECT_FILE.md. Numbers you record here go on your CV, so
-- record what you actually get, not what you expected.

-- 1. How big is the sample, and does it look like the full dataset?
SELECT count(*) AS rows,
       count(DISTINCT session_id) AS sessions,
       count(DISTINCT user_id)    AS users
FROM events;

-- 2. What do people actually DO? Expect ~74% item interactions, ~10% clickouts.
SELECT action_type,
       count(*) AS n,
       round(100.0 * count(*) / sum(count(*)) OVER (), 1) AS pct
FROM events
GROUP BY action_type
ORDER BY n DESC;

-- 3. How long is a session? Short sessions mean people decide fast.
SELECT max(step) AS session_length, count(*) AS sessions
FROM (SELECT session_id, max(step) AS step FROM events GROUP BY session_id)
GROUP BY 1 ORDER BY 1 LIMIT 25;

-- 4. Which markets and devices is this data from?
SELECT platform, count(DISTINCT session_id) AS sessions
FROM events GROUP BY 1 ORDER BY 2 DESC LIMIT 15;

SELECT device, count(DISTINCT session_id) AS sessions
FROM events GROUP BY 1 ORDER BY 2 DESC;

-- 5. Data quality check. Always do this before trusting anything above.
SELECT
  sum(CASE WHEN session_id IS NULL THEN 1 ELSE 0 END) AS null_session,
  sum(CASE WHEN action_type IS NULL THEN 1 ELSE 0 END) AS null_action,
  sum(CASE WHEN action_type = 'clickout item' AND impressions IS NULL
           THEN 1 ELSE 0 END) AS clickout_without_impressions
FROM events;

-- 6. What is in the hotel metadata?
SELECT count(*) AS items FROM items;

SELECT prop, count(*) AS n
FROM (SELECT unnest(str_split(properties,'|')) AS prop FROM items)
GROUP BY 1 ORDER BY 2 DESC LIMIT 25;
