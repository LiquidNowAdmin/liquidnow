-- Update YouLend product metadata: highlight differentiating features
update products
set metadata = metadata || jsonb_build_object(
  'revenue_based_repayment', true,
  'fixed_fee_no_interest', true,
  'high_approval_rate', true,
  'up_to_2x_revenue', true,
  'payout_48h', true,
  'flexible_repayment', true
)
where id = '20000000-0000-0000-0000-000000000007';
