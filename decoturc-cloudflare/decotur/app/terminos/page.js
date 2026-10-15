import PaginaLegal from '../../components/PaginaLegal';
import { getAjustes } from '../../lib/ajustes';
import { terminosDefault } from '../../lib/legal';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Términos y condiciones | Deco Turco' };

export default async function Page() {
  const aj = await getAjustes();
  return <PaginaLegal titulo="Términos y condiciones" texto={aj.terminos || terminosDefault(aj)} aj={aj} />;
}
