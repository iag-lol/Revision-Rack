-- ============================================================
-- REVISIÓN DE RACK — Schema completo
-- Ejecutar en Supabase → SQL Editor → Run
-- ============================================================


-- ============================================================
-- TABLAS
-- ============================================================

CREATE TABLE IF NOT EXISTS modelos_bus (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre     text        NOT NULL UNIQUE,
  activo     boolean     NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cerraduras_modelo (
  id        uuid    PRIMARY KEY DEFAULT gen_random_uuid(),
  modelo_id uuid    NOT NULL REFERENCES modelos_bus(id) ON DELETE CASCADE,
  nombre    text    NOT NULL,
  orden     int     NOT NULL DEFAULT 1,
  activo    boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS terminales (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       text        NOT NULL,
  direccion    text,
  latitud      numeric(10,7),
  longitud     numeric(10,7),
  radio_metros int         NOT NULL DEFAULT 300,
  activo       boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS buses (
  id                   uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  ppu                  text        UNIQUE NOT NULL,
  numero_interno       text        UNIQUE NOT NULL,
  modelo_id            uuid        REFERENCES modelos_bus(id),
  terminal_habitual_id uuid        REFERENCES terminales(id),
  activo               boolean     NOT NULL DEFAULT true,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revisiones_rack (
  id                        uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id                    uuid        REFERENCES buses(id),
  ppu                       text        NOT NULL,
  numero_interno            text        NOT NULL,
  modelo_id                 uuid        REFERENCES modelos_bus(id),
  terminal_id               uuid        REFERENCES terminales(id),
  fecha_revision            date        NOT NULL,
  hora_revision             time        NOT NULL,
  gps_latitud               numeric(10,7),
  gps_longitud              numeric(10,7),
  tiene_disco               boolean     NOT NULL,
  motivo_sin_disco          text,
  tiene_candado             boolean     NOT NULL DEFAULT false,
  tiene_seguridad_extra     boolean     NOT NULL DEFAULT false,
  cantidad_cerraduras_malas int         NOT NULL DEFAULT 0,
  observacion               text,
  usuario_id                text,
  created_at                timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS revision_cerraduras (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revision_id         uuid NOT NULL REFERENCES revisiones_rack(id) ON DELETE CASCADE,
  cerradura_modelo_id uuid REFERENCES cerraduras_modelo(id),
  nombre_cerradura    text NOT NULL,
  estado              text NOT NULL DEFAULT 'BUENA',
  observacion         text
);

CREATE TABLE IF NOT EXISTS casos_srl (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id            uuid        REFERENCES buses(id),
  ppu               text        NOT NULL,
  numero_interno    text        NOT NULL,
  modelo_id         uuid        REFERENCES modelos_bus(id),
  terminal_id       uuid        REFERENCES terminales(id),
  fecha_retiro      date        NOT NULL,
  hora_retiro       time        NOT NULL,
  motivo            text        NOT NULL,
  estado            text        NOT NULL DEFAULT 'PENDIENTE_ENVIO',
  usuario_registra  text,
  observacion       text,
  fecha_recepcion   date,
  hora_recepcion    time,
  fecha_reposicion  date,
  hora_reposicion   time,
  usuario_repone    text,
  observacion_final text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS tickets_robo (
  id                     uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                 text        UNIQUE NOT NULL,
  bus_id                 uuid        REFERENCES buses(id),
  revision_id            uuid        REFERENCES revisiones_rack(id),
  ppu                    text        NOT NULL,
  numero_interno         text        NOT NULL,
  modelo_id              uuid        REFERENCES modelos_bus(id),
  terminal_id            uuid        REFERENCES terminales(id),
  fecha_alerta           date        NOT NULL,
  hora_alerta            time        NOT NULL,
  ultima_fecha_con_disco date,
  estado_anterior        text,
  estado_actual          text,
  impacto_estimado       numeric(12,2),
  estado                 text        NOT NULL DEFAULT 'ABIERTO',
  observacion            text        NOT NULL DEFAULT '',
  usuario_detecta        text,
  fecha_cierre           timestamptz,
  usuario_cierra         text,
  observacion_cierre     text,
  created_at             timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS configuracion (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  clave      text        UNIQUE NOT NULL,
  valor      text,
  updated_at timestamptz NOT NULL DEFAULT now()
);


-- ============================================================
-- ÍNDICES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_buses_ppu             ON buses             (ppu);
CREATE INDEX IF NOT EXISTS idx_buses_numero_interno  ON buses             (numero_interno);
CREATE INDEX IF NOT EXISTS idx_rev_bus_id            ON revisiones_rack   (bus_id);
CREATE INDEX IF NOT EXISTS idx_rev_fecha             ON revisiones_rack   (fecha_revision DESC);
CREATE INDEX IF NOT EXISTS idx_rev_ppu               ON revisiones_rack   (ppu);
CREATE INDEX IF NOT EXISTS idx_rev_terminal          ON revisiones_rack   (terminal_id);
CREATE INDEX IF NOT EXISTS idx_rc_revision_id        ON revision_cerraduras (revision_id);
CREATE INDEX IF NOT EXISTS idx_srl_bus_id            ON casos_srl         (bus_id);
CREATE INDEX IF NOT EXISTS idx_srl_estado            ON casos_srl         (estado);
CREATE INDEX IF NOT EXISTS idx_ticket_bus_id         ON tickets_robo      (bus_id);
CREATE INDEX IF NOT EXISTS idx_ticket_estado         ON tickets_robo      (estado);


-- ============================================================
-- DATOS INICIALES (modelos, cerraduras, terminales, config)
-- ============================================================

-- Modelos de bus
INSERT INTO modelos_bus (nombre, activo) VALUES
  ('Volvo',  true),
  ('Scania', true)
ON CONFLICT (nombre) DO NOTHING;

-- Cerraduras del modelo Volvo (4)
INSERT INTO cerraduras_modelo (modelo_id, nombre, orden)
SELECT id, 'Superior izquierda', 1 FROM modelos_bus WHERE nombre = 'Volvo';

INSERT INTO cerraduras_modelo (modelo_id, nombre, orden)
SELECT id, 'Superior derecha', 2 FROM modelos_bus WHERE nombre = 'Volvo';

INSERT INTO cerraduras_modelo (modelo_id, nombre, orden)
SELECT id, 'Inferior izquierda', 3 FROM modelos_bus WHERE nombre = 'Volvo';

INSERT INTO cerraduras_modelo (modelo_id, nombre, orden)
SELECT id, 'Inferior derecha', 4 FROM modelos_bus WHERE nombre = 'Volvo';

-- Cerraduras del modelo Scania (1)
INSERT INTO cerraduras_modelo (modelo_id, nombre, orden)
SELECT id, 'Derecha media', 1 FROM modelos_bus WHERE nombre = 'Scania';

-- Terminales
INSERT INTO terminales (nombre, latitud, longitud, radio_metros, activo) VALUES
  ('EL ROBLE',       -33.4405843, -70.7895698, 400, true),
  ('LA REINA',       -33.4649078, -70.5317499, 400, true),
  ('MARIA ANGELICA', -33.5177492, -70.5564300, 400, true),
  ('EL DESCANSO',    -33.4748697, -70.7648792, 400, true);

-- Clave de configuración (valor lo ingresa el usuario desde la app)
INSERT INTO configuracion (clave, valor) VALUES
  ('valor_unitario_disco', '')
ON CONFLICT (clave) DO NOTHING;


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE modelos_bus         ENABLE ROW LEVEL SECURITY;
ALTER TABLE cerraduras_modelo   ENABLE ROW LEVEL SECURITY;
ALTER TABLE terminales          ENABLE ROW LEVEL SECURITY;
ALTER TABLE buses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE revisiones_rack     ENABLE ROW LEVEL SECURITY;
ALTER TABLE revision_cerraduras ENABLE ROW LEVEL SECURITY;
ALTER TABLE casos_srl           ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets_robo        ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion       ENABLE ROW LEVEL SECURITY;

CREATE POLICY "acceso_publico" ON modelos_bus         FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON cerraduras_modelo   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON terminales          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON buses               FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON revisiones_rack     FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON revision_cerraduras FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON casos_srl           FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON tickets_robo        FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "acceso_publico" ON configuracion       FOR ALL USING (true) WITH CHECK (true);
