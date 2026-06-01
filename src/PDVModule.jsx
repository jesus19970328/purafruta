import { useState, useEffect, useRef } from "react";

const SB_URL = 'https://iepqhmxgdyuthcsmxadb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHFobXhnZHl1dGhjc214YWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODM1MjcsImV4cCI6MjA5NDk1OTUyN30.WWUs3xNpaMAYcvp2TAVuqQdCHGCsKIV0fdDF3Y45sLE';
const hdr = (tok) => ({ 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${tok || SB_KEY}`, 'Prefer': 'return=representation' });
const db = {
  get: (t, q, tok) => fetch(`${SB_URL}/rest/v1/${t}${q ? '?' + q : ''}`, { headers: { ...hdr(tok), 'Accept': 'application/json' } }).then(r => r.json()),
  post: (t, d, tok) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  patch: (t, f, d, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  del: (t, f, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'DELETE', headers: hdr(tok) }).then(r => r.ok),
};

const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
const fd = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—';
const fdt = (d) => d ? new Date(d).toLocaleString('es-PY') : '—';

// ── UI COMPONENTS ──────────────────────────────────────────
const Card = ({ children, style }) => <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', ...style }}>{children}</div>;
const CardHead = ({ title, sub, action }) => (
  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div><h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{title}</h3>{sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{sub}</p>}</div>
    {action}
  </div>
);
const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };
const Inp = ({ label, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}<input {...p} style={{ ...inp, ...(p.style || {}) }} /></div>;
const Sel = ({ label, children, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}<select {...p} style={{ ...inp, ...(p.style || {}) }}>{children}</select></div>;
const Btn = ({ onClick, children, variant = 'primary', disabled, full, style: sx }) => {
  const styles = { primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' }, secondary: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }, ghost: { background: '#f0fdf4', color: '#15803d' }, danger: { background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }, blue: { background: '#eff6ff', color: '#1d4ed8' }, orange: { background: '#fff7ed', color: '#c2410c' }, purple: { background: '#faf5ff', color: '#7c3aed' } };
  return <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px 18px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', width: full ? '100%' : 'auto', transition: 'all .15s', ...styles[variant], ...sx }}>{children}</button>;
};
const Tabs = ({ tabs, active, onChange }) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{tabs.map(([id, label]) => <button key={id} onClick={() => onChange(id)} style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', flex: '1 1 auto', background: active === id ? '#16a34a' : '#fff', color: active === id ? '#fff' : '#6b7280', boxShadow: active === id ? 'none' : '0 0 0 1.5px #e5e7eb' }}>{label}</button>)}</div>;
const Badge = ({ children, color = 'gray' }) => { const c = { green: { bg: '#f0fdf4', text: '#15803d' }, yellow: { bg: '#fefce8', text: '#a16207' }, blue: { bg: '#eff6ff', text: '#1d4ed8' }, red: { bg: '#fef2f2', text: '#dc2626' }, purple: { bg: '#faf5ff', text: '#7c3aed' }, orange: { bg: '#fff7ed', text: '#c2410c' }, gray: { bg: '#f9fafb', text: '#6b7280' } }; return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: c[color]?.bg, color: c[color]?.text }}>{children}</span>; };

const MEDIOS_PAGO = [
  { id: 'efectivo', label: '💵 Efectivo', color: 'green' },
  { id: 'qr_bancard', label: '📱 QR Bancard', color: 'blue' },
  { id: 'pos_bancard', label: '💳 POS Bancard', color: 'purple' },
  { id: 'transferencia', label: '🏦 Transferencia', color: 'orange' },
];

const CLASIFICACIONES_GASTO = ['Producto de limpieza', 'Transporte / Bolt del personal', 'Mantenimiento', 'Insumos de oficina', 'Otro gasto operativo'];

// Productos que requieren ticket de producción
const REQUIERE_TICKET_PROD = (nombre) => {
  const n = (nombre || '').toLowerCase();
  return n.includes('jugo') || n.includes('açaí') || n.includes('acai') || n.includes('postre açaí');
};

// ── MÓDULO PRINCIPAL ───────────────────────────────────────
export default function PDVModule({ tok, perfil }) {
  const [tab, setTab] = useState('venta');
  const [cajaActiva, setCajaActiva] = useState(null);
  const [loadingCaja, setLoadingCaja] = useState(true);
  const [sucursal, setSucursal] = useState(perfil?.sucursal_id || '');
  const [sucs, setSucs] = useState([]);

  useEffect(() => {
    db.get('sucursales', 'activa=eq.true', tok).then(d => setSucs(Array.isArray(d) ? d : []));
  }, [tok]);

  useEffect(() => {
    if (!sucursal) { setLoadingCaja(false); return; }
    verificarCaja(sucursal);
  }, [sucursal]);

  const verificarCaja = (sucId) => {
    setLoadingCaja(true);
    const hoy = new Date().toISOString().split('T')[0];
    db.get('cajas', `sucursal_id=eq.${sucId}&fecha=eq.${hoy}&estado=eq.abierta&order=created_at.desc&limit=1`, tok)
      .then(d => { setCajaActiva(Array.isArray(d) && d.length > 0 ? d[0] : null); setLoadingCaja(false); });
  };

  const sucNombre = sucs.find(s => s.id === sucursal)?.nombre || perfil?.nombre || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Tabs tabs={[['venta', '🏪 Punto de Venta'], ['caja', '💰 Caja'], ['historial', '📋 Historial'], ['gastos', '📝 Gastos'], ['inventario', '📦 Inventario'], ['proveedores', '🚚 Proveedores']]} active={tab} onChange={setTab} />
      {tab === 'venta' && <Venta tok={tok} perfil={perfil} cajaActiva={cajaActiva} loadingCaja={loadingCaja} sucursal={sucursal} setSucursal={setSucursal} sucs={sucs} sucNombre={sucNombre} onAbrirCaja={() => setTab('caja')} />}
      {tab === 'caja' && <Caja tok={tok} perfil={perfil} sucursal={sucursal} setSucursal={setSucursal} sucs={sucs} sucNombre={sucNombre} cajaActiva={cajaActiva} onCajaChange={() => verificarCaja(sucursal)} />}
      {tab === 'historial' && <HistorialVentas tok={tok} perfil={perfil} sucursal={sucursal} sucs={sucs} cajaActiva={cajaActiva} />}
      {tab === 'gastos' && <Gastos tok={tok} perfil={perfil} sucursal={sucursal} sucs={sucs} cajaActiva={cajaActiva} />}
      {tab === 'inventario' && <InventarioSucursal tok={tok} perfil={perfil} />}
      {tab === 'proveedores' && <ProveedoresSucursal tok={tok} />}
    </div>
  );
}

// ── CAJA ───────────────────────────────────────────────────
function Caja({ tok, perfil, sucursal, setSucursal, sucs, sucNombre, cajaActiva, onCajaChange }) {
  const [historial, setHistorial] = useState([]);
  const [loading, setLoading] = useState(true);
  const [montoApertura, setMontoApertura] = useState('');
  const [turno, setTurno] = useState('manana');
  const [saving, setSaving] = useState(false);
  const [cierreDatos, setCierreDatos] = useState({ caja_sencillo: '', efectivo: '', tarjeta: '', transferencia: '', qr: '', observacion: '' });
  const [showCierre, setShowCierre] = useState(false);

  useEffect(() => {
    if (!sucursal) { setLoading(false); return; }
    const hoy = new Date().toISOString().split('T')[0];
    db.get('cajas', `sucursal_id=eq.${sucursal}&fecha=eq.${hoy}&order=created_at.desc`, tok)
      .then(d => { setHistorial(Array.isArray(d) ? d : []); setLoading(false); });
  }, [sucursal, tok, cajaActiva]);

  const abrirCaja = async () => {
    if (!sucursal || !montoApertura) return;
    setSaving(true);
    await db.post('cajas', { sucursal_id: sucursal, turno, monto_apertura: parseFloat(montoApertura), estado: 'abierta', cajero: perfil?.id || null }, tok);
    setMontoApertura('');
    setSaving(false);
    onCajaChange();
  };

  const cerrarCaja = async () => {
    if (!cajaActiva) return;
    setSaving(true);
    const totalEfectivo = parseFloat(cierreDatos.efectivo || 0);
    const totalTarjeta = parseFloat(cierreDatos.tarjeta || 0);
    const totalTransferencia = parseFloat(cierreDatos.transferencia || 0);
    const totalQr = parseFloat(cierreDatos.qr || 0);
    const cajaSencillo = parseFloat(cierreDatos.caja_sencillo || 0);
    const totalVentas = totalEfectivo + totalTarjeta + totalTransferencia + totalQr;
    const enCaja = parseFloat(cajaActiva.monto_apertura || 0) + totalEfectivo;
    const diferencia = cajaSencillo - enCaja;

    await db.patch('cajas', `id=eq.${cajaActiva.id}`, {
      estado: 'cerrada',
      monto_cierre: cajaSencillo,
      total_efectivo: totalEfectivo,
      total_tarjeta: totalTarjeta,
      total_transferencia: totalTransferencia,
      total_qr: totalQr,
      total_ventas: totalVentas,
      diferencia,
      observacion: cierreDatos.observacion || null
    }, tok);

    setCierreDatos({ caja_sencillo: '', efectivo: '', tarjeta: '', transferencia: '', qr: '', observacion: '' });
    setShowCierre(false);
    setSaving(false);
    onCajaChange();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {!perfil?.sucursal_id && (
        <Sel label="Sucursal" value={sucursal} onChange={e => setSucursal(e.target.value)}>
          <option value="">Elegir sucursal...</option>
          {sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Sel>
      )}

      {sucursal && !cajaActiva && (
        <Card>
          <CardHead title="Abrir nueva caja" sub={sucNombre} />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: '#fefce8', borderRadius: 10, padding: 14, fontSize: 13, color: '#a16207' }}>
              💡 El monto de apertura debe ser: <strong>caja sencillo + caja general anterior</strong>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Sel label="Turno" value={turno} onChange={e => setTurno(e.target.value)}>
                <option value="manana">☀️ Mañana</option>
                <option value="tarde">🌤 Tarde</option>
              </Sel>
              <Inp label="Monto de apertura (Gs.) *" type="number" value={montoApertura} onChange={e => setMontoApertura(e.target.value)} placeholder="Ej: 3000000" />
            </div>
            <Btn onClick={abrirCaja} disabled={saving || !montoApertura} full style={{ padding: 14, fontSize: 15 }}>
              {saving ? 'Abriendo...' : '🔓 Abrir caja'}
            </Btn>
          </div>
        </Card>
      )}

      {sucursal && cajaActiva && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Estado de caja */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {[
              { label: 'Apertura', value: gs(cajaActiva.monto_apertura), color: '#16a34a' },
              { label: 'Movimiento', value: gs(cajaActiva.total_ventas || 0), color: '#1d4ed8' },
              { label: 'En caja', value: gs((cajaActiva.monto_apertura || 0) + (cajaActiva.total_efectivo || 0)), color: '#7c3aed' },
              { label: 'Turno', value: cajaActiva.turno === 'manana' ? '☀️ Mañana' : '🌤 Tarde', color: '#c2410c' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: '14px 16px' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', margin: '0 0 6px', textTransform: 'uppercase' }}>{label}</p>
                <p style={{ fontSize: 20, fontWeight: 700, color, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>

          {!showCierre ? (
            <Btn variant="danger" onClick={() => setShowCierre(true)} full style={{ padding: 14, fontSize: 15 }}>
              🔒 Cerrar caja
            </Btn>
          ) : (
            <Card>
              <CardHead title="Cierre de caja" sub="Ingresá los montos del turno" />
              <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <Inp label="Caja sencillo (Gs.)" type="number" value={cierreDatos.caja_sencillo} onChange={e => setCierreDatos({ ...cierreDatos, caja_sencillo: e.target.value })} placeholder="0" />
                  <Inp label="Venta en efectivo (Gs.)" type="number" value={cierreDatos.efectivo} onChange={e => setCierreDatos({ ...cierreDatos, efectivo: e.target.value })} placeholder="0" />
                  <Inp label="Venta en tarjeta (Gs.)" type="number" value={cierreDatos.tarjeta} onChange={e => setCierreDatos({ ...cierreDatos, tarjeta: e.target.value })} placeholder="0" />
                  <Inp label="Venta por transferencia (Gs.)" type="number" value={cierreDatos.transferencia} onChange={e => setCierreDatos({ ...cierreDatos, transferencia: e.target.value })} placeholder="0" />
                  <Inp label="Venta por QR (Gs.)" type="number" value={cierreDatos.qr} onChange={e => setCierreDatos({ ...cierreDatos, qr: e.target.value })} placeholder="0" />
                  <Inp label="Observación" value={cierreDatos.observacion} onChange={e => setCierreDatos({ ...cierreDatos, observacion: e.target.value })} placeholder="Opcional" />
                </div>
                {/* Resumen automático */}
                <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    ['Total ventas', parseFloat(cierreDatos.efectivo||0)+parseFloat(cierreDatos.tarjeta||0)+parseFloat(cierreDatos.transferencia||0)+parseFloat(cierreDatos.qr||0)],
                    ['En caja', parseFloat(cajaActiva.monto_apertura||0)+parseFloat(cierreDatos.efectivo||0)],
                    ['Diferencia', parseFloat(cierreDatos.caja_sencillo||0)-(parseFloat(cajaActiva.monto_apertura||0)+parseFloat(cierreDatos.efectivo||0))],
                  ].map(([label, val]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span style={{ color: '#6b7280' }}>{label}</span>
                      <span style={{ fontWeight: 700, color: label === 'Diferencia' ? (val === 0 ? '#16a34a' : '#dc2626') : '#111827' }}>{gs(val)}</span>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <Btn onClick={cerrarCaja} disabled={saving} variant="danger" full>{saving ? 'Cerrando...' : '🔒 Confirmar cierre'}</Btn>
                  <Btn variant="secondary" onClick={() => setShowCierre(false)}>Cancelar</Btn>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Historial del día */}
      {historial.length > 0 && (
        <Card>
          <CardHead title="Cajas del día" />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {historial.map(c => (
              <div key={c.id} style={{ background: '#f9fafb', borderRadius: 10, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{c.turno === 'manana' ? '☀️ Mañana' : '🌤 Tarde'}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', marginLeft: 10 }}>{fd(c.fecha)}</span>
                  </div>
                  <Badge color={c.estado === 'abierta' ? 'green' : 'gray'}>{c.estado}</Badge>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, fontSize: 13 }}>
                  <div><span style={{ color: '#9ca3af' }}>Apertura: </span><strong>{gs(c.monto_apertura)}</strong></div>
                  <div><span style={{ color: '#9ca3af' }}>Ventas: </span><strong>{gs(c.total_ventas)}</strong></div>
                  <div><span style={{ color: '#9ca3af' }}>Diferencia: </span><strong style={{ color: c.diferencia === 0 ? '#16a34a' : '#dc2626' }}>{gs(c.diferencia)}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ── PUNTO DE VENTA ─────────────────────────────────────────
function Venta({ tok, perfil, cajaActiva, loadingCaja, sucursal, setSucursal, sucs, sucNombre, onAbrirCaja }) {
  const [prods, setProds] = useState([]);
  const [turno, setTurno] = useState('manana');
  const [carrito, setCarrito] = useState([]);
  const [medioPago, setMedioPago] = useState('efectivo');
  const [montoRecibido, setMontoRecibido] = useState('');
  const [saving, setSaving] = useState(false);
  const [ventaOk, setVentaOk] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [modoRapido, setModoRapido] = useState(true);

  useEffect(() => {
    db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : []));
  }, [tok]);

  const prodsFiltrados = prods.filter(p => p.precio_venta && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));
  const add = (p) => { const ex = carrito.find(i => i.id === p.id); if (ex) setCarrito(carrito.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)); else setCarrito([...carrito, { ...p, qty: 1 }]); };
  const upd = (id, qty) => { if (qty <= 0) setCarrito(carrito.filter(i => i.id !== id)); else setCarrito(carrito.map(i => i.id === id ? { ...i, qty } : i)); };
  const total = carrito.reduce((s, i) => s + (parseFloat(i.precio_venta) || 0) * i.qty, 0);
  const vuelto = montoRecibido ? Math.max(0, parseFloat(montoRecibido) - total) : 0;
  const tieneProductosTicket = carrito.some(i => REQUIERE_TICKET_PROD(i.nombre));

  const cobrar = async (conTicketProd = false) => {
    if (!sucursal || carrito.length === 0) return;
    if (!cajaActiva) { alert('Debés abrir la caja antes de registrar una venta.'); onAbrirCaja(); return; }
    setSaving(true);
    const nroOrden = Math.floor(Math.random() * 9000) + 1000;
    const res = await db.post('ventas', { sucursal_id: sucursal, total, medio_pago: medioPago, turno, cajero: perfil?.id || null, observacion: `Orden #${nroOrden}` }, tok);
    const venta = Array.isArray(res) ? res[0] : res;
    if (venta?.id) {
      await db.post('ventas_detalle', carrito.map(i => ({ venta_id: venta.id, producto_id: i.id, cantidad: i.qty, precio_unitario: parseFloat(i.precio_venta) || 0, subtotal: (parseFloat(i.precio_venta) || 0) * i.qty })), tok);
      setVentaOk({ ...venta, nroOrden, items: [...carrito], sucNombre, medioPago, montoRecibido: parseFloat(montoRecibido) || total, vuelto, conTicketProd });
      setCarrito([]); setMontoRecibido('');
    }
    setSaving(false);
  };

  const imprimirTicket = (tipo = 'cliente') => {
    const w = window.open('', '_blank');
    const esProduccion = tipo === 'produccion';
    w.document.write(`
      <html><head><title>Ticket ${esProduccion ? 'PRODUCCIÓN' : 'Cliente'}</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 280px; padding: 10px; font-size: 12px; }
        .center { text-align: center; } .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .logo { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
        .total { font-size: 16px; font-weight: bold; }
        .prod-header { background: #000; color: #fff; padding: 6px; text-align: center; font-size: 14px; font-weight: bold; margin-bottom: 8px; }
      </style></head><body>
        ${esProduccion ? '<div class="prod-header">🍹 TICKET DE PRODUCCIÓN</div>' : ''}
        <div class="center">
          <div class="logo">PURAFRUTA</div>
          <div>${ventaOk?.sucNombre || ''}</div>
          ${!esProduccion ? `<div>${new Date().toLocaleString('es-PY')}</div>` : ''}
          <div>Orden #${ventaOk?.nroOrden}</div>
        </div>
        <div class="line"></div>
        ${(esProduccion ? ventaOk?.items?.filter(i => REQUIERE_TICKET_PROD(i.nombre)) : ventaOk?.items)
          ?.map(i => `<div class="row"><span>${i.qty}x ${i.nombre}</span>${!esProduccion ? `<span>${gs((parseFloat(i.precio_venta)||0)*i.qty)}</span>` : ''}</div>`).join('')}
        <div class="line"></div>
        ${!esProduccion ? `
          <div class="row total"><span>TOTAL</span><span>${gs(ventaOk?.total)}</span></div>
          <div class="row"><span>Recibido</span><span>${gs(ventaOk?.montoRecibido)}</span></div>
          <div class="row"><span>Vuelto</span><span>${gs(ventaOk?.vuelto)}</span></div>
          <div class="row"><span>Pago</span><span>${MEDIOS_PAGO.find(m => m.id === ventaOk?.medioPago)?.label || ''}</span></div>
          <div class="line"></div>
          <div class="center">¡Gracias por tu compra!</div>
          <div class="center">Purafruta — Sabor natural</div>
        ` : `<div class="center" style="font-size:11px;margin-top:6px;">${new Date().toLocaleString('es-PY')}</div>`}
      </body></html>
    `);
    w.document.close(); w.print(); w.close();
  };

  // Modal venta exitosa
  if (ventaOk) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 24, textAlign: 'center', width: '100%', maxWidth: 420 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontWeight: 700, fontSize: 20, color: '#15803d', margin: '0 0 4px' }}>¡Venta registrada!</h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>Orden #{ventaOk.nroOrden}</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'left' }}>
          {ventaOk.items?.map((i, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <span>{i.qty}x {i.nombre}</span>
              <span style={{ fontWeight: 600 }}>{gs((parseFloat(i.precio_venta)||0)*i.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0 4px', fontSize: 15, fontWeight: 700, color: '#15803d' }}>
            <span>Total</span><span>{gs(ventaOk.total)}</span>
          </div>
          {ventaOk.montoRecibido > ventaOk.total && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#6b7280' }}>
              <span>Recibido</span><span>{gs(ventaOk.montoRecibido)}</span>
            </div>
          )}
          {ventaOk.vuelto > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, color: '#dc2626', background: '#fef2f2', padding: '8px 10px', borderRadius: 8, marginTop: 8 }}>
              <span>💵 Vuelto</span><span>{gs(ventaOk.vuelto)}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn onClick={() => imprimirTicket('cliente')} full>🖨️ Imprimir ticket cliente</Btn>
          {ventaOk.conTicketProd && <Btn variant="orange" onClick={() => imprimirTicket('produccion')} full>🍹 Imprimir ticket producción</Btn>}
          <Btn variant="secondary" onClick={() => setVentaOk(null)} full>Nueva venta</Btn>
        </div>
      </div>
    </div>
  );

  // Alerta si no hay caja abierta
  if (!loadingCaja && !cajaActiva && sucursal) return (
    <div style={{ background: '#fef2f2', borderRadius: 14, padding: 24, textAlign: 'center' }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🔒</div>
      <h3 style={{ fontWeight: 700, color: '#dc2626', margin: '0 0 8px' }}>Caja cerrada</h3>
      <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 16px' }}>Debés abrir la caja antes de registrar ventas.</p>
      <Btn onClick={onAbrirCaja}>💰 Ir a abrir caja</Btn>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px', flex: 1, minWidth: 120 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 2px', textTransform: 'uppercase' }}>Sucursal</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#15803d', margin: 0 }}>{sucNombre || '—'}</p>
          </div>
          <Sel label="Turno" value={turno} onChange={e => setTurno(e.target.value)} style={{ maxWidth: 160 }}>
            <option value="manana">☀️ Mañana</option>
            <option value="tarde">🌤 Tarde</option>
          </Sel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Modo</label>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setModoRapido(true)} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: modoRapido ? '#16a34a' : '#f3f4f6', color: modoRapido ? '#fff' : '#6b7280' }}>⚡ Rápido</button>
              <button onClick={() => setModoRapido(false)} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: !modoRapido ? '#16a34a' : '#f3f4f6', color: !modoRapido ? '#fff' : '#6b7280' }}>💳 Cobro</button>
            </div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: window.innerWidth >= 768 ? '1fr 320px' : '1fr', gap: 14 }}>
        {/* Productos */}
        <Card>
          <CardHead title="Productos" />
          <div style={{ padding: 14 }}>
            <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar producto..." style={{ ...inp, marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
              {prodsFiltrados.map(p => (
                <button key={p.id} onClick={() => add(p)} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: REQUIERE_TICKET_PROD(p.nombre) ? '2px solid #fb923c' : '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', transition: 'all .15s', color: '#111827', position: 'relative' }}>
                  {REQUIERE_TICKET_PROD(p.nombre) && <span style={{ position: 'absolute', top: 6, right: 6, fontSize: 10, background: '#fff7ed', color: '#c2410c', borderRadius: 4, padding: '1px 4px' }}>🍹</span>}
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#16a34a', margin: 0 }}>{gs(p.precio_venta)}</p>
                </button>
              ))}
              {prodsFiltrados.length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '30px 0' }}>Sin productos con precio asignado</p>}
            </div>
          </div>
        </Card>

        {/* Carrito */}
        <Card style={{ display: 'flex', flexDirection: 'column' }}>
          <CardHead title="🛒 Orden" />
          <div style={{ flex: 1, overflowY: 'auto', padding: 14, minHeight: 200 }}>
            {carrito.length === 0
              ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '40px 0' }}>Tocá un producto para agregar</p>
              : carrito.map(i => (
                <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{i.nombre}</p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{gs((parseFloat(i.precio_venta)||0)*i.qty)}</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button onClick={() => upd(i.id, i.qty - 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#374151', fontWeight: 700 }}>-</button>
                    <span style={{ width: 24, textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111827' }}>{i.qty}</span>
                    <button onClick={() => upd(i.id, i.qty + 1)} style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#374151', fontWeight: 700 }}>+</button>
                  </div>
                </div>
              ))
            }
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', padding: 14 }}>
            {/* Método de pago (solo en modo cobro) */}
            {!modoRapido && (
              <>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase' }}>Forma de pago</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  {MEDIOS_PAGO.map(m => (
                    <button key={m.id} onClick={() => setMedioPago(m.id)} style={{ padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: medioPago === m.id ? '2px solid #16a34a' : '1.5px solid #e5e7eb', background: medioPago === m.id ? '#f0fdf4' : '#fff', color: medioPago === m.id ? '#15803d' : '#6b7280' }}>
                      {m.label}
                    </button>
                  ))}
                </div>
                {medioPago === 'efectivo' && (
                  <div style={{ marginBottom: 12 }}>
                    <Inp label="Monto recibido (Gs.)" type="number" value={montoRecibido} onChange={e => setMontoRecibido(e.target.value)} placeholder="Ingresá el monto" />
                    {montoRecibido && vuelto >= 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fef2f2', borderRadius: 8, padding: '8px 12px', marginTop: 8, fontWeight: 700, color: '#dc2626', fontSize: 15 }}>
                        <span>💵 Vuelto</span><span>{gs(vuelto)}</span>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 12 }}>
              <span>Total</span><span style={{ color: '#15803d' }}>{gs(total)}</span>
            </div>

            {modoRapido ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Btn onClick={() => cobrar(false)} disabled={saving || carrito.length === 0 || !sucursal} full style={{ padding: '14px', fontSize: 15, background: saving || carrito.length === 0 ? '#86efac' : '#16a34a', color: '#fff' }}>
                  {saving ? 'Procesando...' : '⚡ Cobro rápido'}
                </Btn>
                {tieneProductosTicket && (
                  <Btn onClick={() => cobrar(true)} disabled={saving || carrito.length === 0 || !sucursal} variant="orange" full style={{ padding: '14px', fontSize: 15 }}>
                    🍹 Cobro rápido + ticket producción
                  </Btn>
                )}
              </div>
            ) : (
              <Btn onClick={() => cobrar(tieneProductosTicket)} disabled={saving || carrito.length === 0 || !sucursal} full style={{ padding: '14px', fontSize: 16 }}>
                {saving ? 'Procesando...' : '💳 Cobrar'}
              </Btn>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── GASTOS ─────────────────────────────────────────────────
function Gastos({ tok, perfil, sucursal, sucs, cajaActiva }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ monto: '', clasificacion: '', observacion: '' });
  const [saving, setSaving] = useState(false);

  const hoy = new Date().toISOString().split('T')[0];

  const load = () => {
    if (!sucursal) { setLoading(false); return; }
    db.get('gastos', `sucursal_id=eq.${sucursal}&fecha=eq.${hoy}&order=created_at.desc`, tok)
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, [sucursal, tok]);

  const guardar = async () => {
    if (!form.monto || !sucursal) return;
    setSaving(true);
    await db.post('gastos', {
      sucursal_id: sucursal,
      caja_id: cajaActiva?.id || null,
      monto: parseFloat(form.monto),
      clasificacion: form.clasificacion || 'Otro gasto operativo',
      observacion: form.observacion,
      cajero: perfil?.id || null,
      fecha: hoy
    }, tok);
    setForm({ monto: '', clasificacion: '', observacion: '' });
    setShow(false); setSaving(false); load();
  };

  const totalGastos = rows.reduce((s, r) => s + parseFloat(r.monto || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {totalGastos > 0 && (
        <div style={{ background: '#fef2f2', borderRadius: 12, padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#dc2626' }}>Total gastos del día</span>
          <span style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{gs(totalGastos)}</span>
        </div>
      )}
      <Card>
        <CardHead title="Gastos operativos del día" sub={`Solo gastos que salen de la caja de ventas`} action={<Btn variant="ghost" onClick={() => setShow(!show)}>+ Nuevo gasto</Btn>} />
        {show && (
          <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Inp label="Monto (Gs.) *" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0" />
              <Sel label="Clasificación" value={form.clasificacion} onChange={e => setForm({ ...form, clasificacion: e.target.value })}>
                <option value="">Seleccionar...</option>
                {CLASIFICACIONES_GASTO.map(c => <option key={c} value={c}>{c}</option>)}
              </Sel>
            </div>
            <Inp label="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Ej: Productos de limpieza para la semana" />
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={guardar} disabled={saving || !form.monto}>{saving ? 'Guardando...' : 'Registrar gasto'}</Btn>
              <Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn>
            </div>
          </div>
        )}
        {loading ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Cargando...</p> :
          rows.length === 0 ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Sin gastos registrados hoy</p> :
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {rows.map(r => (
              <div key={r.id} style={{ background: '#f9fafb', borderRadius: 10, padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>{r.clasificacion}</p>
                  {r.observacion && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>📝 {r.observacion}</p>}
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>{fdt(r.created_at)}</p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 16, color: '#dc2626' }}>{gs(r.monto)}</span>
              </div>
            ))}
          </div>
        }
      </Card>
    </div>
  );
}

// ── HISTORIAL VENTAS ───────────────────────────────────────
function HistorialVentas({ tok, perfil, sucursal, sucs, cajaActiva }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroSuc, setFiltroSuc] = useState(sucursal || '');
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);
  const [anulando, setAnulando] = useState(null);
  const [motivoAnulacion, setMotivoAnulacion] = useState('');
  const [savingAnul, setSavingAnul] = useState(false);

  useEffect(() => {
    Promise.all([
      db.get('ventas', `order=created_at.desc&limit=200&select=*,sucursales(nombre),ventas_detalle(*,productos(nombre))`, tok),
    ]).then(([v]) => { setVentas(Array.isArray(v) ? v : []); setLoading(false); });
  }, [tok]);

  const filtradas = ventas.filter(v => {
    const mismaFecha = filtroFecha ? v.created_at?.startsWith(filtroFecha) : true;
    const mismaSuc = filtroSuc ? v.sucursal_id === filtroSuc : true;
    const noAnulada = v.observacion ? !v.observacion.includes('[ANULADA]') : true;
    return mismaFecha && mismaSuc && noAnulada;
  });

  const anuladas = ventas.filter(v => v.observacion?.includes('[ANULADA]'));
  const totalDia = filtradas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
  const ec = { efectivo: 'green', qr_bancard: 'blue', pos_bancard: 'purple', transferencia: 'orange' };

  const anularVenta = async () => {
    if (!motivoAnulacion || !anulando) return;
    setSavingAnul(true);
    await db.patch('ventas', `id=eq.${anulando.id}`, {
      observacion: `[ANULADA] Motivo: ${motivoAnulacion} | Original: ${anulando.observacion} | ${new Date().toLocaleString('es-PY')}`
    }, tok);
    setAnulando(null); setMotivoAnulacion(''); setSavingAnul(false);
    db.get('ventas', `order=created_at.desc&limit=200&select=*,sucursales(nombre),ventas_detalle(*,productos(nombre))`, tok)
      .then(v => setVentas(Array.isArray(v) ? v : []));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Modal anulación */}
      {anulando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 420, width: '90%' }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 8px' }}>Anular venta</p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 4px' }}>Orden: <strong>{anulando.observacion}</strong></p>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>Total: <strong>{gs(anulando.total)}</strong></p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Inp label="Motivo de anulación *" value={motivoAnulacion} onChange={e => setMotivoAnulacion(e.target.value)} placeholder="Ej: Error en el pedido del cliente" />
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="danger" onClick={anularVenta} disabled={savingAnul || !motivoAnulacion} full>{savingAnul ? 'Anulando...' : 'Confirmar anulación'}</Btn>
                <Btn variant="secondary" onClick={() => { setAnulando(null); setMotivoAnulacion(''); }}>Cancelar</Btn>
              </div>
            </div>
          </div>
        </div>
      )}

      <Card>
        <div style={{ padding: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Inp label="Fecha" type="date" value={filtroFecha} onChange={e => setFiltroFecha(e.target.value)} />
          <Sel label="Sucursal" value={filtroSuc} onChange={e => setFiltroSuc(e.target.value)}>
            <option value="">Todas</option>
            {sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </Sel>
        </div>
      </Card>

      <div style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', borderRadius: 14, padding: '18px 22px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><p style={{ fontSize: 13, color: '#fff', opacity: .8, margin: '0 0 2px' }}>Total del día</p><p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>{gs(totalDia)}</p></div>
        <div style={{ textAlign: 'right' }}><p style={{ fontSize: 13, color: '#fff', opacity: .8, margin: '0 0 2px' }}>Transacciones</p><p style={{ fontSize: 28, fontWeight: 700, color: '#fff', margin: 0 }}>{filtradas.length}</p></div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
          filtradas.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No hay ventas para este filtro</p> :
            filtradas.map(v => (
              <div key={v.id} style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>{v.sucursales?.nombre}</p>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{fdt(v.created_at)} · {v.observacion}</p>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#15803d', margin: 0 }}>{gs(v.total)}</p>
                    <Badge color={ec[v.medio_pago] || 'gray'}>{MEDIOS_PAGO.find(m => m.id === v.medio_pago)?.label || v.medio_pago}</Badge>
                    {perfil?.rol === 'admin' && (
                      <button onClick={() => setAnulando(v)} style={{ fontSize: 11, color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6, padding: '3px 8px', cursor: 'pointer' }}>
                        Anular
                      </button>
                    )}
                  </div>
                </div>
                {v.ventas_detalle?.length > 0 && (
                  <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 8 }}>
                    {v.ventas_detalle.map((d, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#6b7280', padding: '2px 0' }}>
                        <span>{d.cantidad}x {d.productos?.nombre}</span>
                        <span>{gs(d.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
        }
      </div>

      {anuladas.length > 0 && (
        <details style={{ background: '#f9fafb', borderRadius: 12, padding: 14 }}>
          <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 600, color: '#dc2626' }}>🚫 Ventas anuladas ({anuladas.length})</summary>
          <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {anuladas.map(v => (
              <div key={v.id} style={{ background: '#fef2f2', borderRadius: 8, padding: 10, fontSize: 13 }}>
                <p style={{ fontWeight: 600, color: '#dc2626', margin: '0 0 2px' }}>{gs(v.total)} — {v.sucursales?.nombre}</p>
                <p style={{ color: '#9ca3af', margin: 0, fontSize: 12 }}>{v.observacion}</p>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ── INVENTARIO SUCURSAL ────────────────────────────────────
function InventarioSucursal({ tok, perfil }) {
  const [rows, setRows] = useState([]);
  const [sucs, setSucs] = useState([]);
  const [prods, setProds] = useState([]);
  const [sucursal, setSucursal] = useState(perfil?.sucursal_id || '');
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ producto_id: '', stock_actual: '', stock_minimo: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([db.get('sucursales', 'activa=eq.true', tok), db.get('productos', 'activo=eq.true&order=nombre', tok)])
      .then(([s, p]) => { setSucs(Array.isArray(s) ? s : []); setProds(Array.isArray(p) ? p : []); if (perfil?.sucursal_id) cargar(perfil.sucursal_id); });
  }, [tok]);

  const cargar = (suc) => {
    setSucursal(suc); setLoading(true);
    db.get('sucursal_inventario', `sucursal_id=eq.${suc}&select=*,productos(nombre,unidad)`, tok)
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  };

  const guardar = async () => {
    if (!form.producto_id || !sucursal) return;
    setSaving(true);
    await fetch(`${SB_URL}/rest/v1/sucursal_inventario`, { method: 'POST', headers: { ...hdr(tok), 'Prefer': 'resolution=merge-duplicates,return=representation' }, body: JSON.stringify({ sucursal_id: sucursal, producto_id: form.producto_id, stock_actual: parseFloat(form.stock_actual || 0), stock_minimo: parseFloat(form.stock_minimo || 0) }) });
    setForm({ producto_id: '', stock_actual: '', stock_minimo: '' });
    setShow(false); setSaving(false); cargar(sucursal);
  };

  const sucNombre = sucs.find(s => s.id === sucursal)?.nombre || perfil?.nombre || '';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {perfil?.sucursal_id ? (
        <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 2px', textTransform: 'uppercase' }}>Sucursal</p>
          <p style={{ fontSize: 15, fontWeight: 700, color: '#15803d', margin: 0 }}>{sucNombre}</p>
        </div>
      ) : (
        <Sel label="Seleccioná una sucursal para ver su inventario" value={sucursal} onChange={e => cargar(e.target.value)}>
          <option value="">Elegir sucursal...</option>
          {sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
        </Sel>
      )}
      {sucursal && (
        <Card>
          <CardHead title="Inventario" action={<Btn variant="ghost" onClick={() => setShow(!show)} style={{ fontSize: 13 }}>+ Agregar</Btn>} />
          {show && (
            <div style={{ padding: 14, background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Sel label="Producto" value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })}>
                <option value="">Seleccionar...</option>
                {prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
              </Sel>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <Inp label="Stock actual" type="number" value={form.stock_actual} onChange={e => setForm({ ...form, stock_actual: e.target.value })} placeholder="0" />
                <Inp label="Stock mínimo" type="number" value={form.stock_minimo} onChange={e => setForm({ ...form, stock_minimo: e.target.value })} placeholder="0" />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
                <Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn>
              </div>
            </div>
          )}
          {loading ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Cargando...</p> :
            rows.length === 0 ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Sin productos cargados en esta sucursal</p> :
              <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                {rows.map(r => (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: r.stock_actual <= (r.stock_minimo || 0) ? '#fef2f2' : '#f9fafb', borderRadius: 10 }}>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>{r.productos?.nombre}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Mínimo: {r.stock_minimo} {r.productos?.unidad}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, fontSize: 18, color: r.stock_actual <= (r.stock_minimo || 0) ? '#dc2626' : '#15803d', margin: '0 0 2px' }}>{r.stock_actual}</p>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{r.productos?.unidad}</p>
                    </div>
                  </div>
                ))}
              </div>
          }
        </Card>
      )}
    </div>
  );
}

// ── PROVEEDORES SUCURSAL ───────────────────────────────────
function ProveedoresSucursal({ tok }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ nombre: '', ruc: '', contacto: '', tipo: 'sucursal', observacion: '' });
  const [saving, setSaving] = useState(false);

  const load = () => db.get('proveedores', 'tipo=eq.sucursal&order=nombre', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  useEffect(() => { load(); }, [tok]);

  const guardar = async () => {
    if (!form.nombre) return;
    setSaving(true);
    await db.post('proveedores', { ...form, tipo: 'sucursal' }, tok);
    setForm({ nombre: '', ruc: '', contacto: '', tipo: 'sucursal', observacion: '' });
    setShow(false); setSaving(false); load();
  };

  return (
    <Card>
      <CardHead title="Proveedores de sucursales" sub="Agua, hielo, helados, Coca-Cola, etc." action={<Btn variant="ghost" onClick={() => setShow(!show)} style={{ fontSize: 13 }}>+ Nuevo</Btn>} />
      {show && (
        <div style={{ padding: 14, background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Inp label="Nombre del proveedor *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Distribuidora de Hielo ABC" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <Inp label="RUC" value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} placeholder="RUC" />
            <Inp label="Teléfono / Contacto" value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Ej: 0981 000000" />
          </div>
          <Inp label="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Ej: Entrega lunes y jueves" />
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn onClick={guardar} disabled={saving || !form.nombre}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
            <Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn>
          </div>
        </div>
      )}
      {loading ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Cargando...</p> :
        rows.length === 0 ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No hay proveedores de sucursal registrados</p> :
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => (
              <div key={r.id} style={{ background: '#f9fafb', borderRadius: 12, padding: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 4px' }}>{r.nombre}</p>
                    {r.contacto && <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>📞 {r.contacto}</p>}
                    {r.ruc && <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 2px' }}>RUC: {r.ruc}</p>}
                    {r.observacion && <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>📝 {r.observacion}</p>}
                  </div>
                  <Badge color="purple">Sucursal</Badge>
                </div>
              </div>
            ))}
          </div>
      }
    </Card>
  );
}
