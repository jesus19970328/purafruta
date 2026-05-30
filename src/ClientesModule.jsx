import { useState, useEffect } from "react";

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
const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };
const Card = ({ children, style }) => <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', ...style }}>{children}</div>;
const CardHead = ({ title, sub, action }) => <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{title}</h3>{sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{sub}</p>}</div>{action}</div>;
const Btn = ({ onClick, children, variant = 'primary', disabled, full }) => { const s = { primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' }, secondary: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }, ghost: { background: '#f0fdf4', color: '#15803d' }, danger: { background: '#fef2f2', color: '#dc2626' }, blue: { background: '#eff6ff', color: '#1d4ed8' } }; return <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', width: full ? '100%' : 'auto', ...s[variant] }}>{children}</button>; };
const Badge = ({ children, color = 'gray' }) => { const c = { green: { bg: '#f0fdf4', text: '#15803d' }, yellow: { bg: '#fefce8', text: '#a16207' }, red: { bg: '#fef2f2', text: '#dc2626' }, blue: { bg: '#eff6ff', text: '#1d4ed8' }, orange: { bg: '#fff7ed', text: '#c2410c' }, gray: { bg: '#f9fafb', text: '#6b7280' } }; return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: c[color]?.bg, color: c[color]?.text }}>{children}</span>; };
const Inp = ({ label, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}<input {...p} style={{ ...inp, ...(p.style || {}) }} /></div>;
const Sel = ({ label, children, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}<select {...p} style={{ ...inp, ...(p.style || {}) }}>{children}</select></div>;
const Tabs = ({ tabs, active, onChange }) => <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>{tabs.map(([id, label]) => <button key={id} onClick={() => onChange(id)} style={{ padding: '9px 16px', borderRadius: 10, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', flex: '1 1 auto', background: active === id ? '#16a34a' : '#fff', color: active === id ? '#fff' : '#6b7280', boxShadow: active === id ? 'none' : '0 0 0 1.5px #e5e7eb' }}>{label}</button>)}</div>;

export default function ClientesModule({ tok }) {
  const [tab, setTab] = useState('pedidos');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Tabs tabs={[['pedidos', '📦 Pedidos'], ['clientes', '👥 Clientes'], ['cuentas', '💰 Cuentas pendientes']]} active={tab} onChange={setTab} />
      {tab === 'pedidos' && <Pedidos tok={tok} />}
      {tab === 'clientes' && <Clientes tok={tok} />}
      {tab === 'cuentas' && <CuentasPendientes tok={tok} />}
    </div>
  );
}

// ── PEDIDOS EXTERNOS ──────────────────────────────────────
function Pedidos({ tok }) {
  const [pedidos, setPedidos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [prods, setProds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [detalle, setDetalle] = useState(null);
  const [form, setForm] = useState({ cliente_id: '', medio_pago: 'credito', observacion: '', fecha: new Date().toISOString().split('T')[0] });
  const [items, setItems] = useState([]);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([
    db.get('pedidos_externos', 'order=created_at.desc&limit=50&select=*,clientes_externos(nombre,telefono)', tok),
    db.get('clientes_externos', 'activo=eq.true&order=nombre', tok),
    db.get('productos', 'activo=eq.true&order=nombre', tok),
  ]).then(([p, c, pr]) => { setPedidos(Array.isArray(p) ? p : []); setClientes(Array.isArray(c) ? c : []); setProds(Array.isArray(pr) ? pr : []); setLoading(false); });

  useEffect(() => { load(); }, [tok]);

  const addItem = () => setItems([...items, { producto_id: '', cantidad: '', precio_unitario: '' }]);
  const updItem = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };
  const total = items.reduce((s, i) => s + parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0), 0);

  const vencimiento = (fecha) => {
    const d = new Date(fecha); d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  };

  const guardar = async () => {
    if (!form.cliente_id || items.length === 0) return;
    setSaving(true);
    const res = await db.post('pedidos_externos', { ...form, total, fecha_vencimiento: form.medio_pago === 'credito' ? vencimiento(form.fecha) : form.fecha, total_pagado: form.medio_pago !== 'credito' ? total : 0, estado: form.medio_pago !== 'credito' ? 'pagado' : 'pendiente' }, tok);
    const ped = Array.isArray(res) ? res[0] : res;
    if (ped?.id) {
      await db.post('pedidos_externos_detalle', items.map(i => ({ pedido_id: ped.id, producto_id: i.producto_id, cantidad: parseFloat(i.cantidad), precio_unitario: parseFloat(i.precio_unitario), subtotal: parseFloat(i.cantidad) * parseFloat(i.precio_unitario) })), tok);
      setForm({ cliente_id: '', medio_pago: 'credito', observacion: '', fecha: new Date().toISOString().split('T')[0] });
      setItems([]); setShow(false); load();
    }
    setSaving(false);
  };

  const ec = { pendiente: 'yellow', parcial: 'orange', pagado: 'green', vencido: 'red' };
  const ep = { efectivo: '💵', transferencia: '🏦', cheque: '📝', credito: '🗓' };

  if (detalle) return <DetallePedido pedido={detalle} tok={tok} onVolver={() => { setDetalle(null); load(); }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Card>
        <CardHead title="Pedidos de clientes externos" action={<Btn variant="ghost" onClick={() => setShow(!show)}>+ Nuevo pedido</Btn>} />
        {show && (
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
              <Sel label="Cliente *" value={form.cliente_id} onChange={e => setForm({ ...form, cliente_id: e.target.value })}>
                <option value="">Seleccionar cliente...</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </Sel>
              <Inp label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
              <Sel label="Medio de pago" value={form.medio_pago} onChange={e => setForm({ ...form, medio_pago: e.target.value })}>
                <option value="credito">🗓 Crédito 15 días</option>
                <option value="efectivo">💵 Efectivo al contado</option>
                <option value="transferencia">🏦 Transferencia</option>
                <option value="cheque">📝 Cheque</option>
              </Sel>
              <Inp label="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Opcional" />
            </div>
            {form.medio_pago === 'credito' && form.fecha && (
              <div style={{ background: '#fefce8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#a16207' }}>
                📅 Vencimiento del crédito: <strong>{fd(vencimiento(form.fecha))}</strong>
              </div>
            )}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#374151', margin: 0 }}>Productos del pedido</p>
                <button onClick={addItem} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 13, fontWeight: 600 }}>+ Agregar</button>
              </div>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <select value={it.producto_id} onChange={e => updItem(i, 'producto_id', e.target.value)} style={{ ...inp }}>
                    <option value="">Producto...</option>
                    {prods.filter(p => p.es_producido).map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  <input type="number" placeholder="Cantidad" value={it.cantidad} onChange={e => updItem(i, 'cantidad', e.target.value)} style={{ ...inp }} />
                  <input type="number" placeholder="Precio unit." value={it.precio_unitario} onChange={e => updItem(i, 'precio_unitario', e.target.value)} style={{ ...inp }} />
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '0 12px', cursor: 'pointer', fontSize: 18 }}>×</button>
                </div>
              ))}
              {total > 0 && <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#15803d', paddingTop: 8 }}>Total: {gs(total)}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={guardar} disabled={saving || !form.cliente_id || items.length === 0}>{saving ? 'Guardando...' : 'Guardar pedido'}</Btn>
              <Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn>
            </div>
          </div>
        )}
        {loading ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Cargando...</p> :
          pedidos.length === 0 ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No hay pedidos registrados</p> :
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {pedidos.map(p => (
                <div key={p.id} style={{ background: '#f9fafb', borderRadius: 12, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 4px' }}>{p.clientes_externos?.nombre}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 6px' }}>{fd(p.fecha)} {p.fecha_vencimiento && p.estado !== 'pagado' ? `· Vence: ${fd(p.fecha_vencimiento)}` : ''}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <Badge color={ec[p.estado]}>{p.estado}</Badge>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{ep[p.medio_pago]} {p.medio_pago}</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 2px' }}>{gs(p.total)}</p>
                      {p.saldo > 0 && <p style={{ fontSize: 13, color: '#dc2626', fontWeight: 600, margin: '0 0 8px' }}>Saldo: {gs(p.saldo)}</p>}
                      <button onClick={() => setDetalle(p)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Ver / Pagar</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
        }
      </Card>
    </div>
  );
}

// ── DETALLE PEDIDO ────────────────────────────────────────
function DetallePedido({ pedido, tok, onVolver }) {
  const [detalle, setDetalle] = useState([]);
  const [pagos, setPagos] = useState([]);
  const [showPago, setShowPago] = useState(false);
  const [formPago, setFormPago] = useState({ monto: '', medio_pago: 'efectivo', observacion: '' });
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([
    db.get('pedidos_externos_detalle', `pedido_id=eq.${pedido.id}&select=*,productos(nombre)`, tok),
    db.get('pagos_externos', `pedido_id=eq.${pedido.id}&order=created_at.desc`, tok),
  ]).then(([d, p]) => { setDetalle(Array.isArray(d) ? d : []); setPagos(Array.isArray(p) ? p : []); });

  useEffect(() => { load(); }, [pedido.id]);

  const registrarPago = async () => {
    if (!formPago.monto) return;
    setSaving(true);
    const monto = parseFloat(formPago.monto);
    await db.post('pagos_externos', { ...formPago, monto, pedido_id: pedido.id }, tok);
    const nuevoPagado = parseFloat(pedido.total_pagado || 0) + monto;
    const nuevoEstado = nuevoPagado >= pedido.total ? 'pagado' : 'parcial';
    await db.patch('pedidos_externos', `id=eq.${pedido.id}`, { total_pagado: nuevoPagado, estado: nuevoEstado }, tok);
    setFormPago({ monto: '', medio_pago: 'efectivo', observacion: '' });
    setShowPago(false); setSaving(false); load();
  };

  const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
  const fd = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—';
  const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <button onClick={onVolver} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, color: '#374151' }}>← Volver</button>
        <div><p style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: 0 }}>{pedido.clientes_externos?.nombre || 'Cliente'}</p><p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{fd(pedido.fecha)}</p></div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[['Total pedido', gs(pedido.total), '#f0fdf4', '#15803d'], ['Pagado', gs(pedido.total_pagado), '#eff6ff', '#1d4ed8'], ['Saldo pendiente', gs(pedido.saldo), pedido.saldo > 0 ? '#fef2f2' : '#f0fdf4', pedido.saldo > 0 ? '#dc2626' : '#15803d'], ['Vencimiento', fd(pedido.fecha_vencimiento), '#fefce8', '#a16207']].map(([l, v, bg, fg]) => (
          <div key={l} style={{ background: bg, borderRadius: 12, padding: 14 }}>
            <p style={{ fontSize: 11, color: fg, margin: '0 0 4px', fontWeight: 600 }}>{l}</p>
            <p style={{ fontSize: 16, fontWeight: 700, color: fg, margin: 0 }}>{v}</p>
          </div>
        ))}
      </div>

      <Card>
        <CardHead title="Productos del pedido" />
        <div style={{ padding: 14 }}>
          {detalle.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <span>{d.cantidad} x {d.productos?.nombre}</span>
              <span style={{ fontWeight: 600 }}>{gs(d.subtotal)}</span>
            </div>
          ))}
        </div>
      </Card>

      {pedido.saldo > 0 && (
        <Card>
          <CardHead title="Registrar pago" action={<button onClick={() => setShowPago(!showPago)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ Pago</button>} />
          {showPago && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Monto (Gs.) *</label><input type="number" value={formPago.monto} onChange={e => setFormPago({ ...formPago, monto: e.target.value })} placeholder={gs(pedido.saldo)} style={inp} /></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Medio de pago</label><select value={formPago.medio_pago} onChange={e => setFormPago({ ...formPago, medio_pago: e.target.value })} style={inp}><option value="efectivo">💵 Efectivo</option><option value="transferencia">🏦 Transferencia</option><option value="cheque">📝 Cheque</option></select></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Observación</label><input value={formPago.observacion} onChange={e => setFormPago({ ...formPago, observacion: e.target.value })} placeholder="Opcional" style={inp} /></div>
              <div style={{ display: 'flex', gap: 8 }}><button onClick={registrarPago} disabled={saving || !formPago.monto} style={{ background: saving ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Guardando...' : 'Confirmar pago'}</button><button onClick={() => setShowPago(false)} style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button></div>
            </div>
          )}
          {pagos.length > 0 && (
            <div style={{ padding: 14 }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', margin: '0 0 8px', textTransform: 'uppercase' }}>Historial de pagos</p>
              {pagos.map((p, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                  <span style={{ color: '#6b7280' }}>{fd(p.fecha)} · {p.medio_pago}</span>
                  <span style={{ fontWeight: 600, color: '#15803d' }}>{gs(p.monto)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ── CLIENTES ──────────────────────────────────────────────
function Clientes({ tok }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ nombre: '', ruc: '', telefono: '', direccion: '', email: '', limite_credito: '' });
  const [saving, setSaving] = useState(false);

  const load = () => db.get('clientes_externos', 'order=nombre', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  useEffect(() => { load(); }, [tok]);

  const guardar = async () => {
    if (!form.nombre) return;
    setSaving(true);
    await db.post('clientes_externos', { ...form, limite_credito: parseFloat(form.limite_credito || 0) }, tok);
    setForm({ nombre: '', ruc: '', telefono: '', direccion: '', email: '', limite_credito: '' });
    setShow(false); setSaving(false); load();
  };

  const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
  const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };

  return (
    <Card>
      <CardHead title="Clientes externos" sub="Compradores de paquetes congelados" action={<button onClick={() => setShow(!show)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ Nuevo</button>} />
      {show && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
            {[['nombre', 'Nombre / Razón social *', 'text', 'Nombre del cliente'], ['ruc', 'RUC', 'text', 'RUC'], ['telefono', 'Teléfono', 'text', '0981 000000'], ['email', 'Email', 'email', 'cliente@mail.com'], ['direccion', 'Dirección', 'text', 'Dirección'], ['limite_credito', 'Límite de crédito (Gs.)', 'number', '0']].map(([k, l, t, p]) => (
              <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{l}</label><input type={t} value={form[k]} onChange={e => setForm({ ...form, [k]: e.target.value })} placeholder={p} style={inp} /></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}><button onClick={guardar} disabled={saving || !form.nombre} style={{ background: saving ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Guardando...' : 'Guardar'}</button><button onClick={() => setShow(false)} style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 20px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button></div>
        </div>
      )}
      {loading ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Cargando...</p> :
        rows.length === 0 ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>No hay clientes registrados</p> :
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(c => (
              <div key={c.id} style={{ background: '#f9fafb', borderRadius: 12, padding: 14 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 4px' }}>{c.nombre}</p>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13, color: '#6b7280' }}>
                  {c.ruc && <span>RUC: {c.ruc}</span>}
                  {c.telefono && <span>📞 {c.telefono}</span>}
                  {c.email && <span>✉️ {c.email}</span>}
                  {c.direccion && <span>📍 {c.direccion}</span>}
                  {c.limite_credito > 0 && <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Crédito: {gs(c.limite_credito)}</span>}
                </div>
              </div>
            ))}
          </div>
      }
    </Card>
  );
}

// ── CUENTAS PENDIENTES ────────────────────────────────────
function CuentasPendientes({ tok }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.get('pedidos_externos', "estado=in.(pendiente,parcial,vencido)&order=fecha_vencimiento&select=*,clientes_externos(nombre,telefono)", tok)
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  }, [tok]);

  const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
  const fd = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—';
  const totalPendiente = rows.reduce((s, r) => s + parseFloat(r.saldo || 0), 0);
  const hoy = new Date();
  const vencidos = rows.filter(r => r.fecha_vencimiento && new Date(r.fecha_vencimiento) < hoy);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div style={{ background: '#fef2f2', borderRadius: 14, padding: 16 }}><p style={{ fontSize: 12, color: '#dc2626', margin: '0 0 4px', fontWeight: 600 }}>TOTAL PENDIENTE</p><p style={{ fontSize: 22, fontWeight: 700, color: '#dc2626', margin: 0 }}>{gs(totalPendiente)}</p></div>
        <div style={{ background: '#fefce8', borderRadius: 14, padding: 16 }}><p style={{ fontSize: 12, color: '#a16207', margin: '0 0 4px', fontWeight: 600 }}>CUENTAS ACTIVAS</p><p style={{ fontSize: 26, fontWeight: 700, color: '#a16207', margin: 0 }}>{rows.length}</p></div>
        <div style={{ background: '#fff7ed', borderRadius: 14, padding: 16 }}><p style={{ fontSize: 12, color: '#c2410c', margin: '0 0 4px', fontWeight: 600 }}>VENCIDAS</p><p style={{ fontSize: 26, fontWeight: 700, color: '#c2410c', margin: 0 }}>{vencidos.length}</p></div>
      </div>
      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
        rows.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No hay cuentas pendientes 🎉</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => {
              const vencido = r.fecha_vencimiento && new Date(r.fecha_vencimiento) < hoy;
              return (
                <div key={r.id} style={{ background: '#fff', borderRadius: 12, border: `1px solid ${vencido ? '#fecaca' : '#e5e7eb'}`, padding: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>{r.clientes_externos?.nombre}</p>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 6px' }}>{r.clientes_externos?.telefono && `📞 ${r.clientes_externos.telefono}`}</p>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', fontSize: 12 }}>
                        <span style={{ color: '#6b7280' }}>Pedido: {fd(r.fecha)}</span>
                        <span style={{ color: vencido ? '#dc2626' : '#a16207', fontWeight: 600 }}>Vence: {fd(r.fecha_vencimiento)}</span>
                        {vencido && <span style={{ background: '#fef2f2', color: '#dc2626', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>VENCIDO</span>}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 2px' }}>Total: {gs(r.total)}</p>
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 4px' }}>Pagado: {gs(r.total_pagado)}</p>
                      <p style={{ fontWeight: 700, fontSize: 16, color: '#dc2626', margin: 0 }}>Saldo: {gs(r.saldo)}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}
