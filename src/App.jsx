import { useState, useEffect } from "react";
import ProduccionModuleNew from "./ProduccionModule";
import { ShoppingCart, Package, Factory, Store, Truck, DollarSign, BarChart3, LogOut, Menu, X, Plus, Trash2, Check, AlertCircle, Search, Home, ChevronDown } from "lucide-react";

const SB_URL = 'https://iepqhmxgdyuthcsmxadb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHFobXhnZHl1dGhjc214YWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODM1MjcsImV4cCI6MjA5NDk1OTUyN30.WWUs3xNpaMAYcvp2TAVuqQdCHGCsKIV0fdDF3Y45sLE';

const hdr = (tok) => ({ 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${tok || SB_KEY}`, 'Prefer': 'return=representation' });

const db = {
  get: (t, q, tok) => fetch(`${SB_URL}/rest/v1/${t}${q ? '?' + q : ''}`, { headers: { ...hdr(tok), 'Accept': 'application/json' } }).then(r => r.json()),
  post: (t, d, tok) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  patch: (t, f, d, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'PATCH', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
  del: (t, f, tok) => fetch(`${SB_URL}/rest/v1/${t}?${f}`, { method: 'DELETE', headers: hdr(tok) }).then(r => r.ok),
  login: (e, p) => fetch(`${SB_URL}/auth/v1/token?grant_type=password`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY }, body: JSON.stringify({ email: e, password: p }) }).then(r => r.json()),
  logout: (tok) => fetch(`${SB_URL}/auth/v1/logout`, { method: 'POST', headers: hdr(tok) }),
};

const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
const fd = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—';

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin','director','finanzas'] },
  { id: 'compras', label: 'Compras', icon: ShoppingCart, roles: ['admin','almacen'] },
  { id: 'almacen', label: 'Almacén', icon: Package, roles: ['admin','almacen'] },
  { id: 'produccion', label: 'Producción', icon: Factory, roles: ['admin','produccion'] },
  { id: 'pdv', label: 'Punto de venta', icon: Store, roles: ['admin','sucursal'] },
  { id: 'pedidos', label: 'Pedidos', icon: Truck, roles: ['admin','almacen','sucursal','produccion'] },
  { id: 'finanzas', label: 'Finanzas', icon: DollarSign, roles: ['admin','finanzas'] },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, roles: ['admin','director','finanzas'] },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('pf_sess') || 'null');
      if (s?.access_token) { setSession(s); loadPerfil(s.access_token, s.user.id); } else setLoading(false);
    } catch { setLoading(false); }
  }, []);

  const loadPerfil = async (tok, uid) => {
    try {
      const d = await db.get('usuarios', `id=eq.${uid}`, tok);
      setPerfil(Array.isArray(d) && d[0] ? d[0] : { rol: 'admin', nombre: 'Administrador' });
    } catch { setPerfil({ rol: 'admin', nombre: 'Admin' }); }
    setLoading(false);
  };

  const onLogin = (s) => { localStorage.setItem('pf_sess', JSON.stringify(s)); setSession(s); loadPerfil(s.access_token, s.user.id); };
  const onLogout = async () => { if (session) await db.logout(session.access_token); localStorage.removeItem('pf_sess'); setSession(null); setPerfil(null); };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #16a34a', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />
        <p style={{ color: '#6b7280', fontSize: 14 }}>Cargando Purafruta...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );

  return session ? <MainApp session={session} perfil={perfil} onLogout={onLogout} /> : <LoginScreen onLogin={onLogin} />;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('');
  const [pwd, setPwd] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault(); setLoading(true); setErr('');
    const d = await db.login(email, pwd);
    setLoading(false);
    if (d.access_token) onLogin(d);
    else setErr('Email o contraseña incorrectos');
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.1)', width: '100%', maxWidth: 400, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src="/logo.png" style={{ width: 72, height: 72, borderRadius: 20, margin: "0 auto 16px", display: "block", objectFit: "cover" }} />
          <h1 style={{ fontSize: 26, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Purafruta</h1>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Sistema de gestión integral</p>
        </div>
        <form onSubmit={submit}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="tu@email.com" required
              style={{ width: '100%', border: '1.5px solid #d1fae5', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f0fdf4' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" required
              style={{ width: '100%', border: '1.5px solid #d1fae5', borderRadius: 10, padding: '10px 14px', fontSize: 14, outline: 'none', boxSizing: 'border-box', background: '#f0fdf4' }} />
          </div>
          {err && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} />{err}</p>}
          <button type="submit" disabled={loading}
            style={{ width: '100%', background: loading ? '#86efac' : 'linear-gradient(135deg,#16a34a,#22c55e)', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Ingresando...' : 'Ingresar al sistema'}
          </button>
        </form>
      </div>
    </div>
  );
}

function MainApp({ session, perfil, onLogout }) {
  const [mod, setMod] = useState('dashboard');
  const [open, setOpen] = useState(false);
  const tok = session.access_token;
  const rol = perfil?.rol || 'admin';
  const nav = NAV.filter(n => n.roles.includes(rol));

  const panels = {
    dashboard: <Dashboard tok={tok} />,
    compras: <ComprasModule tok={tok} />,
    almacen: <AlmacenModule tok={tok} />,
    produccion: <ProduccionModuleNew tok={tok} />,
    pdv: <PDVModule tok={tok} />,
    pedidos: <PedidosModule tok={tok} />,
    finanzas: <FinanzasModule tok={tok} />,
    reportes: <ReportesModule tok={tok} />,
  };

  const s = { sidebar: { width: 240, background: '#fff', borderRight: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', flexShrink: 0 }, navBtn: (active) => ({ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, border: 'none', background: active ? '#f0fdf4' : 'transparent', color: active ? '#15803d' : '#6b7280', fontWeight: active ? 600 : 400, fontSize: 14, cursor: 'pointer', width: '100%', textAlign: 'left', transition: 'all .15s' }) };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f9fafb', overflow: 'hidden' }}>
      {open && <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.3)', zIndex: 30 }} />}
      <div style={{ ...s.sidebar, position: window.innerWidth < 1024 ? 'fixed' : 'static', height: '100%', zIndex: 40, transform: open || window.innerWidth >= 1024 ? 'none' : 'translateX(-100%)', transition: 'transform .2s' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" style={{ width: 40, height: 40, borderRadius: 12, objectFit: "cover" }} />
            <div><p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>Purafruta</p><p style={{ fontSize: 12, color: '#9ca3af', margin: 0, textTransform: 'capitalize' }}>{perfil?.nombre}</p></div>
          </div>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', display: window.innerWidth >= 1024 ? 'none' : 'block' }}><X size={18} /></button>
        </div>
        <nav style={{ flex: 1, padding: 10, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(n => (
            <button key={n.id} onClick={() => { setMod(n.id); setOpen(false); }} style={s.navBtn(mod === n.id)}>
              <n.icon size={17} />{n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: 10, borderTop: '1px solid #f3f4f6' }}>
          <button onClick={onLogout} style={{ ...s.navBtn(false), color: '#ef4444' }}><LogOut size={17} />Cerrar sesión</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
        <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <button onClick={() => setOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: window.innerWidth >= 1024 ? 'none' : 'block' }}><Menu size={20} /></button>
          <h1 style={{ fontWeight: 600, fontSize: 16, color: '#111827', margin: 0 }}>{nav.find(n => n.id === mod)?.label}</h1>
        </header>
        <main style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {panels[mod]}
        </main>
      </div>
    </div>
  );
}

// ── SHARED COMPONENTS ──────────────────────────────────────
const Card = ({ children, style }) => <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', ...style }}>{children}</div>;
const CardHead = ({ title, action }) => <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><h3 style={{ fontWeight: 600, fontSize: 15, color: '#111827', margin: 0 }}>{title}</h3>{action}</div>;
const Btn = ({ onClick, children, variant = 'primary', disabled, style: sx }) => {
  const styles = { primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' }, secondary: { background: '#fff', color: '#374151', border: '1px solid #e5e7eb' }, ghost: { background: '#f0fdf4', color: '#15803d' }, danger: { background: '#fef2f2', color: '#dc2626' } };
  return <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all .15s', ...styles[variant], ...sx }}>{children}</button>;
};
const Input = ({ label, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{label && <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{label}</label>}<input {...p} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: '#fafafa', ...(p.style || {}) }} /></div>;
const Select = ({ label, children, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{label && <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{label}</label>}<select {...p} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: '#fafafa', ...(p.style || {}) }}>{children}</select></div>;
const Badge = ({ children, color = 'gray' }) => {
  const c = { green: { bg: '#f0fdf4', text: '#15803d' }, yellow: { bg: '#fefce8', text: '#a16207' }, blue: { bg: '#eff6ff', text: '#1d4ed8' }, red: { bg: '#fef2f2', text: '#dc2626' }, purple: { bg: '#faf5ff', text: '#7c3aed' }, orange: { bg: '#fff7ed', text: '#c2410c' }, gray: { bg: '#f9fafb', text: '#6b7280' } };
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: c[color]?.bg, color: c[color]?.text }}>{children}</span>;
};
const Table = ({ cols, rows, empty = 'Sin registros', loading }) => (
  <div style={{ overflowX: 'auto' }}>
    {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>Cargando...</p> : rows.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>{empty}</p> :
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead><tr style={{ borderBottom: '1px solid #f3f4f6' }}>{cols.map((c, i) => <th key={i} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .5 }}>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r, i) => <tr key={i} style={{ borderBottom: '1px solid #fafafa' }}>{r.map((c, j) => <td key={j} style={{ padding: '11px 18px', color: j === 0 ? '#111827' : '#6b7280', fontWeight: j === 0 ? 500 : 400 }}>{c}</td>)}</tr>)}</tbody>
      </table>}
  </div>
);
const Grid = ({ cols = 2, children }) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 12 }}>{children}</div>;
const Tabs = ({ tabs, active, onChange }) => <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{tabs.map(([id, label]) => <button key={id} onClick={() => onChange(id)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: active === id ? '#16a34a' : '#fff', color: active === id ? '#fff' : '#6b7280', boxShadow: active === id ? 'none' : '0 0 0 1px #e5e7eb', transition: 'all .15s' }}>{label}</button>)}</div>;

// ── DASHBOARD ──────────────────────────────────────────────
function Dashboard({ tok }) {
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([db.get('compras', 'select=id,total', tok), db.get('ventas', 'select=id,total', tok), db.get('pedidos', 'estado=eq.enviado', tok), db.get('remisiones', 'estado=eq.preparando', tok)])
      .then(([c, v, p, r]) => {
        setData({ compras: Array.isArray(c) ? c.length : 0, totalCompras: Array.isArray(c) ? c.reduce((s, x) => s + parseFloat(x.total || 0), 0) : 0, ventas: Array.isArray(v) ? v.length : 0, totalVentas: Array.isArray(v) ? v.reduce((s, x) => s + parseFloat(x.total || 0), 0) : 0, pedidos: Array.isArray(p) ? p.length : 0, remisiones: Array.isArray(r) ? r.length : 0 });
        setLoading(false);
      });
  }, [tok]);

  const stat = (label, val, sub, bg, fg) => (
    <div style={{ background: bg, borderRadius: 14, padding: 20 }}>
      <p style={{ fontSize: 13, color: fg, opacity: .7, margin: '0 0 4px' }}>{label}</p>
      <p style={{ fontSize: 26, fontWeight: 700, color: fg, margin: '0 0 2px' }}>{loading ? '—' : val}</p>
      <p style={{ fontSize: 12, color: fg, opacity: .6, margin: 0 }}>{sub}</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div><h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Bienvenido, {data.nombre || 'Jesús'} 👋</h2><p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Resumen general del sistema Purafruta</p></div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
        {stat('Total ventas', gs(data.totalVentas), `${data.ventas} transacciones`, '#f0fdf4', '#15803d')}
        {stat('Total compras', gs(data.totalCompras), `${data.compras} órdenes`, '#eff6ff', '#1d4ed8')}
        {stat('Pedidos pendientes', data.pedidos, 'esperando despacho', '#fefce8', '#a16207')}
        {stat('Remisiones activas', data.remisiones, 'en preparación', '#faf5ff', '#7c3aed')}
      </div>
      <Card>
        <CardHead title="Módulos del sistema" />
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
          {[['🛒', 'Compras', 'Registro de compras a proveedores'], ['📦', 'Almacén', 'Inventario, remisiones y salidas'], ['🏭', 'Producción', 'Hojitas digitales y costeo'], ['🏪', 'PDV', 'Ventas en las 4 sucursales'], ['🚚', 'Pedidos', 'Pedidos de sucursales a fábrica'], ['💰', 'Finanzas', 'Caja general y transferencias']].map(([e, t, d]) => (
            <div key={t} style={{ display: 'flex', gap: 12, padding: 12, borderRadius: 10, background: '#fafafa' }}>
              <span style={{ fontSize: 22 }}>{e}</span>
              <div><p style={{ fontWeight: 600, fontSize: 14, color: '#111827', margin: '0 0 2px' }}>{t}</p><p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{d}</p></div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

// ── COMPRAS ────────────────────────────────────────────────
function ComprasModule({ tok }) {
  const [tab, setTab] = useState('lista');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs tabs={[['lista','Lista de compras'],['nueva','Nueva compra'],['proveedores','Proveedores'],['productos','Catálogo']]} active={tab} onChange={setTab} />
      {tab === 'lista' && <ListaCompras tok={tok} />}
      {tab === 'nueva' && <NuevaCompra tok={tok} onDone={() => setTab('lista')} />}
      {tab === 'proveedores' && <Proveedores tok={tok} />}
      {tab === 'productos' && <Productos tok={tok} />}
    </div>
  );
}

function ListaCompras({ tok }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { db.get('compras', 'order=created_at.desc&limit=50&select=*,proveedores(nombre)', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); }); }, [tok]);
  const ec = { pendiente: 'yellow', recibida: 'blue', verificada: 'green' };
  return <Card><CardHead title="Compras registradas" /><Table loading={loading} cols={['Fecha','Proveedor','Total','Estado','Observación']} empty="No hay compras registradas aún" rows={rows.map(r => [fd(r.fecha), r.proveedores?.nombre || '—', gs(r.total), <Badge color={ec[r.estado]}>{r.estado}</Badge>, r.observacion || '—'])} /></Card>;
}

function NuevaCompra({ tok, onDone }) {
  const [provs, setProvs] = useState([]); const [prods, setProds] = useState([]);
  const [form, setForm] = useState({ proveedor_id: '', fecha: new Date().toISOString().split('T')[0], observacion: '' });
  const [items, setItems] = useState([]); const [saving, setSaving] = useState(false); const [err, setErr] = useState('');
  useEffect(() => { db.get('proveedores', 'activo=eq.true&order=nombre', tok).then(d => setProvs(Array.isArray(d) ? d : [])); db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : [])); }, [tok]);
  const addItem = () => setItems([...items, { producto_id: '', cantidad: '', unidad: 'kg', precio_unitario: '', destino: 'almacen' }]);
  const upd = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };
  const total = items.reduce((s, it) => s + parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0), 0);
  const guardar = async () => {
    if (!form.proveedor_id) { setErr('Seleccioná un proveedor'); return; }
    if (items.length === 0) { setErr('Agregá al menos un producto'); return; }
    setSaving(true); setErr('');
    const res = await db.post('compras', { ...form, total }, tok);
    const compra = Array.isArray(res) ? res[0] : res;
    if (compra?.id) { await db.post('compras_detalle', items.map(it => ({ ...it, compra_id: compra.id, subtotal: parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0) })), tok); onDone(); }
    else { setErr('Error al guardar. Verificá los datos.'); setSaving(false); }
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardHead title="Datos de la compra" />
        <div style={{ padding: 18 }}><Grid cols={3}><Select label="Proveedor *" value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })}><option value="">Seleccionar...</option>{provs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select><Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} /><Input label="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Opcional" /></Grid></div>
      </Card>
      <Card>
        <CardHead title="Productos comprados" action={<Btn variant="ghost" onClick={addItem}><Plus size={14} />Agregar</Btn>} />
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '20px 0' }}>Hacé clic en "Agregar" para sumar productos</p>}
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 8, background: '#fafafa', padding: 12, borderRadius: 10 }}>
              <select value={it.producto_id} onChange={e => upd(i, 'producto_id', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}><option value="">Producto...</option>{prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
              <input type="number" placeholder="Cantidad" value={it.cantidad} onChange={e => upd(i, 'cantidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
              <select value={it.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{['kg','g','litro','ml','unidad','caja','bolsa','paquete','rollo'].map(u => <option key={u}>{u}</option>)}</select>
              <input type="number" placeholder="Precio unit." value={it.precio_unitario} onChange={e => upd(i, 'precio_unitario', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
              <select value={it.destino} onChange={e => upd(i, 'destino', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}><option value="almacen">→ Almacén</option><option value="produccion">→ Producción</option></select>
              <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
            </div>
          ))}
          {items.length > 0 && <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16, color: '#111827', paddingTop: 8, borderTop: '1px solid #f3f4f6' }}>Total: {gs(total)}</div>}
        </div>
      </Card>
      {err && <p style={{ color: '#dc2626', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}><AlertCircle size={14} />{err}</p>}
      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={guardar} disabled={saving}>{saving ? 'Guardando...' : 'Guardar compra'}</Btn>
        <Btn variant="secondary" onClick={onDone}>Cancelar</Btn>
      </div>
    </div>
  );
}

function Proveedores({ tok }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ nombre: '', ruc: '', contacto: '', tipo: 'general' }); const [saving, setSaving] = useState(false);
  const load = () => db.get('proveedores', 'order=nombre', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  useEffect(() => { load(); }, [tok]);
  const guardar = async () => { setSaving(true); await db.post('proveedores', form, tok); setForm({ nombre: '', ruc: '', contacto: '', tipo: 'general' }); setShow(false); setSaving(false); load(); };
  return (
    <Card>
      <CardHead title="Proveedores" action={<Btn variant="ghost" onClick={() => setShow(!show)}><Plus size={14} />Nuevo</Btn>} />
      {show && <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}><Grid cols={4}><Input label="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del proveedor" /><Input label="RUC" value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} placeholder="RUC" /><Input label="Contacto / Tel." value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Teléfono" /><Select label="Tipo" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option value="general">General (pasa por almacén)</option><option value="sucursal">Sucursal (directo al local)</option></Select></Grid><div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Btn onClick={guardar} disabled={saving || !form.nombre}>{saving ? 'Guardando...' : 'Guardar'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div></div>}
      <Table loading={loading} cols={['Nombre','RUC','Contacto','Tipo']} empty="No hay proveedores registrados" rows={rows.map(r => [r.nombre, r.ruc || '—', r.contacto || '—', <Badge color={r.tipo === 'general' ? 'blue' : 'purple'}>{r.tipo === 'general' ? 'General' : 'Sucursal'}</Badge>])} />
    </Card>
  );
}

function Productos({ tok }) {
  const [rows, setRows] = useState([]); const [cats, setCats] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false); const [search, setSearch] = useState('');
  const [form, setForm] = useState({ nombre: '', unidad: 'kg', categoria_id: '', es_producido: false, precio_venta: '' }); const [saving, setSaving] = useState(false);
  const load = () => { Promise.all([db.get('productos', 'order=nombre&select=*,categorias(nombre)', tok), db.get('categorias', 'order=nombre', tok)]).then(([p, c]) => { setRows(Array.isArray(p) ? p : []); setCats(Array.isArray(c) ? c : []); setLoading(false); }); };
  useEffect(() => { load(); }, [tok]);
  const guardar = async () => { setSaving(true); await db.post('productos', { ...form, precio_venta: form.precio_venta || null, categoria_id: form.categoria_id || null }, tok); setForm({ nombre: '', unidad: 'kg', categoria_id: '', es_producido: false, precio_venta: '' }); setShow(false); setSaving(false); load(); };
  const filtered = rows.filter(r => r.nombre.toLowerCase().includes(search.toLowerCase()));
  return (
    <Card>
      <CardHead title="Catálogo de productos" action={<div style={{ display: 'flex', gap: 8 }}><div style={{ position: 'relative' }}><Search size={14} style={{ position: 'absolute', left: 9, top: 9, color: '#9ca3af' }} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px 7px 28px', fontSize: 13, width: 140 }} /></div><Btn variant="ghost" onClick={() => setShow(!show)}><Plus size={14} />Nuevo</Btn></div>} />
      {show && <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}><Grid cols={3}><Input label="Nombre *" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre del producto" /><Select label="Unidad" value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })}>{['kg','g','litro','ml','unidad','caja','bolsa','paquete','rollo'].map(u => <option key={u}>{u}</option>)}</Select><Select label="Categoría" value={form.categoria_id} onChange={e => setForm({ ...form, categoria_id: e.target.value })}><option value="">Sin categoría</option>{cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}</Select><Input label="Precio de venta (Gs.)" type="number" value={form.precio_venta} onChange={e => setForm({ ...form, precio_venta: e.target.value })} placeholder="0" /><div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 20 }}><input type="checkbox" id="esp" checked={form.es_producido} onChange={e => setForm({ ...form, es_producido: e.target.checked })} /><label htmlFor="esp" style={{ fontSize: 13, color: '#374151', cursor: 'pointer' }}>Se produce en fábrica</label></div></Grid><div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Btn onClick={guardar} disabled={saving || !form.nombre}>{saving ? 'Guardando...' : 'Guardar'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div></div>}
      <Table loading={loading} cols={['Producto','Unidad','Categoría','Precio venta','Tipo']} empty="Sin productos registrados" rows={filtered.map(r => [r.nombre, r.unidad, r.categorias?.nombre || '—', r.precio_venta ? gs(r.precio_venta) : '—', <Badge color={r.es_producido ? 'green' : 'gray'}>{r.es_producido ? 'Producción propia' : 'Comprado'}</Badge>])} />
    </Card>
  );
}

// ── ALMACÉN ────────────────────────────────────────────────
function AlmacenModule({ tok }) {
  const [tab, setTab] = useState('inventario');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs tabs={[['inventario','Inventario'],['remisiones','Remisiones'],['salidas','Salidas']]} active={tab} onChange={setTab} />
      {tab === 'inventario' && <InvAlmacen tok={tok} />}
      {tab === 'remisiones' && <Remisiones tok={tok} />}
      {tab === 'salidas' && <Salidas tok={tok} />}
    </div>
  );
}

function InvAlmacen({ tok }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { db.get('almacen_inventario', 'select=*,productos(nombre,unidad)', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); }); }, [tok]);
  return <Card><CardHead title="Inventario de almacén" /><Table loading={loading} cols={['Producto','Stock actual','Stock mínimo','Estado']} empty="El inventario se actualiza al registrar compras y salidas" rows={rows.map(r => [r.productos?.nombre, `${r.stock_actual} ${r.productos?.unidad}`, `${r.stock_minimo} ${r.productos?.unidad}`, <Badge color={r.stock_actual <= r.stock_minimo ? 'red' : 'green'}>{r.stock_actual <= r.stock_minimo ? 'Stock bajo' : 'OK'}</Badge>])} /></Card>;
}

function Remisiones({ tok }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { db.get('remisiones', 'order=created_at.desc&select=*,sucursales(nombre)', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); }); }, [tok]);
  const ec = { preparando: 'yellow', enviada: 'blue', recibida: 'green', con_diferencia: 'red' };
  return <Card><CardHead title="Remisiones" /><Table loading={loading} cols={['Fecha','Sucursal','Estado','Observación']} empty="No hay remisiones registradas" rows={rows.map(r => [fd(r.fecha), r.sucursales?.nombre, <Badge color={ec[r.estado]}>{r.estado.replace('_',' ')}</Badge>, r.observacion || '—'])} /></Card>;
}

function Salidas({ tok }) {
  const [rows, setRows] = useState([]); const [prods, setProds] = useState([]); const [sucs, setSucs] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ producto_id: '', cantidad: '', unidad: 'kg', destino: 'produccion', sucursal_id: '' }); const [saving, setSaving] = useState(false);
  const load = () => Promise.all([db.get('salidas_almacen', 'order=created_at.desc&limit=30&select=*,productos(nombre)', tok), db.get('productos', 'activo=eq.true&order=nombre', tok), db.get('sucursales', 'activa=eq.true', tok)]).then(([s, p, su]) => { setRows(Array.isArray(s) ? s : []); setProds(Array.isArray(p) ? p : []); setSucs(Array.isArray(su) ? su : []); setLoading(false); });
  useEffect(() => { load(); }, [tok]);
  const guardar = async () => { setSaving(true); await db.post('salidas_almacen', { ...form, sucursal_id: form.sucursal_id || null }, tok); setForm({ producto_id: '', cantidad: '', unidad: 'kg', destino: 'produccion', sucursal_id: '' }); setShow(false); setSaving(false); load(); };
  return (
    <Card>
      <CardHead title="Salidas de almacén" action={<Btn variant="ghost" onClick={() => setShow(!show)}><Plus size={14} />Nueva salida</Btn>} />
      {show && <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}><Grid cols={4}><Select label="Producto *" value={form.producto_id} onChange={e => setForm({ ...form, producto_id: e.target.value })}><option value="">Seleccionar...</option>{prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select><Input label="Cantidad *" type="number" value={form.cantidad} onChange={e => setForm({ ...form, cantidad: e.target.value })} /><Select label="Unidad" value={form.unidad} onChange={e => setForm({ ...form, unidad: e.target.value })}>{['kg','g','litro','ml','unidad','caja','bolsa','paquete'].map(u => <option key={u}>{u}</option>)}</Select><Select label="Destino" value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })}><option value="produccion">→ Producción</option><option value="sucursal">→ Sucursal</option></Select>{form.destino === 'sucursal' && <Select label="Sucursal" value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}><option value="">Seleccionar...</option>{sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</Select>}</Grid><div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Btn onClick={guardar} disabled={saving || !form.producto_id || !form.cantidad}>{saving ? 'Guardando...' : 'Registrar'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div></div>}
      <Table loading={loading} cols={['Fecha','Producto','Cantidad','Destino']} empty="Sin salidas registradas" rows={rows.map(r => [fd(r.fecha), r.productos?.nombre, `${r.cantidad} ${r.unidad}`, <Badge color={r.destino === 'produccion' ? 'blue' : 'purple'}>{r.destino}</Badge>])} />
    </Card>
  );
}

// ── PRODUCCIÓN ─────────────────────────────────────────────
function ProduccionModule({ tok }) {
  const [tab, setTab] = useState('lotes');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs tabs={[['lotes','Hojitas de producción'],['congelados','Inventario congelados']]} active={tab} onChange={setTab} />
      {tab === 'lotes' && <Lotes tok={tok} />}
      {tab === 'congelados' && <Congelados tok={tok} />}
    </div>
  );
}

function Lotes({ tok }) {
  const [rows, setRows] = useState([]); const [prods, setProds] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ responsable: '', hora_inicio: '', hora_fin: '', observacion: '' }); const [items, setItems] = useState([]); const [saving, setSaving] = useState(false);
  const load = () => Promise.all([db.get('produccion_lotes', 'order=created_at.desc&limit=30', tok), db.get('productos', 'activo=eq.true&order=nombre', tok)]).then(([l, p]) => { setRows(Array.isArray(l) ? l : []); setProds(Array.isArray(p) ? p : []); setLoading(false); });
  useEffect(() => { load(); }, [tok]);
  const addItem = () => setItems([...items, { producto_id: '', cantidad_producida: '', peso_paquete: '', unidad: 'kg' }]);
  const upd = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };
  const guardar = async () => {
    if (!form.responsable || items.length === 0) return;
    setSaving(true);
    const res = await db.post('produccion_lotes', { ...form, fecha: new Date().toISOString().split('T')[0] }, tok);
    const lote = Array.isArray(res) ? res[0] : res;
    if (lote?.id) { await db.post('produccion_detalle', items.map(it => ({ ...it, lote_id: lote.id })), tok); setForm({ responsable: '', hora_inicio: '', hora_fin: '', observacion: '' }); setItems([]); setShow(false); load(); }
    setSaving(false);
  };
  return (
    <Card>
      <CardHead title="Hojitas de producción" action={<Btn variant="ghost" onClick={() => setShow(!show)}><Plus size={14} />Nueva hojita</Btn>} />
      {show && (
        <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Grid cols={4}><Input label="Responsable *" value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })} placeholder="Nombre del operador" /><Input label="Hora inicio" type="time" value={form.hora_inicio} onChange={e => setForm({ ...form, hora_inicio: e.target.value })} /><Input label="Hora fin" type="time" value={form.hora_fin} onChange={e => setForm({ ...form, hora_fin: e.target.value })} /><Input label="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Opcional" /></Grid>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}><p style={{ fontWeight: 500, fontSize: 14, color: '#374151', margin: 0 }}>Productos producidos</p><button onClick={addItem} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={14} />Agregar</button></div>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                <select value={it.producto_id} onChange={e => upd(i, 'producto_id', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}><option value="">Producto...</option>{prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
                <input type="number" placeholder="Cantidad" value={it.cantidad_producida} onChange={e => upd(i, 'cantidad_producida', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
                <input type="number" placeholder="Peso paq. (kg)" value={it.peso_paquete} onChange={e => upd(i, 'peso_paquete', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
                <select value={it.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{['kg','g','unidad','paquete'].map(u => <option key={u}>{u}</option>)}</select>
                <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}><Btn onClick={guardar} disabled={saving || !form.responsable}>{saving ? 'Guardando...' : 'Cerrar hojita'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div>
        </div>
      )}
      <Table loading={loading} cols={['Fecha','Responsable','Horario','Estado']} empty="No hay hojitas registradas aún" rows={rows.map(r => [fd(r.fecha), r.responsable, r.hora_inicio && r.hora_fin ? `${r.hora_inicio} — ${r.hora_fin}` : '—', <Badge color={r.estado === 'cerrado' ? 'green' : 'yellow'}>{r.estado}</Badge>])} />
    </Card>
  );
}

function Congelados({ tok }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { db.get('congelados_inventario', 'select=*,productos(nombre,unidad)', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); }); }, [tok]);
  return <Card><CardHead title="Inventario de congelados" /><Table loading={loading} cols={['Producto','Stock actual','Última actualización']} empty="El inventario se actualiza al cerrar hojitas de producción" rows={rows.map(r => [r.productos?.nombre, `${r.stock_actual} ${r.productos?.unidad}`, fd(r.ultima_actualizacion)])} /></Card>;
}

// ── PDV ────────────────────────────────────────────────────
function PDVModule({ tok }) {
  const [sucs, setSucs] = useState([]); const [prods, setProds] = useState([]);
  const [sucursal, setSucursal] = useState(''); const [turno, setTurno] = useState('manana'); const [medioPago, setMedioPago] = useState('efectivo');
  const [carrito, setCarrito] = useState([]); const [saving, setSaving] = useState(false); const [ok, setOk] = useState(false);
  useEffect(() => { db.get('sucursales', 'activa=eq.true', tok).then(d => setSucs(Array.isArray(d) ? d : [])); db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : [])); }, [tok]);
  const add = (p) => { const ex = carrito.find(i => i.id === p.id); if (ex) setCarrito(carrito.map(i => i.id === p.id ? { ...i, qty: i.qty + 1 } : i)); else setCarrito([...carrito, { ...p, qty: 1 }]); };
  const upd = (id, qty) => { if (qty <= 0) setCarrito(carrito.filter(i => i.id !== id)); else setCarrito(carrito.map(i => i.id === id ? { ...i, qty } : i)); };
  const total = carrito.reduce((s, i) => s + (parseFloat(i.precio_venta) || 0) * i.qty, 0);
  const cobrar = async () => {
    if (!sucursal || carrito.length === 0) return; setSaving(true);
    const res = await db.post('ventas', { sucursal_id: sucursal, total, medio_pago: medioPago, turno }, tok);
    const venta = Array.isArray(res) ? res[0] : res;
    if (venta?.id) { await db.post('ventas_detalle', carrito.map(i => ({ venta_id: venta.id, producto_id: i.id, cantidad: i.qty, precio_unitario: parseFloat(i.precio_venta) || 0, subtotal: (parseFloat(i.precio_venta) || 0) * i.qty })), tok); setCarrito([]); setOk(true); setTimeout(() => setOk(false), 3000); }
    setSaving(false);
  };
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, height: 'calc(100vh - 120px)' }}>
      <Card style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', gap: 10 }}>
          <Select value={sucursal} onChange={e => setSucursal(e.target.value)} style={{ minWidth: 160 }}><option value="">Sucursal...</option>{sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</Select>
          <Select value={turno} onChange={e => setTurno(e.target.value)}><option value="manana">Mañana</option><option value="tarde">Tarde</option><option value="noche">Noche</option></Select>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .5, margin: '0 0 12px' }}>Productos disponibles</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(130px,1fr))', gap: 10 }}>
            {prods.filter(p => p.precio_venta).map(p => (
              <button key={p.id} onClick={() => add(p)} style={{ textAlign: 'left', padding: 14, borderRadius: 12, border: '1.5px solid #e5e7eb', background: '#fff', cursor: 'pointer', transition: 'all .15s' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                <p style={{ fontSize: 14, fontWeight: 700, color: '#16a34a', margin: 0 }}>{gs(p.precio_venta)}</p>
              </button>
            ))}
            {prods.filter(p => p.precio_venta).length === 0 && <p style={{ gridColumn: '1/-1', textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '40px 0' }}>Agregá precios de venta a los productos en el catálogo</p>}
          </div>
        </div>
      </Card>
      <Card style={{ display: 'flex', flexDirection: 'column' }}>
        <CardHead title="Carrito" />
        {ok && <div style={{ margin: '12px 16px', padding: 12, background: '#f0fdf4', borderRadius: 10, color: '#15803d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><Check size={16} />Venta registrada correctamente</div>}
        <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
          {carrito.length === 0 ? <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '40px 0' }}>Tocá un producto para agregarlo</p> :
            carrito.map(i => (
              <div key={i.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1 }}><p style={{ fontSize: 13, fontWeight: 500, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.nombre}</p><p style={{ fontSize: 12, color: '#6b7280', margin: 0 }}>{gs((parseFloat(i.precio_venta)||0)*i.qty)}</p></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <button onClick={() => upd(i.id, i.qty - 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>-</button>
                  <span style={{ width: 24, textAlign: 'center', fontSize: 14, fontWeight: 600 }}>{i.qty}</span>
                  <button onClick={() => upd(i.id, i.qty + 1)} style={{ width: 26, height: 26, borderRadius: 6, border: '1px solid #e5e7eb', background: '#fff', cursor: 'pointer', fontSize: 16, color: '#6b7280' }}>+</button>
                </div>
              </div>
            ))}
        </div>
        <div style={{ borderTop: '1px solid #f3f4f6', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 17, color: '#111827' }}><span>Total</span><span>{gs(total)}</span></div>
          <Select value={medioPago} onChange={e => setMedioPago(e.target.value)}><option value="efectivo">Efectivo</option><option value="transferencia">Transferencia</option><option value="mixto">Mixto</option></Select>
          <button onClick={cobrar} disabled={saving || carrito.length === 0 || !sucursal} style={{ background: saving || carrito.length === 0 || !sucursal ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 12, padding: 14, fontSize: 16, fontWeight: 600, cursor: saving || carrito.length === 0 || !sucursal ? 'not-allowed' : 'pointer' }}>{saving ? 'Procesando...' : '💳 Cobrar'}</button>
        </div>
      </Card>
    </div>
  );
}

// ── PEDIDOS ────────────────────────────────────────────────
function PedidosModule({ tok }) {
  const [rows, setRows] = useState([]); const [sucs, setSucs] = useState([]); const [prods, setProds] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ sucursal_id: '', destino: 'almacen', observacion: '' }); const [items, setItems] = useState([]); const [saving, setSaving] = useState(false);
  const load = () => Promise.all([db.get('pedidos', 'order=created_at.desc&limit=30&select=*,sucursales(nombre)', tok), db.get('sucursales', 'activa=eq.true', tok), db.get('productos', 'activo=eq.true&order=nombre', tok)]).then(([p, s, pr]) => { setRows(Array.isArray(p)?p:[]); setSucs(Array.isArray(s)?s:[]); setProds(Array.isArray(pr)?pr:[]); setLoading(false); });
  useEffect(() => { load(); }, [tok]);
  const addItem = () => setItems([...items, { producto_id: '', cantidad_solicitada: '', unidad: 'unidad', observacion: '' }]);
  const upd = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };
  const guardar = async () => {
    if (!form.sucursal_id || items.length === 0) return; setSaving(true);
    const res = await db.post('pedidos', form, tok);
    const pedido = Array.isArray(res) ? res[0] : res;
    if (pedido?.id) { await db.post('pedidos_detalle', items.map(it => ({ ...it, pedido_id: pedido.id })), tok); setForm({ sucursal_id: '', destino: 'almacen', observacion: '' }); setItems([]); setShow(false); load(); }
    setSaving(false);
  };
  const updateEstado = async (id, estado) => { await db.patch('pedidos', `id=eq.${id}`, { estado }, tok); load(); };
  const ec = { enviado: 'blue', visto: 'yellow', en_preparacion: 'orange', despachado: 'green' };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardHead title="Pedidos de sucursales" action={<Btn variant="ghost" onClick={() => setShow(!show)}><Plus size={14} />Nuevo pedido</Btn>} />
        {show && (
          <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Grid cols={3}><Select label="Sucursal *" value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}><option value="">Seleccionar...</option>{sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</Select><Select label="Destino del pedido" value={form.destino} onChange={e => setForm({ ...form, destino: e.target.value })}><option value="almacen">Almacén</option><option value="produccion">Producción</option><option value="ambos">Ambos</option></Select><Input label="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Opcional" /></Grid>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}><p style={{ fontWeight: 500, fontSize: 14, margin: 0 }}>Productos solicitados</p><button onClick={addItem} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#16a34a', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><Plus size={14} />Agregar</button></div>
              {items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: 8, marginBottom: 8 }}>
                  <select value={it.producto_id} onChange={e => upd(i, 'producto_id', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}><option value="">Producto...</option>{prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
                  <input type="number" placeholder="Cantidad" value={it.cantidad_solicitada} onChange={e => upd(i, 'cantidad_solicitada', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }} />
                  <select value={it.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>{['kg','g','litro','ml','unidad','caja','bolsa','paquete'].map(u => <option key={u}>{u}</option>)}</select>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}><Btn onClick={guardar} disabled={saving || !form.sucursal_id || items.length === 0}>{saving ? 'Enviando...' : 'Enviar pedido'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div>
          </div>
        )}
        <Table loading={loading} cols={['Fecha','Sucursal','Destino','Estado','Acción']} empty="No hay pedidos registrados" rows={rows.map(r => [fd(r.fecha), r.sucursales?.nombre, r.destino, <Badge color={ec[r.estado]}>{r.estado.replace('_',' ')}</Badge>, r.estado !== 'despachado' ? <select value={r.estado} onChange={e => updateEstado(r.id, e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 12 }}><option value="enviado">Enviado</option><option value="visto">Visto</option><option value="en_preparacion">En preparación</option><option value="despachado">Despachado</option></select> : <Badge color="green">✓ Listo</Badge>])} />
      </Card>
    </div>
  );
}

// ── FINANZAS ───────────────────────────────────────────────
function FinanzasModule({ tok }) {
  const [tab, setTab] = useState('caja');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs tabs={[['caja','Caja general'],['transferencias','Transferencias']]} active={tab} onChange={setTab} />
      {tab === 'caja' && <Caja tok={tok} />}
      {tab === 'transferencias' && <Transf tok={tok} />}
    </div>
  );
}

function Caja({ tok }) {
  const [rows, setRows] = useState([]); const [sucs, setSucs] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ tipo: 'ingreso', concepto: '', monto: '', sucursal_id: '', referencia: '' }); const [saving, setSaving] = useState(false);
  const load = () => Promise.all([db.get('caja_movimientos', 'order=created_at.desc&limit=50&select=*,sucursales(nombre)', tok), db.get('sucursales', 'activa=eq.true', tok)]).then(([m, s]) => { setRows(Array.isArray(m)?m:[]); setSucs(Array.isArray(s)?s:[]); setLoading(false); });
  useEffect(() => { load(); }, [tok]);
  const saldo = rows.reduce((s, m) => m.tipo === 'ingreso' ? s + parseFloat(m.monto) : s - parseFloat(m.monto), 0);
  const guardar = async () => { if (!form.concepto || !form.monto) return; setSaving(true); await db.post('caja_movimientos', { ...form, sucursal_id: form.sucursal_id || null, monto: parseFloat(form.monto) }, tok); setForm({ tipo: 'ingreso', concepto: '', monto: '', sucursal_id: '', referencia: '' }); setShow(false); setSaving(false); load(); };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: saldo >= 0 ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#dc2626,#ef4444)', borderRadius: 16, padding: 24, color: '#fff' }}>
        <p style={{ fontSize: 14, opacity: .85, margin: '0 0 6px' }}>Saldo en caja general</p>
        <p style={{ fontSize: 36, fontWeight: 700, margin: 0 }}>{gs(saldo)}</p>
      </div>
      <Card>
        <CardHead title="Movimientos de caja" action={<Btn variant="ghost" onClick={() => setShow(!show)}><Plus size={14} />Registrar</Btn>} />
        {show && <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}><Grid cols={4}><Select label="Tipo" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option value="ingreso">Ingreso</option><option value="egreso">Egreso</option></Select><Input label="Concepto *" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} placeholder="Descripción" /><Input label="Monto (Gs.) *" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} /><Select label="Sucursal" value={form.sucursal_id} onChange={e => setForm({ ...form, sucursal_id: e.target.value })}><option value="">Sin sucursal</option>{sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}</Select></Grid><div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Btn onClick={guardar} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div></div>}
        <Table loading={loading} cols={['Fecha','Concepto','Sucursal','Monto']} empty="Sin movimientos" rows={rows.map(r => [fd(r.fecha), r.concepto, r.sucursales?.nombre || '—', <span style={{ fontWeight: 600, color: r.tipo === 'ingreso' ? '#16a34a' : '#dc2626' }}>{r.tipo === 'ingreso' ? '+' : '-'}{gs(r.monto)}</span>])} />
      </Card>
    </div>
  );
}

function Transf({ tok }) {
  const [rows, setRows] = useState([]); const [provs, setProvs] = useState([]); const [sucs, setSucs] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ tipo: 'pago_proveedor', concepto: '', monto: '', proveedor_id: '', sucursal_id: '' }); const [saving, setSaving] = useState(false);
  const load = () => Promise.all([db.get('transferencias', 'order=created_at.desc&limit=50&select=*,proveedores(nombre),sucursales(nombre)', tok), db.get('proveedores', 'activo=eq.true&order=nombre', tok), db.get('sucursales', 'activa=eq.true', tok)]).then(([t, p, s]) => { setRows(Array.isArray(t)?t:[]); setProvs(Array.isArray(p)?p:[]); setSucs(Array.isArray(s)?s:[]); setLoading(false); });
  useEffect(() => { load(); }, [tok]);
  const guardar = async () => { if (!form.concepto || !form.monto) return; setSaving(true); await db.post('transferencias', { ...form, proveedor_id: form.proveedor_id || null, sucursal_id: form.sucursal_id || null, monto: parseFloat(form.monto) }, tok); setForm({ tipo: 'pago_proveedor', concepto: '', monto: '', proveedor_id: '', sucursal_id: '' }); setShow(false); setSaving(false); load(); };
  return (
    <Card>
      <CardHead title="Transferencias bancarias" action={<Btn variant="ghost" onClick={() => setShow(!show)}><Plus size={14} />Nueva</Btn>} />
      {show && <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}><Grid cols={4}><Select label="Tipo" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}><option value="pago_proveedor">Pago a proveedor</option><option value="cobro_venta">Cobro de venta</option><option value="otro">Otro</option></Select><Input label="Concepto *" value={form.concepto} onChange={e => setForm({ ...form, concepto: e.target.value })} /><Input label="Monto (Gs.) *" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} /><Select label="Proveedor" value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })}><option value="">Opcional...</option>{provs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</Select></Grid><div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Btn onClick={guardar} disabled={saving}>{saving?'Guardando...':'Guardar'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div></div>}
      <Table loading={loading} cols={['Fecha','Tipo','Concepto','Proveedor','Monto']} empty="Sin transferencias" rows={rows.map(r => [fd(r.fecha), <Badge color="blue">{r.tipo.replace(/_/g,' ')}</Badge>, r.concepto, r.proveedores?.nombre || '—', <span style={{ fontWeight: 600 }}>{gs(r.monto)}</span>])} />
    </Card>
  );
}

// ── REPORTES ───────────────────────────────────────────────
function ReportesModule({ tok }) {
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));
  const [stats, setStats] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    const ini = `${mes}-01`, fin = `${mes}-31`;
    Promise.all([
      db.get('ventas', `select=total,sucursales(nombre)&fecha=gte.${ini}&fecha=lte.${fin}T23:59:59`, tok),
      db.get('compras', `select=total&fecha=gte.${ini}&fecha=lte.${fin}`, tok),
      db.get('caja_movimientos', `select=tipo,monto&fecha=gte.${ini}&fecha=lte.${fin}`, tok),
    ]).then(([v, c, m]) => {
      const tv = Array.isArray(v) ? v.reduce((s, x) => s + parseFloat(x.total || 0), 0) : 0;
      const tc = Array.isArray(c) ? c.reduce((s, x) => s + parseFloat(x.total || 0), 0) : 0;
      const ing = Array.isArray(m) ? m.filter(x => x.tipo === 'ingreso').reduce((s, x) => s + parseFloat(x.monto || 0), 0) : 0;
      const egr = Array.isArray(m) ? m.filter(x => x.tipo === 'egreso').reduce((s, x) => s + parseFloat(x.monto || 0), 0) : 0;
      const porSuc = Array.isArray(v) ? v.reduce((acc, x) => { const n = x.sucursales?.nombre || 'Sin sucursal'; acc[n] = (acc[n] || 0) + parseFloat(x.total || 0); return acc; }, {}) : {};
      setStats({ tv, tc, ing, egr, res: tv - tc, porSuc });
      setLoading(false);
    });
  }, [tok, mes]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <p style={{ fontWeight: 600, fontSize: 15, color: '#374151', margin: 0 }}>Período:</p>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14 }} />
      </div>
      {loading ? <p style={{ textAlign: 'center', color: '#9ca3af', padding: 60 }}>Calculando estado de resultados...</p> : stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 14 }}>
            {[['Ventas del mes', stats.tv, '#f0fdf4', '#15803d'], ['Compras del mes', stats.tc, '#eff6ff', '#1d4ed8'], ['Ingresos en caja', stats.ing, '#f0fdf4', '#15803d'], ['Egresos en caja', stats.egr, '#fef2f2', '#dc2626']].map(([l, v, bg, fg]) => (
              <div key={l} style={{ background: bg, borderRadius: 14, padding: 18 }}><p style={{ fontSize: 12, color: fg, opacity: .7, margin: '0 0 4px' }}>{l}</p><p style={{ fontSize: 22, fontWeight: 700, color: fg, margin: 0 }}>{gs(v)}</p></div>
            ))}
          </div>
          <div style={{ background: stats.res >= 0 ? 'linear-gradient(135deg,#16a34a,#22c55e)' : 'linear-gradient(135deg,#dc2626,#ef4444)', borderRadius: 16, padding: 24, color: '#fff' }}>
            <p style={{ fontSize: 14, opacity: .85, margin: '0 0 6px' }}>Resultado del período — Ventas − Compras</p>
            <p style={{ fontSize: 36, fontWeight: 700, margin: '0 0 4px' }}>{gs(stats.res)}</p>
            <p style={{ fontSize: 13, opacity: .7, margin: 0 }}>{stats.res >= 0 ? '✓ Período positivo' : '✗ Período negativo'}</p>
          </div>
          {Object.keys(stats.porSuc).length > 0 && (
            <Card>
              <CardHead title="Ventas por sucursal" />
              <div style={{ padding: 18 }}>
                {Object.entries(stats.porSuc).sort((a, b) => b[1] - a[1]).map(([nombre, total]) => (
                  <div key={nombre} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 14, color: '#374151' }}>{nombre}</span>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#15803d' }}>{gs(total)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
