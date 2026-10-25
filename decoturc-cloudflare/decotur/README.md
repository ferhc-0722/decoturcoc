# Deco Turco — tienda en Next.js para Cloudflare Workers

Sitio público con catálogo, carrito, pedidos por WhatsApp, formulario de contacto y Libro de Reclamaciones. El panel `/admin` permite gestionar productos, stock, precios, movimientos, pedidos y ajustes.

## Requisitos
- Node.js 20 o superior
- Una base PostgreSQL compatible con Neon
- Una cuenta de Cloudflare con Workers habilitado

## Base de datos
En una base nueva, ejecuta en este orden:
1. `sql/schema_y_datos.sql`
2. `sql/migracion_tienda.sql`

En una base existente, ejecuta `sql/migracion_tienda.sql`. El script agrega las tablas de pedidos y reclamos, activa la reserva transaccional de stock y crea la tabla para limitar intentos de inicio de sesión. Puede volver a ejecutarse.

## Configuración de Cloudflare
Desde la carpeta `decotur`, instala dependencias con `npm ci`. Guarda estos valores como secretos de Worker; no los pongas en `wrangler.jsonc` ni en el repositorio:

```sh
npx wrangler secret put DATABASE_URL
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ADMIN_SESSION_SECRET
```

Usa una clave administrativa larga y única. Para `ADMIN_SESSION_SECRET`, genera al menos 32 bytes aleatorios, por ejemplo con `openssl rand -hex 32`. Cambiarlo invalida las sesiones activas. El inicio de sesión limita a cinco intentos fallidos por dirección IP cada 15 minutos; en producción debe llegar el encabezado `CF-Connecting-IP` de Cloudflare.

Configura el número público de WhatsApp en `wrangler.jsonc` bajo `vars.NEXT_PUBLIC_WHATSAPP`, solo con dígitos y código de país.

## Vista previa y publicación
```sh
npm run cf:preview
npm run cf:deploy
```

La aplicación usa OpenNext para Cloudflare Workers.

## Operación de pedidos
Al insertar un pedido, PostgreSQL bloquea y descuenta el stock de cada medida en la misma transacción. Si falta stock, se rechaza el pedido completo. En el panel de pedidos, marca como fallido un pedido pendiente para liberar las unidades reservadas. Los pedidos pagados conservan el descuento.

## Personalización
- Fondos, contacto, redes y métodos de pago: `/admin` → Diseño y contacto.
- Fotos: URL en `/admin` → Productos.
