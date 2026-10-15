// Textos legales por defecto. Se pueden reemplazar desde el panel (Diseño y contacto → Textos legales).
const rs = (a) => a.razon_social || 'Deco Turco';
const ruc = (a) => (a.ruc ? `, RUC ${a.ruc}` : '');

export function terminosDefault(a) {
  return `1. Quiénes somos
Este sitio web es operado por ${rs(a)}${ruc(a)}, con domicilio en ${a.direccion}. Puedes escribirnos a ${a.email} o por WhatsApp al +${a.whatsapp}. Horario de atención: ${a.horario}.

2. Qué vendemos
Vendemos alfombras de diseño turco para living rooms, dormitorios y espacios de trabajo, en distintos diseños, colores y medidas. Cada producto muestra su código, color, medidas disponibles y precio.

3. Precios y disponibilidad
Todos los precios están expresados en soles (S/). El precio final de cada alfombra depende de la medida elegida y se muestra antes de pagar. Las fotografías son referenciales: el tono puede variar ligeramente según la pantalla. Si un producto se agota después de tu pedido, te lo comunicaremos y podrás elegir otro producto o solicitar la devolución de tu dinero.

4. Cómo comprar
Elige la alfombra y la medida, agrégala al carrito, completa tus datos de entrega y acepta estos términos. Recibirás la confirmación del pedido en el correo que indiques.

5. Medios de pago
Aceptamos tarjetas de crédito y débito y Yape a través de la pasarela de pagos Culqi, que procesa los pagos de forma segura. Nosotros no almacenamos los datos de tu tarjeta. También podemos recibir pagos por Plin o transferencia bancaria, coordinados por WhatsApp.

6. Entrega
La entrega se realiza en la dirección que indiques al comprar. El plazo y el costo de envío se coordinan y confirman contigo al momento de la compra.

7. Cambios y devoluciones
Se rigen por nuestra Política de cambios y devoluciones, disponible en este sitio.

8. Libro de Reclamaciones
Contamos con un Libro de Reclamaciones virtual, disponible en este sitio web, conforme al Código de Protección y Defensa del Consumidor. Puedes presentar un reclamo o una queja en cualquier momento.

9. Datos personales
Los datos que nos entregas (nombre, correo, teléfono, dirección) se usan únicamente para procesar tu pedido, coordinar la entrega y atender tus consultas o reclamos. No los vendemos ni los compartimos con terceros, salvo los necesarios para el pago y la entrega. Puedes pedirnos acceder a tus datos, corregirlos o eliminarlos escribiendo a ${a.email}.

10. Propiedad intelectual
Las fotografías, textos, marcas y diseños de este sitio pertenecen a ${rs(a)} o se usan con autorización. No pueden reproducirse sin permiso.

11. Ley aplicable
Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia se someterá a las autoridades competentes del Perú.`;
}

export function devolucionesDefault(a) {
  return `1. Cambios y devoluciones
Quieres que quedes conforme con tu alfombra. Puedes solicitar un cambio o devolución dentro de los 7 días calendario posteriores a la recepción de tu pedido.

2. Cuándo aplica
• La alfombra llegó con un defecto de fabricación o dañada durante el transporte.
• Recibiste un producto, color o medida distinto al que compraste.
• Tienes derecho a cambio o devolución cuando el producto no coincide con lo ofrecido en este sitio.

3. Condiciones
• El producto debe estar sin uso, limpio, sin olores y en su embalaje original.
• Debes presentar tu número de pedido o comprobante de pago.
• Si el defecto o el error es nuestro, nosotros asumimos el costo del recojo y del nuevo envío.
• Si el cambio es por una decisión personal (gusto, medida o color), el costo de envío lo asume el cliente.

4. Cómo solicitarlo
Escríbenos por WhatsApp al +${a.whatsapp} o a ${a.email} indicando tu número de pedido, tu nombre y el motivo, con fotos del producto si hay un defecto. Te responderemos en un máximo de 2 días hábiles.

5. Reembolsos
Si corresponde la devolución del dinero, se realiza por el mismo medio de pago que usaste, en un plazo máximo de 15 días hábiles desde que recibimos y revisamos el producto.

6. Libro de Reclamaciones
Si no estás de acuerdo con la solución, puedes registrar tu reclamo en nuestro Libro de Reclamaciones virtual.`;
}
