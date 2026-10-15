-- Tabla de ajustes del sitio (fondos, WhatsApp, correo, dirección, horario).
-- Si ya ejecutaste schema_y_datos.sql antes, ejecuta SOLO este archivo.
create table if not exists ajustes (
  clave text primary key,
  valor text
);
insert into ajustes (clave, valor) values
  ('fondo_inicio', 'animado'),
  ('fondo_nosotros', '#FFFFFF'),
  ('fondo_catalogo', '#F8F3EA'),
  ('fondo_contacto', '#1C1C1C'),
  ('email', 'contacto@tu-dominio.com'),
  ('direccion', 'Tu dirección aquí'),
  ('horario', 'Lunes a sábado · 10:00 – 19:00')
on conflict (clave) do nothing;
