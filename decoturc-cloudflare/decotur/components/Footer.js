const IC = {
  facebook: <path d="M13.5 22v-8.2h2.8l.4-3.3h-3.2V8.4c0-.9.3-1.5 1.6-1.5h1.7V4c-.3 0-1.3-.1-2.4-.1-2.4 0-4.1 1.5-4.1 4.2v2.4H7.5v3.3h2.8V22h3.2z" />,
  instagram: <path d="M7.5 2h9A5.5 5.5 0 0 1 22 7.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2zm0 2A3.5 3.5 0 0 0 4 7.5v9A3.5 3.5 0 0 0 7.5 20h9a3.5 3.5 0 0 0 3.5-3.5v-9A3.5 3.5 0 0 0 16.5 4h-9zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6zm5.2-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4z" />,
  tiktok: <path d="M16.6 2h-3.2v13.2a2.8 2.8 0 1 1-2.8-2.8c.3 0 .6 0 .8.1V9.2a6 6 0 1 0 5.2 5.9V8.4a7.3 7.3 0 0 0 4.2 1.3V6.5A4.3 4.3 0 0 1 16.6 2z" />,
};
const NOMBRES = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };

export default function Footer({ aj }) {
  const redes = ['facebook', 'instagram', 'tiktok'].filter((k) => aj[k] && aj[k].startsWith('http'));
  return (
    <footer>
      <a className="logo" href="/">DECO <span>TURCO</span></a>
      <p>ALFOMBRAS &nbsp;|&nbsp; LIVING ROOMS</p>
      {redes.length > 0 && (
        <div className="redes">
          {redes.map((k) => (
            <a key={k} href={aj[k]} target="_blank" rel="noopener noreferrer" aria-label={NOMBRES[k]}>
              <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true">{IC[k]}</svg>
            </a>
          ))}
        </div>
      )}
      <div className="foot-links">
        <a href="/terminos">Términos y condiciones</a>
        <a href="/devoluciones">Cambios y devoluciones</a>
        <a className="libro" href="/libro-de-reclamaciones">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M5 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5V3zm2 2v14h10V5H7zm2 3h6v2H9V8zm0 4h6v2H9v-2z" /></svg>
          Libro de Reclamaciones
        </a>
      </div>
      <div className="foot-datos">
        {aj.razon_social || 'Deco Turco'}{aj.ruc ? ` · RUC ${aj.ruc}` : ''} · {aj.direccion}<br />
        <a href={`mailto:${aj.email}`}>{aj.email}</a> · <a href={`https://wa.me/${aj.whatsapp}`} target="_blank" rel="noopener">+{aj.whatsapp}</a>
      </div>
      <div className="copy">© {new Date().getFullYear()} Deco Turco · Todos los derechos reservados</div>
    </footer>
  );
}
