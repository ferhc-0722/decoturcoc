import { isAdmin } from '../../lib/auth';
import { q } from '../../lib/db';
import { getAjustes } from '../../lib/ajustes';
import { loginAction, logoutAction, saveAjustes, saveProduct, createProduct, deleteProduct, createMovement, deleteMovement, savePreciosTier, responderReclamo } from '../actions';
import BotonEnvio from '../../components/BotonEnvio';

export const dynamic = 'force-dynamic';

const S = (n) => `S/ ${Number(n || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Login({ error }) {
  return (
    <div className="login">
      <form action={loginAction}>
        <h2>DECO TURCO · PANEL</h2>
        {error && <p style={{ color: '#e88', marginBottom: 10 }}>Clave incorrecta</p>}
        <label>Clave</label>
        <input type="password" name="password" required />
        <BotonEnvio pendingText="Ingresando…">Ingresar</BotonEnvio>
      </form>
    </div>
  );
}

export default async function Admin({ searchParams }) {
  if (!isAdmin()) return <Login error={searchParams?.error} />;

  const tab = searchParams?.tab || 'resumen';
  const sp = searchParams || {};
  let body = null;

  if (tab === 'resumen') {
    const t = (await q('select count(*)::int c, coalesce(sum(stock),0)::int s, count(*) filter (where estado=$1)::int a from productos', ['agotado'])).rows[0];
    const f = (await q(`select
      coalesce(sum(monto) filter (where tipo in ('venta','ingreso')),0) ingresos,
      coalesce(sum(monto) filter (where tipo in ('compra','gasto')),0) egresos from movimientos`)).rows[0];
    const bajo = (await q('select * from productos where stock < 3 order by stock, codigo limit 50')).rows;
    const balance = Number(f.ingresos) - Number(f.egresos);
    body = (
      <>
        <div className="kpis">
          <div className="kpi"><small>Productos</small><strong>{t.c}</strong></div>
          <div className="kpi"><small>Piezas en stock</small><strong>{t.s}</strong></div>
          <div className="kpi"><small>Agotados</small><strong>{t.a}</strong></div>
          <div className="kpi"><small>Ingresos</small><strong className="pos">{S(f.ingresos)}</strong></div>
          <div className="kpi"><small>Gastos</small><strong className="neg">{S(f.egresos)}</strong></div>
          <div className="kpi"><small>Balance</small><strong className={balance >= 0 ? 'pos' : 'neg'}>{S(balance)}</strong></div>
        </div>
        <div className="card-a"><h3>Stock bajo (menos de 3 piezas)</h3>
          <table><thead><tr><th>Código</th><th>Color</th><th>Stock</th></tr></thead><tbody>
            {bajo.map((r) => <tr key={r.id}><td>{r.codigo}</td><td>{r.color}</td><td>{r.stock}</td></tr>)}
          </tbody></table>
        </div>
      </>
    );
  }

  if (tab === 'productos' && sp.id) {
    const p = (await q('select * from productos where id=$1', [Number(sp.id)])).rows[0];
    const ms = (await q(`select m.id mid, m.medida, pm.precio, pm.stock from producto_medidas pm
      join medidas m on m.id = pm.medida_id where pm.producto_id=$1 order by m.id`, [Number(sp.id)])).rows;
    const hist = (await q('select * from historial_precios where producto_id=$1 order by id desc', [Number(sp.id)])).rows;
    if (p) body = (
      <>
        <div className="card-a">
          <h3>{p.codigo} · {p.color} <a href="?tab=productos" style={{ float: 'right', fontSize: 14 }}>← Volver</a></h3>
          <form action={saveProduct} style={{ marginTop: 14 }}>
            <input type="hidden" name="id" value={p.id} />
            <div className="grid-a">
              <div><label>Precio mínimo (S/)</label><input type="number" step="0.01" name="precio_min" defaultValue={Number(p.precio_min)} /></div>
              <div><label>Precio máximo (S/)</label><input type="number" step="0.01" name="precio_max" defaultValue={Number(p.precio_max)} /></div>
              <div><label>Stock total</label><input type="number" name="stock" defaultValue={p.stock} /></div>
              <div><label>Estado</label><select name="estado" defaultValue={p.estado}><option value="disponible">Disponible</option><option value="agotado">Agotado</option></select></div>
              <div><label>URL de la foto</label><input name="foto_url" defaultValue={p.foto_url || ''} placeholder="https://..." /></div>
            </div>
            <div style={{ marginTop: 12 }}><label>Descripción (se muestra al cliente)</label>
              <textarea name="descripcion" rows={3} defaultValue={p.descripcion || ''} placeholder="Ej: Alfombra de diseño turco, pelo corto, fácil de limpiar. Ideal para living." style={{ width: '100%', padding: 8, border: '1px solid #ccc', font: 'inherit' }} /></div>
            <h4 style={{ margin: '22px 0 8px' }}>Medidas: precio y stock por tamaño</h4>
            <table><thead><tr><th>Medida</th><th>Precio (S/)</th><th>Stock</th></tr></thead><tbody>
              {ms.map((m) => (
                <tr key={m.mid}><td>{m.medida} cm</td>
                  <td><input type="number" step="0.01" name={`m_${m.mid}_precio`} defaultValue={m.precio ?? ''} placeholder="Sin precio" /></td>
                  <td><input type="number" name={`m_${m.mid}_stock`} defaultValue={m.stock} /></td></tr>
              ))}
            </tbody></table>
            <p style={{ marginTop: 18 }}><BotonEnvio>Guardar cambios</BotonEnvio></p>
          </form>
        </div>
        <div className="card-a">
          <h4>Historial de precios</h4>
          <table><thead><tr><th>Fecha</th><th>Mín</th><th>Máx</th></tr></thead><tbody>
            {hist.map((x) => <tr key={x.id}><td>{new Date(x.cambiado).toLocaleString('es-PE')}</td><td>{S(x.precio_min)}</td><td>{S(x.precio_max)}</td></tr>)}
          </tbody></table>
        </div>
        <div className="card-a">
          <h4>Eliminar producto</h4>
          <form action={deleteProduct} style={{ marginTop: 10 }}>
            <input type="hidden" name="id" value={p.id} />
            <label><input type="checkbox" name="confirmar" value="si" style={{ width: 'auto', marginRight: 8 }} />Confirmo que quiero eliminar este producto</label>
            <p style={{ marginTop: 10 }}><BotonEnvio className="peligro" pendingText="Eliminando…">Eliminar</BotonEnvio></p>
          </form>
        </div>
      </>
    );
  } else if (tab === 'productos') {
    const qq = (sp.q || '').trim();
    const rows = (await q('select * from productos where codigo ilike $1 or color ilike $1 order by codigo, color limit 300', [`%${qq}%`])).rows;
    body = (
      <>
        <div className="card-a">
          <form method="get" className="grid-a">
            <input type="hidden" name="tab" value="productos" />
            <div style={{ gridColumn: 'span 2' }}><label>Buscar código o color</label><input name="q" defaultValue={qq} /></div>
            <div><button>Buscar</button></div>
          </form>
          <table style={{ marginTop: 14 }}>
            <thead><tr><th>Código</th><th>Color</th><th>Precio</th><th>Stock</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id}>
                  <td>{p.codigo}</td><td>{p.color}</td>
                  <td>S/ {Number(p.precio_min).toLocaleString('es-PE')} – {Number(p.precio_max).toLocaleString('es-PE')}</td>
                  <td>{p.stock}</td>
                  <td className={p.estado === 'agotado' ? 'agot' : 'disp'}>{p.estado === 'agotado' ? 'Agotado' : 'Disponible'}</td>
                  <td><a href={`?tab=productos&id=${p.id}`}>Editar</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-a">
          <h3>Agregar producto nuevo</h3>
          <form action={createProduct} className="grid-a" style={{ marginTop: 12 }}>
            <div><label>Código</label><input name="codigo" required /></div>
            <div><label>Color</label><input name="color" required /></div>
            <div><label>Precio mín.</label><input type="number" step="0.01" name="precio_min" defaultValue="0" /></div>
            <div><label>Precio máx.</label><input type="number" step="0.01" name="precio_max" defaultValue="0" /></div>
            <div><label>Stock</label><input type="number" name="stock" defaultValue="0" /></div>
            <div><BotonEnvio>Agregar</BotonEnvio></div>
          </form>
        </div>
      </>
    );
  }

  if (tab === 'movimientos') {
    const hoy = new Date();
    const desde = sp.desde || new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().slice(0, 10);
    const hasta = sp.hasta || new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().slice(0, 10);
    const prods = (await q('select id, codigo, color from productos order by codigo, color')).rows;
    const movs = (await q(`select mv.*, p.codigo, p.color from movimientos mv
      left join productos p on p.id = mv.producto_id
      where mv.fecha between $1 and $2 order by mv.fecha desc, mv.id desc`, [desde, hasta])).rows;
    const ing = movs.filter((m) => ['venta', 'ingreso'].includes(m.tipo)).reduce((a, m) => a + Number(m.monto), 0);
    const egr = movs.filter((m) => ['compra', 'gasto'].includes(m.tipo)).reduce((a, m) => a + Number(m.monto), 0);
    body = (
      <>
        <div className="card-a">
          <h3>Registrar movimiento</h3>
          <form action={createMovement} className="grid-a" style={{ marginTop: 12 }}>
            <div><label>Fecha</label><input type="date" name="fecha" defaultValue={hoy.toISOString().slice(0, 10)} required /></div>
            <div><label>Tipo</label><select name="tipo">
              <option value="venta">Venta (resta stock)</option>
              <option value="compra">Compra de alfombras (suma stock)</option>
              <option value="gasto">Gasto</option>
              <option value="ingreso">Otro ingreso</option>
            </select></div>
            <div><label>Categoría</label><input name="categoria" placeholder="alquiler, transporte, publicidad…" /></div>
            <div><label>Descripción</label><input name="descripcion" /></div>
            <div><label>Monto (S/)</label><input type="number" step="0.01" name="monto" defaultValue="0" /></div>
            <div><label>Producto (opcional)</label><select name="producto_id" defaultValue="">
              <option value="">—</option>
              {prods.map((p) => <option key={p.id} value={p.id}>{p.codigo} {p.color}</option>)}
            </select></div>
            <div><label>Cantidad (piezas)</label><input type="number" name="cantidad" defaultValue="0" /></div>
            <div><BotonEnvio>Guardar</BotonEnvio></div>
          </form>
        </div>
        <div className="card-a">
          <form method="get" className="grid-a" style={{ marginBottom: 14 }}>
            <input type="hidden" name="tab" value="movimientos" />
            <div><label>Desde</label><input type="date" name="desde" defaultValue={desde} /></div>
            <div><label>Hasta</label><input type="date" name="hasta" defaultValue={hasta} /></div>
            <div><button>Filtrar</button></div>
          </form>
          <p>Ingresos: <span className="pos">{S(ing)}</span> · Gastos: <span className="neg">{S(egr)}</span> · Balance: <strong>{S(ing - egr)}</strong></p>
          <table style={{ marginTop: 12 }}>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Categoría / descripción</th><th>Producto</th><th>Cant.</th><th>Monto</th><th></th></tr></thead>
            <tbody>
              {movs.map((m) => (
                <tr key={m.id}>
                  <td>{String(m.fecha).slice(0, 10)}</td>
                  <td>{m.tipo}</td>
                  <td>{[m.categoria, m.descripcion].filter(Boolean).join(' · ')}</td>
                  <td>{m.codigo ? `${m.codigo} ${m.color}` : '—'}</td>
                  <td>{m.cantidad}</td>
                  <td className={['venta', 'ingreso'].includes(m.tipo) ? 'pos' : 'neg'}>{S(m.monto)}</td>
                  <td>
                    <form action={deleteMovement}>
                      <input type="hidden" name="id" value={m.id} />
                      <BotonEnvio className="peligro" pendingText="…">X</BotonEnvio>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  if (tab === 'precios') {
    const medidasL = (await q('select id, medida from medidas order by id')).rows;
    const tiers = (await q('select precio_min, precio_max, count(*)::int n from productos group by 1,2 order by 1,2')).rows;
    const cur = (await q(`select p.precio_min, p.precio_max, pm.medida_id, min(pm.precio) mn, max(pm.precio) mx
      from producto_medidas pm join productos p on p.id = pm.producto_id group by 1,2,3`)).rows;
    body = (
      <>
        <div className="card-a">
          <h3>Precios por medida</h3>
          <p className="hint">Los productos se agrupan por su rango de precio (mínimo–máximo). Escribe el precio de cada medida y se aplica a <b>todos</b> los productos de ese grupo. Sin precio por medida, el cliente no puede agregar la alfombra al carrito. Si un producto necesita un precio distinto, edítalo en Productos y stock.</p>
        </div>
        {tiers.map((t) => (
          <div className="card-a" key={`${t.precio_min}-${t.precio_max}`}>
            <h4>Rango {S(t.precio_min)} – {S(t.precio_max)} · {t.n} producto(s)</h4>
            <form action={savePreciosTier} style={{ marginTop: 10 }}>
              <input type="hidden" name="tier_min" value={Number(t.precio_min)} />
              <input type="hidden" name="tier_max" value={Number(t.precio_max)} />
              <div className="grid-a">
                {medidasL.map((m) => {
                  const c = cur.find((x) => Number(x.precio_min) === Number(t.precio_min) && Number(x.precio_max) === Number(t.precio_max) && x.medida_id === m.id);
                  const igual = c && c.mn != null && Number(c.mn) === Number(c.mx);
                  return (
                    <div key={m.id}><label>{m.medida} cm (S/)</label>
                      <input type="number" step="0.01" min="0" name={`p_${m.id}`} defaultValue={igual ? Number(c.mn) : ''} placeholder={c && c.mn != null ? 'varios' : 'sin precio'} /></div>
                  );
                })}
                <div><BotonEnvio>Aplicar a este grupo</BotonEnvio></div>
              </div>
            </form>
          </div>
        ))}
      </>
    );
  }

  if (tab === 'pedidos') {
    const ps = (await q('select * from pedidos order by id desc limit 100')).rows;
    body = (
      <div className="card-a">
        <h3>Pedidos de la web</h3>
        <table style={{ marginTop: 12 }}>
          <thead><tr><th>#</th><th>Fecha</th><th>Cliente</th><th>Entrega</th><th>Productos</th><th>Total</th><th>Estado</th></tr></thead>
          <tbody>
            {ps.map((p) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{new Date(p.creado).toLocaleString('es-PE', { timeZone: 'America/Lima' })}</td>
                <td>{p.nombre}<br /><small>{p.email} · {p.telefono}{p.documento ? ` · ${p.documento}` : ''}</small></td>
                <td>{p.direccion}, {p.ciudad}{p.notas ? <><br /><small>{p.notas}</small></> : null}</td>
                <td>{(p.items || []).map((i, k) => <div key={k}>{i.qty} × {i.codigo} {i.color} · {i.medida}</div>)}</td>
                <td>{S(p.total)}</td>
                <td className={p.estado === 'pagado' ? 'disp' : p.estado === 'fallido' ? 'agot' : ''}>{p.estado}{p.error ? <><br /><small>{p.error}</small></> : null}</td>
              </tr>
            ))}
            {ps.length === 0 && <tr><td colSpan={7}>Aún no hay pedidos.</td></tr>}
          </tbody>
        </table>
      </div>
    );
  }

  if (tab === 'reclamos') {
    const rs = (await q('select * from reclamos order by id desc limit 100')).rows;
    body = (
      <>
        <div className="card-a"><h3>Libro de Reclamaciones</h3><p className="hint">Debes responder cada hoja en un máximo de 30 días calendario, al correo del cliente. Anota aquí la respuesta y márcala como atendida.</p></div>
        {rs.map((r) => (
          <div className="card-a" key={r.id}>
            <h4>N° {r.codigo} · {r.tipo.toUpperCase()} · <span className={r.estado === 'atendido' ? 'disp' : 'agot'}>{r.estado}</span></h4>
            <p style={{ margin: '8px 0' }}>{new Date(r.creado).toLocaleString('es-PE', { timeZone: 'America/Lima' })} · {r.nombre} ({r.documento_tipo} {r.documento_num}) · {r.email} · {r.telefono || 'sin teléfono'}<br />
              Domicilio: {r.domicilio}{r.menor ? ` · Apoderado: ${r.apoderado}` : ''}<br />
              {r.tipo_bien}: {r.descripcion_bien || '—'} · Monto: {r.monto ? S(r.monto) : '—'}</p>
            <p><b>Detalle:</b> {r.detalle}</p>
            <p><b>Pedido del cliente:</b> {r.pedido_consumidor}</p>
            <form action={responderReclamo} style={{ marginTop: 10 }}>
              <input type="hidden" name="id" value={r.id} />
              <label>Respuesta / acciones adoptadas</label>
              <textarea name="respuesta" rows={3} defaultValue={r.respuesta || ''} style={{ width: '100%', padding: 8, border: '1px solid #ccc', font: 'inherit' }} />
              <p style={{ marginTop: 8 }}>
                <BotonEnvio name="estado" value="atendido">Guardar y marcar atendido</BotonEnvio>{' '}
                <BotonEnvio name="estado" value="pendiente" className="sec">Guardar como pendiente</BotonEnvio>
              </p>
            </form>
          </div>
        ))}
        {rs.length === 0 && <div className="card-a">Aún no hay reclamos registrados.</div>}
      </>
    );
  }

  if (tab === 'ajustes') {
    const aj = await getAjustes();
    body = (
      <div className="card-a">
        <h3>Diseño y contacto</h3>
        <p className="hint"><b>Fondo Inicio:</b> pega la URL de una foto (.jpg, .png, .webp) o de un video directo (.mp4, .webm). También puedes escribir <b>animado</b> o un color como <b>#1C1C1C</b>. Se aplica al instante. <b>Nosotros, Catálogo y Contáctanos:</b> color (#F8F3EA) o URL de foto. Usa colores claros en Nosotros y Catálogo, y uno oscuro en Contáctanos.</p>
        <form action={saveAjustes} className="grid-a" style={{ marginTop: 14 }}>
          <div style={{ gridColumn: '1 / -1' }}><label>Fondo Inicio (URL de foto o video, color o "animado")</label><input name="fondo_inicio" defaultValue={aj.fondo_inicio} placeholder="https://.../video.mp4" /></div>
          <div><label>Fondo Nosotros</label><input name="fondo_nosotros" defaultValue={aj.fondo_nosotros} /></div>
          <div><label>Fondo Catálogo</label><input name="fondo_catalogo" defaultValue={aj.fondo_catalogo} /></div>
          <div><label>Fondo Contáctanos</label><input name="fondo_contacto" defaultValue={aj.fondo_contacto} /></div>
          <div><label>WhatsApp / teléfono (con código de país, sin +)</label><input name="whatsapp" defaultValue={aj.whatsapp} placeholder="51999999999" inputMode="numeric" /></div>
          <div><label>Correo</label><input name="email" defaultValue={aj.email} /></div>
          <div><label>Dirección</label><input name="direccion" defaultValue={aj.direccion} /></div>
          <div><label>Horario</label><input name="horario" defaultValue={aj.horario} /></div>
          <div style={{ gridColumn: '1 / -1' }}><h3 style={{ marginTop: 10 }}>Métodos de pago</h3><p className="hint">Se muestran al cliente cuando elige una alfombra. Deja vacío lo que no uses.</p></div>
          <div style={{ gridColumn: '1 / -1' }}><label>Yape · URL de la foto del QR</label><input name="yape_qr" defaultValue={aj.yape_qr} placeholder="https://.../qr-yape.png" /></div>
          <div><label>Yape · número</label><input name="yape_numero" defaultValue={aj.yape_numero} placeholder="999 999 999" /></div>
          <div><label>Plin · número</label><input name="plin_numero" defaultValue={aj.plin_numero} placeholder="999 999 999" /></div>
          <div style={{ gridColumn: '1 / -1' }}><label>Plin · URL de la foto del QR (opcional)</label><input name="plin_qr" defaultValue={aj.plin_qr} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label>Transferencia bancaria (banco, cuenta, CCI, titular)</label><textarea name="transferencia" defaultValue={aj.transferencia} rows={4} placeholder={'BCP Soles: 000-0000000-0-00\nCCI: 000-000-000000000000-00\nTitular: Nombre Apellido'} style={{ width: '100%', padding: 8, border: '1px solid #ccc', font: 'inherit' }} /></div>
          <div style={{ gridColumn: '1 / -1' }}><h3 style={{ marginTop: 10 }}>Datos de la empresa y redes sociales</h3><p className="hint">Aparecen en el pie de página, en el Libro de Reclamaciones y en los textos legales. Las redes solo se muestran si pegas el enlace completo (https://...).</p></div>
          <div><label>Razón social / nombre comercial</label><input name="razon_social" defaultValue={aj.razon_social} /></div>
          <div><label>RUC</label><input name="ruc" defaultValue={aj.ruc} /></div>
          <div><label>Facebook (enlace)</label><input name="facebook" defaultValue={aj.facebook} placeholder="https://facebook.com/..." /></div>
          <div><label>Instagram (enlace)</label><input name="instagram" defaultValue={aj.instagram} placeholder="https://instagram.com/..." /></div>
          <div><label>TikTok (enlace)</label><input name="tiktok" defaultValue={aj.tiktok} placeholder="https://tiktok.com/@..." /></div>
          <div style={{ gridColumn: '1 / -1' }}><h3 style={{ marginTop: 10 }}>Textos legales</h3><p className="hint">Si los dejas vacíos se muestra un texto base. Revísalos y ajústalos a tu negocio (plazos, costos de envío, etc.); conviene que los valide un abogado. Se ven en /terminos y /devoluciones.</p></div>
          <div style={{ gridColumn: '1 / -1' }}><label>Términos y condiciones</label><textarea name="terminos" rows={8} defaultValue={aj.terminos} placeholder="Vacío = texto base" style={{ width: '100%', padding: 8, border: '1px solid #ccc', font: 'inherit' }} /></div>
          <div style={{ gridColumn: '1 / -1' }}><label>Política de cambios y devoluciones</label><textarea name="devoluciones" rows={8} defaultValue={aj.devoluciones} placeholder="Vacío = texto base" style={{ width: '100%', padding: 8, border: '1px solid #ccc', font: 'inherit' }} /></div>
          <div><BotonEnvio>Guardar cambios</BotonEnvio></div>
        </form>
        <p className="hint" style={{ marginTop: 14 }}>El número de WhatsApp se usa en todos los botones de la web y en el pie de página. Si lo dejas vacío se usa el de la variable NEXT_PUBLIC_WHATSAPP de Vercel.</p>
      </div>
    );
  }

  return (
    <div className="adm">
      <header>
        <div><b>DECO TURCO</b> · Panel de gestión</div>
        <form action={logoutAction}><BotonEnvio className="sec" pendingText="Saliendo…">Salir</BotonEnvio></form>
      </header>
      <nav>
        <a href="?tab=resumen" className={tab === 'resumen' ? 'on' : ''}>Resumen</a>
        <a href="?tab=productos" className={tab === 'productos' ? 'on' : ''}>Productos y stock</a>
        <a href="?tab=movimientos" className={tab === 'movimientos' ? 'on' : ''}>Ingresos y gastos</a>
        <a href="?tab=precios" className={tab === 'precios' ? 'on' : ''}>Precios por medida</a>
        <a href="?tab=pedidos" className={tab === 'pedidos' ? 'on' : ''}>Pedidos</a>
        <a href="?tab=reclamos" className={tab === 'reclamos' ? 'on' : ''}>Reclamos</a>
        <a href="?tab=ajustes" className={tab === 'ajustes' ? 'on' : ''}>Diseño y contacto</a>
      </nav>
      <main>{body}</main>
    </div>
  );
}
