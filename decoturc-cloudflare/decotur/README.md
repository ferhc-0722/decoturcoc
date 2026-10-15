# Deco Turco – sitio completo (Next.js + Postgres) para Vercel

Secciones: Inicio · Nosotros · Catálogo · Contáctanos.
Panel en `/admin`: productos, stock, precios, medidas, fotos, ventas, compras, gastos, ingresos y **Diseño y contacto** (fondos, correo, dirección, horario).

## 1. Base de datos (Vercel → Storage → Neon Postgres)
- Base nueva: ejecuta **todo** `sql/schema_y_datos.sql` en el editor SQL de Neon.
- Ya tenías la base de la versión anterior: ejecuta solo `sql/migracion_ajustes.sql`.

## 2. Variables de entorno (Vercel → Settings → Environment Variables)
- `DATABASE_URL` → URL de Postgres (Neon la crea sola al conectar el storage)
- `ADMIN_PASSWORD` → clave larga para entrar a `/admin`
- `NEXT_PUBLIC_WHATSAPP` → tu número con código de país, sin +, ej. `519XXXXXXXX`

## 3. Publicar
Con CLI (sin GitHub): dentro de esta carpeta, `npx vercel login` y luego `npx vercel --prod`.
Después de cambiar variables de entorno, vuelve a ejecutar `npx vercel --prod`.

## 4. Personalizar
- Fondos, correo, dirección y horario: desde `/admin` → Diseño y contacto. Se aplican sin redeploy.
- Video de inicio (opcional): pon `public/hero.mp4` y escribe `video` en el fondo del Inicio.
- Fotos de alfombras: URL en `/admin` → Productos → Editar.
