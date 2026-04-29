# Revisión de Rack — Guía de instalación

## 1. Requisitos previos
- Node.js 18+
- Cuenta en Supabase (supabase.com)

## 2. Crear proyecto en Supabase

1. Entra a supabase.com → Nuevo proyecto
2. Copia tu **Project URL** y **Anon Key** (en Settings → API)
3. En el SQL Editor, ejecuta el archivo `supabase/schema.sql` completo

## 3. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=TU_ANON_KEY
```

## 4. Instalar dependencias y ejecutar

```bash
cd revision-rack
npm install
npm run dev
```

La aplicación estará disponible en http://localhost:3000

## 5. Configuración inicial en la app

1. Ve a **Configuración → Terminales** y agrega los terminales de tu empresa
   - Nombre del terminal
   - Coordenadas GPS (latitud/longitud)
   - Radio de detección en metros (recomendado: 200-500m)

2. Ve a **Configuración → Modelos** para verificar que Volvo y Scania están cargados.
   Puedes agregar más modelos y definir sus cerraduras.

3. Ve a **Configuración → Valor del disco** y configura el precio unitario de los discos.
   Este valor se usará para calcular el impacto económico en el Dashboard.

4. Ve a **Buses** y agrega los buses de tu flota (PPU, N° interno, modelo, terminal).

## 6. Uso en terreno

- Abre la app en el celular del operador
- Ve a **Revisar** (menú inferior)
- Ingresa PPU o N° interno del bus
- El sistema verifica si fue revisado esta semana
- Completa el formulario de revisión
- Si el bus no tiene disco y en la revisión anterior sí tenía, el sistema genera automáticamente un ticket de posible robo

## 7. Supabase — Permisos de acceso

Si usas la aplicación sin autenticación (recomendado para inicio), ejecuta en el SQL Editor de Supabase:

```sql
ALTER TABLE buses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON buses FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE revisiones_rack ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON revisiones_rack FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE casos_srl ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON casos_srl FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE tickets_robo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON tickets_robo FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON configuracion FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE modelos_bus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON modelos_bus FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE cerraduras_modelo ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON cerraduras_modelo FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE terminales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON terminales FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE revision_cerraduras ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public_access" ON revision_cerraduras FOR ALL USING (true) WITH CHECK (true);
```

## 8. Build para producción

```bash
npm run build
```

Los archivos generados estarán en la carpeta `dist/` y pueden desplegarse en Vercel, Netlify, o cualquier servidor web estático.

## 9. Deploy en Render (evitar 404 en rutas internas)

Este repo incluye dos mecanismos para SPA fallback:

1. `public/_redirects` con:
```txt
/* /index.html 200
```
2. `render.yaml` con `routes` de tipo `rewrite` hacia `/index.html`.

Si ya tienes un sitio creado manualmente en Render, verifica en **Redirects/Rewrites** que exista:

- Source: `/*`
- Destination: `/index.html`
- Action: `Rewrite`
