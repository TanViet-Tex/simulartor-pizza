begin;
do $$
declare ranking jsonb; blocked boolean := false;
begin
  if exists(select 1 from public.player_scores where id in ('00000000-0000-4000-8000-000000000001','00000000-0000-4000-8000-000000000002')) then raise exception 'Test identity already exists'; end if;
  perform public.publish_player_score('00000000-0000-4000-8000-000000000001',repeat('a',64),'Kiểm tra A',1,500,1,'live-check-a',1);
  perform public.publish_player_score('00000000-0000-4000-8000-000000000002',repeat('b',64),'Kiểm tra B',1,100500,4,'live-check-b',1);
  ranking := public.read_player_leaderboard('00000000-0000-4000-8000-000000000001',repeat('a',64));
  if ranking->'entries'->0->>'name' <> 'Kiểm tra B' or (ranking->'self'->>'rank')::integer <> 2 or (ranking->'self'->>'day')::integer <> 1 then raise exception 'Shared ranking failed'; end if;
  perform public.publish_player_score('00000000-0000-4000-8000-000000000001',repeat('a',64),'Kiểm tra A',2,100500,5,'live-check-a',2);
  perform public.publish_player_score('00000000-0000-4000-8000-000000000001',repeat('a',64),'Kiểm tra A',3,500,1,'live-check-a',1);
  ranking := public.read_player_leaderboard('00000000-0000-4000-8000-000000000001',repeat('a',64));
  if (ranking->'self'->>'rank')::integer <> 1 or (ranking->'self'->>'day')::integer <> 5 or (ranking->'self'->>'cash')::bigint <> 100500 then raise exception 'Day tie-break or stale revision failed'; end if;
  begin
    perform public.publish_player_score('00000000-0000-4000-8000-000000000001',repeat('b',64),'Sai token',4,999999,9,'live-check-a',3);
  exception when insufficient_privilege then blocked := true;
  end;
  if not blocked then raise exception 'Ownership protection failed'; end if;
  if has_function_privilege('anon','public.read_player_leaderboard(uuid,text)','EXECUTE') or has_function_privilege('authenticated','public.publish_player_score(uuid,text,text,bigint,bigint,integer,text,bigint)','EXECUTE') then raise exception 'Browser RPC access must be denied'; end if;
  if not has_function_privilege('service_role','public.read_player_leaderboard(uuid,text)','EXECUTE') then raise exception 'Server RPC permission missing'; end if;
end;
$$;
rollback;