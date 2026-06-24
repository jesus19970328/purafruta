/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect, useRef, useCallback } from "react";
import { ShoppingCart, Package, Factory, Store, Truck, DollarSign, BarChart3, LogOut, Menu, X, Plus, Trash2, Check, AlertCircle, Search, Home, ChevronDown } from "lucide-react";
import PDVModuleNew from "./PDVModule";
import ProduccionModuleNew from "./ProduccionModule";
import ActivosModule from "./ActivosModule";
import ClientesModule from "./ClientesModule";

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
const fd = (d) => {
  if (!d) return '—';
  // Evitar desfase de zona horaria: parsear como fecha local
  const [y, m, day] = String(d).slice(0, 10).split('-');
  return new Date(parseInt(y), parseInt(m) - 1, parseInt(day)).toLocaleDateString('es-PY');
};

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, roles: ['admin','director','finanzas'] },
  { id: 'compras', label: 'Compras', icon: ShoppingCart, roles: ['admin','almacen'] },
  { id: 'almacen', label: 'Almacén', icon: Package, roles: ['admin','almacen'] },
  { id: 'produccion', label: 'Producción', icon: Factory, roles: ['admin','produccion'] },
  { id: 'pdv', label: 'Punto de venta', icon: Store, roles: ['admin','sucursal'] },
  { id: 'pedidos', label: 'Pedidos', icon: Truck, roles: ['admin','almacen','sucursal','produccion'] },
  { id: 'finanzas', label: 'Finanzas', icon: DollarSign, roles: ['admin','finanzas'] },
  { id: 'reportes', label: 'Reportes', icon: BarChart3, roles: ['admin','director','finanzas'] },
  { id: 'activos', label: 'Activos fijos', icon: Package, roles: ['admin','almacen','produccion','sucursal','director'] },
  { id: 'clientes', label: 'Clientes externos', icon: ShoppingCart, roles: ['admin','finanzas'] },
];

export default function App() {
  const [session, setSession] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const refreshTimer = useRef(null);

  // ── AUTO-REFRESH DEL TOKEN ─────────────────────────────
  const scheduleRefresh = useCallback((s) => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    if (!s?.expires_at) return;
    const delay = (s.expires_at * 1000) - Date.now() - 5 * 60 * 1000; // 5 min antes
    if (delay <= 0) { doRefresh(s.refresh_token); return; }
    refreshTimer.current = setTimeout(() => doRefresh(s.refresh_token), delay);
  }, []);

  const doRefresh = async (refreshToken) => {
    if (!refreshToken) { doLogout(); return; }
    try {
      const res = await fetch(`${SB_URL}/auth/v1/token?grant_type=refresh_token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SB_KEY },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!res.ok) throw new Error('refresh failed');
      const data = await res.json();
      const newSess = {
        ...data,
        expires_at: Math.floor(Date.now() / 1000) + data.expires_in,
      };
      localStorage.setItem('pf_sess', JSON.stringify(newSess));
      setSession(newSess);
      scheduleRefresh(newSess);
    } catch {
      doLogout();
    }
  };

  const doLogout = () => {
    if (refreshTimer.current) clearTimeout(refreshTimer.current);
    localStorage.removeItem('pf_sess');
    setSession(null);
    setPerfil(null);
  };
  // ──────────────────────────────────────────────────────

  useEffect(() => {
    try {
      const s = JSON.parse(localStorage.getItem('pf_sess') || 'null');
      if (s?.access_token) {
        setSession(s);
        loadPerfil(s.access_token, s.user.id);
        scheduleRefresh(s);
      } else setLoading(false);
    } catch { setLoading(false); }
    return () => { if (refreshTimer.current) clearTimeout(refreshTimer.current); };
  }, []);

  const loadPerfil = async (tok, uid) => {
    try {
      const d = await db.get('usuarios', `id=eq.${uid}`, tok);
      setPerfil(Array.isArray(d) && d[0] ? d[0] : { rol: 'admin', nombre: 'Administrador' });
    } catch { setPerfil({ rol: 'admin', nombre: 'Admin' }); }
    setLoading(false);
  };

  const onLogin = (s) => {
    // Guardar con expires_at para que el auto-refresh funcione
    const sess = { ...s, expires_at: Math.floor(Date.now() / 1000) + (s.expires_in || 3600) };
    localStorage.setItem('pf_sess', JSON.stringify(sess));
    setSession(sess);
    loadPerfil(sess.access_token, sess.user.id);
    scheduleRefresh(sess);
  };
  const onLogout = async () => { if (session) await db.logout(session.access_token); doLogout(); };

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0fdf4', color: '#111827' }}>
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
              style={{ width: '100%', border: '1.5px solid #d1fae5', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#f0fdf4', color: '#111827' }} />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: '#374151', marginBottom: 6 }}>Contraseña</label>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)} placeholder="••••••••" required
              style={{ width: '100%', border: '1.5px solid #d1fae5', borderRadius: 10, padding: '10px 14px', fontSize: 14, color: '#111827', outline: 'none', boxSizing: 'border-box', background: '#f0fdf4', color: '#111827' }} />
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
  const tok = session.access_token;
  const rol = perfil?.rol || 'admin';
  const nav = NAV.filter(n => n.roles.includes(rol));
  const getDefaultMod = (r) => {
    if (r === 'almacen') return 'almacen';
    if (r === 'produccion') return 'produccion';
    if (r === 'sucursal') return 'pdv';
    if (r === 'finanzas') return 'finanzas';
    return 'dashboard';
  };
  const [mod, setMod] = useState(getDefaultMod(rol));
  const [open, setOpen] = useState(false);
  useEffect(() => { setMod(getDefaultMod(perfil?.rol || 'admin')); }, [perfil?.rol]);

  const panels = {
    dashboard: <Dashboard tok={tok} />,
    compras: <ComprasModule tok={tok} />,
    almacen: <AlmacenModule tok={tok} />,
    produccion: <ProduccionModuleNew tok={tok} />,
    pdv: <PDVModuleNew tok={tok} perfil={perfil} />,
    pedidos: <PedidosModule tok={tok} perfil={perfil} />,
    finanzas: <FinanzasModule tok={tok} />,
    reportes: <ReportesModule tok={tok} />,
    activos: <ActivosModule tok={tok} perfil={perfil} />,
    clientes: <ClientesModule tok={tok} />,
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
const Input = ({ label, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{label && <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{label}</label>}<input {...p} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#111827', outline: 'none', background: '#fafafa', ...(p.style || {}) }} /></div>;
const Select = ({ label, children, ...p }) => <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>{label && <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{label}</label>}<select {...p} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#111827', outline: 'none', background: '#fafafa', ...(p.style || {}) }}>{children}</select></div>;
const Badge = ({ children, color = 'gray' }) => {
  const c = { green: { bg: '#f0fdf4', text: '#15803d' }, yellow: { bg: '#fefce8', text: '#a16207' }, blue: { bg: '#eff6ff', text: '#1d4ed8' }, red: { bg: '#fef2f2', text: '#dc2626' }, purple: { bg: '#faf5ff', text: '#7c3aed' }, orange: { bg: '#fff7ed', text: '#c2410c' }, gray: { bg: '#f9fafb', text: '#6b7280' } };
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: c[color]?.bg, color: c[color]?.text }}>{children}</span>;
};
const Table = ({ cols, rows, empty = 'Sin registros', loading }) => (
  <div style={{ overflowX: 'auto' }}>
    {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>Cargando...</p> : rows.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>{empty}</p> :
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
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
      <div><h2 style={{ fontSize: 20, fontWeight: 700, color: '#111827', margin: '0 0 4px' }}>Bienvenido 👋</h2><p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>Resumen general del sistema Purafruta</p></div>
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
      <Tabs tabs={[['lista','Lista de compras'],['nueva','Nueva compra'],['credito','💳 Créditos'],['proveedores','Proveedores'],['productos','Catálogo']]} active={tab} onChange={setTab} />
      {tab === 'lista' && <ListaCompras tok={tok} setTab={setTab} />}
      {tab === 'nueva' && <NuevaCompra tok={tok} onDone={() => setTab('lista')} />}
      {tab === 'credito' && <CreditosCompras tok={tok} />}
      {tab === 'proveedores' && <Proveedores tok={tok} />}
      {tab === 'productos' && <Productos tok={tok} />}
    </div>
  );
}

function ListaCompras({ tok, setTab }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [detalles, setDetalles] = useState({});
  const [loadingDet, setLoadingDet] = useState({});
  const [editando, setEditando] = useState(null);
  const [vista, setVista] = useState('general'); // general | personal
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const load = () => db.get('compras', 'order=fecha.desc,created_at.desc&limit=200&select=*,proveedores(nombre)', tok)
    .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });

  useEffect(() => { load(); }, [tok]);

  const toggleDetalle = async (r) => {
    if (expandido === r.id) { setExpandido(null); return; }
    setExpandido(r.id);
    if (!detalles[r.id]) {
      setLoadingDet(prev => ({ ...prev, [r.id]: true }));
      const det = await db.get('compras_detalle', `compra_id=eq.${r.id}&select=*,productos(nombre)`, tok);
      setDetalles(prev => ({ ...prev, [r.id]: Array.isArray(det) ? det : [] }));
      setLoadingDet(prev => ({ ...prev, [r.id]: false }));
    }
  };

  const eliminar = async (r) => {
    setDeleting(true);
    await fetch(`${SB_URL}/rest/v1/compras_detalle?compra_id=eq.${r.id}`, { method: 'DELETE', headers: hdr(tok) });
    await fetch(`${SB_URL}/rest/v1/compras?id=eq.${r.id}`, { method: 'DELETE', headers: hdr(tok) });
    setConfirmDel(null); setDeleting(false); load();
  };

  const ec = { pendiente: 'yellow', recibida: 'blue', verificada: 'green' };
  const mp = { contado: { label: '💵 Contado', bg: '#f0fdf4', color: '#15803d' }, credito: { label: '🗓 Crédito', bg: '#fefce8', color: '#a16207' } };

  // Filtrar por vista (general/personal) y por rango de fechas
  const filtradas = rows.filter(r => {
    const tipoR = r.tipo_compra || 'general';
    if (tipoR !== vista) return false;
    if (fechaDesde && r.fecha < fechaDesde) return false;
    if (fechaHasta && r.fecha > fechaHasta) return false;
    return true;
  });

  const totalGeneral = rows.filter(r => (r.tipo_compra || 'general') === 'general').length;
  const totalPersonal = rows.filter(r => r.tipo_compra === 'personal').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Selector de vista */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => setVista('general')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: vista === 'general' ? '#16a34a' : '#f3f4f6', color: vista === 'general' ? '#fff' : '#374151', fontWeight: 700, fontSize: 13 }}>
          📦 Compras de almacén ({totalGeneral})
        </button>
        <button onClick={() => setVista('personal')} style={{ flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer', background: vista === 'personal' ? '#a16207' : '#f3f4f6', color: vista === 'personal' ? '#fff' : '#374151', fontWeight: 700, fontSize: 13 }}>
          🏠 Compras personales ({totalPersonal})
        </button>
      </div>

      {vista === 'personal' && (
        <div style={{ background: '#fefce8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#a16207', fontWeight: 600 }}>
          ℹ️ Estas compras (Ña María / Sintia) no afectan el inventario de almacén.
        </div>
      )}

      <Card>
        <CardHead
          title="Compras registradas"
          sub="Clic en una fila para ver el detalle"
          action={
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#111827', background: '#fff', colorScheme: 'light' }} />
              <span style={{ fontSize: 12, color: '#9ca3af' }}>a</span>
              <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#111827', background: '#fff', colorScheme: 'light' }} />
              {(fechaDesde || fechaHasta) && (
                <button onClick={() => { setFechaDesde(''); setFechaHasta(''); }} style={{ background: '#f3f4f6', border: 'none', borderRadius: 8, padding: '6px 10px', fontSize: 12, color: '#6b7280', cursor: 'pointer' }}>✕ Limpiar</button>
              )}
            </div>
          }
        />
        {loading ? <p style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>Cargando...</p> :
          filtradas.length === 0 ? <p style={{ padding: 20, textAlign: 'center', color: '#9ca3af' }}>No hay compras en este filtro</p> :
          <div>
            {filtradas.map((r, i) => {
              const metodo = r.metodo_pago || 'contado';
              const vencido = metodo === 'credito' && r.fecha_vencimiento_pago && new Date(r.fecha_vencimiento_pago) < new Date() && r.estado_pago !== 'pagado';
              return (
                <div key={r.id} style={{ borderBottom: i < filtradas.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                  <div onClick={() => toggleDetalle(r)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', background: expandido === r.id ? '#f9fafb' : vencido ? '#fff5f5' : '#fff' }}>
                    <span style={{ fontSize: 16, color: '#9ca3af', flexShrink: 0 }}>{expandido === r.id ? '▾' : '▸'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>{r.proveedores?.nombre || '—'}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#15803d' }}>{gs(r.total)}</span>
                        {mp[metodo] && <span style={{ background: mp[metodo].bg, color: mp[metodo].color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{mp[metodo].label}</span>}
                        {vencido && <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>⚠️ VENCIDO</span>}
                        {metodo === 'credito' && r.estado_pago === 'pagado' && <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>✓ Pagado</span>}
                        {metodo === 'credito' && r.estado_pago === 'parcial' && <span style={{ background: '#fff7ed', color: '#c2410c', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>Pago parcial</span>}
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: '#9ca3af', flexWrap: 'wrap' }}>
                        <span>{fd(r.fecha)}</span>
                        {r.numero_factura && <span>Fact. {r.numero_factura}</span>}
                        {r.fecha_vencimiento_pago && metodo === 'credito' && <span style={{ color: vencido ? '#dc2626' : '#a16207' }}>Vence: {fd(r.fecha_vencimiento_pago)}</span>}
                        {r.observacion && <span>{r.observacion}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={e => { e.stopPropagation(); setEditando(r); }} style={{ background: '#eff6ff', color: '#1d4ed8', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✏️</button>
                      <button onClick={e => { e.stopPropagation(); setConfirmDel(r); }} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 7, padding: '5px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑</button>
                    </div>
                  </div>

                  {expandido === r.id && (
                    <div style={{ padding: '0 16px 14px 44px', background: '#f9fafb' }}>
                      {loadingDet[r.id] ? <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando...</p> :
                        (detalles[r.id] || []).length === 0 ? <p style={{ fontSize: 13, color: '#9ca3af' }}>Sin detalle registrado</p> :
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                          <thead><tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                            {['Producto','Cantidad','Unidad','Precio unit.','Subtotal','Destino'].map(h => (
                              <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                            ))}
                          </tr></thead>
                          <tbody>
                            {(detalles[r.id] || []).map((d, j) => (
                              <tr key={j} style={{ borderBottom: '1px solid #f3f4f6' }}>
                                <td style={{ padding: '8px 10px', fontWeight: 600, color: '#111827' }}>{d.productos?.nombre || '—'}</td>
                                <td style={{ padding: '8px 10px', color: '#374151' }}>{d.cantidad}</td>
                                <td style={{ padding: '8px 10px', color: '#6b7280' }}>{d.unidad}</td>
                                <td style={{ padding: '8px 10px', color: '#374151' }}>{gs(d.precio_unitario)}</td>
                                <td style={{ padding: '8px 10px', fontWeight: 700, color: '#15803d' }}>{gs(d.subtotal)}</td>
                                <td style={{ padding: '8px 10px' }}>
                                  <span style={{ background: d.destino === 'produccion' ? '#eff6ff' : '#f0fdf4', color: d.destino === 'produccion' ? '#1d4ed8' : '#15803d', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600 }}>
                                    {d.destino === 'produccion' ? '→ Producción' : '→ Almacén'}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot><tr style={{ borderTop: '2px solid #e5e7eb' }}>
                            <td colSpan={4} style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: '#374151' }}>TOTAL</td>
                            <td style={{ padding: '8px 10px', fontWeight: 800, color: '#15803d', fontSize: 15 }}>{gs(r.total)}</td>
                            <td></td>
                          </tr></tfoot>
                        </table>
                      }
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        }
      </Card>

      {/* Modal eliminar */}
      {confirmDel && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 400, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <p style={{ fontWeight: 800, fontSize: 17, color: '#111827', margin: '0 0 8px' }}>⚠️ Eliminar compra</p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>
              ¿Eliminar la compra de <strong>{confirmDel.proveedores?.nombre || 'este proveedor'}</strong> por <strong>{gs(confirmDel.total)}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => eliminar(confirmDel)} disabled={deleting} style={{ flex: 1, background: deleting ? '#fecaca' : '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                {deleting ? 'Eliminando...' : '🗑 Sí, eliminar'}
              </button>
              <button onClick={() => setConfirmDel(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal editar */}
      {editando && <ModalEditarCompra tok={tok} compra={editando} onClose={() => { setEditando(null); load(); }} />}
    </div>
  );
}


// ── MODAL EDITAR COMPRA ─────────────────────────────────────
function ModalEditarCompra({ tok, compra, onClose }) {
  const [provs, setProvs] = useState([]);
  const [prods, setProds] = useState([]);
  const [items, setItems] = useState([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [form, setForm] = useState({
    proveedor_id: compra.proveedor_id || '',
    fecha: compra.fecha || '',
    observacion: compra.observacion || '',
    metodo_pago: compra.metodo_pago || 'contado',
    fecha_vencimiento_pago: compra.fecha_vencimiento_pago || '',
    estado_pago: compra.estado_pago || 'pendiente',
    numero_factura: compra.numero_factura || '',
    tipo_compra: compra.tipo_compra || 'general',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    db.get('proveedores', 'order=nombre', tok).then(d => setProvs(Array.isArray(d) ? d : []));
    db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : []));
    db.get('compras_detalle', `compra_id=eq.${compra.id}&select=*,productos(nombre)`, tok).then(d => {
      const arr = Array.isArray(d) ? d : [];
      setItems(arr.map(it => ({
        id: it.id, producto_id: it.producto_id, nombre_libre: it.productos?.nombre || '',
        cantidad: String(it.cantidad), unidad: it.unidad, precio_unitario: String(it.precio_unitario),
        destino: it.destino || 'almacen', _sugs: [], _showSugs: false,
      })));
      setLoadingItems(false);
    });
  }, [tok, compra.id]);

  const upd = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };

  const buscarProd = (i, texto) => {
    const n = [...items];
    n[i].nombre_libre = texto;
    n[i].producto_id = '';
    n[i]._sugs = texto.length > 0 ? prods.filter(p => p.nombre.toLowerCase().includes(texto.toLowerCase())).slice(0, 6) : [];
    n[i]._showSugs = n[i]._sugs.length > 0;
    setItems(n);
  };

  const elegirProd = (i, prod) => {
    const n = [...items];
    n[i].nombre_libre = prod.nombre;
    n[i].producto_id = prod.id;
    n[i]._sugs = [];
    n[i]._showSugs = false;
    setItems(n);
  };

  const cerrarSugs = (i) => setTimeout(() => {
    const n = [...items];
    if (n[i]) { n[i]._showSugs = false; setItems(n); }
  }, 200);

  const addItem = () => setItems([...items, { id: null, producto_id: '', nombre_libre: '', cantidad: '', unidad: 'kg', precio_unitario: '', destino: 'almacen', _sugs: [], _showSugs: false }]);
  const removeItem = async (i) => {
    const it = items[i];
    if (it.id) await fetch(`${SB_URL}/rest/v1/compras_detalle?id=eq.${it.id}`, { method: 'DELETE', headers: hdr(tok) });
    setItems(items.filter((_, j) => j !== i));
  };

  const total = items.reduce((s, it) => s + parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0), 0);

  const guardar = async () => {
    setSaving(true);
    for (const it of items) {
      if (!it.producto_id && it.nombre_libre) {
        const existe = prods.find(p => p.nombre.toLowerCase() === it.nombre_libre.toLowerCase());
        if (existe) { it.producto_id = existe.id; }
        else {
          const res = await db.post('productos', { nombre: it.nombre_libre.trim(), unidad: it.unidad, activo: true, es_producido: false }, tok);
          const nuevo = Array.isArray(res) ? res[0] : res;
          it.producto_id = nuevo?.id || null;
        }
      }
      const subtotal = parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0);
      if (it.id) {
        await db.patch('compras_detalle', `id=eq.${it.id}`, {
          producto_id: it.producto_id, cantidad: parseFloat(it.cantidad), unidad: it.unidad,
          precio_unitario: parseFloat(it.precio_unitario || 0), subtotal, destino: it.destino,
        }, tok);
      } else {
        await db.post('compras_detalle', {
          compra_id: compra.id, producto_id: it.producto_id, cantidad: parseFloat(it.cantidad), unidad: it.unidad,
          precio_unitario: parseFloat(it.precio_unitario || 0), subtotal, destino: it.destino,
        }, tok);
      }
    }
    await db.patch('compras', `id=eq.${compra.id}`, {
      proveedor_id: form.proveedor_id, fecha: form.fecha, observacion: form.observacion,
      metodo_pago: form.metodo_pago,
      fecha_vencimiento_pago: form.metodo_pago === 'credito' ? form.fecha_vencimiento_pago || null : null,
      estado_pago: form.metodo_pago === 'credito' ? form.estado_pago : 'pagado',
      numero_factura: form.numero_factura, tipo_compra: form.tipo_compra, total,
    }, tok);
    setSaving(false);
    onClose();
  };

  const inp = { border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '11px 14px', fontSize: 14, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };
  const inpSm = { border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ background: '#fff', borderRadius: 18, width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
          <p style={{ fontWeight: 800, fontSize: 16, color: '#111827', margin: 0 }}>✏️ Editar compra</p>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 22, cursor: 'pointer', color: '#9ca3af' }}>×</button>
        </div>
        <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Proveedor</label>
            <select value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })} style={inp}>
              <option value="">Seleccionar...</option>
              {provs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Fecha</label>
              <input type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} style={inp} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>N° Factura</label>
              <input value={form.numero_factura} onChange={e => setForm({ ...form, numero_factura: e.target.value })} placeholder="Ej: 001-002-1234" style={inp} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Método de pago</label>
              <select value={form.metodo_pago} onChange={e => setForm({ ...form, metodo_pago: e.target.value })} style={inp}>
                <option value="contado">💵 Contado</option>
                <option value="credito">🗓 Crédito</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Tipo de compra</label>
            <select value={form.tipo_compra} onChange={e => setForm({ ...form, tipo_compra: e.target.value })} style={inp}>
              <option value="general">📦 General (impacta inventario)</option>
              <option value="personal">🏠 Personal (no afecta inventario)</option>
            </select>
          </div>
          {form.metodo_pago === 'credito' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, background: '#fefce8', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#a16207' }}>Fecha de vencimiento</label>
                <input type="date" value={form.fecha_vencimiento_pago} onChange={e => setForm({ ...form, fecha_vencimiento_pago: e.target.value })} style={inp} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#a16207' }}>Estado del crédito</label>
                <select value={form.estado_pago} onChange={e => setForm({ ...form, estado_pago: e.target.value })} style={inp}>
                  <option value="pendiente">⏳ Pendiente</option>
                  <option value="parcial">🔶 Pago parcial</option>
                  <option value="pagado">✅ Pagado</option>
                </select>
              </div>
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Observación</label>
            <input value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Opcional" style={inp} />
          </div>

          <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Productos</p>
              <button onClick={addItem} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Agregar</button>
            </div>
            {loadingItems ? <p style={{ fontSize: 13, color: '#9ca3af' }}>Cargando productos...</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {items.map((it, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 8, background: '#fafafa', padding: 10, borderRadius: 10 }}>
                    <div style={{ position: 'relative' }}>
                      <input value={it.nombre_libre || ''} onChange={e => buscarProd(i, e.target.value)} onBlur={() => cerrarSugs(i)} placeholder="Producto..." style={inpSm} />
                      {it._showSugs && (
                        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #16a34a', borderRadius: 8, zIndex: 50, maxHeight: 160, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                          {it._sugs.map(p => (
                            <div key={p.id} onMouseDown={() => elegirProd(i, p)} style={{ padding: '7px 10px', cursor: 'pointer', fontSize: 12, borderBottom: '1px solid #f3f4f6' }}>{p.nombre}</div>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="number" placeholder="Cant." value={it.cantidad} onChange={e => upd(i, 'cantidad', e.target.value)} style={inpSm} />
                    <select value={it.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={inpSm}>
                      {['kg','g','litro','ml','unidad','caja','bolsa','paquete','rollo'].map(u => <option key={u}>{u}</option>)}
                    </select>
                    <input type="number" placeholder="Precio" value={it.precio_unitario} onChange={e => upd(i, 'precio_unitario', e.target.value)} style={inpSm} />
                    <select value={it.destino} onChange={e => upd(i, 'destino', e.target.value)} style={inpSm}>
                      <option value="almacen">→ Almacén</option>
                      <option value="produccion">→ Producción</option>
                    </select>
                    <button onClick={() => removeItem(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 16 }}>✕</button>
                  </div>
                ))}
                {items.length > 0 && (
                  <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 15, color: '#111827', paddingTop: 6, borderTop: '1px solid #f3f4f6' }}>
                    Nuevo total: {gs(total)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, paddingTop: 4 }}>
            <button onClick={guardar} disabled={saving} style={{ flex: 1, background: saving ? '#86efac' : '#16a34a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
              {saving ? 'Guardando...' : '✓ Guardar cambios'}
            </button>
            <button onClick={onClose} style={{ background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb', borderRadius: 10, padding: '13px 18px', cursor: 'pointer' }}>Cancelar</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── CRÉDITOS DE COMPRAS ─────────────────────────────────────
function CreditosCompras({ tok }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('todos');

  useEffect(() => {
    db.get('compras', `metodo_pago=eq.credito&tipo_compra=eq.general&order=fecha_vencimiento_pago.asc&select=*,proveedores(nombre)`, tok)
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  }, [tok]);

  const hoy = new Date();
  const vencidas = rows.filter(r => r.estado_pago !== 'pagado' && r.fecha_vencimiento_pago && new Date(r.fecha_vencimiento_pago) < hoy);
  const pendientes = rows.filter(r => r.estado_pago === 'pendiente' && (!r.fecha_vencimiento_pago || new Date(r.fecha_vencimiento_pago) >= hoy));
  const parciales = rows.filter(r => r.estado_pago === 'parcial');
  const pagadas = rows.filter(r => r.estado_pago === 'pagado');

  const totalPendiente = [...vencidas, ...pendientes, ...parciales].reduce((s, r) => s + parseFloat(r.total || 0), 0);

  const filtradas = filtro === 'vencidas' ? vencidas : filtro === 'pendientes' ? pendientes : filtro === 'parciales' ? parciales : filtro === 'pagadas' ? pagadas : rows;

  const estadoStyle = {
    pendiente: { bg: '#fefce8', color: '#a16207', label: '⏳ Pendiente' },
    parcial: { bg: '#fff7ed', color: '#c2410c', label: '🔶 Parcial' },
    pagado: { bg: '#f0fdf4', color: '#15803d', label: '✅ Pagado' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          ['Total deuda', gs(totalPendiente), '#fef2f2', '#dc2626'],
          ['Vencidas', `${vencidas.length} compras`, '#fef2f2', '#dc2626'],
          ['Pendientes', `${pendientes.length} compras`, '#fefce8', '#a16207'],
          ['Parciales', `${parciales.length} compras`, '#fff7ed', '#c2410c'],
          ['Pagadas', `${pagadas.length} compras`, '#f0fdf4', '#15803d'],
        ].map(([label, val, bg, fg]) => (
          <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px' }}>
            <p style={{ fontSize: 11, color: fg, fontWeight: 700, margin: '0 0 4px', textTransform: 'uppercase' }}>{label}</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: fg, margin: 0 }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {[['todos','Todos'], ['vencidas','⚠️ Vencidas'], ['pendientes','⏳ Pendientes'], ['parciales','🔶 Parciales'], ['pagadas','✅ Pagadas']].map(([k, l]) => (
          <button key={k} onClick={() => setFiltro(k)} style={{ padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', background: filtro === k ? '#16a34a' : '#f3f4f6', color: filtro === k ? '#fff' : '#374151' }}>{l}</button>
        ))}
      </div>

      {/* Lista */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
        {loading ? <p style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>Cargando...</p> :
          filtradas.length === 0 ? <p style={{ padding: 30, textAlign: 'center', color: '#9ca3af' }}>Sin compras en esta categoría</p> :
          filtradas.map((r, i) => {
            const vencido = r.estado_pago !== 'pagado' && r.fecha_vencimiento_pago && new Date(r.fecha_vencimiento_pago) < hoy;
            const est = estadoStyle[r.estado_pago] || estadoStyle.pendiente;
            return (
              <div key={r.id} style={{ padding: '14px 18px', borderBottom: i < filtradas.length - 1 ? '1px solid #f3f4f6' : 'none', background: vencido ? '#fff5f5' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: 15, color: '#111827' }}>{r.proveedores?.nombre || '—'}</span>
                    <span style={{ background: est.bg, color: est.color, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>{est.label}</span>
                    {vencido && <span style={{ background: '#fef2f2', color: '#dc2626', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 700 }}>⚠️ VENCIDO</span>}
                  </div>
                  <div style={{ display: 'flex', gap: 14, fontSize: 12, color: '#9ca3af', flexWrap: 'wrap' }}>
                    <span>Fecha compra: {fd(r.fecha)}</span>
                    {r.fecha_vencimiento_pago && <span style={{ color: vencido ? '#dc2626' : '#a16207', fontWeight: 600 }}>Vence: {fd(r.fecha_vencimiento_pago)}</span>}
                    {r.observacion && <span>{r.observacion}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontWeight: 800, fontSize: 17, color: r.estado_pago === 'pagado' ? '#15803d' : '#dc2626', margin: '0 0 4px' }}>{gs(r.total)}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: 0 }}>{fd(r.fecha)}</p>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}


function NuevaCompra({ tok, onDone }) {
  const [provs, setProvs] = useState([]); const [prods, setProds] = useState([]);
  const [form, setForm] = useState({ proveedor_id: '', fecha: new Date().toISOString().split('T')[0], observacion: '', numero_factura: '', tipo_compra: 'general' });
  const [items, setItems] = useState([]); const [saving, setSaving] = useState(false); const [err, setErr] = useState('');
  const [confirmDup, setConfirmDup] = useState(null); // compra existente sospechada de duplicado

  useEffect(() => { db.get('proveedores', 'activo=eq.true&order=nombre', tok).then(d => setProvs(Array.isArray(d) ? d : [])); db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : [])); }, [tok]);
  const emptyItem = () => ({ producto_id: '', nombre_libre: '', cantidad: '', unidad: 'kg', precio_unitario: '', destino: 'almacen', _sugs: [], _showSugs: false });
  const addItem = () => setItems([...items, emptyItem()]);
  const upd = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };
  const total = items.reduce((s, it) => s + parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0), 0);

  const buscarProd = (i, texto) => {
    const n = [...items];
    n[i].nombre_libre = texto;
    n[i].producto_id = '';
    n[i]._sugs = texto.length > 0 ? prods.filter(p => p.nombre.toLowerCase().includes(texto.toLowerCase())).slice(0, 6) : [];
    n[i]._showSugs = n[i]._sugs.length > 0;
    setItems(n);
  };

  const elegirProd = (i, prod) => {
    const n = [...items];
    n[i].nombre_libre = prod.nombre;
    n[i].producto_id = prod.id;
    n[i]._sugs = [];
    n[i]._showSugs = false;
    setItems(n);
  };

  const cerrarSugs = (i) => setTimeout(() => {
    const n = [...items];
    if (n[i]) { n[i]._showSugs = false; setItems(n); }
  }, 200);

  // Verificar si ya existe una compra muy similar (mismo proveedor + fecha + total)
  const checkDuplicado = async () => {
    const existentes = await db.get('compras', `proveedor_id=eq.${form.proveedor_id}&fecha=eq.${form.fecha}`, tok);
    if (!Array.isArray(existentes)) return null;
    const match = existentes.find(c => Math.abs(parseFloat(c.total) - total) < 1);
    return match || null;
  };

  const procederGuardar = async () => {
    setSaving(true); setErr('');
    const itemsResueltos = [];
    for (const it of items) {
      let pid = it.producto_id;
      if (!pid && it.nombre_libre) {
        const existe = prods.find(p => p.nombre.toLowerCase() === it.nombre_libre.toLowerCase());
        if (existe) { pid = existe.id; }
        else {
          const res = await db.post('productos', { nombre: it.nombre_libre.trim(), unidad: it.unidad, activo: true, es_producido: false }, tok);
          const nuevo = Array.isArray(res) ? res[0] : res;
          pid = nuevo?.id || null;
        }
      }
      itemsResueltos.push({ ...it, producto_id: pid, subtotal: parseFloat(it.cantidad || 0) * parseFloat(it.precio_unitario || 0) });
    }
    const res = await db.post('compras', { ...form, total }, tok);
    const compra = Array.isArray(res) ? res[0] : res;
    if (compra?.id) {
      await db.post('compras_detalle', itemsResueltos.map(it => ({
        compra_id: compra.id, producto_id: it.producto_id, cantidad: parseFloat(it.cantidad),
        unidad: it.unidad, precio_unitario: parseFloat(it.precio_unitario || 0),
        subtotal: it.subtotal, destino: it.destino,
      })), tok);
      onDone();
    } else { setErr('Error al guardar. Verificá los datos.'); setSaving(false); }
  };

  const guardar = async () => {
    if (!form.proveedor_id) { setErr('Seleccioná un proveedor'); return; }
    if (items.length === 0) { setErr('Agregá al menos un producto'); return; }
    if (items.some(it => !it.nombre_libre || !it.cantidad)) { setErr('Completá nombre y cantidad de todos los productos'); return; }
    setErr('');

    const dup = await checkDuplicado();
    if (dup) { setConfirmDup(dup); return; }

    procederGuardar();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Card>
        <CardHead title="Datos de la compra" />
        <div style={{ padding: 18 }}>
          <Grid cols={3}>
            <Select label="Proveedor *" value={form.proveedor_id} onChange={e => setForm({ ...form, proveedor_id: e.target.value })}>
              <option value="">Seleccionar...</option>
              {provs.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
            <Input label="Fecha" type="date" value={form.fecha} onChange={e => setForm({ ...form, fecha: e.target.value })} />
            <Input label="N° de factura" value={form.numero_factura} onChange={e => setForm({ ...form, numero_factura: e.target.value })} placeholder="Ej: 001-002-0001234" />
          </Grid>
          <div style={{ marginTop: 14 }}>
            <Grid cols={2}>
              <Select label="Tipo de compra *" value={form.tipo_compra} onChange={e => setForm({ ...form, tipo_compra: e.target.value })}>
                <option value="general">📦 General (impacta inventario)</option>
                <option value="personal">🏠 Personal (Ña María / Sintia — no afecta inventario)</option>
              </Select>
              <Input label="Observación" value={form.observacion} onChange={e => setForm({ ...form, observacion: e.target.value })} placeholder="Opcional" />
            </Grid>
          </div>
          {form.tipo_compra === 'personal' && (
            <div style={{ marginTop: 12, background: '#fefce8', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#a16207', fontWeight: 600 }}>
              ⚠️ Esta compra se registrará por separado y NO sumará al inventario de almacén.
            </div>
          )}
        </div>
      </Card>
      <Card>
        <CardHead title="Productos comprados" action={<Btn variant="ghost" onClick={addItem}><Plus size={14} />Agregar</Btn>} />
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {items.length === 0 && <p style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14, padding: '20px 0' }}>Hacé clic en "Agregar" para sumar productos</p>}
          {items.map((it, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr auto', gap: 8, background: '#fafafa', padding: 12, borderRadius: 10 }}>
              <div style={{ position: 'relative' }}>
                <input value={it.nombre_libre || ''} onChange={e => buscarProd(i, e.target.value)} onBlur={() => cerrarSugs(i)} placeholder="Escribir o buscar producto..." style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
                {it._showSugs && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #16a34a', borderRadius: 8, zIndex: 50, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    {it._sugs.map(p => (
                      <div key={p.id} onMouseDown={() => elegirProd(i, p)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f3f4f6', color: '#111827' }} onMouseEnter={e => e.currentTarget.style.background='#f0fdf4'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>{p.nombre}</div>
                    ))}
                  </div>
                )}
                {it.nombre_libre && <p style={{ fontSize: 10, margin: '2px 0 0', color: it.producto_id ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{it.producto_id ? '✓ Producto existente' : '✚ Se creará como nuevo'}</p>}
              </div>
              <input type="number" placeholder="Cantidad" value={it.cantidad} onChange={e => upd(i, 'cantidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }} />
              <select value={it.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }}>{['kg','g','litro','ml','unidad','caja','bolsa','paquete','rollo'].map(u => <option key={u}>{u}</option>)}</select>
              <input type="number" placeholder="Precio unit." value={it.precio_unitario} onChange={e => upd(i, 'precio_unitario', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }} />
              <select value={it.destino} onChange={e => upd(i, 'destino', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }}><option value="almacen">→ Almacén</option><option value="produccion">→ Producción</option></select>
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

      {/* Modal aviso de posible duplicado */}
      {confirmDup && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,0.2)' }}>
            <p style={{ fontWeight: 800, fontSize: 17, color: '#111827', margin: '0 0 8px' }}>⚠️ Posible compra duplicada</p>
            <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 10px' }}>
              Ya existe una compra registrada con el mismo proveedor, fecha y monto:
            </p>
            <div style={{ background: '#fefce8', borderRadius: 10, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#a16207' }}>
              <strong>{gs(confirmDup.total)}</strong> · {fd(confirmDup.fecha)} {confirmDup.numero_factura ? `· Fact. ${confirmDup.numero_factura}` : ''}
            </div>
            <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>¿Querés registrar esta compra de todas formas?</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => { setConfirmDup(null); procederGuardar(); }} style={{ flex: 1, background: '#f59e0b', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
                Sí, registrar igual
              </button>
              <button onClick={() => setConfirmDup(null)} style={{ background: '#f3f4f6', color: '#374151', border: 'none', borderRadius: 10, padding: '12px 20px', fontSize: 14, cursor: 'pointer' }}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Proveedores({ tok }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ nombre: '', ruc: '', contacto: '', tipo: 'general' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [confirmDel, setConfirmDel] = useState(null);

  const load = () => db.get('proveedores', 'order=nombre', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  useEffect(() => { load(); }, [tok]);

  const guardar = async () => {
    if (!form.nombre.trim()) { setErr('El nombre es obligatorio'); return; }
    // Validar duplicado por nombre
    const nombreNorm = form.nombre.trim().toLowerCase();
    const duplicadoNombre = rows.find(r => r.nombre.toLowerCase() === nombreNorm);
    if (duplicadoNombre) { setErr(`Ya existe un proveedor con el nombre "${duplicadoNombre.nombre}"`); return; }
    // Validar duplicado por RUC
    if (form.ruc.trim()) {
      const duplicadoRUC = rows.find(r => r.ruc && r.ruc.replace(/-/g,'') === form.ruc.trim().replace(/-/g,''));
      if (duplicadoRUC) { setErr(`El RUC ya está registrado para "${duplicadoRUC.nombre}"`); return; }
    }
    setSaving(true); setErr('');
    await db.post('proveedores', { ...form, nombre: form.nombre.trim() }, tok);
    setForm({ nombre: '', ruc: '', contacto: '', tipo: 'general' });
    setShow(false); setSaving(false); load();
  };

  const eliminar = async (r) => {
    await fetch(`${SB_URL}/rest/v1/proveedores?id=eq.${r.id}`, { method: 'DELETE', headers: hdr(tok) });
    setConfirmDel(null); load();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card>
        <CardHead title="Proveedores" sub={`${rows.length} registrados`} action={<Btn variant="ghost" onClick={() => { setShow(!show); setErr(''); }}><Plus size={14} />Nuevo</Btn>} />

        {show && (
          <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Grid cols={4}>
              <Input label="Nombre *" value={form.nombre} onChange={e => { setForm({ ...form, nombre: e.target.value }); setErr(''); }} placeholder="Nombre del proveedor" />
              <Input label="RUC" value={form.ruc} onChange={e => { setForm({ ...form, ruc: e.target.value }); setErr(''); }} placeholder="Ej: 80012345-6" />
              <Input label="Contacto / Tel." value={form.contacto} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Teléfono" />
              <Select label="Tipo" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })}>
                <option value="general">General (pasa por almacén)</option>
                <option value="sucursal">Sucursal (directo al local)</option>
              </Select>
            </Grid>
            {err && <p style={{ color: '#dc2626', fontSize: 13, margin: 0, background: '#fef2f2', padding: '8px 12px', borderRadius: 8 }}>⚠️ {err}</p>}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={guardar} disabled={saving || !form.nombre}>{saving ? 'Guardando...' : 'Guardar'}</Btn>
              <Btn variant="secondary" onClick={() => { setShow(false); setErr(''); }}>Cancelar</Btn>
            </div>
          </div>
        )}

        {/* Modal eliminar */}
        {confirmDel && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 380, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 8px' }}>¿Eliminar proveedor?</p>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 20px' }}>
                Se eliminará <strong>{confirmDel.nombre}</strong>. Las compras asociadas no se eliminarán.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => eliminar(confirmDel)} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                  Sí, eliminar
                </button>
                <Btn variant="secondary" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Tabla */}
        <div style={{ overflowX: 'auto' }}>
          {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
            rows.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No hay proveedores registrados</p> :
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Nombre', 'RUC', 'Contacto', 'Tipo', ''].map((c, i) => (
                    <th key={i} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .5 }}>{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={{ padding: '11px 18px', fontWeight: 600, color: '#111827' }}>{r.nombre}</td>
                    <td style={{ padding: '11px 18px', color: '#6b7280' }}>{r.ruc || '—'}</td>
                    <td style={{ padding: '11px 18px', color: '#6b7280' }}>{r.contacto || '—'}</td>
                    <td style={{ padding: '11px 18px' }}><Badge color={r.tipo === 'general' ? 'blue' : 'purple'}>{r.tipo === 'general' ? 'General' : 'Sucursal'}</Badge></td>
                    <td style={{ padding: '11px 18px' }}>
                      <button onClick={() => setConfirmDel(r)} style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer' }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          }
        </div>
      </Card>
    </div>
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
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [sortCol, setSortCol] = useState('nombre');
  const [sortDir, setSortDir] = useState('asc');
  const [showAdd, setShowAdd] = useState(false);
  const [ajusteId, setAjusteId] = useState(null);
  const [ajusteVal, setAjusteVal] = useState('');
  const [saving, setSaving] = useState(false);
  const [cats, setCats] = useState([]);
  const [formProd, setFormProd] = useState({ nombre: '', unidad: 'kg', categoria_id: '', stock_inicial: '0' });

  const load = () => {
    Promise.all([
      db.get('almacen_inventario', 'select=id,stock_actual,stock_minimo,producto_id,productos(nombre,unidad)', tok),
      db.get('categorias', 'order=nombre', tok)
    ]).then(([d, c]) => {
      setRows(Array.isArray(d) ? d : []);
      setCats(Array.isArray(c) ? c : []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [tok]);

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('asc'); }
  };

  const filtrados = rows
    .filter(r => r.productos?.nombre?.toLowerCase().includes(busqueda.toLowerCase()))
    .sort((a, b) => {
      let va, vb;
      if (sortCol === 'nombre') { va = a.productos?.nombre || ''; vb = b.productos?.nombre || ''; }
      else if (sortCol === 'stock') { va = parseFloat(a.stock_actual) || 0; vb = parseFloat(b.stock_actual) || 0; }
      else if (sortCol === 'unidad') { va = a.productos?.unidad || ''; vb = b.productos?.unidad || ''; }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const SortTh = ({ col, label }) => (
    <th onClick={() => toggleSort(col)} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: sortCol === col ? '#16a34a' : '#9ca3af', textTransform: 'uppercase', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}>
      {label} {sortCol === col ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
    </th>
  );

  const guardarAjuste = async (id) => {
    if (ajusteVal === '') return;
    setSaving(true);
    await db.patch('almacen_inventario', `id=eq.${id}`, { stock_actual: parseFloat(ajusteVal) }, tok);
    setAjusteId(null); setAjusteVal(''); setSaving(false); load();
  };

  const agregarProducto = async () => {
    if (!formProd.nombre) return;
    setSaving(true);
    const res = await db.post('productos', {
      nombre: formProd.nombre,
      unidad: formProd.unidad,
      categoria_id: formProd.categoria_id || null,
      activo: true
    }, tok);
    const prod = Array.isArray(res) ? res[0] : res;
    if (prod?.id) {
      await db.post('almacen_inventario', {
        producto_id: prod.id,
        stock_actual: parseFloat(formProd.stock_inicial) || 0,
        stock_minimo: 0
      }, tok);
    }
    setFormProd({ nombre: '', unidad: 'kg', categoria_id: '', stock_inicial: '0' });
    setShowAdd(false); setSaving(false); load();
  };

  return (
    <Card>
      <CardHead
        title={`Inventario de almacén${rows.length > 0 ? ' (' + rows.length + ' productos)' : ''}`}
        action={<Btn variant="ghost" onClick={() => setShowAdd(!showAdd)}><Plus size={14} />Agregar producto</Btn>}
      />

      {showAdd && (
        <div style={{ padding: 16, background: '#f9fafb', borderBottom: '1px solid #f3f4f6' }}>
          <Grid cols={4}>
            <Input label="Nombre *" value={formProd.nombre} onChange={e => setFormProd({ ...formProd, nombre: e.target.value })} placeholder="Nombre del producto" />
            <Select label="Unidad" value={formProd.unidad} onChange={e => setFormProd({ ...formProd, unidad: e.target.value })}>
              {['kg','g','litro','ml','unidad','caja','bolsa','paquete','rollo'].map(u => <option key={u}>{u}</option>)}
            </Select>
            <Select label="Categoría" value={formProd.categoria_id} onChange={e => setFormProd({ ...formProd, categoria_id: e.target.value })}>
              <option value="">Sin categoría</option>
              {cats.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </Select>
            <Input label="Stock inicial" type="number" value={formProd.stock_inicial} onChange={e => setFormProd({ ...formProd, stock_inicial: e.target.value })} placeholder="0" />
          </Grid>
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <Btn onClick={agregarProducto} disabled={saving || !formProd.nombre}>{saving ? 'Guardando...' : 'Guardar producto'}</Btn>
            <Btn variant="secondary" onClick={() => setShowAdd(false)}>Cancelar</Btn>
          </div>
        </div>
      )}

      <div style={{ padding: '12px 18px', borderBottom: '1px solid #f3f4f6' }}>
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar producto..." style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, width: '100%', color: '#111827', background: '#fff', boxSizing: 'border-box', outline: 'none' }} />
      </div>

      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
        filtrados.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Sin resultados</p> :
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
                <SortTh col="nombre" label="Producto" />
                <SortTh col="stock" label="Stock actual" />
                <SortTh col="unidad" label="Unidad" />
                <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Estado</th>
                <th style={{ padding: '7px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>Ajuste</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((r, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '6px 14px', fontWeight: 600, color: '#111827', fontSize: 13, textTransform: 'uppercase', textAlign: 'left' }}>{r.productos?.nombre}</td>
                  <td style={{ padding: '6px 14px', fontWeight: 600, color: '#111827', fontSize: 13 }}>
                    {ajusteId === r.id ? (
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <input type="number" value={ajusteVal} onChange={e => setAjusteVal(e.target.value)}
                          style={{ border: '1.5px solid #16a34a', borderRadius: 6, padding: '3px 7px', fontSize: 13, width: 70, color: '#111827' }} autoFocus />
                        <button onClick={() => guardarAjuste(r.id)} style={{ background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, padding: '3px 9px', fontSize: 12, cursor: 'pointer' }}>✓</button>
                        <button onClick={() => { setAjusteId(null); setAjusteVal(''); }} style={{ background: '#f3f4f6', color: '#6b7280', border: 'none', borderRadius: 6, padding: '3px 7px', fontSize: 12, cursor: 'pointer' }}>✕</button>
                      </div>
                    ) : r.stock_actual}
                  </td>
                  <td style={{ padding: '6px 14px', color: '#6b7280', fontSize: 13 }}>{r.productos?.unidad}</td>
                  <td style={{ padding: '6px 14px' }}>
                    <Badge color={parseFloat(r.stock_actual) === 0 ? 'yellow' : 'green'}>
                      {parseFloat(r.stock_actual) === 0 ? 'Sin stock' : 'OK'}
                    </Badge>
                  </td>
                  <td style={{ padding: '6px 14px' }}>
                    {ajusteId !== r.id && (
                      <button onClick={() => { setAjusteId(r.id); setAjusteVal(r.stock_actual); }}
                        style={{ background: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', borderRadius: 6, padding: '3px 9px', fontSize: 12, cursor: 'pointer' }}>
                        Ajustar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      }
    </Card>
  );
}

function Remisiones({ tok }) {
  const [rows, setRows] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { db.get('remisiones', 'order=created_at.desc&select=*,sucursales(nombre)', tok).then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); }); }, [tok]);
  const ec = { preparando: 'yellow', enviada: 'blue', recibida: 'green', con_diferencia: 'red' };
  return <Card><CardHead title="Remisiones" /><Table loading={loading} cols={['Fecha','Sucursal','Estado','Observación']} empty="No hay remisiones registradas" rows={rows.map(r => [fd(r.fecha), r.sucursales?.nombre, <Badge color={ec[r.estado]}>{r.estado.replace('_',' ')}</Badge>, r.observacion || '—'])} /></Card>;
}

function Salidas({ tok }) {
  const [grupos, setGrupos] = useState([]);
  const [prods, setProds] = useState([]);
  const [sucs, setSucs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [show, setShow] = useState(false);
  const [expandido, setExpandido] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  // Formulario de nueva salida
  const emptyHead = { fecha: new Date().toISOString().split('T')[0], tipo_salida: 'salida', destino: 'produccion', sucursal_id: '', responsable: '' };
  const emptyItem = () => ({ producto_id: '', cantidad: '', unidad: 'unidad' });
  const [head, setHead] = useState(emptyHead);
  const [items, setItems] = useState([emptyItem()]);

  const load = () => Promise.all([
    db.get('salidas_almacen', 'order=fecha.desc,created_at.desc&limit=100&select=*,productos(nombre)', tok),
    db.get('productos', 'activo=eq.true&order=nombre', tok),
    db.get('sucursales', 'activa=eq.true', tok),
  ]).then(([s, p, su]) => {
    // Agrupar salidas por grupo_salida_id (si existe) o mostrar individualmente
    const arr = Array.isArray(s) ? s : [];
    const map = {};
    arr.forEach(r => {
      const key = r.grupo_salida_id || r.id;
      if (!map[key]) map[key] = { id: key, fecha: r.fecha, tipo_salida: r.tipo_salida, destino: r.destino, responsable: r.responsable, sucursal_id: r.sucursal_id, created_at: r.created_at, items: [] };
      map[key].items.push(r);
    });
    setGrupos(Object.values(map).sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
    setProds(Array.isArray(p) ? p : []);
    setSucs(Array.isArray(su) ? su : []);
    setLoading(false);
  });

  useEffect(() => { load(); }, [tok]);

  const addItem = () => setItems([...items, emptyItem()]);
  const updItem = (i, k, v) => { const n = [...items]; n[i][k] = v; setItems(n); };
  const removeItem = (i) => setItems(items.filter((_, idx) => idx !== i));

  const guardar = async () => {
    if (!head.responsable) { setErr('Ingresá el responsable'); return; }
    if (items.some(it => !it.producto_id || !it.cantidad)) { setErr('Completá todos los productos y cantidades'); return; }
    setSaving(true); setErr('');

    // Generar un ID de grupo para vincular todas las filas de esta salida
    const grupoId = crypto.randomUUID();

    for (const it of items) {
      // Guardar la salida
      await db.post('salidas_almacen', {
        grupo_salida_id: grupoId,
        producto_id: it.producto_id,
        cantidad: parseFloat(it.cantidad),
        unidad: it.unidad,
        fecha: head.fecha,
        tipo_salida: head.tipo_salida,
        destino: head.destino,
        sucursal_id: head.sucursal_id || null,
        responsable: head.responsable,
      }, tok);

      // Descontar del inventario de almacén
      const inv = await db.get('almacen_inventario', `producto_id=eq.${it.producto_id}`, tok);
      if (Array.isArray(inv) && inv[0]) {
        const nuevo = Math.max(0, parseFloat(inv[0].stock_actual) - parseFloat(it.cantidad));
        await db.patch('almacen_inventario', `producto_id=eq.${it.producto_id}`, { stock_actual: nuevo, ultima_actualizacion: new Date().toISOString() }, tok);
      }
    }

    setHead(emptyHead);
    setItems([emptyItem()]);
    setShow(false);
    setSaving(false);
    load();
  };

  const eliminarGrupo = async (grupo) => {
    for (const r of grupo.items) {
      const inv = await db.get('almacen_inventario', `producto_id=eq.${r.producto_id}`, tok);
      if (Array.isArray(inv) && inv[0]) {
        await db.patch('almacen_inventario', `producto_id=eq.${r.producto_id}`,
          { stock_actual: parseFloat(inv[0].stock_actual) + parseFloat(r.cantidad), ultima_actualizacion: new Date().toISOString() }, tok);
      }
      await db.del('salidas_almacen', `id=eq.${r.id}`, tok);
    }
    setConfirmDel(null);
    load();
  };

  const prodNombre = (id) => prods.find(p => p.id === id)?.nombre || '—';
  const sucNombre = (id) => sucs.find(s => s.id === id)?.nombre || null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <Card>
        <CardHead
          title="Salidas de almacén"
          action={<Btn variant="ghost" onClick={() => { setShow(!show); setErr(''); }}><Plus size={14} />Nueva salida</Btn>}
        />

        {/* Formulario nueva salida */}
        {show && (
          <div style={{ padding: 18, background: '#f9fafb', borderBottom: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p style={{ fontWeight: 700, fontSize: 14, color: '#111827', margin: 0 }}>Nueva salida de almacén</p>

            {/* Datos generales */}
            <Grid cols={3}>
              <Input label="Fecha *" type="date" value={head.fecha} onChange={e => setHead({ ...head, fecha: e.target.value })} />
              <Select label="Tipo de salida *" value={head.tipo_salida} onChange={e => setHead({ ...head, tipo_salida: e.target.value })}>
                <option value="salida">Salida normal</option>
                <option value="consumo">Consumo interno</option>
              </Select>
              <Select label="Destino *" value={head.destino} onChange={e => setHead({ ...head, destino: e.target.value })}>
                <option value="produccion">→ Producción</option>
                <option value="sucursal">→ Sucursal</option>
              </Select>
              {head.destino === 'sucursal' && (
                <Select label="Sucursal" value={head.sucursal_id} onChange={e => setHead({ ...head, sucursal_id: e.target.value })}>
                  <option value="">Seleccionar...</option>
                  {sucs.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </Select>
              )}
              <Input label="Responsable *" value={head.responsable} onChange={e => setHead({ ...head, responsable: e.target.value })} placeholder="Nombre del personal" />
            </Grid>

            {/* Líneas de productos */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontWeight: 600, fontSize: 13, color: '#374151', margin: 0 }}>Productos</p>
                <button onClick={addItem} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 7, padding: '6px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>+ Agregar producto</button>
              </div>
              {items.map((it, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 10, border: '1px solid #e5e7eb', padding: 12, display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' }}>
                  <div style={{ flex: 2, minWidth: 160 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Producto *</label>
                    <select value={it.producto_id} onChange={e => updItem(i, 'producto_id', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#111827', width: '100%', outline: 'none' }}>
                      <option value="">Seleccionar...</option>
                      {prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div style={{ flex: 1, minWidth: 90 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Cantidad *</label>
                    <input type="number" value={it.cantidad} onChange={e => updItem(i, 'cantidad', e.target.value)} placeholder="0" style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#111827', width: '100%', outline: 'none', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 90 }}>
                    <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Unidad</label>
                    <select value={it.unidad} onChange={e => updItem(i, 'unidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#111827', width: '100%', outline: 'none' }}>
                      {['kg','g','litro','ml','unidad','caja','bolsa','paquete'].map(u => <option key={u}>{u}</option>)}
                    </select>
                  </div>
                  {items.length > 1 && (
                    <button onClick={() => removeItem(i)} style={{ background: '#fef2f2', color: '#dc2626', border: 'none', borderRadius: 8, padding: '9px 12px', fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>✕</button>
                  )}
                </div>
              ))}
            </div>

            {err && <p style={{ color: '#dc2626', fontSize: 13, margin: 0 }}>⚠️ {err}</p>}

            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={guardar} disabled={saving}>
                {saving ? 'Registrando...' : `Registrar salida (${items.length} producto${items.length > 1 ? 's' : ''})`}
              </Btn>
              <Btn variant="secondary" onClick={() => { setShow(false); setErr(''); }}>Cancelar</Btn>
            </div>
          </div>
        )}

        {/* Modal confirmación eliminar */}
        {confirmDel && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ background: '#fff', borderRadius: 16, padding: 28, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
              <p style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: '0 0 8px' }}>¿Eliminar esta salida?</p>
              <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 6px' }}>
                {confirmDel.items.length} producto{confirmDel.items.length > 1 ? 's' : ''} · {fd(confirmDel.fecha)} · {confirmDel.responsable}
              </p>
              <p style={{ fontSize: 13, color: '#16a34a', margin: '0 0 20px', background: '#f0fdf4', padding: '8px 12px', borderRadius: 8 }}>
                ✓ El stock de todos los productos se reintegrará automáticamente.
              </p>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn variant="danger" onClick={() => eliminarGrupo(confirmDel)}>Sí, eliminar</Btn>
                <Btn variant="secondary" onClick={() => setConfirmDel(null)}>Cancelar</Btn>
              </div>
            </div>
          </div>
        )}

        {/* Lista de salidas agrupadas */}
        <div>
          {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
            grupos.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Sin salidas registradas</p> :
            grupos.map((g, i) => (
              <div key={g.id} style={{ borderBottom: i < grupos.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
                {/* Fila principal */}
                <div
                  style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, cursor: 'pointer', background: expandido === g.id ? '#fafafa' : '#fff' }}
                  onClick={() => setExpandido(expandido === g.id ? null : g.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                    <span style={{ fontSize: 18 }}>{expandido === g.id ? '▾' : '▸'}</span>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111827' }}>{fd(g.fecha)}</span>
                        <Badge color={g.tipo_salida === 'consumo' ? 'orange' : 'blue'}>{g.tipo_salida || 'salida'}</Badge>
                        <Badge color={g.destino === 'produccion' ? 'blue' : 'purple'}>{g.destino}{sucNombre(g.sucursal_id) ? ` — ${sucNombre(g.sucursal_id)}` : ''}</Badge>
                        <span style={{ background: '#f3f4f6', borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: '#374151' }}>
                          {g.items.length} producto{g.items.length > 1 ? 's' : ''}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>Responsable: {g.responsable || '—'}</p>
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setConfirmDel(g); }}
                    style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 6, padding: '5px 12px', fontSize: 12, cursor: 'pointer', flexShrink: 0 }}
                  >
                    Eliminar
                  </button>
                </div>

                {/* Detalle expandido */}
                {expandido === g.id && (
                  <div style={{ padding: '0 18px 14px 50px', background: '#fafafa' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                          {['Producto', 'Cantidad', 'Unidad'].map(h => (
                            <th key={h} style={{ padding: '6px 10px', textAlign: 'left', fontSize: 11, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {g.items.map((r, j) => (
                          <tr key={j} style={{ borderBottom: '1px solid #f3f4f6' }}>
                            <td style={{ padding: '8px 10px', fontWeight: 600, color: '#111827' }}>{r.productos?.nombre || prodNombre(r.producto_id)}</td>
                            <td style={{ padding: '8px 10px', color: '#374151' }}>{r.cantidad}</td>
                            <td style={{ padding: '8px 10px', color: '#6b7280' }}>{r.unidad}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          }
        </div>
      </Card>
    </div>
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
                <div style={{ position: 'relative' }}>
                <input value={it.nombre_libre || ''} onChange={e => buscarProd(i, e.target.value)} onBlur={() => cerrarSugs(i)} placeholder="Escribir o buscar producto..." style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
                {it._showSugs && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #16a34a', borderRadius: 8, zIndex: 50, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    {it._sugs.map(p => (
                      <div key={p.id} onMouseDown={() => elegirProd(i, p)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f3f4f6', color: '#111827' }} onMouseEnter={e => e.currentTarget.style.background='#f0fdf4'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>{p.nombre}</div>
                    ))}
                  </div>
                )}
                {it.nombre_libre && <p style={{ fontSize: 10, margin: '2px 0 0', color: it.producto_id ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{it.producto_id ? '✓ Producto existente' : '✚ Se creará como nuevo'}</p>}
              </div>
                <input type="number" placeholder="Cantidad" value={it.cantidad_producida} onChange={e => upd(i, 'cantidad_producida', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }} />
                <input type="number" placeholder="Peso paq. (kg)" value={it.peso_paquete} onChange={e => upd(i, 'peso_paquete', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }} />
                <select value={it.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }}>{['kg','g','unidad','paquete'].map(u => <option key={u}>{u}</option>)}</select>
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
        {ok && <div style={{ margin: '12px 16px', padding: 12, background: '#f0fdf4', color: '#111827', borderRadius: 10, color: '#15803d', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}><Check size={16} />Venta registrada correctamente</div>}
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
function PedidosModule({ tok, perfil }) {
  const [rows, setRows] = useState([]); const [sucs, setSucs] = useState([]); const [prods, setProds] = useState([]); const [loading, setLoading] = useState(true); const [show, setShow] = useState(false);
  const [form, setForm] = useState({ sucursal_id: perfil?.sucursal_id || '', destino: 'almacen', observacion: '' }); const [items, setItems] = useState([]); const [saving, setSaving] = useState(false);
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
                  <div style={{ position: 'relative' }}>
                <input value={it.nombre_libre || ''} onChange={e => buscarProd(i, e.target.value)} onBlur={() => cerrarSugs(i)} placeholder="Escribir o buscar producto..." style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff', width: '100%', boxSizing: 'border-box', outline: 'none' }} />
                {it._showSugs && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', border: '1.5px solid #16a34a', borderRadius: 8, zIndex: 50, maxHeight: 180, overflowY: 'auto', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
                    {it._sugs.map(p => (
                      <div key={p.id} onMouseDown={() => elegirProd(i, p)} style={{ padding: '8px 12px', cursor: 'pointer', fontSize: 13, borderBottom: '1px solid #f3f4f6', color: '#111827' }} onMouseEnter={e => e.currentTarget.style.background='#f0fdf4'} onMouseLeave={e => e.currentTarget.style.background='#fff'}>{p.nombre}</div>
                    ))}
                  </div>
                )}
                {it.nombre_libre && <p style={{ fontSize: 10, margin: '2px 0 0', color: it.producto_id ? '#16a34a' : '#f59e0b', fontWeight: 600 }}>{it.producto_id ? '✓ Producto existente' : '✚ Se creará como nuevo'}</p>}
              </div>
                  <input type="number" placeholder="Cantidad" value={it.cantidad_solicitada} onChange={e => upd(i, 'cantidad_solicitada', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }} />
                  <select value={it.unidad} onChange={e => upd(i, 'unidad', e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#111827', background: '#fff' }}>{['kg','g','litro','ml','unidad','caja','bolsa','paquete'].map(u => <option key={u}>{u}</option>)}</select>
                  <button onClick={() => setItems(items.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}><Trash2 size={16} /></button>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8 }}><Btn onClick={guardar} disabled={saving || !form.sucursal_id || items.length === 0}>{saving ? 'Enviando...' : 'Enviar pedido'}</Btn><Btn variant="secondary" onClick={() => setShow(false)}>Cancelar</Btn></div>
          </div>
        )}
        <Table loading={loading} cols={['Fecha','Sucursal','Destino','Estado','Acción']} empty="No hay pedidos registrados" rows={rows.map(r => [fd(r.fecha), r.sucursales?.nombre, r.destino, <Badge color={ec[r.estado]}>{r.estado.replace('_',' ')}</Badge>, r.estado !== 'despachado' ? <select value={r.estado} onChange={e => updateEstado(r.id, e.target.value)} style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '4px 8px', fontSize: 12, color: '#111827', background: '#fff' }}><option value="enviado">Enviado</option><option value="visto">Visto</option><option value="en_preparacion">En preparación</option><option value="despachado">Despachado</option></select> : <Badge color="green">✓ Listo</Badge>])} />
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
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, color: '#111827' }} />
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
