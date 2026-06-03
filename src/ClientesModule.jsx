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
  const [editando, setEditando] = useState(false);
  const [formEdit, setFormEdit] = useState({
    fecha: pedido.fecha || '',
    medio_pago: pedido.medio_pago || 'efectivo',
    observacion: pedido.observacion || '',
  });
  const [itemsEdit, setItemsEdit] = useState([]);
  const [prods, setProds] = useState([]);

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
      estado: formEdit.medio_pago !== 'credito' && nuevoTotal <= parseFloat(pedido.total_pagado || 0) ? 'pagado' : nuevoEstado,
      fecha_vencimiento: nuevaFechaVenc,
      total_pagado: formEdit.medio_pago !== 'credito' ? nuevoTotal : parseFloat(pedido.total_pagado || 0),
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
        <div style="font-size:28px;font-weight:900;color:#16a34a;letter-spacing:-1px;">🍊 PURAFRUTA</div>
        <div style="font-size:12px;color:#6b7280;margin-top:4px;">Jugos naturales · Açaí · Ensaladas de frutas</div>
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
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span style="color:#6b7280;">Total pedido</span><span style="font-weight:700;color:#111827;">${gs(pedido.total)}</span></div>
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;font-size:13px;"><span style="color:#6b7280;">Pagado</span><span style="font-weight:700;color:#16a34a;">${gs(pedido.total_pagado)}</span></div>
        ${saldo > 0 ? `<div style="display:flex;justify-content:space-between;padding-top:8px;border-top:1px solid #e5e7eb;margin-top:6px;font-size:14px;"><span style="font-weight:700;color:#dc2626;">Saldo pendiente</span><span style="font-weight:800;color:#dc2626;">${gs(saldo)}</span></div>` : `<div style="text-align:center;margin-top:10px;padding:8px;background:#f0fdf4;border-radius:8px;font-size:13px;font-weight:700;color:#16a34a;">✓ PAGADO COMPLETAMENTE</div>`}
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
      <div style="font-size:12px;font-weight:700;color:#16a34a;">🍊 PURAFRUTA</div>
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
              {formEdit.medio_pago !== 'credito' && (
                <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#15803d', fontWeight: 600 }}>
                  ✓ Al guardar, el pedido quedará marcado como <strong>pagado al contado</strong>
                </div>
              )}
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
            <p style={{ fontWeight: 900, fontSize: 20, color: '#fff', margin: '0 0 2px', letterSpacing: -0.5 }}>🍊 PURAFRUTA</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: 0 }}>Jugos naturales · Açaí · Ensaladas de frutas</p>
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

      {/* Registrar pago */}
      {saldo > 0 && (
        <Card>
          <CardHead title="Registrar pago" action={<button onClick={() => setShowPago(!showPago)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>+ Pago</button>} />
          {showPago && (
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}><label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>Monto (Gs.) *</label><input type="number" value={formPago.monto} onChange={e => setFormPago({ ...formPago, monto: e.target.value })} placeholder={gs(saldo)} style={inp} /></div>
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

  const load = () => db.get('clientes_externos', 'order=nombre&activo=neq.false', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
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
      estado: formEdit.medio_pago !== 'credito' && nuevoTotal <= parseFloat(pedido.total_pagado || 0) ? 'pagado' : nuevoEstado,
      fecha_vencimiento: nuevaFechaVenc,
      total_pagado: formEdit.medio_pago !== 'credito' ? nuevoTotal : parseFloat(pedido.total_pagado || 0),
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
      estado: formEdit.medio_pago !== 'credito' && nuevoTotal <= parseFloat(pedido.total_pagado || 0) ? 'pagado' : nuevoEstado,
      fecha_vencimiento: nuevaFechaVenc,
      total_pagado: formEdit.medio_pago !== 'credito' ? nuevoTotal : parseFloat(pedido.total_pagado || 0),
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
