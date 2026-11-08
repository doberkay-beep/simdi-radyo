-- 8 Kas 2026 (Supabase migration: uygulama_dinleme_kimliksiz) — canlıda uygulandı.
-- Uygulama dinleme sayımı (kimliksiz). Web satırları aynen kalır (kaynak='web', anonim tarayıcı kimliğiyle).
alter table public.dinlemeler add column if not exists kaynak text not null default 'web';
alter table public.dinlemeler alter column dinleyici drop not null;
create index if not exists dinlemeler_slug_t_idx on public.dinlemeler (slug, t desc);

-- Uygulamalar yalnız "bu radyo bu platformda bir kez dinlenmeye başladı" der. Kimlik, rastgele sayı, IP saklanmaz.
create or replace function public.uygulama_dinleme(p_slug text, p_kaynak text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_kaynak is null or p_kaynak not in ('ios','tvos','macos','watchos') then return; end if;
  if p_slug is null or length(p_slug) not between 2 and 80 then return; end if;
  if not exists (select 1 from stations where slug = p_slug and app_izinli and is_active) then return; end if;
  if (select count(*) from dinlemeler where slug = p_slug and kaynak = p_kaynak and t > now() - interval '10 seconds') >= 50 then return; end if;
  insert into dinlemeler (dinleyici, slug, kaynak) values (null, p_slug, p_kaynak);
end $$;
revoke all on function public.uygulama_dinleme(text, text) from public;
grant execute on function public.uygulama_dinleme(text, text) to anon, authenticated;
