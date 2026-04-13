-- Deduplicate existing inquiries: move applications to the oldest inquiry, delete dupes

with dupes as (
  select
    user_id, company_id, volume, term_months, purpose,
    min(created_at) as first_created,
    array_agg(id order by created_at) as all_ids
  from inquiries
  group by user_id, company_id, volume, term_months, purpose
  having count(*) > 1
),
keep as (
  select all_ids[1] as keep_id, unnest(all_ids[2:]) as dupe_id
  from dupes
)
-- Reassign applications from dupe inquiries to the kept one
update applications a
set inquiry_id = k.keep_id
from keep k
where a.inquiry_id = k.dupe_id;

-- Now delete the duplicate inquiries (applications already moved)
with dupes as (
  select
    user_id, company_id, volume, term_months, purpose,
    array_agg(id order by created_at) as all_ids
  from inquiries
  group by user_id, company_id, volume, term_months, purpose
  having count(*) > 1
),
to_delete as (
  select unnest(all_ids[2:]) as dupe_id from dupes
)
delete from inquiries where id in (select dupe_id from to_delete);
