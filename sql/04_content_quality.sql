-- Day 3B: how the scored AI descriptions break down.
-- Run after scripts/02_generate.py and scripts/03_score.py.

-- Overall, and by how many facts the model had to work with.
SELECT
  CASE WHEN n_properties <= 5  THEN '1  1-5 facts'
       WHEN n_properties <= 15 THEN '2  6-15'
       WHEN n_properties <= 30 THEN '3  16-30'
       ELSE '4  31+' END                                  AS band,
  count(*)                                                AS hotels,
  round(100.0*sum(CASE WHEN passed THEN 1 ELSE 0 END)/count(*), 1) AS pass_rate,
  sum(CASE WHEN refused  THEN 1 ELSE 0 END)               AS refused,
  sum(CASE WHEN too_long THEN 1 ELSE 0 END)               AS too_long,
  sum(CASE WHEN invented <> '' THEN 1 ELSE 0 END)         AS invented,
  sum(CASE WHEN n_supported < 2 THEN 1 ELSE 0 END)        AS too_thin
FROM 'output/tables/scored.csv'
GROUP BY 1 ORDER BY 1;

-- Every description that claimed something the hotel does not have.
SELECT item_id, n_properties, invented, generated
FROM 'output/tables/scored.csv'
WHERE invented <> ''
ORDER BY n_properties;
