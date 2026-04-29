-- Insertar terminales de la empresa
-- Ejecuta este script en el SQL Editor de Supabase

INSERT INTO terminales (nombre, latitud, longitud, radio_metros, activo) VALUES
  ('EL ROBLE',       -33.4405842820967, -70.7895698167365, 400, true),
  ('LA REINA',       -33.4649078178948, -70.5317499339210, 400, true),
  ('MARIA ANGELICA', -33.5177492359585, -70.5564300455689, 400, true),
  ('EL DESCANSO',    -33.4748697429789, -70.7648792293136, 400, true)
ON CONFLICT DO NOTHING;
