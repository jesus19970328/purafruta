import { useState, useEffect } from "react";

const SB_URL = 'https://iepqhmxgdyuthcsmxadb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHFobXhnZHl1dGhjc214YWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODM1MjcsImV4cCI6MjA5NDk1OTUyN30.WWUs3xNpaMAYcvp2TAVuqQdCHGCsKIV0fdDF3Y45sLE';
const hdr = (tok) => ({ 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${tok || SB_KEY}`, 'Prefer': 'return=representation' });
const db = {
  get: (t, q, tok) => fetch(`${SB_URL}/rest/v1/${t}${q ? '?' + q : ''}`, { headers: { ...hdr(tok), 'Accept': 'application/json' } }).then(r => r.json()),
  post: (t, d, tok) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  patch: (t, f, d, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
};

const gs = (n) => n ? new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n) + ' Gs.' : '—';
const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };
const Card = ({ children, style }) => <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', ...style }}>{children}</div>;
const CardHead = ({ title, sub, action }) => <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div><h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{title}</h3>{sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{sub}</p>}</div>{action}</div>;
const Btn = ({ onClick, children, variant = 'primary', disabled, full }) => { const s = { primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' }, secondary: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' }, ghost: { background: '#f0fdf4', color: '#15803d' }, danger: { background: '#fef2f2', color: '#dc2626' } }; return <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', width: full ? '100%' : 'auto', ...s[variant] }}>{children}</button>; };
const Badge = ({ children, color = 'gray' }) => { const c = { green: { bg: '#f0fdf4', text: '#15803d' }, yellow: { bg: '#fefce8', text: '#a16207' }, red: { bg: '#fef2f2', text: '#dc2626' }, blue: { bg: '#eff6ff', text: '#1d4ed8' }, orange: { bg: '#fff7ed', text: '#c2410c' }, gray: { bg: '#f9fafb', text: '#6b7280' } }; return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: c[color]?.bg, color: c[color]?.text }}>{children}</span>; };
const Sel = ({ label, children, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}<select {...p} style={{ ...inp, ...(p.style || {}) }}>{children}</select></div>;
const Inp = ({ label, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>{label && <label style={{ fontSize: 12, fontWeight: 600, color: '#374151' }}>{label}</label>}<input {...p} style={{ ...inp, ...(p.style || {}) }} /></div>;

const LOCALES = ['FABRICA', 'CANTINA 1', 'CANTINA 2', 'P. GUASU', 'COSTANERA', 'CAMION - FABRICA'];
const TIPOS = ['LICUADORAS', 'CONGELADORES', 'AIRES', 'VISICOOLER', 'COMPUTADORAS', 'IMPRESORA', 'EXTINTORES', 'MIXTERA', 'MOVIL', 'HORNO', 'MICROONDAS', 'PLACA ELECTRICA', 'BEBEDERO', 'HERVIDOR', 'VENTILADOR', 'BALANZA', 'DETECTOR BILLETES', 'EXPRIMIDOR', 'ETIQUETADORA', 'CAMARA', 'OTROS'];
const ESTADOS = { activo: { label: 'Activo', color: 'green' }, investigar: { label: 'Investigar', color: 'yellow' }, en_reparacion: { label: 'En reparación', color: 'orange' }, baja: { label: 'Baja', color: 'red' } };

const localMap = {
  'FABRICA': 'Fábrica', 'CAMION - FABRICA': 'Fábrica',
  'CANTINA 1': 'Cantina Ñu Guasú 1', 'CANTINA 2': 'Cantina Ñu Guasú 2',
  'P. GUASU': 'Parque Guasú', 'COSTANERA': 'Costanera'
};

export default function ActivosModule({ tok, perfil }) {
  const [activos, setActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroLocal, setFiltroLocal] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [show, setShow] = useState(false);
  const [editando, setEditando] = useState(null);
  const [form, setForm] = useState({ item_nro: '', tipo: '', local_actual: '', codigo: '', equipo: '', importe: '', marca: '', modelo: '', color: '', detalle: '', nota: '', estado: 'activo' });
  const [saving, setSaving] = useState(false);
  const isAdmin = perfil?.rol === 'admin';

  const load = () => {
    db.get('activos_fijos', 'order=tipo,local_actual,item_nro', tok)
      .then(d => { setActivos(Array.isArray(d) ? d : []); setLoading(false); });
  };
  useEffect(() => { load(); }, [tok]);

  // Si es sucursal, filtrar por su local
  const localSucursal = !isAdmin ? (() => {
    const n = perfil?.nombre || '';
    if (n.includes('Cantina Ñu Guasú 1') || n === 'Cantina Ñu Guasú 1') return 'CANTINA 1';
    if (n.includes('Cantina Ñu Guasú 2') || n === 'Cantina Ñu Guasú 2') return 'CANTINA 2';
    if (n.includes('Parque') || n === 'Parque Guasú') return 'P. GUASU';
    if (n.includes('Costanera')) return 'COSTANERA';
    if (n.includes('Producción') || n.includes('Almacén') || n.includes('Costeo')) return 'FABRICA';
    return '';
  })() : '';

  const filtrados = activos.filter(a => {
    if (localSucursal && a.local_actual !== localSucursal && !(localSucursal === 'FABRICA' && a.local_actual === 'CAMION - FABRICA')) return false;
    if (filtroLocal && a.local_actual !== filtroLocal) return false;
    if (filtroTipo && a.tipo !== filtroTipo) return false;
    if (filtroEstado && a.estado !== filtroEstado) return false;
    if (busqueda && !`${a.equipo} ${a.codigo} ${a.marca} ${a.modelo} ${a.detalle}`.toLowerCase().includes(busqueda.toLowerCase())) return false;
    return true;
  });

  const totalValor = filtrados.reduce((s, a) => s + parseFloat(a.importe || 0), 0);
  const showMonto = perfil?.rol === 'admin' || perfil?.rol === 'director';

  const guardar = async () => {
    if (!form.equipo || !form.local_actual) return;
    setSaving(true);
    if (editando) await db.patch('activos_fijos', `id=eq.${editando}`, form, tok);
    else await db.post('activos_fijos', { ...form, importe: parseFloat(form.importe || 0) }, tok);
    setForm({ item_nro: '', tipo: '', local_actual: '', codigo: '', equipo: '', importe: '', marca: '', modelo: '', color: '', detalle: '', nota: '', estado: 'activo' });
    setShow(false); setEditando(null); setSaving(false); load();
  };

  const editar = (a) => { setForm(a); setEditando(a.id); setShow(true); };

  // Agrupar por tipo para estadísticas
  const porTipo = activos.reduce((acc, a) => { acc[a.tipo] = (acc[a.tipo] || 0) + 1; return acc; }, {});
  const porEstado = activos.reduce((acc, a) => { acc[a.estado] = (acc[a.estado] || 0) + 1; return acc; }, {});

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
        <div style={{ background: '#f0fdf4', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ fontSize: 11, color: '#15803d', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>Total activos</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#15803d', margin: 0 }}>{filtrados.length}</p>
        </div>
        {showMonto && <div style={{ background: '#eff6ff', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ fontSize: 11, color: '#1d4ed8', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>Valor total</p>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#1d4ed8', margin: 0 }}>{gs(totalValor)}</p>
        </div>}
        {isAdmin && <div style={{ background: '#fefce8', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ fontSize: 11, color: '#a16207', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>A investigar</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#a16207', margin: 0 }}>{porEstado['investigar'] || 0}</p>
        </div>}
        {isAdmin && <div style={{ background: '#fff7ed', borderRadius: 12, padding: '12px 16px' }}>
          <p style={{ fontSize: 11, color: '#c2410c', margin: '0 0 2px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>En reparacion</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: '#c2410c', margin: 0 }}>{porEstado['en_reparacion'] || 0}</p>
        </div>}
      </div>

      {/* Filtros */}
      <Card>
        <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="🔍 Buscar por equipo, código, marca..." style={{ ...inp }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
            {isAdmin && <Sel label="" value={filtroLocal} onChange={e => setFiltroLocal(e.target.value)}>
              <option value="">Todos los locales</option>
              {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
            </Sel>}
            <Sel label="" value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </Sel>
            <Sel label="" value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}>
              <option value="">Todos los estados</option>
              {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Sel>
          </div>
        </div>
      </Card>

      {/* Formulario nuevo/editar — solo admin */}
      {isAdmin && (
        <Card>
          <CardHead title={editando ? 'Editar activo' : 'Registrar nuevo activo'} action={<Btn variant="ghost" onClick={() => { setShow(!show); setEditando(null); setForm({ item_nro: '', tipo: '', local_actual: '', codigo: '', equipo: '', importe: '', marca: '', modelo: '', color: '', detalle: '', nota: '', estado: 'activo' }); }}>
            {show ? 'Cancelar' : '+ Nuevo'}
          </Btn>} />
          {show && (
            <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                <Inp label="N° Item" value={form.item_nro} onChange={e => setForm({ ...form, item_nro: e.target.value })} placeholder="Ej: 1" />
                <Sel label="Tipo *" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
                </Sel>
                <Sel label="Local *" value={form.local_actual} onChange={e => setForm({ ...form, local_actual: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {LOCALES.map(l => <option key={l} value={l}>{l}</option>)}
                </Sel>
                <Inp label="Código" value={form.codigo} onChange={e => setForm({ ...form, codigo: e.target.value })} placeholder="Ej: CONG 1 - PF" />
                <Inp label="Equipo *" value={form.equipo} onChange={e => setForm({ ...form, equipo: e.target.value })} placeholder="Nombre del equipo" />
                <Inp label="Importe (Gs.)" type="number" value={form.importe} onChange={e => setForm({ ...form, importe: e.target.value })} placeholder="0" />
                <Inp label="Marca" value={form.marca} onChange={e => setForm({ ...form, marca: e.target.value })} placeholder="Marca" />
                <Inp label="Modelo" value={form.modelo} onChange={e => setForm({ ...form, modelo: e.target.value })} placeholder="Modelo" />
                <Inp label="Color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} placeholder="Color" />
                <Sel label="Estado" value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
                  {Object.entries(ESTADOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Sel>
              </div>
              <Inp label="Detalle / Observación" value={form.detalle} onChange={e => setForm({ ...form, detalle: e.target.value })} placeholder="Descripción adicional" />
              <Inp label="Nota" value={form.nota} onChange={e => setForm({ ...form, nota: e.target.value })} placeholder="Nota interna" />
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn onClick={guardar} disabled={saving || !form.equipo || !form.local_actual}>{saving ? 'Guardando...' : editando ? 'Actualizar' : 'Guardar'}</Btn>
                <Btn variant="secondary" onClick={() => { setShow(false); setEditando(null); }}>Cancelar</Btn>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Lista de activos */}
      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando activos...</p> :
        filtrados.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No se encontraron activos con ese filtro</p> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtrados.map(a => (
              <div key={a.id} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: '10px 14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>{a.equipo}</span>
                      {a.codigo && <span style={{ fontSize: 11, color: '#9ca3af', background: '#f3f4f6', padding: '2px 7px', borderRadius: 5 }}>{a.codigo}</span>}
                      <Badge color={ESTADOS[a.estado]?.color || 'gray'}>{ESTADOS[a.estado]?.label || a.estado}</Badge>
                    </div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 12, color: '#6b7280' }}>
                      <span>{a.local_actual}</span>
                      {a.marca && <span>{a.marca}</span>}
                      {a.modelo && <span>{a.modelo}</span>}
                      {a.color && <span>{a.color}</span>}
                      {showMonto && a.importe > 0 && <span style={{ color: '#15803d', fontWeight: 600 }}>{gs(a.importe)}</span>}
                    </div>
                    {(a.detalle || a.nota) && (
                      <p style={{ fontSize: 11, color: a.nota ? '#c2410c' : '#9ca3af', margin: '4px 0 0' }}>{a.nota || a.detalle}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <button onClick={() => editar(a)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 8, padding: '5px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500, flexShrink: 0 }}>Editar</button>
                  )}
                </div>
              </div>
            ))}
          </div>
      }
    </div>
  );
}
