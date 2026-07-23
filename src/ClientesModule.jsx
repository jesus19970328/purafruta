import { useState, useEffect } from "react";

const SB_URL = 'https://iepqhmxgdyuthcsmxadb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHFobXhnZHl1dGhjc214YWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODM1MjcsImV4cCI6MjA5NDk1OTUyN30.WWUs3xNpaMAYcvp2TAVuqQdCHGCsKIV0fdDF3Y45sLE';
const hdr = (tok) => ({ 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${tok || SB_KEY}`, 'Prefer': 'return=representation' });
const db = {
  get: (t, q, tok) => fetch(`${SB_URL}/rest/v1/${t}${q ? '?' + q : ''}`, { headers: { ...hdr(tok), 'Accept': 'application/json' } }).then(r => r.json()),
  post: (t, d, tok) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  patch: (t, f, d, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  delete: (t, f, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'DELETE', headers: hdr(tok) }).then(r => r.ok ? r : r.json()),
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
  const [busca, setBusca] = useState('');

  const load = () => Promise.all([
    db.get('pedidos_externos', 'order=created_at.desc&limit=50&select=*,clientes_externos(nombre,telefono)', tok),
    db.get('clientes_externos', 'activo=neq.false&order=nombre', tok),
    db.get('productos', 'activo=eq.true&order=nombre', tok),
  ]).then(([p, c, pr]) => { setPedidos(Array.isArray(p) ? p : []); setClientes(Array.isArray(c) ? c : []); setProds(Array.isArray(pr) ? pr : []); setLoading(false); });

  useEffect(() => { load(); }, [tok]);

  const addItem = () => setItems([...items, { producto_id: '', nombre_libre: '', cantidad: '', precio_unitario: '', _sugerencias: [], _mostrarSug: false }]);
  const updItem = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };

  const buscarProducto = (i, texto) => {
    const n = [...items];
    n[i].nombre_libre = texto;
    n[i].producto_id = '';
    if (texto.length >= 1) {
      n[i]._sugerencias = prods.filter(p => p.nombre.toLowerCase().includes(texto.toLowerCase())).slice(0, 6);
      n[i]._mostrarSug = true;
    } else {
      n[i]._sugerencias = [];
      n[i]._mostrarSug = false;
    }
    setItems(n);
  };

  const elegirProducto = (i, prod) => {
    const n = [...items];
    n[i].producto_id = prod.id;
    n[i].nombre_libre = prod.nombre;
    n[i]._sugerencias = [];
    n[i]._mostrarSug = false;
    setItems(n);
  };

  const cerrarSugerencias = (i) => {
    setTimeout(() => {
      const n = [...items];
      if (n[i]) { n[i]._mostrarSug = false; setItems(n); }
    }, 200);
  };

  // Al guardar: si un item tiene nombre_libre pero no producto_id, crear el producto primero
  const resolverItems = async () => {
    const resueltos = [];
    for (const it of items) {
      if (!it.nombre_libre && !it.producto_id) continue;
      if (it.producto_id) {
        resueltos.push({ producto_id: it.producto_id, nombre_libre: it.nombre_libre, cantidad: parseFloat(it.cantidad), precio_unitario: parseFloat(it.precio_unitario), subtotal: parseFloat(it.cantidad) * parseFloat(it.precio_unitario) });
      } else if (it.nombre_libre) {
        // Crear producto nuevo en catálogo
        const res = await db.post('productos', { nombre: it.nombre_libre, unidad: 'paquete', es_producido: true, activo: true }, tok);
        const nuevo = Array.isArray(res) ? res[0] : res;
        if (nuevo?.id) {
          resueltos.push({ producto_id: nuevo.id, nombre_libre: it.nombre_libre, cantidad: parseFloat(it.cantidad), precio_unitario: parseFloat(it.precio_unitario), subtotal: parseFloat(it.cantidad) * parseFloat(it.precio_unitario) });
        }
      }
    }
    return resueltos;
  };
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
      const itemsResueltos = await resolverItems();
      await db.post('pedidos_externos_detalle', itemsResueltos.map(i => ({ pedido_id: ped.id, producto_id: i.producto_id, cantidad: i.cantidad, precio_unitario: i.precio_unitario, subtotal: i.subtotal })), tok);
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
                  <div style={{ position: 'relative' }}>
                    <input
                      value={it.nombre_libre}
                      onChange={e => buscarProducto(i, e.target.value)}
                      onBlur={() => cerrarSugerencias(i)}
                      placeholder="Escribir o buscar producto..."
                      style={{ ...inp }}
                    />
                    {it._mostrarSug && it._sugerencias.length > 0 && (
                      <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #16a34a', borderRadius: 10, zIndex: 50, maxHeight: 200, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                        {it._sugerencias.map(p => (
                          <div key={p.id} onMouseDown={() => elegirProducto(i, p)}
                            style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 14, color: '#111827', borderBottom: '1px solid #f3f4f6' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#f0fdf4'}
                            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
                          >
                            {p.nombre}
                          </div>
                        ))}
                        {!prods.find(p => p.nombre.toLowerCase() === it.nombre_libre.toLowerCase()) && (
                          <div style={{ padding: '10px 14px', fontSize: 13, color: '#16a34a', fontWeight: 600, background: '#f0fdf4', borderTop: '1px solid #d1fae5' }}>
                            ✚ Crear "{it.nombre_libre}" como producto nuevo
                          </div>
                        )}
                      </div>
                    )}
                    {it.nombre_libre && !it._mostrarSug && (
                      <div style={{ fontSize: 11, marginTop: 3, color: it.producto_id ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>
                        {it.producto_id ? '✓ Producto del catálogo' : '✚ Se creará como producto nuevo al guardar'}
                      </div>
                    )}
                  </div>
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
              <input
                value={busca} onChange={e => setBusca(e.target.value)}
                placeholder="🔍 Buscar por nombre de cliente..."
                style={{ ...inp, marginBottom: 4 }}
              />
              {pedidos.filter(p => !busca || p.clientes_externos?.nombre?.toLowerCase().includes(busca.toLowerCase())).map(p => (
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
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({
    fecha: pedido.fecha || '',
    medio_pago: pedido.medio_pago || 'efectivo',
    observacion: pedido.observacion || '',
  });
  const [itemsEdit, setItemsEdit] = useState([]);
  const [prods, setProds] = useState([]);
  const [showPagModal, setShowPagModal] = useState(false);
  const [formPag, setFormPag] = useState({
    metodo: 'efectivo',
    monto: '',
    banco: '',
    comprobante: '',
    fecha_transferencia: new Date().toISOString().split('T')[0],
    observacion: '',
  });

  const load = () => Promise.all([
    db.get('pedidos_externos_detalle', `pedido_id=eq.${pedido.id}&select=*,productos(nombre)`, tok),
    db.get('pagos_externos', `pedido_id=eq.${pedido.id}&order=created_at.desc`, tok),
  ]).then(([d, p]) => { setDetalle(Array.isArray(d) ? d : []); setPagos(Array.isArray(p) ? p : []); });

  useEffect(() => {
    load();
    db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : []));
  }, [pedido.id]);

  useEffect(() => {
    if (detalle.length > 0) {
      setItemsEdit(detalle.map(d => ({
        id: d.id,
        producto_id: d.producto_id,
        nombre_libre: d.productos?.nombre || '',
        cantidad: String(d.cantidad),
        precio_unitario: String(d.precio_unitario),
      })));
    }
  }, [detalle]);

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

  const confirmarPago = async () => {
    if (!formPag.monto) return;
    setSaving(true);
    const monto = parseFloat(formPag.monto);
    const pagado = parseFloat(pedido.total_pagado || 0) + monto;
    const nuevoEstado = pagado >= parseFloat(pedido.total) ? 'pagado' : 'parcial';

    // Guardar pago con todos los datos
    await db.post('pagos_externos', {
      pedido_id: pedido.id,
      monto,
      medio_pago: formPag.metodo,
      banco: formPag.metodo === 'transferencia' ? formPag.banco : null,
      comprobante: formPag.metodo === 'transferencia' ? formPag.comprobante : null,
      fecha: formPag.metodo === 'transferencia' ? formPag.fecha_transferencia : new Date().toISOString().split('T')[0],
      observacion: formPag.observacion || null,
    }, tok);

    // Actualizar pedido
    await db.patch('pedidos_externos', `id=eq.${pedido.id}`, {
      total_pagado: pagado,
      estado: nuevoEstado,
    }, tok);

    setFormPag({ metodo: 'efectivo', monto: '', banco: '', comprobante: '', fecha_transferencia: new Date().toISOString().split('T')[0], observacion: '' });
    setShowPagModal(false);
    setSaving(false);
    load();
  };


  const eliminarPedido = async () => {
    if (!window.confirm("¿Eliminar este pedido? Se eliminarán también los pagos y el detalle. Esta acción no se puede deshacer.")) return;
    setSaving(true);
    await db.delete("pagos_externos", `pedido_id=eq.${pedido.id}`, tok);
    await db.delete("pedidos_externos_detalle", `pedido_id=eq.${pedido.id}`, tok);
    await db.delete("pedidos_externos", `id=eq.${pedido.id}`, tok);
    setSaving(false);
    onVolver();
  };

  const guardarEdicion = async () => {
    setSaving(true);
    const nuevoTotal = itemsEdit.reduce((s, i) => s + parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0), 0);
    const nuevoEstado = nuevoTotal <= parseFloat(pedido.total_pagado || 0) ? 'pagado' : pedido.estado;
    const nuevaFechaVenc = formEdit.medio_pago === 'credito'
      ? (() => { const d = new Date(formEdit.fecha); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; })()
      : formEdit.fecha;

    // Actualizar cabecera del pedido
    await db.patch('pedidos_externos', `id=eq.${pedido.id}`, {
      fecha: formEdit.fecha,
      medio_pago: formEdit.medio_pago,
      observacion: formEdit.observacion,
      total: nuevoTotal,
      estado: nuevoEstado,
      fecha_vencimiento: nuevaFechaVenc,
    }, tok);

    // Actualizar líneas de detalle
    for (const it of itemsEdit) {
      const subtotal = parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0);
      if (it.id) {
        await db.patch('pedidos_externos_detalle', `id=eq.${it.id}`, {
          cantidad: parseFloat(it.cantidad),
          precio_unitario: parseFloat(it.precio_unitario),
          subtotal,
        }, tok);
      }
    }

    setSaving(false);
    setEditando(false);
    onVolver(); // Volver para recargar el pedido con datos frescos
  };

  const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
  const fd = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—';
  const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const cliente = pedido.clientes_externos || {};
  const saldo = parseFloat(pedido.saldo || 0);
  const estadoColor = { pendiente: '#f59e0b', parcial: '#f97316', pagado: '#16a34a', vencido: '#dc2626' };
  const nroPedido = String(pedido.id).slice(-6).toUpperCase();

  const imprimirPDF = () => {
    const filas = detalle.map(d => `
      <tr>
        <td style="padding:11px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;color:#111827;">${d.productos?.nombre || '—'}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:center;color:#374151;">${d.cantidad}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;color:#374151;">${gs(d.precio_unitario)}</td>
        <td style="padding:11px 14px;border-bottom:1px solid #f3f4f6;font-size:13px;text-align:right;font-weight:700;color:#111827;">${gs(d.subtotal)}</td>
      </tr>`).join('');

    const historialPagos = pagos.length > 0 ? `
      <div style="margin-top:24px;">
        <p style="font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px;">Historial de pagos</p>
        ${pagos.map(p => `<div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #f3f4f6;font-size:13px;"><span style="color:#6b7280;">${fd(p.fecha)} · ${p.medio_pago}</span><span style="font-weight:700;color:#16a34a;">${gs(p.monto)}</span></div>`).join('')}
      </div>` : '';

    const html = `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Pedido ${nroPedido} — Purafruta</title>
    <style>
      *{margin:0;padding:0;box-sizing:border-box;}
      body{font-family:'Segoe UI',Arial,sans-serif;color:#111827;background:#fff;padding:40px;}
      @media print{@page{margin:20mm;} body{padding:0;} .no-print{display:none!important;}}
    </style></head><body>
    <!-- HEADER -->
    <div style="display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:3px solid #16a34a;margin-bottom:32px;">
      <div>
        <img src="data:image/png;base64,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" style="height:64px;width:auto;" alt="Purafruta" />
        <div style="font-size:12px;color:#6b7280;margin-top:6px;">Jugos naturales · Açaí · Ensaladas de frutas</div>
        <div style="font-size:12px;color:#6b7280;margin-top:2px;">Asunción, Paraguay</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:22px;font-weight:800;color:#111827;letter-spacing:2px;">PEDIDO</div>
        <div style="font-size:14px;color:#16a34a;font-weight:700;margin-top:4px;">#${nroPedido}</div>
        <div style="font-size:12px;color:#6b7280;margin-top:6px;">Fecha: <strong>${fd(pedido.fecha)}</strong></div>
        ${pedido.fecha_vencimiento ? `<div style="font-size:12px;color:#6b7280;margin-top:2px;">Vencimiento: <strong>${fd(pedido.fecha_vencimiento)}</strong></div>` : ''}
        <div style="margin-top:8px;display:inline-block;padding:4px 14px;border-radius:99px;font-size:12px;font-weight:700;background:${pedido.estado === 'pagado' ? '#f0fdf4' : pedido.estado === 'vencido' ? '#fef2f2' : '#fefce8'};color:${estadoColor[pedido.estado] || '#a16207'};">${(pedido.estado || '').toUpperCase()}</div>
      </div>
    </div>

    <!-- DATOS CLIENTE -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:32px;">
      <div style="background:#f9fafb;border-radius:12px;padding:18px;">
        <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Cliente</p>
        <p style="font-size:16px;font-weight:800;color:#111827;margin-bottom:6px;">${cliente.nombre || '—'}</p>
        ${cliente.ruc ? `<p style="font-size:13px;color:#6b7280;margin-bottom:3px;">RUC: ${cliente.ruc}</p>` : ''}
        ${cliente.telefono ? `<p style="font-size:13px;color:#6b7280;margin-bottom:3px;">📞 ${cliente.telefono}</p>` : ''}
        ${cliente.email ? `<p style="font-size:13px;color:#6b7280;margin-bottom:3px;">✉️ ${cliente.email}</p>` : ''}
        ${cliente.direccion ? `<p style="font-size:13px;color:#6b7280;">📍 ${cliente.direccion}</p>` : ''}
      </div>
      <div style="background:#f9fafb;border-radius:12px;padding:18px;">
        <p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px;">Resumen de pago</p>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span style="color:#6b7280;">Medio de pago</span><span style="font-weight:600;color:#111827;">${pedido.medio_pago || '—'}</span></div>
        ${pagos.length > 0 && pagos[0].banco ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span style="color:#6b7280;">Banco</span><span style="font-weight:600;color:#111827;">${pagos[0].banco}</span></div>` : ''}
        ${pagos.length > 0 && pagos[0].comprobante ? `<div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span style="color:#6b7280;">N° Comprobante</span><span style="font-weight:600;color:#111827;">${pagos[0].comprobante}</span></div>` : ''}
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span style="color:#6b7280;">Total pedido</span><span style="font-weight:700;color:#111827;">${gs(pedido.total)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span style="color:#6b7280;">Pagado</span><span style="font-weight:700;color:#16a34a;">${gs(pedido.estado === 'pagado' ? pedido.total : pedido.total_pagado)}</span></div>
        ${saldo > 0 ? `<div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb;margin-top:6px;font-size:14px;"><span style="font-weight:700;color:#dc2626;">Saldo pendiente</span><span style="font-weight:800;color:#dc2626;">${gs(saldo)}</span></div>` : ""}
      </div>
    </div>

    <!-- TABLA PRODUCTOS -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#16a34a;color:#fff;">
          <th style="padding:12px 14px;text-align:left;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-radius:8px 0 0 0;">Producto</th>
          <th style="padding:12px 14px;text-align:center;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Cantidad</th>
          <th style="padding:12px 14px;text-align:right;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;">Precio unit.</th>
          <th style="padding:12px 14px;text-align:right;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;border-radius:0 8px 0 0;">Subtotal</th>
        </tr>
      </thead>
      <tbody>${filas}</tbody>
      <tfoot>
        <tr style="background:#f9fafb;">
          <td colspan="3" style="padding:14px;text-align:right;font-size:15px;font-weight:700;color:#111827;">TOTAL</td>
          <td style="padding:14px;text-align:right;font-size:18px;font-weight:900;color:#16a34a;">${gs(pedido.total)}</td>
        </tr>
      </tfoot>
    </table>

    ${pedido.observacion ? `<div style="background:#fefce8;border-left:4px solid #f59e0b;border-radius:0 8px 8px 0;padding:12px 16px;margin-bottom:24px;"><p style="font-size:12px;font-weight:700;color:#a16207;margin-bottom:4px;text-transform:uppercase;">Observación</p><p style="font-size:13px;color:#374151;">${pedido.observacion}</p></div>` : ''}

    ${historialPagos}

    <!-- FOOTER -->
    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;display:flex;justify-content:space-between;align-items:center;">
      <div style="font-size:11px;color:#9ca3af;">Documento generado por Purafruta Sistema de Gestión · ${new Date().toLocaleString('es-PY')}</div>
    </div>

    <div class="no-print" style="text-align:center;margin-top:32px;">
      <button onclick="window.print()" style="padding:12px 32px;background:#16a34a;color:#fff;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;margin-right:10px;">🖨️ Imprimir / Guardar PDF</button>
      <button onclick="window.close()" style="padding:12px 20px;background:#f3f4f6;color:#374151;border:none;border-radius:10px;font-size:15px;cursor:pointer;">Cerrar</button>
    </div>
    </body></html>`;

    // Generar como blob para evitar bloqueo de popups
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pedido_${nroPedido}_${cliente.nombre || 'cliente'}.html`.replace(/\s+/g, '_');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Barra superior */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={onVolver} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600, color: '#374151' }}>← Volver</button>
        <div style={{ flex: 1 }}>
          <p style={{ fontWeight: 800, fontSize: 17, color: '#111827', margin: '0 0 2px' }}>{cliente.nombre || 'Cliente'}</p>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Pedido #{nroPedido} · {fd(pedido.fecha)}</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setEditando(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            ✏️ Editar
          </button>
          <button onClick={eliminarPedido} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fef2f2', color: '#dc2626', border: '1.5px solid #fecaca', borderRadius: 10, padding: '10px 16px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
            🗑 Eliminar
          </button>
          <button onClick={imprimirPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 20px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            📄 Descargar PDF
          </button>
        </div>
      </div>

      {/* ── MODAL DE EDICIÓN ── */}
      {editando && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: '#111827', margin: 0 }}>✏️ Editar pedido #{nroPedido}</p>
              <button onClick={() => setEditando(false)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Datos generales */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Fecha</label>
                  <input type="date" value={formEdit.fecha} onChange={e => setFormEdit({ ...formEdit, fecha: e.target.value })} style={inp} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Medio de pago</label>
                  <select value={formEdit.medio_pago} onChange={e => setFormEdit({ ...formEdit, medio_pago: e.target.value })} style={inp}>
                    <option value="credito">🗓 Crédito 15 días</option>
                    <option value="efectivo">💵 Efectivo al contado</option>
                    <option value="transferencia">🏦 Transferencia</option>
                    <option value="cheque">📝 Cheque</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Observación</label>
                <input value={formEdit.observacion} onChange={e => setFormEdit({ ...formEdit, observacion: e.target.value })} placeholder="Opcional" style={inp} />
              </div>

              {/* Líneas de productos */}
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: '#374151', margin: '0 0 10px' }}>Productos del pedido</p>
                {itemsEdit.map((it, i) => (
                  <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: 12, marginBottom: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: 0 }}>{it.nombre_libre}</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Cantidad</label>
                        <input type="number" value={it.cantidad} onChange={e => { const n = [...itemsEdit]; n[i].cantidad = e.target.value; setItemsEdit(n); }} style={inp} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <label style={{ fontSize: 11, fontWeight: 600, color: '#6b7280' }}>Precio unitario (Gs.)</label>
                        <input type="number" value={it.precio_unitario} onChange={e => { const n = [...itemsEdit]; n[i].precio_unitario = e.target.value; setItemsEdit(n); }} style={inp} />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>
                      Subtotal: {gs(parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0))}
                    </div>
                  </div>
                ))}
                <div style={{ textAlign: 'right', fontWeight: 800, fontSize: 16, color: '#111827', paddingTop: 8, borderTop: '2px solid #e5e7eb' }}>
                  Nuevo total: {gs(itemsEdit.reduce((s, i) => s + parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0), 0))}
                </div>
              </div>
              {/* Botones */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
                <button onClick={guardarEdicion} disabled={saving} style={{ flex: 1, background: saving ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Guardando...' : '✓ Guardar cambios'}
                </button>
                <button onClick={() => setEditando(false)} style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 20px', fontSize: 14, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tarjeta de pedido estilo factura */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #e5e7eb', overflow: 'hidden' }}>

        {/* Header verde */}
        <div style={{ background: 'linear-gradient(135deg,#16a34a,#22c55e)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <img src="data:image/png;base64,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" style={{ height: 52, width: 'auto', filter: 'none', background: '#fff', borderRadius: 8, padding: '4px 8px' }} alt="Purafruta" />
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '4px 0 0' }}>Jugos naturales · Açaí · Ensaladas de frutas</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: 1 }}>Pedido N°</p>
            <p style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 4px' }}>#{nroPedido}</p>
            <span style={{ background: 'rgba(255,255,255,0.2)', color: '#fff', borderRadius: 99, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
              {(pedido.estado || '').toUpperCase()}
            </span>
          </div>
        </div>

        {/* Info cliente + pago */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderBottom: '1px solid #f3f4f6' }}>
          <div style={{ padding: '18px 24px', borderRight: '1px solid #f3f4f6' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Cliente</p>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', margin: '0 0 5px' }}>{cliente.nombre || '—'}</p>
            {cliente.ruc && <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 3px' }}>RUC: {cliente.ruc}</p>}
            {cliente.telefono && <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 3px' }}>📞 {cliente.telefono}</p>}
            {cliente.email && <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 3px' }}>✉️ {cliente.email}</p>}
            {cliente.direccion && <p style={{ fontSize: 13, color: '#6b7280', margin: 0 }}>📍 {cliente.direccion}</p>}
          </div>
          <div style={{ padding: '18px 24px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 10px' }}>Detalle de pago</p>
            {[
              ['Fecha', fd(pedido.fecha)],
              pedido.fecha_vencimiento ? ['Vencimiento', fd(pedido.fecha_vencimiento)] : null,
              ['Medio de pago', pedido.medio_pago || '—'],
            ].filter(Boolean).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>{l}</span>
                <span style={{ fontWeight: 600, color: '#111827' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tabla productos */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
                {['Producto', 'Cantidad', 'Precio unitario', 'Subtotal'].map((h, i) => (
                  <th key={h} style={{ padding: '10px 16px', fontSize: 11, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .5, textAlign: i === 0 ? 'left' : 'right' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {detalle.map((d, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f9fafb' }}>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 500, color: '#111827' }}>{d.productos?.nombre || '—'}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, color: '#374151', textAlign: 'right' }}>{d.cantidad}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, color: '#374151', textAlign: 'right' }}>{gs(d.precio_unitario)}</td>
                  <td style={{ padding: '13px 16px', fontSize: 14, fontWeight: 700, color: '#111827', textAlign: 'right' }}>{gs(d.subtotal)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={3} style={{ padding: '14px 16px', fontSize: 15, fontWeight: 700, color: '#374151', textAlign: 'right' }}>TOTAL</td>
                <td style={{ padding: '14px 16px', fontSize: 20, fontWeight: 900, color: '#16a34a', textAlign: 'right' }}>{gs(pedido.total)}</td>
              </tr>
              {parseFloat(pedido.total_pagado) > 0 && (
                <tr style={{ background: '#f9fafb' }}>
                  <td colSpan={3} style={{ padding: '8px 16px', fontSize: 13, color: '#6b7280', textAlign: 'right' }}>Pagado</td>
                  <td style={{ padding: '8px 16px', fontSize: 14, fontWeight: 700, color: '#16a34a', textAlign: 'right' }}>{gs(pedido.total_pagado)}</td>
                </tr>
              )}
              {saldo > 0 && (
                <tr style={{ background: '#fef2f2' }}>
                  <td colSpan={3} style={{ padding: '10px 16px', fontSize: 14, fontWeight: 700, color: '#dc2626', textAlign: 'right' }}>Saldo pendiente</td>
                  <td style={{ padding: '10px 16px', fontSize: 16, fontWeight: 900, color: '#dc2626', textAlign: 'right' }}>{gs(saldo)}</td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>

        {/* Observación */}
        {pedido.observacion && (
          <div style={{ margin: '0 16px 16px', background: '#fefce8', borderLeft: '4px solid #f59e0b', borderRadius: '0 8px 8px 0', padding: '10px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#a16207', margin: '0 0 3px', textTransform: 'uppercase' }}>Observación</p>
            <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{pedido.observacion}</p>
          </div>
        )}
      </div>

      {/* Botón registrar pago */}
      {saldo > 0 && (
        <button
          onClick={() => { setFormPag(f => ({ ...f, monto: String(saldo) })); setShowPagModal(true); }}
          style={{ width: '100%', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: '14px', fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          ✓ Registrar pago — {gs(saldo)} pendiente
        </button>
      )}

      {/* Historial de pagos */}
      {pagos.length > 0 && (
        <Card>
          <CardHead title="Historial de pagos" />
          <div style={{ padding: '0 14px 14px' }}>
            {pagos.map((p, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid #f3f4f6' }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#111827', margin: '0 0 2px' }}>
                    {p.medio_pago === 'transferencia' ? '🏦 Transferencia' : p.medio_pago === 'efectivo' ? '💵 Efectivo' : '📝 ' + p.medio_pago}
                  </p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                    {fd(p.fecha)}{p.banco ? ` · ${p.banco}` : ''}{p.comprobante ? ` · Comp. ${p.comprobante}` : ''}
                  </p>
                </div>
                <span style={{ fontWeight: 700, fontSize: 15, color: '#16a34a' }}>{gs(p.monto)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* MODAL DE PAGO */}
      {showPagModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 480, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontWeight: 800, fontSize: 16, color: '#111827', margin: 0 }}>✓ Registrar pago</p>
              <button onClick={() => setShowPagModal(false)} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Selector método */}
              <div style={{ display: 'flex', gap: 10 }}>
                {[['efectivo', '💵 Efectivo'], ['transferencia', '🏦 Transferencia']].map(([val, lbl]) => (
                  <button key={val} onClick={() => setFormPag(f => ({ ...f, metodo: val }))}
                    style={{ flex: 1, padding: '12px', borderRadius: 10, border: `2px solid ${formPag.metodo === val ? '#16a34a' : '#e5e7eb'}`, background: formPag.metodo === val ? '#f0fdf4' : '#fff', color: formPag.metodo === val ? '#15803d' : '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* Monto */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Monto (Gs.) *</label>
                <input type="number" value={formPag.monto} onChange={e => setFormPag(f => ({ ...f, monto: e.target.value }))} placeholder={gs(saldo)} style={inp} />
                <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>Saldo total: {gs(saldo)}</p>
              </div>

              {/* Campos de transferencia */}
              {formPag.metodo === 'transferencia' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, background: '#f0fdf4', borderRadius: 12, padding: 14 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#15803d', margin: 0, textTransform: 'uppercase', letterSpacing: .5 }}>Datos de la transferencia</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Banco</label>
                      <select value={formPag.banco} onChange={e => setFormPag(f => ({ ...f, banco: e.target.value }))} style={inp}>
                        <option value="">Seleccionar...</option>
                        <option>Bancop</option>
                        <option>Banco Continental</option>
                        <option>Itaú</option>
                        <option>Vision Banco</option>
                        <option>GNB</option>
                        <option>Familiar</option>
                        <option>BCP</option>
                        <option>Sudameris</option>
                        <option>Otro</option>
                      </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>N° Comprobante</label>
                      <input value={formPag.comprobante} onChange={e => setFormPag(f => ({ ...f, comprobante: e.target.value }))} placeholder="Ej: 123456" style={inp} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Fecha de transferencia</label>
                    <input type="date" value={formPag.fecha_transferencia} onChange={e => setFormPag(f => ({ ...f, fecha_transferencia: e.target.value }))} style={inp} />
                  </div>
                </div>
              )}

              {/* Observación */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Observación (opcional)</label>
                <input value={formPag.observacion} onChange={e => setFormPag(f => ({ ...f, observacion: e.target.value }))} placeholder="Ej: Pago parcial primera cuota" style={inp} />
              </div>

              {/* Resumen */}
              <div style={{ background: '#f9fafb', borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>Saldo después del pago</span>
                <span style={{ fontSize: 15, fontWeight: 800, color: saldo - parseFloat(formPag.monto || 0) <= 0 ? '#16a34a' : '#f59e0b' }}>
                  {gs(Math.max(0, saldo - parseFloat(formPag.monto || 0)))}
                </span>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={confirmarPago} disabled={saving || !formPag.monto}
                  style={{ flex: 1, background: saving ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Guardando...' : '✓ Confirmar pago'}
                </button>
                <button onClick={() => setShowPagModal(false)}
                  style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '13px 18px', fontSize: 14, cursor: 'pointer' }}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
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
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [stats, setStats] = useState({ ventasMes: 0, pedidosMes: 0, pendiente: 0 });

  const load = () => {
    const hoy = new Date();
    const inicioMes = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-01`;
    Promise.all([
      db.get('clientes_externos', 'order=nombre&activo=neq.false', tok),
      db.get('pedidos_externos', `fecha=gte.${inicioMes}&select=total,estado`, tok),
    ]).then(([c, p]) => {
      setRows(Array.isArray(c) ? c : []);
      const pedsMes = Array.isArray(p) ? p : [];
      setStats({
        ventasMes: pedsMes.reduce((s, x) => s + parseFloat(x.total || 0), 0),
        pedidosMes: pedsMes.length,
        pendiente: pedsMes.filter(x => ['pendiente', 'parcial', 'vencido'].includes(x.estado)).reduce((s, x) => s + parseFloat(x.total || 0), 0),
      });
      setLoading(false);
    });
  };
  useEffect(() => { load(); }, [tok]);

  const guardar = async () => {
    if (!form.nombre) return;
    setSaving(true);
    const res = await db.post('clientes_externos', { ...form, activo: true, limite_credito: parseFloat(form.limite_credito || 0) }, tok);
    const nuevo = Array.isArray(res) ? res[0] : res;
    if (nuevo?.id) {
      setForm({ nombre: '', ruc: '', telefono: '', direccion: '', email: '', limite_credito: '' });
      setShow(false);
      load();
    } else {
      alert('Error al guardar el cliente. Verificá los datos e intentá de nuevo.');
    }
    setSaving(false);
  };

  const abrirEdicion = (c) => { setEditId(c.id); setEditForm({ nombre: c.nombre || '', ruc: c.ruc || '', telefono: c.telefono || '', email: c.email || '', direccion: c.direccion || '', limite_credito: c.limite_credito || '' }); };
  const guardarEdicionCliente = async () => {
    if (!editForm.nombre) return;
    setSaving(true);
    await db.patch('clientes_externos', `id=eq.${editId}`, { ...editForm, limite_credito: parseFloat(editForm.limite_credito || 0) }, tok);
    setEditId(null);
    setSaving(false);
    load();
  };
  const eliminar = async (c) => {
    if (!window.confirm(`¿Eliminar a ${c.nombre}? Esta acción no se puede deshacer.`)) return;
    await db.patch('clientes_externos', `id=eq.${c.id}`, { activo: false }, tok);
    load();
  };

  const confirmarPago = async () => {
    if (!formPag.monto) return;
    setSaving(true);
    const monto = parseFloat(formPag.monto);
    const pagado = parseFloat(pedido.total_pagado || 0) + monto;
    const nuevoEstado = pagado >= parseFloat(pedido.total) ? 'pagado' : 'parcial';

    // Guardar pago con todos los datos
    await db.post('pagos_externos', {
      pedido_id: pedido.id,
      monto,
      medio_pago: formPag.metodo,
      banco: formPag.metodo === 'transferencia' ? formPag.banco : null,
      comprobante: formPag.metodo === 'transferencia' ? formPag.comprobante : null,
      fecha: formPag.metodo === 'transferencia' ? formPag.fecha_transferencia : new Date().toISOString().split('T')[0],
      observacion: formPag.observacion || null,
    }, tok);

    // Actualizar pedido
    await db.patch('pedidos_externos', `id=eq.${pedido.id}`, {
      total_pagado: pagado,
      estado: nuevoEstado,
    }, tok);

    setFormPag({ metodo: 'efectivo', monto: '', banco: '', comprobante: '', fecha_transferencia: new Date().toISOString().split('T')[0], observacion: '' });
    setShowPagModal(false);
    setSaving(false);
    load();
  };

  const guardarEdicion = async () => {
    setSaving(true);
    const nuevoTotal = itemsEdit.reduce((s, i) => s + parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0), 0);
    const nuevoEstado = nuevoTotal <= parseFloat(pedido.total_pagado || 0) ? 'pagado' : pedido.estado;
    const nuevaFechaVenc = formEdit.medio_pago === 'credito'
      ? (() => { const d = new Date(formEdit.fecha); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; })()
      : formEdit.fecha;

    // Actualizar cabecera del pedido
    await db.patch('pedidos_externos', `id=eq.${pedido.id}`, {
      fecha: formEdit.fecha,
      medio_pago: formEdit.medio_pago,
      observacion: formEdit.observacion,
      total: nuevoTotal,
      estado: nuevoEstado,
      fecha_vencimiento: nuevaFechaVenc,
    }, tok);

    // Actualizar líneas de detalle
    for (const it of itemsEdit) {
      const subtotal = parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0);
      if (it.id) {
        await db.patch('pedidos_externos_detalle', `id=eq.${it.id}`, {
          cantidad: parseFloat(it.cantidad),
          precio_unitario: parseFloat(it.precio_unitario),
          subtotal,
        }, tok);
      }
    }

    setSaving(false);
    setEditando(false);
    onVolver(); // Volver para recargar el pedido con datos frescos
  };

  const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
  const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };

  return (
    <Card>
      {/* Dashboard resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, padding: '16px 18px', borderBottom: '1px solid #f3f4f6' }}>
        {[
          { label: 'Clientes registrados', valor: rows.length, color: '#1d4ed8', bg: '#eff6ff', icono: '👥' },
          { label: 'Ventas del mes', valor: gs(stats.ventasMes), color: '#15803d', bg: '#f0fdf4', icono: '💰' },
          { label: 'Pedidos del mes', valor: stats.pedidosMes, color: '#6d28d9', bg: '#f5f3ff', icono: '📦' },
          { label: 'Saldo pendiente', valor: gs(stats.pendiente), color: '#dc2626', bg: '#fef2f2', icono: '⏳' },
        ].map(s => (
          <div key={s.label} style={{ background: s.bg, borderRadius: 12, padding: '12px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', margin: '0 0 6px', textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.icono} {s.label}</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: s.color, margin: 0 }}>{s.valor}</p>
          </div>
        ))}
      </div>

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
      {loading ? <p style={{ padding: 30, color: '#9ca3af' }}>Cargando...</p> :
        rows.length === 0 ? <p style={{ padding: 30, color: '#9ca3af' }}>No hay clientes registrados</p> :
          <div style={{ padding: '8px 14px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {rows.map(c => (
              <div key={c.id} style={{ borderRadius: 10, padding: '10px 14px', border: '1px solid #e5e7eb', background: '#fff' }}>
                {editId === c.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
                      {[['nombre', 'Nombre *', 'text'], ['ruc', 'RUC', 'text'], ['telefono', 'Teléfono', 'text'], ['email', 'Email', 'email'], ['direccion', 'Dirección', 'text'], ['limite_credito', 'Límite crédito (Gs.)', 'number']].map(([k, l, t]) => (
                        <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{l}</label>
                          <input type={t} value={editForm[k]} onChange={e => setEditForm({ ...editForm, [k]: e.target.value })} style={inp} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={guardarEdicionCliente} disabled={saving || !editForm.nombre} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 16px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? 'Guardando...' : 'Guardar'}</button>
                      <button onClick={() => setEditId(null)} style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 16px', fontSize: 13, cursor: 'pointer' }}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ minWidth: 0, textAlign: 'left' }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 2px', textAlign: 'left' }}>{c.nombre}</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#6b7280', textAlign: 'left' }}>
                        {c.ruc && <span>RUC: {c.ruc}</span>}
                        {c.telefono && <span>📞 {c.telefono}</span>}
                        {c.email && <span>✉️ {c.email}</span>}
                        {c.direccion && <span>📍 {c.direccion}</span>}
                        {c.limite_credito > 0 && <span style={{ color: '#1d4ed8', fontWeight: 600 }}>Crédito: {gs(c.limite_credito)}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => abrirEdicion(c)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✏️ Editar</button>
                      <button onClick={() => eliminar(c)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗑 Eliminar</button>
                    </div>
                  </div>
                )}
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

  const confirmarPago = async () => {
    if (!formPag.monto) return;
    setSaving(true);
    const monto = parseFloat(formPag.monto);
    const pagado = parseFloat(pedido.total_pagado || 0) + monto;
    const nuevoEstado = pagado >= parseFloat(pedido.total) ? 'pagado' : 'parcial';

    // Guardar pago con todos los datos
    await db.post('pagos_externos', {
      pedido_id: pedido.id,
      monto,
      medio_pago: formPag.metodo,
      banco: formPag.metodo === 'transferencia' ? formPag.banco : null,
      comprobante: formPag.metodo === 'transferencia' ? formPag.comprobante : null,
      fecha: formPag.metodo === 'transferencia' ? formPag.fecha_transferencia : new Date().toISOString().split('T')[0],
      observacion: formPag.observacion || null,
    }, tok);

    // Actualizar pedido
    await db.patch('pedidos_externos', `id=eq.${pedido.id}`, {
      total_pagado: pagado,
      estado: nuevoEstado,
    }, tok);

    setFormPag({ metodo: 'efectivo', monto: '', banco: '', comprobante: '', fecha_transferencia: new Date().toISOString().split('T')[0], observacion: '' });
    setShowPagModal(false);
    setSaving(false);
    load();
  };

  const guardarEdicion = async () => {
    setSaving(true);
    const nuevoTotal = itemsEdit.reduce((s, i) => s + parseFloat(i.cantidad || 0) * parseFloat(i.precio_unitario || 0), 0);
    const nuevoEstado = nuevoTotal <= parseFloat(pedido.total_pagado || 0) ? 'pagado' : pedido.estado;
    const nuevaFechaVenc = formEdit.medio_pago === 'credito'
      ? (() => { const d = new Date(formEdit.fecha); d.setDate(d.getDate() + 15); return d.toISOString().split('T')[0]; })()
      : formEdit.fecha;

    // Actualizar cabecera del pedido
    await db.patch('pedidos_externos', `id=eq.${pedido.id}`, {
      fecha: formEdit.fecha,
      medio_pago: formEdit.medio_pago,
      observacion: formEdit.observacion,
      total: nuevoTotal,
      estado: nuevoEstado,
      fecha_vencimiento: nuevaFechaVenc,
    }, tok);

    // Actualizar líneas de detalle
    for (const it of itemsEdit) {
      const subtotal = parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0);
      if (it.id) {
        await db.patch('pedidos_externos_detalle', `id=eq.${it.id}`, {
          cantidad: parseFloat(it.cantidad),
          precio_unitario: parseFloat(it.precio_unitario),
          subtotal,
        }, tok);
      }
    }

    setSaving(false);
    setEditando(false);
    onVolver(); // Volver para recargar el pedido con datos frescos
  };

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
