import PaginaLegal from '../../components/PaginaLegal';
import { getAjustes } from '../../lib/ajustes';
import { devolucionesDefault } from '../../lib/legal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Política de cambios y devoluciones | Deco Turco' };

export default async function Page() {
  const aj = await getAjustes();
  return <PaginaLegal titulo="Política de cambios y devoluciones" texto={aj.devoluciones || devolucionesDefault(aj)} aj={aj} />;
}
