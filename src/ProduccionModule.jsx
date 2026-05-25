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
const MARGEN = 0.55; // 55% promedio

// ── SHARED UI ──────────────────────────────────────────────
const Card = ({ children, style }) => <div style={{ background: '#fff', color: '#374151', borderRadius: 14, border: '1px solid #e5e7eb', ...style }}>{children}</div>;
const CardHead = ({ title, sub }) => (
  <div style={{ padding: '14px 18px', borderBottom: '1px solid #f3f4f6' }}>
    <h3 style={{ fontWeight: 700, fontSize: 15, color: '#111827', margin: 0 }}>{title}</h3>
    {sub && <p style={{ fontSize: 12, color: '#9ca3af', margin: '2px 0 0' }}>{sub}</p>}
  </div>
);
const Btn = ({ onClick, children, variant = 'primary', disabled, style: sx }) => {
  const styles = { primary: { background: disabled ? '#86efac' : '#16a34a', color: '#fff' }, secondary: { background: '#fff', color: '#374151', color: '#374151', border: '1px solid #e5e7eb' }, ghost: { background: '#f0fdf4', color: '#15803d' }, danger: { background: '#fef2f2', color: '#dc2626' }, orange: { background: '#fff7ed', color: '#c2410c' } };
  return <button onClick={onClick} disabled={disabled} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: disabled ? 'not-allowed' : 'pointer', border: 'none', transition: 'all .15s', ...styles[variant], ...sx }}>{children}</button>;
};
const Input = ({ label, ...p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{label}</label>}
    <input {...p} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: '#fafafa', color: '#374151', ...(p.style || {}) }} />
  </div>
);
const Select = ({ label, children, ...p }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
    {label && <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280' }}>{label}</label>}
    <select {...p} style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '8px 12px', fontSize: 14, outline: 'none', background: '#fafafa', color: '#374151', ...(p.style || {}) }}>{children}</select>
  </div>
);
const Badge = ({ children, color = 'gray' }) => {
  const c = { green: { bg: '#f0fdf4', text: '#15803d' }, yellow: { bg: '#fefce8', text: '#a16207' }, blue: { bg: '#eff6ff', text: '#1d4ed8' }, red: { bg: '#fef2f2', text: '#dc2626' }, orange: { bg: '#fff7ed', text: '#c2410c' }, gray: { bg: '#f9fafb', text: '#6b7280' } };
  return <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 99, fontSize: 12, fontWeight: 500, background: c[color]?.bg, color: c[color]?.text }}>{children}</span>;
};
const Tabs = ({ tabs, active, onChange }) => (
  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
    {tabs.map(([id, label]) => (
      <button key={id} onClick={() => onChange(id)} style={{ padding: '8px 16px', borderRadius: 8, fontSize: 13, fontWeight: 500, border: 'none', cursor: 'pointer', background: active === id ? '#16a34a' : '#fff', color: active === id ? '#fff' : '#6b7280', boxShadow: active === id ? 'none' : '0 0 0 1px #e5e7eb' }}>{label}</button>
    ))}
  </div>
);
const Divider = ({ label }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0' }}>
    <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
    <span style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 }}>{label}</span>
    <div style={{ flex: 1, height: 1, background: '#f3f4f6' }} />
  </div>
);

// ── UTILS ──────────────────────────────────────────────────
const calcHoras = (inicio, fin) => {
  if (!inicio || !fin) return 0;
  const [hi, mi] = inicio.split(':').map(Number);
  const [hf, mf] = fin.split(':').map(Number);
  const mins = (hf * 60 + mf) - (hi * 60 + mi);
  return Math.max(0, mins / 60);
};

// ── MÓDULO PRINCIPAL ───────────────────────────────────────
export default function ProduccionModule({ tok }) {
  const [tab, setTab] = useState('nueva');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <Tabs tabs={[['nueva', '+ Nueva hojita'], ['historial', 'Historial'], ['congelados', 'Inventario congelados']]} active={tab} onChange={setTab} />
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

  // Datos generales
  const [general, setGeneral] = useState({
    fecha: new Date().toISOString().split('T')[0],
    producto_id: '',
    gramaje: '',
    tamano: 'grande',
    congelador_nro: '',
    numero_hojita: '',
  });

  // Materia prima — hasta 6 items
  const [materia, setMateria] = useState(
    Array(6).fill(null).map(() => ({ nombre: '', fecha_mp: '', peso_bruto: '', peso_neto: '', sobra_neto: '' }))
  );

  // Cantidad producida
  const [paquetes, setPaquetes] = useState('');

  // Operadores — hasta 3 turnos
  const [operadores, setOperadores] = useState(
    Array(3).fill(null).map(() => ({ nombre: '', inicio: '', fin: '' }))
  );

  // Materiales indirectos
  const [indirectos, setIndirectos] = useState({
    bolsa_vacio: '', bolsa_basura: '', guantes: '', vasos: '',
    costo_bolsa_vacio: 500, costo_bolsa_basura: 300, costo_guante: 2000, costo_vaso: 200,
  });

  // Otras tareas
  const [tareas, setTareas] = useState(
    Array(3).fill(null).map(() => ({ inicio: '', fin: '', descripcion: '' }))
  );

  // Firmas
  const [firmas, setFirmas] = useState({ nombres_operadores: '', jefe_prod: 'Isaac', firma_almacen: '' });

  useEffect(() => {
    db.get('productos', 'activo=eq.true&order=nombre', tok).then(d => setProds(Array.isArray(d) ? d : []));
  }, [tok]);

  const updMateria = (i, k, v) => { const n = [...materia]; n[i][k] = v; setMateria(n); };
  const updOp = (i, k, v) => { const n = [...operadores]; n[i][k] = v; setOperadores(n); };
  const updTarea = (i, k, v) => { const n = [...tareas]; n[i][k] = v; setTareas(n); };

  // ── CÁLCULOS ──────────────────────────────────────────────
  const totalPesoNeto = materia.reduce((s, m) => s + parseFloat(m.peso_neto || 0), 0);
  const totalSobra = materia.reduce((s, m) => s + parseFloat(m.sobra_neto || 0), 0);
  const pesoUsado = totalPesoNeto - totalSobra;

  const horasTotales = operadores.reduce((s, op) => s + calcHoras(op.inicio, op.fin), 0);
  const costoManoObra = horasTotales * COSTO_HORA;

  const costoIndirectos =
    (parseFloat(indirectos.bolsa_vacio || 0) * indirectos.costo_bolsa_vacio) +
    (parseFloat(indirectos.bolsa_basura || 0) * indirectos.costo_bolsa_basura) +
    (parseFloat(indirectos.guantes || 0) * indirectos.costo_guante) +
    (parseFloat(indirectos.vasos || 0) * indirectos.costo_vaso);

  const cantPaq = parseFloat(paquetes || 0);
  const costoTotal = costoManoObra + costoIndirectos;
  const costoUnitario = cantPaq > 0 ? costoTotal / cantPaq : 0;
  const precioSugerido = costoUnitario / (1 - MARGEN);

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
          firmas, calculos: { horasTotales, costoManoObra, costoIndirectos, costoTotal, costoUnitario, precioSugerido, pesoUsado }
        }),
        estado: 'cerrado',
      };
      const res = await db.post('produccion_lotes', payload, tok);
      const lote = Array.isArray(res) ? res[0] : res;
      if (lote?.id) {
        await db.post('produccion_detalle', [{
          lote_id: lote.id, producto_id: general.producto_id,
          cantidad_producida: cantPaq, peso_paquete: parseFloat(general.gramaje || 0) / 1000,
          unidad: 'paquete', costo_estimado: costoUnitario
        }], tok);
        onGuardado();
      } else { setErr('Error al guardar. Intentá de nuevo.'); }
    } catch (e) { setErr('Error al guardar.'); }
    setSaving(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ENCABEZADO */}
      <Card>
        <CardHead title="Planilla de Producción — Purafruta" sub="Completá todos los campos de la hojita" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Input label="N° de hojita" value={general.numero_hojita} onChange={e => setGeneral({ ...general, numero_hojita: e.target.value })} placeholder="Ej: 5542" />
            <Input label="Fecha" type="date" value={general.fecha} onChange={e => setGeneral({ ...general, fecha: e.target.value })} />
            <Select label="Producto *" value={general.producto_id} onChange={e => setGeneral({ ...general, producto_id: e.target.value })}>
              <option value="">Seleccionar...</option>
              {prods.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </Select>
            <Input label="Gramaje (g)" type="number" value={general.gramaje} onChange={e => setGeneral({ ...general, gramaje: e.target.value })} placeholder="Ej: 300" />
            <Select label="Tamaño" value={general.tamano} onChange={e => setGeneral({ ...general, tamano: e.target.value })}>
              <option value="chico">Chico</option>
              <option value="grande">Grande</option>
            </Select>
            <Input label="Congelador N°" value={general.congelador_nro} onChange={e => setGeneral({ ...general, congelador_nro: e.target.value })} placeholder="Ej: 1" />
          </div>
        </div>
      </Card>

      {/* MATERIA PRIMA */}
      <Card>
        <CardHead title="Materia Prima" sub="Ingresá cada ingrediente con sus pesos en gramos" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            {['Ingrediente', 'Fecha M.P.', 'Peso Bruto (g)', 'Peso Neto (g)', 'Sobra Neto (g)'].map(h => (
              <div key={h} style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: .3 }}>{h}</div>
            ))}
          </div>
          {materia.map((m, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, marginBottom: 6 }}>
              <input value={m.nombre} onChange={e => updMateria(i, 'nombre', e.target.value)} placeholder={`${i + 1}. Ingrediente`}
                style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fafafa', color: '#374151' }} />
              <input type="date" value={m.fecha_mp} onChange={e => updMateria(i, 'fecha_mp', e.target.value)}
                style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, background: '#fafafa', color: '#374151' }} />
              <input type="number" value={m.peso_bruto} onChange={e => updMateria(i, 'peso_bruto', e.target.value)} placeholder="0"
                style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fafafa', color: '#374151' }} />
              <input type="number" value={m.peso_neto} onChange={e => updMateria(i, 'peso_neto', e.target.value)} placeholder="0"
                style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fafafa', color: '#374151' }} />
              <input type="number" value={m.sobra_neto} onChange={e => updMateria(i, 'sobra_neto', e.target.value)} placeholder="0"
                style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 13, background: '#fafafa', color: '#374151' }} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 8, marginTop: 8, padding: '8px 0', borderTop: '2px solid #f3f4f6' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#374151' }}>TOTALES</div>
            <div />
            <div />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#15803d' }}>{totalPesoNeto.toLocaleString()} g</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{totalSobra.toLocaleString()} g</div>
          </div>
          <p style={{ fontSize: 12, color: '#6b7280', margin: '8px 0 0' }}>Peso neto usado en producción: <strong>{pesoUsado.toLocaleString()} g</strong></p>
        </div>
      </Card>

      {/* CANTIDAD PRODUCIDA + HORA DE TRABAJO */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHead title="Cantidad producida" />
          <div style={{ padding: 18 }}>
            <Input label="Paquetes producidos *" type="number" value={paquetes} onChange={e => setPaquetes(e.target.value)} placeholder="Ej: 57" style={{ fontSize: 28, fontWeight: 700, textAlign: 'center', color: '#15803d' }} />
          </div>
        </Card>
        <Card>
          <CardHead title="Hora de trabajo" sub="Por cada operador" />
          <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {operadores.map((op, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8, alignItems: 'end' }}>
                <Input label={i === 0 ? 'Nombre operador' : ''} value={op.nombre} onChange={e => updOp(i, 'nombre', e.target.value)} placeholder={`Operador ${i + 1}`} />
                <Input label={i === 0 ? 'Inicio' : ''} type="time" value={op.inicio} onChange={e => updOp(i, 'inicio', e.target.value)} />
                <Input label={i === 0 ? 'Fin' : ''} type="time" value={op.fin} onChange={e => updOp(i, 'fin', e.target.value)} />
              </div>
            ))}
            {horasTotales > 0 && (
              <div style={{ marginTop: 4, padding: 8, background: '#f0fdf4', borderRadius: 8, fontSize: 13, color: '#15803d' }}>
                Total: <strong>{horasTotales.toFixed(1)} horas</strong> → Mano de obra: <strong>{gs(costoManoObra)}</strong>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* MATERIALES INDIRECTOS */}
      <Card>
        <CardHead title="Materiales indirectos" sub="Cantidades utilizadas en esta producción" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            {[
              { key: 'bolsa_vacio', label: 'Bolsa al vacío (unidades)', costoKey: 'costo_bolsa_vacio' },
              { key: 'bolsa_basura', label: 'Bolsa de basura (unidades)', costoKey: 'costo_bolsa_basura' },
              { key: 'guantes', label: 'Guantes (pares)', costoKey: 'costo_guante' },
              { key: 'vasos', label: 'Vasos (unidades)', costoKey: 'costo_vaso' },
            ].map(({ key, label, costoKey }) => (
              <div key={key} style={{ background: '#fafafa', color: '#374151', borderRadius: 10, padding: 12 }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: '#6b7280', display: 'block', marginBottom: 4 }}>{label}</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input type="number" value={indirectos[key]} onChange={e => setIndirectos({ ...indirectos, [key]: e.target.value })} placeholder="0"
                    style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 14, width: '60px', background: '#fff', color: '#374151' }} />
                  <input type="number" value={indirectos[costoKey]} onChange={e => setIndirectos({ ...indirectos, [costoKey]: parseFloat(e.target.value) || 0 })}
                    style={{ border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '7px 10px', fontSize: 12, flex: 1, background: '#fff', color: '#374151' }}
                    title="Costo unitario en Gs." />
                </div>
                {indirectos[key] > 0 && (
                  <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>
                    Subtotal: {gs(parseFloat(indirectos[key]) * indirectos[costoKey])}
                  </p>
                )}
              </div>
            ))}
          </div>
          {costoIndirectos > 0 && (
            <div style={{ marginTop: 12, padding: 10, background: '#eff6ff', borderRadius: 8, fontSize: 13, color: '#1d4ed8', fontWeight: 600 }}>
              Total materiales indirectos: {gs(costoIndirectos)}
            </div>
          )}
        </div>
      </Card>

      {/* OTRAS TAREAS */}
      <Card>
        <CardHead title="Otras tareas" sub="Tareas adicionales realizadas en la jornada" />
        <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tareas.map((t, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 3fr', gap: 8 }}>
              <Input label={i === 0 ? 'Inicio' : ''} type="time" value={t.inicio} onChange={e => updTarea(i, 'inicio', e.target.value)} />
              <Input label={i === 0 ? 'Fin' : ''} type="time" value={t.fin} onChange={e => updTarea(i, 'fin', e.target.value)} />
              <Input label={i === 0 ? 'Descripción de tarea' : ''} value={t.descripcion} onChange={e => updTarea(i, 'descripcion', e.target.value)} placeholder="Ej: Limpieza de área" />
            </div>
          ))}
        </div>
      </Card>

      {/* RESUMEN DE COSTOS */}
      <Card style={{ border: '2px solid #16a34a' }}>
        <CardHead title="Resumen de costos — Calculado automáticamente" sub="Basado en 13.000 Gs/hora · Margen 55%" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
            {[
              ['Mano de obra', gs(costoManoObra), '#eff6ff', '#1d4ed8'],
              ['Materiales indirectos', gs(costoIndirectos), '#faf5ff', '#7c3aed'],
              ['Costo total del lote', gs(costoTotal), '#fefce8', '#a16207'],
              ['Costo unitario x paquete', gs(costoUnitario), '#fff7ed', '#c2410c'],
              ['Precio sugerido (55% margen)', gs(precioSugerido), '#f0fdf4', '#15803d'],
            ].map(([label, val, bg, fg]) => (
              <div key={label} style={{ background: bg, borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, color: fg, opacity: .7, margin: '0 0 4px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: .3 }}>{label}</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: fg, margin: 0 }}>{val}</p>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: '#9ca3af', margin: 0 }}>
            ⚠️ El costo de materia prima no está incluido aún — se calcula cuando se cargue el precio de compra de cada ingrediente en el catálogo de productos.
          </p>
        </div>
      </Card>

      {/* FIRMAS */}
      <Card>
        <CardHead title="Firmas y responsables" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
            <Input label="Nombre y apellido operadores" value={firmas.nombres_operadores} onChange={e => setFirmas({ ...firmas, nombres_operadores: e.target.value })} placeholder="Ej: Caroliliz, Graciela, Andresa" />
            <Input label="Firma Jefe de Producción" value={firmas.jefe_prod} onChange={e => setFirmas({ ...firmas, jefe_prod: e.target.value })} placeholder="Isaac" />
            <Input label="Firma Almacén" value={firmas.firma_almacen} onChange={e => setFirmas({ ...firmas, firma_almacen: e.target.value })} placeholder="Carmen" />
          </div>
        </div>
      </Card>

      {err && <p style={{ color: '#dc2626', fontSize: 13, padding: '10px 14px', background: '#fef2f2', borderRadius: 8 }}>⚠️ {err}</p>}

      <div style={{ display: 'flex', gap: 10 }}>
        <Btn onClick={guardar} disabled={saving} style={{ padding: '12px 24px', fontSize: 15 }}>
          {saving ? 'Guardando...' : '✓ Cerrar y guardar hojita'}
        </Btn>
      </div>
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
    <Card>
      <CardHead title="Historial de hojitas" />
      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
        lotes.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>No hay hojitas registradas aún</p> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Fecha', 'Producto', 'Paquetes', 'Costo unit.', 'P. sugerido', 'Responsable', 'Ver'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lotes.map(l => {
                  let calc = {};
                  try { calc = JSON.parse(l.observacion || '{}')?.calculos || {}; } catch {}
                  const det = l.produccion_detalle?.[0];
                  return (
                    <tr key={l.id} style={{ borderBottom: '1px solid #fafafa' }}>
                      <td style={{ padding: '11px 18px', fontWeight: 500 }}>{fd(l.fecha)}</td>
                      <td style={{ padding: '11px 18px', color: '#6b7280' }}>{det?.productos?.nombre || '—'}</td>
                      <td style={{ padding: '11px 18px', color: '#6b7280' }}>{det?.cantidad_producida || '—'} paq.</td>
                      <td style={{ padding: '11px 18px', color: '#c2410c', fontWeight: 600 }}>{calc.costoUnitario ? gs(calc.costoUnitario) : '—'}</td>
                      <td style={{ padding: '11px 18px', color: '#15803d', fontWeight: 600 }}>{calc.precioSugerido ? gs(calc.precioSugerido) : '—'}</td>
                      <td style={{ padding: '11px 18px', color: '#6b7280' }}>{l.responsable || '—'}</td>
                      <td style={{ padding: '11px 18px' }}>
                        <button onClick={() => setDetalle(l)} style={{ background: '#f0fdf4', color: '#15803d', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 12, cursor: 'pointer', fontWeight: 500 }}>Ver</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
      }
    </Card>
  );
}

// ── DETALLE HOJITA ─────────────────────────────────────────
function DetalleHojita({ lote, onVolver }) {
  let data = {};
  try { data = JSON.parse(lote.observacion || '{}'); } catch {}
  const { general = {}, materia = [], operadores = [], indirectos = {}, tareas = [], firmas = {}, calculos = {} } = data;
  const det = lote.produccion_detalle?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Btn variant="secondary" onClick={onVolver}>← Volver</Btn>
        <h2 style={{ fontWeight: 700, fontSize: 16, color: '#111827', margin: 0 }}>
          Hojita #{general.numero_hojita || '—'} — {fd(lote.fecha)}
        </h2>
      </div>

      <Card style={{ border: '2px solid #16a34a' }}>
        <CardHead title="Resumen de costos" />
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
          {[
            ['Paquetes', `${det?.cantidad_producida || 0} paq.`, '#f9fafb', '#374151'],
            ['Mano de obra', gs(calculos.costoManoObra), '#eff6ff', '#1d4ed8'],
            ['Indirectos', gs(calculos.costoIndirectos), '#faf5ff', '#7c3aed'],
            ['Costo total', gs(calculos.costoTotal), '#fefce8', '#a16207'],
            ['Costo unit.', gs(calculos.costoUnitario), '#fff7ed', '#c2410c'],
            ['P. sugerido', gs(calculos.precioSugerido), '#f0fdf4', '#15803d'],
          ].map(([l, v, bg, fg]) => (
            <div key={l} style={{ background: bg, borderRadius: 10, padding: 12 }}>
              <p style={{ fontSize: 11, color: fg, opacity: .7, margin: '0 0 2px', fontWeight: 600 }}>{l}</p>
              <p style={{ fontSize: 16, fontWeight: 700, color: fg, margin: 0 }}>{v}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHead title="Materia prima" />
        <div style={{ padding: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
            {['Ingrediente', 'Peso Bruto', 'Peso Neto', 'Sobra'].map(h => <div key={h} style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</div>)}
          </div>
          {materia.map((m, i) => m.nombre && (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 8, padding: '8px 0', borderBottom: '1px solid #f3f4f6' }}>
              <span style={{ fontWeight: 500 }}>{m.nombre}</span>
              <span style={{ color: '#6b7280' }}>{m.peso_bruto ? `${parseInt(m.peso_bruto).toLocaleString()} g` : '—'}</span>
              <span style={{ color: '#15803d', fontWeight: 600 }}>{m.peso_neto ? `${parseInt(m.peso_neto).toLocaleString()} g` : '—'}</span>
              <span style={{ color: '#dc2626' }}>{m.sobra_neto ? `${parseInt(m.sobra_neto).toLocaleString()} g` : '—'}</span>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Card>
          <CardHead title="Operadores" />
          <div style={{ padding: 18 }}>
            {operadores.filter(o => o.nombre).map((op, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f3f4f6', fontSize: 14 }}>
                <span style={{ fontWeight: 500 }}>{op.nombre}</span>
                <span style={{ color: '#6b7280' }}>{op.inicio} — {op.fin} ({calcHoras(op.inicio, op.fin).toFixed(1)}h)</span>
              </div>
            ))}
            <p style={{ fontSize: 13, color: '#1d4ed8', fontWeight: 600, margin: '10px 0 0' }}>Total: {calculos.horasTotales?.toFixed(1)}h → {gs(calculos.costoManoObra)}</p>
          </div>
        </Card>
        <Card>
          <CardHead title="Materiales indirectos" />
          <div style={{ padding: 18, fontSize: 14 }}>
            {[['Bolsas al vacío', indirectos.bolsa_vacio], ['Bolsas de basura', indirectos.bolsa_basura], ['Guantes', indirectos.guantes], ['Vasos', indirectos.vasos]].map(([l, v]) => v && (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f3f4f6' }}>
                <span>{l}</span><span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <CardHead title="Firmas" />
        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, textAlign: 'center' }}>
          {[['Operadores', firmas.nombres_operadores], ['Jefe de Producción', firmas.jefe_prod], ['Almacén', firmas.firma_almacen]].map(([l, v]) => (
            <div key={l} style={{ borderTop: '2px solid #e5e7eb', paddingTop: 8 }}>
              <p style={{ fontWeight: 600, fontSize: 14, margin: '0 0 4px' }}>{v || '—'}</p>
              <p style={{ fontSize: 11, color: '#9ca3af', margin: 0, textTransform: 'uppercase' }}>{l}</p>
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
    <Card>
      <CardHead title="Inventario de congelados" sub="Actualizado automáticamente al cerrar cada hojita" />
      {loading ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>Cargando...</p> :
        rows.length === 0 ? <p style={{ textAlign: 'center', padding: 40, color: '#9ca3af' }}>El inventario se actualiza al cerrar hojitas de producción</p> :
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #f3f4f6' }}>
                  {['Producto', 'Stock actual', 'Última actualización'].map(h => (
                    <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#9ca3af', textTransform: 'uppercase' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #fafafa' }}>
                    <td style={{ padding: '11px 18px', fontWeight: 500 }}>{r.productos?.nombre}</td>
                    <td style={{ padding: '11px 18px', color: '#6b7280' }}>{r.stock_actual} {r.productos?.unidad}</td>
                    <td style={{ padding: '11px 18px', color: '#6b7280' }}>{fd(r.ultima_actualizacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
      }
    </Card>
  );
}
