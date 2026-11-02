-- 在 Supabase SQL Editor 執行一次即可
create table if not exists public.readings (
  id uuid primary key,
  created_at timestamptz not null default now(),
  input jsonb not null,
  chart jsonb not null,
  utm jsonb,
  paid boolean not null default false,
  paid_at timestamptz,
  report jsonb,
  report_status text not null default 'none' check (report_status in ('none','generating','done','failed')),
  report_started_at timestamptz
);

create table if not exists public.orders (
  trade_no text primary key,
  reading_id uuid not null references public.readings(id) on delete cascade,
  amount integer not null,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  created_at timestamptz not null default now(),
  paid_at timestamptz,
  payment_type text,
  raw jsonb
);

create index if not exists orders_reading_idx on public.orders(reading_id);
create index if not exists readings_created_idx on public.readings(created_at desc);
create index if not exists readings_utm_campaign_idx on public.readings((utm->>'utm_campaign'));

-- 開啟 RLS 且不建立任何 policy：只有伺服器端的 service role 能讀寫，前端金鑰一律無法存取
alter table public.readings enable row level security;
alter table public.orders enable row level security;

-- 營運報表：每日排盤數、付費數、轉換率、營收
create or replace view public.daily_stats as
select
  date_trunc('day', r.created_at at time zone 'Asia/Taipei')::date as day,
  count(*) as readings,
  count(*) filter (where r.paid) as paid,
  round(100.0 * count(*) filter (where r.paid) / nullif(count(*), 0), 2) as conversion_pct,
  coalesce(sum(o.amount) filter (where o.status = 'paid'), 0) as revenue_twd
from public.readings r
left join public.orders o on o.reading_id = r.id and o.status = 'paid'
group by 1 order by 1 desc;

-- 依廣告活動看成效
create or replace view public.campaign_stats as
select
  coalesce(r.utm->>'utm_campaign', '(direct)') as campaign,
  count(*) as readings,
  count(*) filter (where r.paid) as paid,
  round(100.0 * count(*) filter (where r.paid) / nullif(count(*), 0), 2) as conversion_pct
from public.readings r
group by 1 order by readings desc;
