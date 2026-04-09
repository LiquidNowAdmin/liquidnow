-- Iwoca: dynamic approval score based on volume
-- ≤60k: score 3 (Hoch), >60k: score 2 (Mittel)
update products
set metadata = metadata || jsonb_build_object(
  'approval_score', 3,
  'approval_score_above_60k', 2
)
where id = '20000000-0000-0000-0000-000000000004';
