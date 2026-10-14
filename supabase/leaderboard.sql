-- Run once in the Supabase SQL editor. No direct browser access is permitted.
create table if not exists public.player_scores (
  id uuid primary key,
  token_hash text not null check (token_hash ~ '^[0-9a-f]{64}$'),
  name text not null check (char_length(name) between 2 and 20),
  sequence bigint not null check (sequence between 1 and 9007199254740991),
  cash bigint not null check (cash between -9007199254740991 and 9007199254740991),
  day integer not null check (day between 1 and 1000000),
  campaign_id text not null check (char_length(campaign_id) between 1 and 128),
  revision bigint not null check (revision between 1 and 9007199254740991)
);
alter table public.player_scores enable row level security;
revoke all on table public.player_scores from public, anon, authenticated;
create index if not exists player_scores_ranking on public.player_scores (cash desc, day desc, id asc);

create or replace function public.publish_player_score(
  p_id uuid, p_token_hash text, p_name text, p_sequence bigint,
  p_cash bigint, p_day integer, p_campaign_id text, p_revision bigint
) returns void language plpgsql security definer set search_path = '' as $$
declare current_player public.player_scores%rowtype;
begin
  -- Concurrent claims serialize on the primary key. Ownership is checked even
  -- for a stale sequence, so possession of an ID alone grants no access.
  insert into public.player_scores(id,token_hash,name,sequence,cash,day,campaign_id,revision)
  values(p_id,p_token_hash,p_name,p_sequence,p_cash,p_day,p_campaign_id,p_revision)
  on conflict(id) do nothing;
  select * into strict current_player from public.player_scores where id=p_id for update;
  if current_player.token_hash <> p_token_hash or p_token_hash is null then
    raise insufficient_privilege using message='Player authentication failed';
  end if;
  -- A stale tab must not replace a newer confirmed save from the same campaign.
  if p_campaign_id = current_player.campaign_id and p_revision < current_player.revision then
    return;
  end if;
  if p_sequence > current_player.sequence or
     (p_campaign_id = current_player.campaign_id and p_revision > current_player.revision) then
    update public.player_scores set name=p_name, sequence=greatest(p_sequence,current_player.sequence), cash=p_cash,
      day=p_day, campaign_id=p_campaign_id, revision=p_revision where id=p_id;
  end if;
end;
$$;

create or replace function public.read_player_leaderboard(p_id uuid default null,p_token_hash text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare stored_hash text; result jsonb;
begin
  if p_id is not null then
    select token_hash into stored_hash from public.player_scores where id=p_id;
    if stored_hash is not null and (p_token_hash is null or stored_hash <> p_token_hash) then
      raise insufficient_privilege using message='Player authentication failed';
    end if;
  end if;
  with ranked as (
    select id,name,cash,day,row_number() over(order by cash desc, day desc, id asc) as rank
    from public.player_scores
  ) select jsonb_build_object(
    'entries',coalesce((select jsonb_agg(to_jsonb(top_player) order by top_player.rank)
      from (select * from ranked where rank<=10) top_player),'[]'::jsonb),
    'self',(select to_jsonb(own_player) from ranked own_player where id=p_id)
  ) into result;
  return result;
end;
$$;
revoke all on function public.publish_player_score(uuid,text,text,bigint,bigint,integer,text,bigint) from public, anon, authenticated;
revoke all on function public.read_player_leaderboard(uuid,text) from public, anon, authenticated;
grant execute on function public.publish_player_score(uuid,text,text,bigint,bigint,integer,text,bigint) to service_role;
grant execute on function public.read_player_leaderboard(uuid,text) to service_role;
