-- Tienda con Culqi + Libro de Reclamaciones. Ejecutar UNA vez en el SQL Editor de Neon.
-- Es seguro repetirlo: no borra nada.
alter table productos add column if not exists descripcion text;

create table if not exists pedidos (
  id serial primary key,
  creado timestamptz not null default now(),
  nombre text not null,
  email text not null,
  telefono text,
  documento text,
  direccion text,
  ciudad text,
  notas text,
  items jsonb not null,
  total numeric(10,2) not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','pagado','fallido')),
  culqi_charge_id text,
  error text
);

create table if not exists reclamos (
  id serial primary key,
  codigo text unique,
  creado timestamptz not null default now(),
  nombre text not null,
  documento_tipo text not null default 'DNI',
  documento_num text not null,
  domicilio text not null,
  telefono text,
  email text not null,
  menor boolean not null default false,
  apoderado text,
  tipo_bien text not null default 'producto' check (tipo_bien in ('producto','servicio')),
  monto numeric(10,2),
  descripcion_bien text,
  tipo text not null default 'reclamo' check (tipo in ('reclamo','queja')),
  detalle text not null,
  pedido_consumidor text not null,
  estado text not null default 'pendiente' check (estado in ('pendiente','atendido')),
  respuesta text,
  fecha_respuesta timestamptz
);

-- Medidas y relación producto-medida (seguro repetir; completa lo que haya faltado antes)
insert into medidas (medida) values ('80x150'),('120x170'),('140x200'),('160x230'),('200x300'),('250x350'),('300x400')
on conflict (medida) do nothing;
insert into producto_medidas (producto_id, medida_id)
select p.id, m.id from productos p cross join medidas m
on conflict do nothing;

-- Ajustes del sitio (seguro repetir)
create table if not exists ajustes (clave text primary key, valor text);
insert into ajustes (clave, valor) values
  ('fondo_inicio', 'animado'),
  ('fondo_nosotros', '#FFFFFF'),
  ('fondo_catalogo', '#F8F3EA'),
  ('fondo_contacto', '#1C1C1C'),
  ('email', 'contacto@tu-dominio.com'),
  ('direccion', 'Tu dirección aquí'),
  ('horario', 'Lunes a sábado · 10:00 – 19:00')
on conflict (clave) do nothing;

-- Persistentes, por IP hasheada, para limitar intentos de inicio de sesión.
create table if not exists admin_login_attempts (
  ip_hash text primary key,
  window_started timestamptz not null default now(),
  failed_attempts int not null default 0
);
