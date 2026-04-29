-- Diagnostico rapido para buses

-- 1) Ver si RLS esta activado en buses
select
  c.relname as tabla,
  c.relrowsecurity as rls_activado
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname = 'buses';

-- 2) Ver policies actuales en buses
select
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'buses'
order by policyname;

-- 3) Consulta de verificacion por PPU / numero interno
select
  b.id,
  b.ppu,
  b.numero_interno,
  mb.nombre as modelo,
  t.nombre as terminal,
  b.activo
from buses b
left join modelos_bus mb on mb.id = b.modelo_id
left join terminales t on t.id = b.terminal_habitual_id
where b.ppu = 'LXWP57'
   or b.numero_interno = '1919';

-- 4) (Opcional) Policy de lectura solo buses activos
-- Ejecutar solo si quieres restringir SELECT publico a activos.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'buses'
      and policyname = 'Permitir lectura buses activos'
  ) then
    create policy "Permitir lectura buses activos"
    on buses
    for select
    using (activo = true);
  end if;
end $$;
