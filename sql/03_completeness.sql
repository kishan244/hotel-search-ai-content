-- Day 3A: does trivago rank BETTER hotels first, or just more complete ones?
--
-- Ratings in item_metadata are a LADDER, not a label. A hotel rated Excellent
-- also carries Very Good, Good and Satisfactory. So the real rating is the
-- highest rung it holds. CASE WHEN stops at the first match, which gives us
-- exactly that - as long as the checks run from best to worst.

CREATE OR REPLACE TABLE item_quality AS
SELECT item_id,
       CASE
         WHEN properties LIKE '%Excellent Rating%'    THEN 4
         WHEN properties LIKE '%Very Good Rating%'    THEN 3
         WHEN properties LIKE '%Good Rating%'         THEN 2
         WHEN properties LIKE '%Satisfactory Rating%' THEN 1
         ELSE 0
       END                                AS rating_level,
       len(str_split(properties,'|'))     AS n_properties
FROM items;

-- How many hotels sit at each rung. 42.5% have no rating at all.
SELECT rating_level, count(*) AS n_hotels
FROM item_quality GROUP BY 1 ORDER BY 1;

-- Quality against page position.
--
-- Unrated hotels are EXCLUDED from the rating average rather than counted as
-- zero. A hotel nobody has rated is not a bad hotel, it is an unknown one, and
-- averaging it as zero invents a difference that is not there. avg() skips
-- NULL, so the CASE with no ELSE does the work.
SELECT
  CASE WHEN position <= 5  THEN 'slot 1-5'
       WHEN position <= 10 THEN 'slot 6-10'
       ELSE 'slot 11+' END                                     AS where_on_page,
  count(*)                                                     AS times_shown,
  round(100.0 * sum(CASE WHEN q.rating_level = 0 THEN 1 ELSE 0 END)
        / count(*), 1)                                         AS pct_unrated,
  round(avg(CASE WHEN q.rating_level > 0 THEN q.rating_level END), 2)
                                                               AS avg_rating,
  round(avg(q.n_properties), 1)                                AS avg_amenities,
  round(avg(c.price), 0)                                       AS avg_price
FROM clickouts c
JOIN item_quality q ON CAST(c.item AS BIGINT) = q.item_id
GROUP BY 1 ORDER BY 1;

-- Completeness of the whole catalogue, for comparison with what gets shown.
SELECT round(avg(len(str_split(properties,'|'))), 1) AS avg_props_catalogue
FROM items;
