-- Iwoca: dynamic approval score based on volume (corrected)
-- ≤60k: score 2 (Mittel — selektiver bei kleinen Tickets)
-- >60k: score 3 (Hoch)
update products
set metadata = metadata || jsonb_build_object(
  'approval_score', 2,
  'approval_score_above_60k', 3
)
where id = '20000000-0000-0000-0000-000000000004';
