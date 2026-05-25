import { useState, useEffect } from "react";

const SB_URL = 'https://iepqhmxgdyuthcsmxadb.supabase.co';
const SB_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImllcHFobXhnZHl1dGhjc214YWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzODM1MjcsImV4cCI6MjA5NDk1OTUyN30.WWUs3xNpaMAYcvp2TAVuqQdCHGCsKIV0fdDF3Y45sLE';
const hdr = (tok) => ({ 'Content-Type': 'application/json', 'apikey': SB_KEY, 'Authorization': `Bearer ${tok || SB_KEY}`, 'Prefer': 'return=representation' });
const db = {
  get: (t, q, tok) => fetch(`${SB_URL}/rest/v1/${t}${q ? '?' + q : ''}`, { headers: { ...hdr(tok), 'Accept': 'application/json' } }).then(r => r.json()),
  post: (t, d, tok) => fetch(`${SB_URL}/rest/v1/${t}`, { method: 'POST', headers: hdr(tok), body: JSON.stringify(d) }).then(r => r.json()),
};

const gs = (n) => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 0 }).format(n || 0) + ' Gs.';
const fd = (d) => d ? new Date(d).toLocaleDateString('es-PY') : '—';
const COSTO_HORA = 13000;
const MARGEN = 0.55;

const isMobile = () => window.innerWidth < 768;

// ── SHARED UI ──────────────────────────────────────────────
const Card = ({ children, style }) => (
  <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', overflow: 'hidden', ...style }}>
    {children}
  </div>
);

const CardHead = ({ title, sub }) => (
  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6', background: '#fafafa' }}>
    <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{title}</h3>
    {sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '3px 0 0' }}>{sub}</p>}
  </div>
);

const Field = ({ label, children }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{label}</label>
    {children}
  </div>
);

const inp = {
  border: '1.5px solid #e5e7eb',
  borderRadius: 10,
  padding: '12px 14px',
  fontSize: 15,
  color: '#111827',
  background: '#fff',
  width: '100%',
  boxSizing: 'border-box',
  outline: 'none',
  appearance: 'none',
  WebkitAppearance: 'none',
};

const Inp = ({ label, ...p }) => (
  <Field label={label}>
    <input {...p} style={{ ...inp, ...(p.style || {}) }} />
  </Field>
);

const Sel = ({ label, children, ...p }) => (
  <Field label={label}>
    <select {...p} style={{ ...inp, ...(p.style || {}) }}>{children}</select>
  </Field>
);

const Btn = ({ onClick, children, variant = 'primary', disabled, full }) => {
  const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px 20px', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', width: full ? '100%' : 'auto', transition: 'all .15s' };
  const styles = {
    primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' },
    secondary: { background: '#fff', color: '#374151', border: '1.5px solid #e5e7eb' },
    ghost: { background: '#f0fdf4', color: '#15803d' },
  };
  return <button onClick={onClick} disabled={disabled} style={{ ...base, ...styles[variant] }}>{children}</button>;
};

const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
    {tabs.map(([id, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{
        padding: '10px 16px', borderRadius: 10, fontSize: 14, fontWeight: 500,
        border: 'none', cursor: 'pointer', flex: isMobile() ? '1 1 auto' : 'none',
        background: active === id ? '#16a34a' : '#fff',
        color: active === id ? '#fff' : '#6b7280',
        boxShadow: active === id ? 'none' : '0 0 0 1.5px #e5e7eb',
      }}>{label}</button>
    ))}
  </div>
);

const Row2 = ({ children }) => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
    {children}
  </div>
);

const calcHoras = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fin.split(':').map(Number);
  return Math.max(0, ((hf * 60 + mf) - (hi * 60 + mi)) / 60);
};

// ── MÓDULO PRINCIPAL ───────────────────────────────────────
export default function ProduccionModule({ tok }) {
  const [tab, setTab] = useState('nueva');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <Tabs tabs={[['nueva', '+ Nueva hojita'], ['historial', 'Historial'], ['congelados', 'Congelados']]} active={tab} onChange={setTab} />
      {tab === 'nueva' && <NuevaHojita tok={tok} onGuardado={() => setTab('historial')} />}
      {tab === 'historial' && <Historial tok={tok} />}
      {tab === 'congelados' && <Congelados tok={tok} />}
    </div>
  );
}

// ── NUEVA HOJITA ───────────────────────────────────────────
function NuevaHojita({ tok, onGuardado }) {
  const [prods, setProds] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const [general, setGeneral] = useState({
    fecha: new Date().toISOString().split('T')[0],
    producto_id: '', gramaje: '', tamano: 'grande',
    congelador_nro: '', numero_hojita: '',
  });

  const [materia, setMateria] = useState(
    Array(6).fill(null).map(() => ({ nombre: '', fecha_mp: '', peso_bruto: '', peso_neto: '', sobra_neto: '' }))
  );

  const [paquetes, setPaquetes] = useState('');

  const [operadores, setOperadores] = useState(
    Array(3).fill(null).map(() => ({ nombre: '', inicio: '', fin: '' }))
  );

  const [indirectos, setIndirectos] = useState({
    bolsa_vacio: '', bolsa_basura: '', guantes: '', vasos: '',
    costo_bolsa_vacio: 500, costo_bolsa_basura: 300, costo_guante: 2000, costo_vaso: 200,
  });

  const [tareas, setTareas] = useState(
    Array(3).fill(null).map(() => ({ inicio: '', fin: '', descripcion: '' }))
  );

  const [firmas, setFirmas] = useState({ nombres_operadores: '', jefe_prod: 'Isaac', firma_almacen: '' });

  useEffect(() => {
    db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : []));
  }, [tok]);

  const updM = (i, k, v) => { const n = [...materia]; n[i][k] = v; setMateria(n); };
  const updO = (i, k, v) => { const n = [...operadores]; n[i][k] = v; setOperadores(n); };
  const updT = (i, k, v) => { const n = [...tareas]; n[i][k] = v; setTareas(n); };

  const totalNeto = materia.reduce((s, m) => s + parseFloat(m.peso_neto || 0), 0);
  const totalSobra = materia.reduce((s, m) => s + parseFloat(m.sobra_neto || 0), 0);
  const horasTotales = operadores.reduce((s, op) => s + calcHoras(op.inicio, op.fin), 0);
  const costoMO = horasTotales * COSTO_HORA;
  const costoInd =
    (parseFloat(indirectos.bolsa_vacio || 0) * indirectos.costo_bolsa_vacio) +
    (parseFloat(indirectos.bolsa_basura || 0) * indirectos.costo_bolsa_basura) +
    (parseFloat(indirectos.guantes || 0) * indirectos.costo_guante) +
    (parseFloat(indirectos.vasos || 0) * indirectos.costo_vaso);
  const cantPaq = parseFloat(paquetes || 0);
  const costoTotal = costoMO + costoInd;
  const costoUnit = cantPaq > 0 ? costoTotal / cantPaq : 0;
  const precioSug = costoUnit / (1 - MARGEN);

  const guardar = async () => {
    if (!general.producto_id || !paquetes) { setErr('Completá el producto y la cantidad de paquetes'); return; }
    setSaving(true); setErr('');
    try {
      const payload = {
        fecha: general.fecha,
        responsable: firmas.nombres_operadores || operadores.filter(o => o.nombre).map(o => o.nombre).join(', '),
        hora_inicio: operadores[0]?.inicio || null,
        hora_fin: operadores[0]?.fin || null,
        observacion: JSON.stringify({
          general, materia: materia.filter(m => m.nombre),
          operadores: operadores.filter(o => o.nombre),
          indirectos, tareas: tareas.filter(t => t.descripcion),
          firmas, calculos: { horasTotales, costoMO, costoInd, costoTotal, costoUnit, precioSug }
        }),
        estado: 'cerrado',
      };
      const res = await db.post('produccion_lotes', payload, tok);
      const lote = Array.isArray(res) ? res[0] : res;
      if (lote?.id) {
        await db.post('produccion_detalle', [{
          lote_id: lote.id, producto_id: general.producto_id,
          cantidad_producida: cantPaq, peso_paquete: parseFloat(general.gramaje || 0) / 1000,
          unidad: 'paquete', costo_estimado: costoUnit
        }], tok);
        onGuardado();
      } else setErr('Error al guardar. Intentá de nuevo.');
    } catch { setErr('Error al guardar.'); }
    setSaving(false);
  };

  const sec = { padding: 16, display: 'flex', flexDirection: 'column', gap: 14 };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingBottom: 40 }}>

      {/* ENCABEZADO */}
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
            <Sel label="Tamaño" value={general.tamano} onChange={e => setGeneral({ ...general, tamano: e.target.value })}>
              <option value="chico">Chico</option>
              <option value="grande">Grande</option>
            </Sel>
            <Inp label="Congelador N°" value={general.congelador_nro} onChange={e => setGeneral({ ...general, congelador_nro: e.target.value })} placeholder="Ej: 1" />
          </Row2>
        </div>
      </Card>

      {/* MATERIA PRIMA */}
      <Card>
        <CardHead title="🍓 Materia Prima" sub="Pesos en gramos" />
        <div style={sec}>
          {materia.map((m, i) => (
            <div key={i} style={{ background: '#f9fafb', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280' }}>Ingrediente {i + 1}</div>
              <Inp label="Nombre" value={m.nombre} onChange={e => updM(i, 'nombre', e.target.value)} placeholder="Ej: Piña, Limón..." />
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

      {/* CANTIDAD PRODUCIDA */}
      <Card>
        <CardHead title="📦 Cantidad Producida" />
        <div style={sec}>
          <Inp label="Paquetes producidos *" type="number" value={paquetes} onChange={e => setPaquetes(e.target.value)} placeholder="Ej: 57" style={{ fontSize: 32, fontWeight: 700, textAlign: 'center', color: '#15803d', padding: '16px' }} />
        </div>
      </Card>

      {/* HORA DE TRABAJO */}
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

      {/* MATERIALES INDIRECTOS */}
      <Card>
        <CardHead title="🧤 Materiales Indirectos" sub="Cantidades usadas en esta producción" />
        <div style={sec}>
          {[
            { key: 'bolsa_vacio', label: '🛍 Bolsa al vacío', costoKey: 'costo_bolsa_vacio' },
            { key: 'bolsa_basura', label: '🗑 Bolsa de basura', costoKey: 'costo_bolsa_basura' },
            { key: 'guantes', label: '🧤 Guantes (pares)', costoKey: 'costo_guante' },
            { key: 'vasos', label: '🥤 Vasos', costoKey: 'costo_vaso' },
          ].map(({ key, label, costoKey }) => (
            <div key={key} style={{ background: '#f9fafb', borderRadius: 12, padding: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#374151' }}>{label}</div>
              <Row2>
                <Inp label="Cantidad" type="number" value={indirectos[key]} onChange={e => setIndirectos({ ...indirectos, [key]: e.target.value })} placeholder="0" />
                <Inp label="Costo unitario (Gs.)" type="number" value={indirectos[costoKey]} onChange={e => setIndirectos({ ...indirectos, [costoKey]: parseFloat(e.target.value) || 0 })} />
              </Row2>
              {indirectos[key] > 0 && (
                <div style={{ background: '#eff6ff', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
                  Subtotal: {gs(parseFloat(indirectos[key]) * indirectos[costoKey])}
                </div>
              )}
            </div>
          ))}
          {costoInd > 0 && (
            <div style={{ background: '#faf5ff', borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#7c3aed', margin: 0 }}>Total indirectos: {gs(costoInd)}</p>
            </div>
          )}
        </div>
      </Card>

      {/* OTRAS TAREAS */}
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

      {/* RESUMEN DE COSTOS */}
      <Card style={{ border: '2px solid #16a34a' }}>
        <CardHead title="💰 Resumen de Costos" sub="Calculado automáticamente · 13.000 Gs/hora · Margen 55%" />
        <div style={sec}>
          {[
            ['Mano de obra', gs(costoMO), '#eff6ff', '#1d4ed8'],
            ['Materiales indirectos', gs(costoInd), '#faf5ff', '#7c3aed'],
            ['Costo total del lote', gs(costoTotal), '#fefce8', '#a16207'],
            ['Costo unitario x paquete', gs(costoUnit), '#fff7ed', '#c2410c'],
            ['Precio sugerido (55% margen)', gs(precioSug), '#f0fdf4', '#15803d'],
          ].map(([label, val, bg, fg]) => (
            <div key={label} style={{ background: bg, borderRadius: 12, padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <p style={{ fontSize: 14, color: fg, margin: 0, fontWeight: 500 }}>{label}</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: fg, margin: 0 }}>{val}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* FIRMAS */}
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

      {err && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: 14, color: '#dc2626', fontSize: 14 }}>
          ⚠️ {err}
        </div>
      )}

      <Btn onClick={guardar} disabled={saving} full>
        {saving ? 'Guardando...' : '✓ Cerrar y guardar hojita'}
      </Btn>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
        lotes.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No hay hojitas registradas aún</p> :
          lotes.map(l => {
            let calc = {};
            try { calc = JSON.parse(l.observacion || '{}')?.calculos || {}; } catch {}
            const det = l.produccion_detalle?.[0];
            return (
              <div key={l.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '0 0 2px' }}>{det?.productos?.nombre || '—'}</p>
                    <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>{fd(l.fecha)} · {det?.cantidad_producida || 0} paquetes</p>
                  </div>
                  <button onClick={() => setDetalle(l)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 8, padding: '8px 14px', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>Ver</button>
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {calc.costoUnit > 0 && <span style={{ background: '#fff7ed', color: '#c2410c', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 600 }}>Costo: {gs(calc.costoUnit)}</span>}
                  {calc.precioSug > 0 && <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 8, padding: '4px 10px', fontSize: 13, fontWeight: 600 }}>Precio sug.: {gs(calc.precioSug)}</span>}
                </div>
              </div>
            );
          })
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
            ['Mano de obra', gs(calculos.costoMO), '#eff6ff', '#1d4ed8'],
            ['Indirectos', gs(calculos.costoInd), '#faf5ff', '#7c3aed'],
            ['Costo total', gs(calculos.costoTotal), '#fefce8', '#a16207'],
            ['Costo unit.', gs(calculos.costoUnit), '#fff7ed', '#c2410c'],
            ['P. sugerido', gs(calculos.precioSug), '#f0fdf4', '#15803d'],
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

// ── CONGELADOS ─────────────────────────────────────────────
function Congelados({ tok }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    db.get('congelados_inventario', 'select=*,productos(nombre,unidad)', tok)
      .then(d => { setRows(Array.isArray(d) ? d : []); setLoading(false); });
  }, [tok]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
        rows.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>El inventario se actualiza al cerrar hojitas</p> :
          rows.map(r => (
            <div key={r.id} style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: '0 0 2px' }}>{r.productos?.nombre}</p>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>Actualizado: {fd(r.ultima_actualizacion)}</p>
              </div>
              <span style={{ background: '#f0fdf4', color: '#15803d', borderRadius: 10, padding: '8px 14px', fontWeight: 700, fontSize: 16 }}>
                {r.stock_actual} {r.productos?.unidad}
              </span>
            </div>
          ))
      }
    </div>
  );
}
