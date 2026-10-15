import Footer from './Footer';

// Muestra un texto largo (con títulos numerados y viñetas) en una página limpia
export default function PaginaLegal({ titulo, texto, aj }) {
  const bloques = texto.split(/\n{2,}/);
  return (
    <>
      <div className="legal-top"><a className="logo" href="/">DECO <span>TURCO</span></a><a href="/" className="legal-volver">← Volver a la tienda</a></div>
      <main className="legal">
        <h1>{titulo}</h1>
        {bloques.map((b, i) => {
          const lineas = b.split('\n');
          const esTitulo = /^\d+\.\s/.test(lineas[0]);
          return (
            <section key={i}>
              {esTitulo && <h2>{lineas[0]}</h2>}
              {(esTitulo ? lineas.slice(1) : lineas).map((l, k) => (l.trim() ? <p key={k}>{l}</p> : null))}
            </section>
          );
        })}
      </main>
      <Footer aj={aj} />
    </>
  );
}
