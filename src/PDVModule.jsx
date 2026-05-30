import { useState, useEffect, useRef } from "react";

const SB_URL = 'https://iepqhmxgdyuthcsmxadb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHFobXhnZHl1dGhjc214YWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODM1MjcsImV4cCI6MjA5NDk1OTUyN30.WWUs3xNpaMAYcvp2TAVuqQdCHGCsKIV0fdDF3Y45sLE';
const hdr = (tok) => ({ 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${tok || SB_KEY}`, 'Prefer': 'return=representation' });
const db = {
  get: (t, q, tok) => fetch(`${SB_URL}/rest/v1/${t}${q ? '?' + q : ''}`, { headers: { ...hdr(tok), 'Accept': 'application/json' } }).then(r => r.json()),
  post: (t, d, tok) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  patch: (t, f, d, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
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
  const styles = { primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' }, secondary: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }, ghost: { background: '#f0fdf4', color: '#15803d' }, danger: { background: '#fef2f2', color: '#dc2626' }, blue: { background: '#eff6ff', color: '#1d4ed8' }, orange: { background: '#fff7ed', color: '#c2410c' }, purple: { background: '#faf5ff', color: '#7c3aed' } };
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

// ── MÓDULO PRINCIPAL ───────────────────────────────────────
export default function PDVModule({ tok, perfil }) {
  const [tab, setTab] = useState('venta');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Tabs tabs={[['venta', '🏪 Punto de Venta'], ['historial', '📋 Historial'], ['inventario', '📦 Inventario'], ['proveedores', '🚚 Proveedores']]} active={tab} onChange={setTab} />
      {tab === 'venta' && <Venta tok={tok} perfil={perfil} />}
      {tab === 'historial' && <HistorialVentas tok={tok} />}
      {tab === 'inventario' && <InventarioSucursal tok={tok} perfil={perfil} />}
      {tab === 'proveedores' && <ProveedoresSucursal tok={tok} />}
    </div>
  );
}

// ── PUNTO DE VENTA ─────────────────────────────────────────
function Venta({ tok, perfil }) {
  const [sucs, setSucs] = useState([]);
  const [prods, setProds] = useState([]);
  const [sucursal, setSucursal] = useState(perfil?.sucursal_id || '');
  const [turno, setTurno] = useState('manana');
  const [carrito, setCarrito] = useState([]);
  const [medioPago, setMedioPago] = useState('efectivo');
  const [saving, setSaving] = useState(false);
  const [ventaOk, setVentaOk] = useState(null);
  const [busqueda, setBusqueda] = useState('');
  const [showTicket, setShowTicket] = useState(false);
  const ticketRef = useRef();

  useEffect(() => {
    db.get('sucursales', 'activa=eq.true', tok).then(d => setSucs(Array.isArray(d) ? d : []));
    db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : []));
  }, [tok]);

  const prodsFiltrados = prods.filter(p => p.precio_venta && p.nombre.toLowerCase().includes(busqueda.toLowerCase()));

  const add = (p) => {
    const ex = carrito.find(i => i.id === p.id);
    if (ex) setCarrito(carrito.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i));
    else setCarrito([...carrito, { ...p, qty: 1 }]);
  };
  const upd = (id, qty) => { if (qty <= 0) setCarrito(carrito.filter(i => i.id !== id)); else setCarrito(carrito.map(i => i.id === id ? { ...i, qty } : i)); };
  const total = carrito.reduce((s, i) => s + (parseFloat(i.precio_venta) || 0) * i.qty, 0);
  const sucNombre = sucs.find(s => s.id === sucursal)?.nombre || '';

  const cobrar = async () => {
    if (!sucursal || carrito.length === 0) return;
    setSaving(true);
    const nroOrden = Math.floor(Math.random() * 9000) + 1000;
    const res = await db.post('ventas', { sucursal_id: sucursal, total, medio_pago: medioPago, turno, observacion: `Orden #${nroOrden}` }, tok);
    const venta = Array.isArray(res) ? res[0] : res;
    if (venta?.id) {
      await db.post('ventas_detalle', carrito.map(i => ({ venta_id: venta.id, producto_id: i.id, cantidad: i.qty, precio_unitario: parseFloat(i.precio_venta) || 0, subtotal: (parseFloat(i.precio_venta) || 0) * i.qty })), tok);
      setVentaOk({ ...venta, nroOrden, items: [...carrito], sucNombre, medioPago });
      setCarrito([]);
    }
    setSaving(false);
  };

  const imprimirTicket = () => {
    const w = window.open('', '_blank');
    w.document.write(`
      <html><head><title>Ticket Purafruta</title><style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Courier New', monospace; width: 280px; padding: 10px; font-size: 12px; }
        .center { text-align: center; }
        .bold { font-weight: bold; }
        .line { border-top: 1px dashed #000; margin: 6px 0; }
        .row { display: flex; justify-content: space-between; padding: 2px 0; }
        .logo { font-size: 18px; font-weight: bold; letter-spacing: 2px; }
        .total { font-size: 16px; font-weight: bold; }
      </style></head><body>
        <div class="center">
          <div class="logo">PURAFRUTA</div>
          <div>${ventaOk?.sucNombre || ''}</div>
          <div>${new Date().toLocaleString('es-PY')}</div>
          <div>Orden #${ventaOk?.nroOrden}</div>
        </div>
        <div class="line"></div>
        ${ventaOk?.items?.map(i => `<div class="row"><span>${i.qty}x ${i.nombre}</span><span>${gs((parseFloat(i.precio_venta)||0)*i.qty)}</span></div>`).join('')}
        <div class="line"></div>
        <div class="row total"><span>TOTAL</span><span>${gs(ventaOk?.total)}</span></div>
        <div class="row"><span>Pago</span><span>${MEDIOS_PAGO.find(m => m.id === ventaOk?.medioPago)?.label || ''}</span></div>
        <div class="line"></div>
        <div class="center">¡Gracias por tu compra!</div>
        <div class="center">Purafruta — Sabor natural</div>
      </body></html>
    `);
    w.document.close();
    w.print();
    w.close();
  };

  // Modal ticket
  if (ventaOk) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center' }}>
      <div style={{ background: '#f0fdf4', borderRadius: 16, padding: 24, textAlign: 'center', width: '100%', maxWidth: 400 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>✅</div>
        <h2 style={{ fontWeight: 700, fontSize: 20, color: '#15803d', margin: '0 0 4px' }}>¡Venta registrada!</h2>
        <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 16px' }}>Orden #{ventaOk.nroOrden} · {fdt(ventaOk.created_at)}</p>
        <div style={{ background: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, textAlign: 'left' }}>
          {ventaOk.items?.map((i, idx) => (
            <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <span>{i.qty}x {i.nombre}</span>
              <span style={{ fontWeight: 600 }}>{gs((parseFloat(i.precio_venta)||0)*i.qty)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 16, fontWeight: 700, color: '#15803d' }}>
            <span>Total</span><span>{gs(ventaOk.total)}</span>
          </div>
        </div>
        <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 16px' }}>
          {MEDIOS_PAGO.find(m => m.id === ventaOk.medioPago)?.label} · {ventaOk.sucNombre}
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <Btn onClick={imprimirTicket} full>🖨️ Imprimir ticket</Btn>
          <Btn variant="secondary" onClick={() => setVentaOk(null)} full>Nueva venta</Btn>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Selector turno — sucursal viene del perfil */}
      <Card>
        <div style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 16px', flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 2px', textTransform: 'uppercase' }}>Sucursal</p>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#15803d', margin: 0 }}>{sucs.find(s => s.id === sucursal)?.nombre || perfil?.nombre || '—'}</p>
          </div>
          <Sel label="Turno" value={turno} onChange={e => setTurno(e.target.value)} style={{ maxWidth: 180 }}>
            <option value="manana">☀️ Mañana</option>
            <option value="tarde">🌤 Tarde</option>
          </Sel>
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
                <button key={p.id} onClick={() => add(p)} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', transition: 'all .15s', color: '#111827' }}>
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

          {/* Método de pago */}
          <div style={{ borderTop: '1px solid #f3f4f6', padding: 14 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase' }}>Forma de pago</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 }}>
              {MEDIOS_PAGO.map(m => (
                <button key={m.id} onClick={() => setMedioPago(m.id)} style={{ padding: '10px 8px', borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: medioPago === m.id ? '2px solid #16a34a' : '1.5px solid #e5e7eb', background: medioPago === m.id ? '#f0fdf4' : '#fff', color: medioPago === m.id ? '#15803d' : '#6b7280', transition: 'all .15s' }}>
                  {m.label}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, color: '#111827', marginBottom: 12 }}>
              <span>Total</span><span style={{ color: '#15803d' }}>{gs(total)}</span>
            </div>
            <Btn onClick={cobrar} disabled={saving || carrito.length === 0 || !sucursal} full style={{ padding: '14px', fontSize: 16 }}>
              {saving ? 'Procesando...' : '💳 Cobrar'}
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

// ── HISTORIAL VENTAS ───────────────────────────────────────
function HistorialVentas({ tok }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sucs, setSucs] = useState([]);
  const [filtroSuc, setFiltroSuc] = useState('');
  const [filtroFecha, setFiltroFecha] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    Promise.all([
      db.get('ventas', `order=created_at.desc&limit=100&select=*,sucursales(nombre),ventas_detalle(*,productos(nombre))`, tok),
      db.get('sucursales', 'activa=eq.true', tok)
    ]).then(([v, s]) => { setVentas(Array.isArray(v) ? v : []); setSucs(Array.isArray(s) ? s : []); setLoading(false); });
  }, [tok]);

  const filtradas = ventas.filter(v => {
    const mismaFecha = filtroFecha ? v.created_at?.startsWith(filtroFecha) : true;
    const mismaSuc = filtroSuc ? v.sucursal_id === filtroSuc : true;
    return mismaFecha && mismaSuc;
  });

  const totalDia = filtradas.reduce((s, v) => s + parseFloat(v.total || 0), 0);
  const ec = { efectivo: 'green', qr_bancard: 'blue', pos_bancard: 'purple', transferencia: 'orange' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, fontSize: 16, color: '#15803d', margin: '0 0 4px' }}>{gs(v.total)}</p>
                    <Badge color={ec[v.medio_pago] || 'gray'}>{MEDIOS_PAGO.find(m => m.id === v.medio_pago)?.label || v.medio_pago}</Badge>
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
      .then(([s, p]) => {
        setSucs(Array.isArray(s) ? s : []);
        setProds(Array.isArray(p) ? p : []);
        if (perfil?.sucursal_id) cargar(perfil.sucursal_id);
      });
  }, [tok]);

  const cargar = (suc) => {
    setSucursal(suc); setLoading(true);
    db.get('sucursal_inventario', `sucursal_id=eq.${suc}&select=*,productos(nombre,unidad)`, tok)
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  };

  const guardar = async () => {
    if (!form.producto_id || !sucursal) return;
    setSaving(true);
    await fetch(`${SB_URL}/rest/v1/sucursal_inventario`, {
      method: 'POST',
      headers: { ...hdr(tok), 'Prefer': 'resolution=merge-duplicates,return=representation' },
      body: JSON.stringify({ sucursal_id: sucursal, producto_id: form.producto_id, stock_actual: parseFloat(form.stock_actual || 0), stock_minimo: parseFloat(form.stock_minimo || 0) })
    });
    setForm({ producto_id: '', stock_actual: '', stock_minimo: '' });
    setShow(false);
    setSaving(false);
    cargar(sucursal);
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
    setShow(false);
    setSaving(false);
    load();
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
