'use client';

export default function ContactoForm({ whatsapp }) {
  const enviar = (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const txt = `Hola, soy ${f.get('nombre')}. Mi teléfono es ${f.get('tel')}. Me interesa: ${f.get('interes')}. ${f.get('mensaje') || ''}`;
    window.open(`https://wa.me/${whatsapp}?text=${encodeURIComponent(txt)}`, '_blank');
  };
  return (
    <form className="form reveal" onSubmit={enviar}>
      <div className="fila">
        <div className="campo"><label htmlFor="nombre">Nombre</label><input id="nombre" name="nombre" required /></div>
        <div className="campo"><label htmlFor="tel">Teléfono</label><input id="tel" name="tel" type="tel" required /></div>
      </div>
      <div className="campo"><label htmlFor="interes">Me interesa</label>
        <select id="interes" name="interes">
          <option>Asesoría general</option>
          <option>Alfombra para living room</option>
          <option>Alfombra para dormitorio</option>
          <option>Una medida o color específico</option>
          <option>Compra al por mayor</option>
        </select>
      </div>
      <div className="campo"><label htmlFor="mensaje">Mensaje</label><textarea id="mensaje" name="mensaje" placeholder="Cuéntanos el espacio y el estilo que buscas" /></div>
      <button className="btn solido" type="submit">Enviar por WhatsApp</button>
    </form>
  );
}
