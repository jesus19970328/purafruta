/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from "react";

const SB_URL = 'https://iepqhmxgdyuthcsmxadb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHFobXhnZHl1dGhjc214YWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODM1MjcsImV4cCI6MjA5NDk1OTUyN30.WWUs3xNpaMAYcvp2TAVuqQdCHGCsKIV0fdDF3Y45sLE';
const hdr = (tok) => ({ 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${tok || SB_KEY}`, 'Prefer': 'return=representation' });
const db = {
  get: (t, q, tok) => fetch(`${SB_URL}/rest/v1/${t}${q ? '?' + q : ''}`, { headers: { ...hdr(tok), 'Accept': 'application/json' } }).then(r => r.json()),
  post: (t, d, tok) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  patch: (t, q, d, tok) => fetch(`${SB_URL}/rest/v1/${t}?${q}`, { method: 'PATCH', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
};

const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
const fd = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—';
const fdt = (d) => d ? new Date(d).toLocaleString('es-PY', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const COSTO_HORA = 13000;
const MARGEN = 0.55;
const isMobile = () => window.innerWidth < 768;

const SUCURSALES = ['Villa Morra', 'Mariscal López', 'San Lorenzo', 'Luque', 'Fernando', 'Otras'];

// ── UI BASE ────────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', ...style }}>{children}</div>
);
const CardHead = ({ title, sub, action }) => (
  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <div>
      <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{title}</h3>
      {sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>{sub}</p>}
    </div>
    {action}
  </div>
);
const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
    {children}
  </div>
);
const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '12px 14px', fontSize: 15, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none', appearance: 'none', WebkitAppearance: 'none' };
const Inp = ({ label, ...p }) => <Field label={label}><input {...p} style={{ ...inp, ...(p.style || {}) }} /></Field>;
const Sel = ({ label, children, ...p }) => <Field label={label}><select {...p} style={{ ...inp, ...(p.style || {}) }}>{children}</select></Field>;
const Btn = ({ onClick, children, variant = 'primary', disabled, full }) => {
  const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', width: full ? '100%' : 'auto' };
  const styles = { primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' }, secondary: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }, ghost: { background: '#f0fdf4', color: '#15803d' } };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...styles[variant] }}>{children}</button>;
};
const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {tabs.map(([id, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{ padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500, border: 'none', cursor: 'pointer', flex: isMobile() ? '1 1 auto' : 'none', background: active === id ? '#16a34a' : '#fff', color: active === id ? '#fff' : '#6b7280', boxShadow: active === id ? 'none' : '0 0 0 1.5px #e5e7eb' }}>{label}</button>
    ))}
  </div>
);
const Row2 = ({ children }) => <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>{children}</div>;
const calcHoras = (inicio, fin) => { if (!inicio || !fin) return 0; const [hi, mi] = inicio.split(':').map(Number); const [hf, mf] = fin.split(':').map(Number); return Math.max(0, ((hf * 60 + mf) - (hi * 60 + mi)) / 60); };

// ── HELPER: registrar movimiento ───────────────────────────
async function registrarMovimiento(tok, { producto_id, tabla_origen, tipo, cantidad, stock_anterior, stock_nuevo, referencia, responsable, observacion, lote_id }) {
  try {
    await db.post('inventario_movimientos', { producto_id, tabla_origen, tipo, cantidad, stock_anterior, stock_nuevo, referencia, responsable, observacion, lote_id: lote_id || null }, tok);
  } catch (e) { console.error('Error registrando movimiento:', e); }
}

// ── MÓDULO PRINCIPAL ───────────────────────────────────────
export default function ProduccionModule({ tok }) {
  const [tab, setTab] = useState('nueva');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Tabs tabs={[['nueva', '+ Nueva hojita'], ['historial', 'Historial'], ['frescos', '🍃 Frescos'], ['congelados', '❄️ Congelados']]} active={tab} onChange={setTab} />
      {tab === 'nueva' && <NuevaHojita tok={tok} onGuardado={() => setTab('historial')} />}
      {tab === 'historial' && <Historial tok={tok} />}
      {tab === 'frescos' && <InventarioStock tok={tok} tabla="sucursal_inventario" titulo="Inventario de Frescos" emoji="🍃" tipoSalida="salida_produccion" />}
      {tab === 'congelados' && <InventarioStock tok={tok} tabla="congelados_inventario" titulo="Inventario de Congelados" emoji="❄️" tipoSalida="salida_sucursal" />}
    </div>
  );
}

// ── INVENTARIO STOCK ───────────────────────────────────────
function InventarioStock({ tok, tabla, titulo, emoji, tipoSalida }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos'); // todos | sin_stock | stock_bajo
  const [busqueda, setBusqueda] = useState('');
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [ajusteId, setAjusteId] = useState(null);
  const [ajusteVal, setAjusteVal] = useState('');
  const [ajusteMotivo, setAjusteMotivo] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSalida, setShowSalida] = useState(null);

  const load = () => {
    setLoading(true);
    db.get(tabla, 'select=*,productos(nombre,unidad)&order=productos(nombre)', tok)
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  };

  useEffect(() => { load(); }, [tok, tabla]);

  const guardarAjuste = async (r) => {
    if (ajusteVal === '') return;
    setSaving(true);
    const stockAnterior = parseFloat(r.stock_actual || 0);
    const stockNuevo = parseFloat(ajusteVal);
    await db.patch(tabla, `id=eq.${r.id}`, { stock_actual: stockNuevo, ultima_actualizacion: new Date().toISOString(), observacion: ajusteMotivo || null }, tok);
    await registrarMovimiento(tok, { producto_id: r.producto_id, tabla_origen: tabla, tipo: 'ajuste', cantidad: Math.abs(stockNuevo - stockAnterior), stock_anterior: stockAnterior, stock_nuevo: stockNuevo, referencia: 'Ajuste manual', responsable: 'Admin', observacion: ajusteMotivo || null });
    setAjusteId(null); setAjusteVal(''); setAjusteMotivo(''); setSaving(false); load();
  };

  const sinStock = rows.filter(r => parseFloat(r.stock_actual || 0) === 0).length;
  const stockBajoCount = rows.filter(r => { const s = parseFloat(r.stock_actual || 0); return s > 0 && s <= 5; }).length;

  const filtrados = rows.filter(r => {
    const stock = parseFloat(r.stock_actual || 0);
    const matchBusqueda = r.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    if (!matchBusqueda) return false;
    if (filtro === 'sin_stock') return stock === 0;
    if (filtro === 'stock_bajo') return stock > 0 && stock <= 5;
    return true;
  });

  if (productoDetalle) return <HistorialProducto tok={tok} row={productoDetalle} tabla={tabla} onVolver={() => { setProductoDetalle(null); load(); }} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

      {/* Header */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: '14px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
          <div>
            <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '0 0 2px' }}>{emoji} {titulo}</p>
            <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{rows.length} productos · {sinStock} sin stock · {stockBajoCount} stock bajo</p>
          </div>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar..." style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 13, outline: 'none', width: 180 }} />
        </div>
        {/* Filtros */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[['todos', `Todos (${rows.length})`], ['sin_stock', `Sin stock (${sinStock})`], ['stock_bajo', `Stock bajo (${stockBajoCount})`]].map(([k, label]) => {
            const isActive = filtro === k;
            const bgMap = { sin_stock: '#fef2f2', stock_bajo: '#fefce8', todos: '#f0fdf4' };
            const colorMap = { sin_stock: '#dc2626', stock_bajo: '#a16207', todos: '#15803d' };
            return (
              <button key={k} onClick={() => setFiltro(k)} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, border: 'none', cursor: 'pointer', background: isActive ? bgMap[k] : '#f3f4f6', color: isActive ? colorMap[k] : '#6b7280' }}>
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista compacta */}
      {loading ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Cargando...</p> :
        filtrados.length === 0 ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Sin resultados</p> :
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {filtrados.map((r, i) => {
            const stock = parseFloat(r.stock_actual || 0);
            const sinStock = stock === 0;
            const bajo = stock > 0 && stock <= 5;
            const isEditing = ajusteId === r.id;

            return (
              <div key={r.id} style={{ padding: '10px 16px', borderBottom: i < filtrados.length - 1 ? '1px solid #f3f4f6' : 'none', background: sinStock ? '#fff5f5' : bajo ? '#fffbeb' : '#fff' }}>
                {isEditing ? (
                  // Modo edición
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0, textTransform: 'uppercase' }}>{r.productos?.nombre}</p>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <input type="number" value={ajusteVal} onChange={e => setAjusteVal(e.target.value)} autoFocus style={{ border: '2px solid #16a34a', borderRadius: 8, padding: '7px 10px', fontSize: 15, fontWeight: 700, width: 90, textAlign: 'center', outline: 'none' }} />
                      <span style={{ fontSize: 13, color: '#6b7280' }}>{r.productos?.unidad}</span>
                      <input value={ajusteMotivo} onChange={e => setAjusteMotivo(e.target.value)} placeholder="Motivo (opcional)" style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, outline: 'none', flex: 1, minWidth: 120 }} />
                      <button onClick={() => guardarAjuste(r)} disabled={saving} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>{saving ? '...' : '✓'}</button>
                      <button onClick={() => { setAjusteId(null); setAjusteVal(''); setAjusteMotivo(''); }} style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 8, padding: '8px 10px', fontSize: 13, cursor: 'pointer' }}>✕</button>
                    </div>
                  </div>
                ) : (
                  // Vista normal compacta
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => setProductoDetalle(r)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: 0, textTransform: 'uppercase' }}>{r.productos?.nombre}</p>
                        {sinStock && <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 5, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>SIN STOCK</span>}
                        {bajo && <span style={{ background: '#fefce8', color: '#a16207', borderRadius: 5, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>STOCK BAJO</span>}
                      </div>
                      <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Actualizado: {r.ultima_actualizacion ? new Date(r.ultima_actualizacion).toLocaleDateString('es-PY') : '—'} · ver historial →</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {tabla === 'congelados_inventario' && (
                        <button onClick={() => setShowSalida(r)} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 7, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Salida</button>
                      )}
                      <button onClick={() => { setAjusteId(r.id); setAjusteVal(String(stock)); }} style={{ background: '#f9fafb', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 7, padding: '6px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Ajustar</button>
                      <span style={{ background: sinStock ? '#fef2f2' : bajo ? '#fefce8' : '#f0fdf4', color: sinStock ? '#dc2626' : bajo ? '#a16207' : '#15803d', borderRadius: 8, padding: '6px 12px', fontWeight: 700, fontSize: 15, minWidth: 60, textAlign: 'center' }}>
                        {stock} <span style={{ fontSize: 11, fontWeight: 500 }}>{r.productos?.unidad}</span>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      }

      {/* Modal salida congelados */}
      {showSalida && (
        <ModalSalida tok={tok} row={showSalida} tabla={tabla} onClose={() => { setShowSalida(null); load(); }} />
      )}
    </div>
  );
}

// ── MODAL SALIDA CONGELADOS ────────────────────────────────
function ModalSalida({ tok, row, tabla, onClose }) {
  const [tipo, setTipo] = useState('salida_sucursal');
  const [cantidad, setCantidad] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [responsable, setResponsable] = useState('');
  const [observacion, setObservacion] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const stockActual = parseFloat(row.stock_actual || 0);

  const guardar = async () => {
    if (!cantidad || parseFloat(cantidad) <= 0) { setErr('Ingresá una cantidad válida'); return; }
    if (parseFloat(cantidad) > stockActual) { setErr(`Stock insuficiente. Disponible: ${stockActual} ${row.productos?.unidad}`); return; }
    if (tipo === 'salida_sucursal' && !sucursal) { setErr('Seleccioná la sucursal'); return; }
    setSaving(true); setErr('');
    const cant = parseFloat(cantidad);
    const stockNuevo = stockActual - cant;
    await db.patch(tabla, `id=eq.${row.id}`, { stock_actual: stockNuevo, ultima_actualizacion: new Date().toISOString() }, tok);
    await registrarMovimiento(tok, { producto_id: row.producto_id, tabla_origen: tabla, tipo, cantidad: cant, stock_anterior: stockActual, stock_nuevo: stockNuevo, referencia: tipo === 'salida_sucursal' ? sucursal : 'Consumo interno', responsable: responsable || 'Sin especificar', observacion: observacion || null });
    setSaving(false);
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 440, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <p style={{ fontWeight: 800, fontSize: 15, color: '#111827', margin: 0 }}>Registrar salida</p>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '2px 0 0', textTransform: 'uppercase' }}>{row.productos?.nombre} · Stock: {stockActual} {row.productos?.unidad}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tipo */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[['salida_sucursal', '🏪 A sucursal'], ['salida_consumo', '🍽 Consumo interno']].map(([val, lbl]) => (
              <button key={val} onClick={() => setTipo(val)} style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${tipo === val ? '#1d4ed8' : '#e5e7eb'}`, background: tipo === val ? '#eff6ff' : '#fff', color: tipo === val ? '#1d4ed8' : '#374151', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{lbl}</button>
            ))}
          </div>
          {/* Cantidad */}
          <Field label="Cantidad *">
            <input type="number" value={cantidad} onChange={e => setCantidad(e.target.value)} placeholder={`Máx: ${stockActual}`} style={inp} />
          </Field>
          {/* Sucursal o responsable */}
          {tipo === 'salida_sucursal' ? (
            <Field label="Sucursal *">
              <select value={sucursal} onChange={e => setSucursal(e.target.value)} style={inp}>
                <option value="">Seleccionar...</option>
                {SUCURSALES.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
          ) : (
            <Field label="Responsable">
              <input value={responsable} onChange={e => setResponsable(e.target.value)} placeholder="Ej: Isaac, Carmen..." style={inp} />
            </Field>
          )}
          <Field label="Observación (opcional)">
            <input value={observacion} onChange={e => setObservacion(e.target.value)} placeholder="Opcional" style={inp} />
          </Field>
          {/* Resumen */}
          {cantidad && (
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6b7280' }}>Stock después de salida</span>
              <span style={{ fontWeight: 700, fontSize: 14, color: stockActual - parseFloat(cantidad || 0) < 0 ? '#dc2626' : '#16a34a' }}>
                {Math.max(0, stockActual - parseFloat(cantidad || 0))} {row.productos?.unidad}
              </span>
            </div>
          )}
          {err && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>⚠️ {err}</p>}
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={guardar} disabled={saving} style={{ flex: 1, background: saving ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer' }}>
              {saving ? 'Guardando...' : '✓ Confirmar salida'}
            </button>
            <button onClick={onClose} style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '13px 16px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── HISTORIAL DE PRODUCTO ──────────────────────────────────
function HistorialProducto({ tok, row, tabla, onVolver }) {
  const [movimientos, setMovimientos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.get('inventario_movimientos', `producto_id=eq.${row.producto_id}&tabla_origen=eq.${tabla}&order=created_at.desc&limit=50`, tok)
      .then(d => { setMovimientos(Array.isArray(d) ? d : []); setLoading(false); });
  }, [row.producto_id, tok, tabla]);

  const tipoLabel = (t) => ({
    'entrada': { label: 'Entrada', color: '#15803d', bg: '#f0fdf4' },
    'salida_produccion': { label: 'Uso en producción', color: '#1d4ed8', bg: '#eff6ff' },
    'salida_sucursal': { label: 'Salida a sucursal', color: '#7c3aed', bg: '#faf5ff' },
    'salida_consumo': { label: 'Consumo interno', color: '#c2410c', bg: '#fff7ed' },
    'ajuste': { label: 'Ajuste manual', color: '#a16207', bg: '#fefce8' },
  }[t] || { label: t, color: '#6b7280', bg: '#f9fafb' });

  const stock = parseFloat(row.stock_actual || 0);
  const unidad = row.productos?.unidad || '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button onClick={onVolver} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>← Volver</button>
        <div>
          <p style={{ fontWeight: 800, fontSize: 16, color: '#111827', margin: 0, textTransform: 'uppercase' }}>{row.productos?.nombre}</p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>Stock actual: <strong style={{ color: stock === 0 ? '#dc2626' : '#15803d' }}>{stock} {unidad}</strong></p>
        </div>
      </div>

      {loading ? <p style={{ textAlign: 'center', padding: 30, color: '#9ca3af' }}>Cargando historial...</p> :
        movimientos.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 30, textAlign: 'center' }}>
            <p style={{ color: '#9ca3af', margin: 0 }}>Sin movimientos registrados aún</p>
            <p style={{ color: '#d1d5db', fontSize: 12, margin: '6px 0 0' }}>Los movimientos se generan automáticamente al registrar salidas o usar en producción</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {movimientos.map((m, i) => {
              const { label, color, bg } = tipoLabel(m.tipo);
              const esSalida = m.tipo.startsWith('salida');
              return (
                <div key={m.id} style={{ padding: '12px 16px', borderBottom: i < movimientos.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                      <span style={{ background: bg, color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{label}</span>
                      {m.referencia && <span style={{ fontSize: 12, color: '#374151', fontWeight: 600 }}>{m.referencia}</span>}
                    </div>
                    <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
                      {fdt(m.created_at)}
                      {m.responsable ? ` · ${m.responsable}` : ''}
                      {m.observacion ? ` · ${m.observacion}` : ''}
                    </p>
                    {m.stock_anterior != null && m.stock_nuevo != null && (
                      <p style={{ fontSize: 12, color: '#6b7280', margin: '3px 0 0' }}>
                        {m.stock_anterior} {unidad} → {m.stock_nuevo} {unidad}
                      </p>
                    )}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: 16, color: esSalida ? '#dc2626' : '#15803d', whiteSpace: 'nowrap' }}>
                    {esSalida ? '−' : '+'}{m.cantidad} {unidad}
                  </span>
                </div>
              );
            })}
          </div>
        )
      }
    </div>
  );
}

// ── NUEVA HOJITA ───────────────────────────────────────────
function NuevaHojita({ tok, onGuardado }) {
  const [prods, setProds] = useState([]);
  const [frescos, setFrescos] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [general, setGeneral] = useState({ fecha: new Date().toISOString().split('T')[0], producto_id: '', gramaje: '', tamano: 'grande', congelador_nro: '', numero_hojita: '' });
  const [materia, setMateria] = useState(Array(6).fill(null).map(() => ({ nombre: '', fecha_mp: '', peso_bruto: '', peso_neto: '', sobra_neto: '', producto_id: '', _sugerencias: [], _mostrarSug: false })));
  const [paquetes, setPaquetes] = useState('');
  const [operadores, setOperadores] = useState(Array(3).fill(null).map(() => ({ nombre: '', inicio: '', fin: '' })));
  const [indirectos, setIndirectos] = useState({ bolsa_vacio: '', bolsa_basura: '', guantes: '', vasos: '', costo_bolsa_vacio: 500, costo_bolsa_basura: 300, costo_guante: 2000, costo_vaso: 200 });
  const [tareas, setTareas] = useState(Array(3).fill(null).map(() => ({ inicio: '', fin: '', descripcion: '' })));
  const [firmas, setFirmas] = useState({ nombres_operadores: '', jefe_prod: 'Isaac', firma_almacen: '' });
  const [preciosMP, setPreciosMP] = useState({}); // producto_id -> precio_por_kg

  useEffect(() => {
    db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : []));
    db.get('sucursal_inventario', 'select=*,productos(nombre,unidad)&order=productos(nombre)', tok).then(d => setFrescos(Array.isArray(d) ? d : []));
    // Cargar últimos precios de compra por producto (precio_unitario en Gs. por unidad declarada)
    db.get('compras_detalle', 'select=producto_id,precio_unitario,unidad,compras(fecha)&order=compras(fecha).desc', tok).then(d => {
      if (!Array.isArray(d)) return;
      const map = {};
      d.forEach(r => {
        if (!map[r.producto_id] && r.precio_unitario > 0) {
          // Normalizar a Gs. por kg
          let precioKg = parseFloat(r.precio_unitario);
          if (r.unidad === 'g') precioKg = precioKg * 1000;
          else if (r.unidad === 'kg') precioKg = precioKg;
          else precioKg = precioKg; // unidad o paquete: precio por unidad
          map[r.producto_id] = { precioKg, unidad: r.unidad, precioUnit: parseFloat(r.precio_unitario) };
        }
      });
      setPreciosMP(map);
    });
  }, [tok]);

  const updM = (i, k, v) => { const n = [...materia]; n[i][k] = v; setMateria(n); };

  const buscarFresco = (i, texto) => {
    const n = [...materia];
    n[i].nombre = texto;
    n[i].producto_id = '';
    n[i]._sugerencias = frescos.filter(f => f.productos?.nombre?.toLowerCase().includes(texto.toLowerCase())).slice(0, 5);
    n[i]._mostrarSug = texto.length > 0 && n[i]._sugerencias.length > 0;
    setMateria(n);
  };

  const elegirFresco = (i, fresco) => {
    const n = [...materia];
    n[i].nombre = fresco.productos?.nombre;
    n[i].producto_id = fresco.producto_id;
    n[i]._sugerencias = [];
    n[i]._mostrarSug = false;
    setMateria(n);
  };

  const cerrarSug = (i) => setTimeout(() => { const n = [...materia]; if (n[i]) { n[i]._mostrarSug = false; setMateria(n); } }, 200);

  const updO = (i, k, v) => { const n = [...operadores]; n[i][k] = v; setOperadores(n); };
  const updT = (i, k, v) => { const n = [...tareas]; n[i][k] = v; setTareas(n); };

  const totalNeto = materia.reduce((s, m) => s + parseFloat(m.peso_neto || 0), 0);
  const totalSobra = materia.reduce((s, m) => s + parseFloat(m.sobra_neto || 0), 0);
  const horasTotales = operadores.reduce((s, op) => s + calcHoras(op.inicio, op.fin), 0);
  const costoMO = horasTotales * COSTO_HORA;
  const costoInd = (parseFloat(indirectos.bolsa_vacio || 0) * indirectos.costo_bolsa_vacio) + (parseFloat(indirectos.bolsa_basura || 0) * indirectos.costo_bolsa_basura) + (parseFloat(indirectos.guantes || 0) * indirectos.costo_guante) + (parseFloat(indirectos.vasos || 0) * indirectos.costo_vaso);
  const cantPaq = parseFloat(paquetes || 0);

  // Costo materia prima usando última compra
  const costoMP = materia.filter(m => m.producto_id && parseFloat(m.peso_neto) > 0).reduce((s, m) => {
    const precio = preciosMP[m.producto_id];
    if (!precio) return s;
    const usadoG = parseFloat(m.peso_neto) - parseFloat(m.sobra_neto || 0);
    const usadoKg = usadoG / 1000;
    return s + (usadoKg * precio.precioKg);
  }, 0);

  const costoTotal = costoMO + costoInd + costoMP;
  const costoUnit = cantPaq > 0 ? costoTotal / cantPaq : 0;
  const precioSug = costoUnit / (1 - MARGEN);
  const tienePreciosMP = materia.filter(m => m.producto_id).some(m => preciosMP[m.producto_id]);

  const guardar = async () => {
    if (!general.producto_id || !paquetes) { setErr('Completá el producto y la cantidad de paquetes'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        fecha: general.fecha,
        responsable: firmas.nombres_operadores || operadores.filter(o => o.nombre).map(o => o.nombre).join(', '),
        hora_inicio: operadores[0]?.inicio || null,
        hora_fin: operadores[0]?.fin || null,
        observacion: JSON.stringify({ general, materia: materia.filter(m => m.nombre), operadores: operadores.filter(o => o.nombre), indirectos, tareas: tareas.filter(t => t.descripcion), firmas, calculos: { horasTotales, costoMO, costoInd, costoMP, costoTotal, costoUnit, precioSug } }),
        estado: 'cerrado',
      };
      const res = await db.post('produccion_lotes', payload, tok);
      const lote = Array.isArray(res) ? res[0] : res;
      if (lote?.id) {
        await db.post('produccion_detalle', [{ lote_id: lote.id, producto_id: general.producto_id, cantidad_producida: cantPaq, peso_paquete: parseFloat(general.gramaje || 0) / 1000, unidad: 'paquete', costo_estimado: costoUnit }], tok);

        // ── DESCONTAR FRESCOS AUTOMÁTICAMENTE ──────────────
        const materialesConId = materia.filter(m => m.nombre && m.producto_id && parseFloat(m.peso_neto) > 0);
        for (const mat of materialesConId) {
          const fresco = frescos.find(f => f.producto_id === mat.producto_id);
          if (fresco) {
            const usado = parseFloat(mat.peso_neto) - parseFloat(mat.sobra_neto || 0);
            const usadoKg = usado / 1000;
            const stockAnterior = parseFloat(fresco.stock_actual || 0);
            const stockNuevo = Math.max(0, stockAnterior - usadoKg);
            await db.patch('sucursal_inventario', `id=eq.${fresco.id}`, { stock_actual: stockNuevo, ultima_actualizacion: new Date().toISOString() }, tok);
            await registrarMovimiento(tok, { producto_id: mat.producto_id, tabla_origen: 'sucursal_inventario', tipo: 'salida_produccion', cantidad: usadoKg, stock_anterior: stockAnterior, stock_nuevo: stockNuevo, referencia: `Hojita #${general.numero_hojita || lote.id.slice(-6)}`, responsable: firmas.nombres_operadores || operadores.filter(o => o.nombre).map(o => o.nombre).join(', ') || 'Producción', lote_id: lote.id });
          }
        }
        onGuardado();
      } else setErr('Error al guardar. Intentá de nuevo.');
    } catch (e) { setErr('Error al guardar: ' + e.message); }
    setSaving(false);
  };

  const sec = { padding: 16, display: 'flex', flexDirection: 'column', gap: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 40 }}>
      <Card>
        <CardHead title="📋 Planilla de Producción" sub="Purafruta — completá todos los campos" />
        <div style={sec}>
          <Row2>
            <Inp label="N° de hojita" value={general.numero_hojita} onChange={e => setGeneral({ ...general, numero_hojita: e.target.value })} placeholder="Ej: 5542" />
            <Inp label="Fecha" type="date" value={general.fecha} onChange={e => setGeneral({ ...general, fecha: e.target.value })} />
          </Row2>
          <Sel label="Producto *" value={general.producto_id} onChange={e => setGeneral({ ...general, producto_id: e.target.value })}>
            <option value="">Seleccionar producto...</option>
            {prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </Sel>
          <Row2>
            <Inp label="Gramaje (g)" type="number" value={general.gramaje} onChange={e => setGeneral({ ...general, gramaje: e.target.value })} placeholder="Ej: 300" />
            <Sel label="Tamaño" value={general.tamano} onChange={e => setGeneral({ ...general, tamano: e.target.value })}><option value="chico">Chico</option><option value="grande">Grande</option></Sel>
            <Inp label="Congelador N°" value={general.congelador_nro} onChange={e => setGeneral({ ...general, congelador_nro: e.target.value })} placeholder="Ej: 1" />
          </Row2>
        </div>
      </Card>

      <Card>
        <CardHead title="🍓 Materia Prima" sub="Buscá en frescos o escribí el nombre · Pesos en gramos" />
        <div style={sec}>
          {materia.map((m, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Ingrediente {i + 1}</div>
              <div style={{ position: 'relative' }}>
                <Field label="Nombre / Buscar en frescos">
                  <input value={m.nombre} onChange={e => buscarFresco(i, e.target.value)} onBlur={() => cerrarSug(i)} placeholder="Ej: Naranja, Piña..." style={inp} />
                </Field>
                {m._mostrarSug && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #16a34a', borderRadius: 10, zIndex: 50, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: 180, overflowY: 'auto' }}>
                    {m._sugerencias.map(f => (
                      <div key={f.id} onMouseDown={() => elegirFresco(i, f)} style={{ padding: '10px 14px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ textTransform: 'uppercase' }}>{f.productos?.nombre}</span>
                        <span style={{ color: '#16a34a', fontWeight: 700 }}>{f.stock_actual} {f.productos?.unidad}</span>
                      </div>
                    ))}
                  </div>
                )}
                {m.producto_id && <p style={{ fontSize: 11, color: '#16a34a', fontWeight: 600, margin: '3px 0 0' }}>✓ Vinculado a frescos — stock se descontará al guardar</p>}
              </div>
              <Inp label="Fecha M.P." type="date" value={m.fecha_mp} onChange={e => updM(i, 'fecha_mp', e.target.value)} />
              <Row2>
                <Inp label="Peso Bruto (g)" type="number" value={m.peso_bruto} onChange={e => updM(i, 'peso_bruto', e.target.value)} placeholder="0" />
                <Inp label="Peso Neto (g)" type="number" value={m.peso_neto} onChange={e => updM(i, 'peso_neto', e.target.value)} placeholder="0" />
                <Inp label="Sobra Neto (g)" type="number" value={m.sobra_neto} onChange={e => updM(i, 'sobra_neto', e.target.value)} placeholder="0" />
              </Row2>
            </div>
          ))}
          {(totalNeto > 0 || totalSobra > 0) && (
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div><p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 2px', fontWeight: 600 }}>TOTAL NETO</p><p style={{ fontSize: 16, fontWeight: 700, color: '#15803d', margin: 0 }}>{totalNeto.toLocaleString()} g</p></div>
              <div><p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 2px', fontWeight: 600 }}>TOTAL SOBRA</p><p style={{ fontSize: 16, fontWeight: 700, color: '#dc2626', margin: 0 }}>{totalSobra.toLocaleString()} g</p></div>
              <div><p style={{ fontSize: 11, color: '#6b7280', margin: '0 0 2px', fontWeight: 600 }}>NETO USADO</p><p style={{ fontSize: 16, fontWeight: 700, color: '#1d4ed8', margin: 0 }}>{(totalNeto - totalSobra).toLocaleString()} g</p></div>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHead title="📦 Cantidad Producida" />
        <div style={sec}>
          <Inp label="Paquetes producidos *" type="number" value={paquetes} onChange={e => setPaquetes(e.target.value)} placeholder="Ej: 57" style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#15803d', padding: '16px' }} />
        </div>
      </Card>

      <Card>
        <CardHead title="⏱ Hora de Trabajo" sub="Ingresá cada operador y su horario" />
        <div style={sec}>
          {operadores.map((op, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Operador {i + 1}</div>
              <Inp label="Nombre" value={op.nombre} onChange={e => updO(i, 'nombre', e.target.value)} placeholder="Nombre del operador" />
              <Row2>
                <Inp label="Hora inicio" type="time" value={op.inicio} onChange={e => updO(i, 'inicio', e.target.value)} />
                <Inp label="Hora fin" type="time" value={op.fin} onChange={e => updO(i, 'fin', e.target.value)} />
              </Row2>
              {op.inicio && op.fin && calcHoras(op.inicio, op.fin) > 0 && (
                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                  {calcHoras(op.inicio, op.fin).toFixed(1)}h → {gs(calcHoras(op.inicio, op.fin) * COSTO_HORA)}
                </div>
              )}
            </div>
          ))}
          {horasTotales > 0 && (
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#15803d', margin: 0 }}>Total mano de obra: {horasTotales.toFixed(1)}h → {gs(costoMO)}</p>
            </div>
          )}
        </div>
      </Card>

      <Card>
        <CardHead title="🧤 Materiales Indirectos" sub="Cantidades usadas en esta producción" />
        <div style={sec}>
          {[{ key: 'bolsa_vacio', label: '🛍 Bolsa al vacío', costoKey: 'costo_bolsa_vacio' }, { key: 'bolsa_basura', label: '🗑 Bolsa de basura', costoKey: 'costo_bolsa_basura' }, { key: 'guantes', label: '🧤 Guantes (pares)', costoKey: 'costo_guante' }, { key: 'vasos', label: '🥤 Vasos', costoKey: 'costo_vaso' }].map(({ key, label, costoKey }) => (
            <div key={key} style={{ background: '#f9fafb', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{label}</div>
              <Row2>
                <Inp label="Cantidad" type="number" value={indirectos[key]} onChange={e => setIndirectos({ ...indirectos, [key]: e.target.value })} placeholder="0" />
                <Inp label="Costo unitario (Gs.)" type="number" value={indirectos[costoKey]} onChange={e => setIndirectos({ ...indirectos, [costoKey]: parseFloat(e.target.value) || 0 })} />
              </Row2>
              {indirectos[key] > 0 && <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>Subtotal: {gs(parseFloat(indirectos[key]) * indirectos[costoKey])}</div>}
            </div>
          ))}
          {costoInd > 0 && <div style={{ background: '#faf5ff', borderRadius: 10, padding: 12 }}><p style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', margin: 0 }}>Total indirectos: {gs(costoInd)}</p></div>}
        </div>
      </Card>

      <Card>
        <CardHead title="📝 Otras Tareas" sub="Tareas adicionales de la jornada" />
        <div style={sec}>
          {tareas.map((t, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Tarea {i + 1}</div>
              <Inp label="Descripción" value={t.descripcion} onChange={e => updT(i, 'descripcion', e.target.value)} placeholder="Ej: Limpieza del área" />
              <Row2>
                <Inp label="Hora inicio" type="time" value={t.inicio} onChange={e => updT(i, 'inicio', e.target.value)} />
                <Inp label="Hora fin" type="time" value={t.fin} onChange={e => updT(i, 'fin', e.target.value)} />
              </Row2>
            </div>
          ))}
        </div>
      </Card>

      <Card style={{ border: '2px solid #16a34a' }}>
        <CardHead title="💰 Resumen de Costos" sub="Calculado automáticamente · 13.000 Gs/hora · Margen 55%" />
        <div style={sec}>
          {costoMP === 0 && materia.some(m => m.producto_id) && !tienePreciosMP && (
            <div style={{ background: '#fefce8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#a16207', fontWeight: 600 }}>
              ⚠️ Sin precio de compra para los ingredientes — registrá las compras para incluir el costo de MP en el cálculo
            </div>
          )}
          {[
            ['Materia prima', costoMP > 0 ? gs(costoMP) : 'Sin precio registrado', '#f0fdf4', costoMP > 0 ? '#15803d' : '#9ca3af'],
            ['Mano de obra', gs(costoMO), '#eff6ff', '#1d4ed8'],
            ['Materiales indirectos', gs(costoInd), '#faf5ff', '#7c3aed'],
            ['Costo total del lote', gs(costoTotal), '#fefce8', '#a16207'],
            ['Costo unitario x paquete', gs(costoUnit), '#fff7ed', '#c2410c'],
            ['Precio sugerido (55% margen)', gs(precioSug), '#f0fdf4', '#15803d']
          ].map(([label, val, bg, fg]) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, color: fg, margin: 0, fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: fg, margin: 0 }}>{val}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="✍️ Firmas y Responsables" />
        <div style={sec}>
          <Inp label="Nombres de operadores" value={firmas.nombres_operadores} onChange={e => setFirmas({ ...firmas, nombres_operadores: e.target.value })} placeholder="Ej: Caroliliz, Graciela, Andresa" />
          <Row2>
            <Inp label="Jefe de Producción" value={firmas.jefe_prod} onChange={e => setFirmas({ ...firmas, jefe_prod: e.target.value })} placeholder="Isaac" />
            <Inp label="Almacén" value={firmas.firma_almacen} onChange={e => setFirmas({ ...firmas, firma_almacen: e.target.value })} placeholder="Carmen" />
          </Row2>
        </div>
      </Card>

      {err && <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, color: '#dc2626', fontSize: 14 }}>⚠️ {err}</div>}
      <Btn onClick={guardar} disabled={saving} full>{saving ? 'Guardando...' : '✓ Cerrar y guardar hojita'}</Btn>
    </div>
  );
}

// ── HISTORIAL ──────────────────────────────────────────────
function Historial({ tok }) {
  const [lotes, setLotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detalle, setDetalle] = useState(null);

  useEffect(() => {
    db.get('produccion_lotes', 'order=created_at.desc&limit=50&select=*,produccion_detalle(*,productos(nombre))', tok)
      .then(d => { setLotes(Array.isArray(d) ? d : []); setLoading(false); });
  }, [tok]);

  if (detalle) return <DetalleHojita lote={detalle} onVolver={() => setDetalle(null)} />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
        lotes.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No hay hojitas registradas aún</p> :
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
          {lotes.map((l, i) => {
            let calc = {};
            try { calc = JSON.parse(l.observacion || '{}')?.calculos || {}; } catch {}
            const det = l.produccion_detalle?.[0];
            return (
              <div key={l.id} style={{ padding: '12px 16px', borderBottom: i < lotes.length - 1 ? '1px solid #f3f4f6' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 2px', textTransform: 'uppercase' }}>{det?.productos?.nombre || '—'}</p>
                  <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>{fd(l.fecha)} · {det?.cantidad_producida || 0} paquetes</p>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                    {calc.costoUnit > 0 && <span style={{ background: '#fff7ed', color: '#c2410c', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>Costo: {gs(calc.costoUnit)}</span>}
                    {calc.precioSug > 0 && <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>P. sug.: {gs(calc.precioSug)}</span>}
                  </div>
                </div>
                <button onClick={() => setDetalle(l)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>Ver</button>
              </div>
            );
          })}
        </div>
      }
    </div>
  );
}

// ── DETALLE HOJITA ─────────────────────────────────────────
function DetalleHojita({ lote, onVolver }) {
  let data = {};
  try { data = JSON.parse(lote.observacion || '{}'); } catch {}
  const { general = {}, materia = [], operadores = [], indirectos = {}, tareas = [], firmas = {}, calculos = {} } = data;
  const det = lote.produccion_detalle?.[0];
  const sec = { padding: 16, display: 'flex', flexDirection: 'column', gap: 10 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 40 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={onVolver} style={{ background: '#f3f4f6', border: 'none', borderRadius: 10, padding: '10px 16px', fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>← Volver</button>
        <div>
          <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>Hojita #{general.numero_hojita || '—'}</p>
          <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{fd(lote.fecha)}</p>
        </div>
      </div>
      <Card style={{ border: '2px solid #16a34a' }}>
        <CardHead title="💰 Resumen de costos" />
        <div style={sec}>
          {[
            ['Paquetes', `${det?.cantidad_producida || 0} paq.`, '#f9fafb', '#374151'],
            ['Materia prima', calculos.costoMP > 0 ? gs(calculos.costoMP) : '—', '#f0fdf4', '#15803d'],
            ['Mano de obra', gs(calculos.costoMO), '#eff6ff', '#1d4ed8'],
            ['Indirectos', gs(calculos.costoInd), '#faf5ff', '#7c3aed'],
            ['Costo total', gs(calculos.costoTotal), '#fefce8', '#a16207'],
            ['Costo unit.', gs(calculos.costoUnit), '#fff7ed', '#c2410c'],
            ['P. sugerido', gs(calculos.precioSug), '#f0fdf4', '#15803d']
          ].map(([l, v, bg, fg]) => (
            <div key={l} style={{ background: bg, borderRadius: 10, padding: '12px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: fg, fontWeight: 500 }}>{l}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: fg }}>{v}</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHead title="🍓 Materia prima" />
        <div style={sec}>
          {materia.filter(m => m.nombre).map((m, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: 12 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: '0 0 8px' }}>{m.nombre}</p>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 13 }}>
                <span style={{ color: '#6b7280' }}>Bruto: <strong>{parseInt(m.peso_bruto || 0).toLocaleString()} g</strong></span>
                <span style={{ color: '#15803d' }}>Neto: <strong>{parseInt(m.peso_neto || 0).toLocaleString()} g</strong></span>
                <span style={{ color: '#dc2626' }}>Sobra: <strong>{parseInt(m.sobra_neto || 0).toLocaleString()} g</strong></span>
              </div>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHead title="⏱ Operadores" />
        <div style={sec}>
          {operadores.filter(o => o.nombre).map((op, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 10, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{op.nombre}</span>
              <span style={{ fontSize: 13, color: '#6b7280' }}>{op.inicio} — {op.fin} ({calcHoras(op.inicio, op.fin).toFixed(1)}h)</span>
            </div>
          ))}
        </div>
      </Card>
      <Card>
        <CardHead title="✍️ Firmas" />
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[['Operadores', firmas.nombres_operadores], ['Jefe de Prod.', firmas.jefe_prod], ['Almacén', firmas.firma_almacen]].map(([l, v]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
              <span style={{ color: '#6b7280' }}>{l}</span>
              <span style={{ fontWeight: 600, color: '#111827' }}>{v || '—'}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
