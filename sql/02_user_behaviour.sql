-- Day 2: what actually makes someone click a hotel.
-- Everything here runs on the `clickouts` table, one row per (clickout, position).

-- Q1. What share of sessions end in a clickout?
SELECT round(100.0 *
  count(DISTINCT CASE WHEN action_type='clickout item' THEN session_id END)
  / count(DISTINCT session_id), 1) AS pct_sessions_with_clickout
FROM events;

-- Q2. Does POSITION drive clicks? This is the headline finding.
SELECT position,
       count(*)                  AS times_shown,
       sum(was_clicked::INT)     AS clicks,
       round(100.0*sum(was_clicked::INT)/count(*), 2) AS ctr_pct
FROM clickouts
WHERE position <= 25
GROUP BY position ORDER BY position;

-- Q3. Does PRICE drive clicks, once position is accounted for?
-- price_rank 1 = cheapest option shown in that clickout.
WITH ranked AS (
  SELECT *, rank() OVER (PARTITION BY session_id, step ORDER BY price) AS price_rank
  FROM clickouts
)
SELECT price_rank,
       count(*) AS times_shown,
       sum(was_clicked::INT) AS clicks,
       round(100.0*sum(was_clicked::INT)/count(*), 2) AS ctr_pct
FROM ranked WHERE price_rank <= 25
GROUP BY price_rank ORDER BY price_rank;

-- Q4. Position and price together. Does being cheap rescue a bad position?
WITH ranked AS (
  SELECT *, rank() OVER (PARTITION BY session_id, step ORDER BY price) AS price_rank
  FROM clickouts
)
SELECT
  CASE WHEN position <= 5 THEN '1-5' WHEN position <= 10 THEN '6-10' ELSE '11+' END AS pos_band,
  CASE WHEN price_rank <= 5 THEN 'cheapest 5' WHEN price_rank <= 10 THEN 'next 5' ELSE 'rest' END AS price_band,
  count(*) AS times_shown,
  round(100.0*sum(was_clicked::INT)/count(*), 2) AS ctr_pct
FROM ranked GROUP BY 1,2 ORDER BY 1,2;

-- Q5. Do filters change behaviour?
SELECT
  CASE WHEN current_filters IS NULL THEN 'no filter' ELSE 'filtered' END AS filtered,
  count(DISTINCT session_id) AS sessions,
  round(100.0*sum(was_clicked::INT)/count(*), 2) AS ctr_pct
FROM clickouts GROUP BY 1;

-- Q6. Where do sessions die? Last action before the session stops.
WITH last_step AS (
  SELECT session_id, max(step) AS ms FROM events GROUP BY session_id
)
SELECT e.action_type AS final_action, count(*) AS sessions,
       round(100.0*count(*)/sum(count(*)) OVER (), 1) AS pct
FROM events e JOIN last_step l
  ON e.session_id = l.session_id AND e.step = l.ms
GROUP BY 1 ORDER BY 2 DESC;
