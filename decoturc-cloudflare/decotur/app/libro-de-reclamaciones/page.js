import FormReclamo from '../../components/FormReclamo';
import Footer from '../../components/Footer';
import { getAjustes } from '../../lib/ajustes';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Libro de Reclamaciones | Deco Turco' };

export default async function Page() {
  const aj = await getAjustes();
  const proveedor = { razon_social: aj.razon_social || 'Deco Turco', ruc: aj.ruc, direccion: aj.direccion };
  return (
    <>
      <div className="legal-top no-print"><a className="logo" href="/">DECO <span>TURCO</span></a><a href="/" className="legal-volver">← Volver a la tienda</a></div>
      <main className="legal">
        <h1 className="no-print">Libro de Reclamaciones</h1>
        <p className="no-print">Conforme al Código de Protección y Defensa del Consumidor (Ley N.º 29571), completa esta hoja para registrar un reclamo o una queja. Recibirás una constancia con tu número de hoja.</p>
        <FormReclamo proveedor={proveedor} />
      </main>
      <div className="no-print"><Footer aj={aj} /></div>
    </>
  );
}
