import { useState, useEffect, useMemo } from 'react'
import { Producto, MovimientoInventario } from '../types'
import HistorialInventario from './HistorialInventario'
import './Inventario.css'

interface InventarioProps {
    productos: Producto[]
    movimientos: MovimientoInventario[]
    onVolver: () => void
    onAjustarStock: (producto: Producto, nuevoStock: number, nuevoStockCaja: number | undefined, nuevoStockUnidad: number | undefined, motivo: string, cantidadDiferencia: number) => void
}

export default function Inventario({ productos, movimientos, onVolver, onAjustarStock }: InventarioProps) {
    const [busqueda, setBusqueda] = useState('')
    const [diaSeleccionado, setDiaSeleccionado] = useState<string>('')
    const [mostrarHistorial, setMostrarHistorial] = useState(false)


    // Estado local para los conteos físicos { [productoId]: { cantidad, cajas, unidades } }
    const [conteos, setConteos] = useState<Record<string, { cantidad?: number, cajas?: number, unidades?: number }>>({})
    const [motivos, setMotivos] = useState<Record<string, string>>({})

    // Configuración de Periodicidad (Code omitted for brevity, same as before)
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
    const [configPeriodicidad, setConfigPeriodicidad] = useState<Record<string, string[]>>({})

    useEffect(() => {
        const config = localStorage.getItem('pos_config_inventario')
        if (config) {
            setConfigPeriodicidad(JSON.parse(config))
        }

        // Auto-seleccionar el día actual
        const hoyIndex = new Date().getDay() // 0 = Domingo, 1 = Lunes...
        const mapDias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
        setDiaSeleccionado(mapDias[hoyIndex])
    }, [])



    // Filtrar productos (Code stays same)
    const productosFiltrados = useMemo(() => {
        let result = productos

        // 1. Filtro por periodicidad / día
        if (diaSeleccionado && configPeriodicidad[diaSeleccionado]?.length > 0) {
            // Solo mostrar lo que toca hoy, A MENOS que haya búsqueda manual
            if (!busqueda) {
                const catsDelDia = configPeriodicidad[diaSeleccionado]
                result = result.filter(p => catsDelDia.includes(p.categoria))
            }
        }

        // 2. Filtro por búsqueda texto
        if (busqueda) {
            const q = busqueda.toUpperCase()
            result = result.filter(p =>
                p.nombre.toUpperCase().includes(q) ||
                p.codigoBarras?.includes(q) ||
                p.id.includes(q)
            )
        }

        return result
    }, [productos, busqueda, diaSeleccionado, configPeriodicidad])

    const handleConteoChange = (id: string, field: 'cantidad' | 'cajas' | 'unidades', value: string) => {
        // Allow empty string to let user delete content
        if (value === '') {
            setConteos(prev => ({
                ...prev,
                [id]: { ...prev[id], [field]: undefined }
            }))
            return
        }

        const val = parseInt(value)
        if (!isNaN(val)) {
            setConteos(prev => ({
                ...prev,
                [id]: { ...prev[id], [field]: val }
            }))
        }
    }

    // Rest of helper functions (handleMotivoChange, etc.) - keeping existing logic
    const handleMotivoChange = (id: string, motivo: string) => {
        setMotivos(prev => ({ ...prev, [id]: motivo }))
    }

    const calcularDiferencia = (p: Producto) => {
        const conteo = conteos[p.id]
        if (!conteo) return 0

        if (p.esCerrado) {
            // Calcular total unidades contado
            const cajas = conteo.cajas || 0
            const unidades = conteo.unidades || 0
            const totalContado = (cajas * (p.unidadesPorCaja || 1)) + unidades
            return totalContado - p.stock
        } else {
            const cantidad = conteo.cantidad || 0
            if (conteo.cantidad === undefined) return 0 // No ha contado
            return cantidad - p.stock
        }
    }

    const onGuardarAjuste = (p: Producto) => {
        const diff = calcularDiferencia(p)
        if (diff === 0) {
            alert("No hay diferencia que ajustar")
            return
        }

        const motivo = motivos[p.id]
        if (!motivo) {
            alert("Selecciona un motivo para la diferencia")
            return
        }

        const conteo = conteos[p.id]
        let nuevoStock = 0
        let nuevoStockCaja = undefined
        let nuevoStockUnidad = undefined

        if (p.esCerrado) {
            const cajas = conteo?.cajas || 0
            const unidades = conteo?.unidades || 0
            nuevoStock = (cajas * (p.unidadesPorCaja || 1)) + unidades
            nuevoStockCaja = cajas
            nuevoStockUnidad = unidades
        } else {
            nuevoStock = conteo?.cantidad || 0
        }

        if (window.confirm(`¿Confirmar ajuste de ${diff} unidades por motivo: ${motivo}?`)) {
            onAjustarStock(p, nuevoStock, nuevoStockCaja, nuevoStockUnidad, motivo, diff)
            // Limpiar estado
            setConteos(prev => {
                const next = { ...prev }
                delete next[p.id]
                return next
            })
            setMotivos(prev => {
                const next = { ...prev }
                delete next[p.id]
                return next
            })
        }
    }

    // Resumen (same as before)
    const resumen = useMemo(() => {
        let totalHurto = 0
        let totalMerma = 0
        let totalExcedente = 0
        let totalValor = 0

        Object.keys(conteos).forEach(pid => {
            const p = productos.find(x => x.id === pid)
            if (!p) return
            const diff = calcularDiferencia(p)
            if (diff === 0) return

            const precio = p.precio || 0
            const valorDiff = Math.abs(diff * precio)
            totalValor += valorDiff

            const motivo = motivos[pid]
            if (motivo === 'Hurto') totalHurto += valorDiff
            if (motivo === 'Merma') totalMerma += valorDiff
            if (motivo === 'Excedente') totalExcedente += valorDiff
        })

        return { totalHurto, totalMerma, totalExcedente, totalValor }
    }, [conteos, productos, motivos])

    // If showing history, return early with that component
    if (mostrarHistorial) {
        return <HistorialInventario movimientos={movimientos} productos={productos} onVolver={() => setMostrarHistorial(false)} />
    }

    return (
        <div className="inventario-container">
            <div className="inventario-header">
                <div>
                    <h1>Inventario</h1>
                    <button
                        className="btn-historial"
                        onClick={() => setMostrarHistorial(true)}
                        style={{
                            marginTop: '0.5rem',
                            padding: '0.5rem 1rem',
                            fontSize: '0.9rem',
                            background: '#e0e7ff',
                            color: '#4338ca',
                            border: '1px solid #c7d2fe',
                            borderRadius: '6px',
                            cursor: 'pointer'
                        }}
                    >
                        📜 Ver Historial de Ajustes
                    </button>
                </div>
                <button className="btn-volver" onClick={onVolver}>← Cerrar Panel</button>
            </div>

            <div className="inventario-controls">
                <input
                    type="text"
                    placeholder="🔍 Buscar producto rápido..."
                    className="search-input"
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    autoFocus
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'white', padding: '0.5rem', borderRadius: '8px' }}>
                    <span>📅 Mostrando inventario para: </span>
                    <select
                        value={diaSeleccionado}
                        onChange={e => setDiaSeleccionado(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    >
                        {diasSemana.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
            </div>

            {/* Resumen en tiempo real de lo que se está contando */}
            <div className="inventario-summary">
                <div className="summary-card">
                    <h3>Diferencia Total (Valor)</h3>
                    <p>S/ {resumen.totalValor.toFixed(2)}</p>
                </div>
                <div className="summary-card">
                    <h3>Posible Hurto</h3>
                    <p style={{ color: 'red' }}>S/ {resumen.totalHurto.toFixed(2)}</p>
                </div>
                <div className="summary-card">
                    <h3>Merma Reportada</h3>
                    <p style={{ color: 'orange' }}>S/ {resumen.totalMerma.toFixed(2)}</p>
                </div>
                <div className="summary-card">
                    <h3>Excedente (Sin Guía)</h3>
                    <p style={{ color: 'green' }}>S/ {resumen.totalExcedente.toFixed(2)}</p>
                </div>
            </div>

            <div className="inventario-table-container">
                <table className="inventario-table">
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th>Stock Sistema</th>
                            <th>Stock Físico</th>
                            <th>Diferencia</th>
                            <th>Motivo</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productosFiltrados.map(p => {
                            const conteo = conteos[p.id]
                            const diff = calcularDiferencia(p)
                            const haContado = conteo !== undefined && (conteo.cantidad !== undefined || (conteo.cajas !== undefined))

                            return (
                                <tr key={p.id}>
                                    <td>
                                        <div style={{ fontWeight: 'bold' }}>{p.nombre}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>{p.categoria} | {p.marca}</div>
                                    </td>
                                    <td>
                                        {p.esCerrado ? (
                                            <>
                                                <div>Cajas: {p.stockCaja}</div>
                                                <div>Unid: {p.stockUnidad}</div>
                                                <div style={{ fontSize: '0.8em', color: '#888' }}>Total: {p.stock}</div>
                                            </>
                                        ) : (
                                            <span style={{ fontSize: '1.2em' }}>{p.stock}</span>
                                        )}
                                    </td>
                                    <td>
                                        {p.esCerrado ? (
                                            <div style={{ display: 'flex', gap: '5px', flexDirection: 'column' }}>
                                                <input
                                                    type="number"
                                                    className="input-stock"
                                                    placeholder="Cajas"
                                                    value={conteo?.cajas ?? ''}
                                                    onChange={(e) => handleConteoChange(p.id, 'cajas', e.target.value)}
                                                />
                                                <input
                                                    type="number"
                                                    className="input-stock"
                                                    placeholder="Unid"
                                                    value={conteo?.unidades ?? ''}
                                                    onChange={(e) => handleConteoChange(p.id, 'unidades', e.target.value)}
                                                />
                                            </div>
                                        ) : (
                                            <input
                                                type="number"
                                                className="input-stock"
                                                placeholder="Cant."
                                                value={conteo?.cantidad ?? ''}
                                                onChange={(e) => handleConteoChange(p.id, 'cantidad', e.target.value)}
                                            />
                                        )}
                                    </td>
                                    <td>
                                        {haContado && diff !== 0 && (
                                            <span className={diff < 0 ? 'diff-positive' : 'diff-negative'}>
                                                {diff > 0 ? `+${diff}` : diff}
                                            </span>
                                        )}
                                        {haContado && diff === 0 && <span style={{ color: 'green' }}>OK</span>}
                                    </td>
                                    <td>
                                        {haContado && diff !== 0 && (
                                            <select
                                                className="select-motivo"
                                                value={motivos[p.id] || ''}
                                                onChange={(e) => handleMotivoChange(p.id, e.target.value)}
                                            >
                                                <option value="">Seleccione...</option>
                                                {diff < 0 ? (
                                                    <>
                                                        <option value="Hurto">Hurto / Robo</option>
                                                        <option value="Merma">Merma (Dañado/Vencido)</option>
                                                        <option value="ErrorConteo">Error de Conteo Anterior</option>
                                                    </>
                                                ) : (
                                                    <>
                                                        <option value="Excedente">Excedente (Sin Guía)</option>
                                                        <option value="Devolucion">Devolución no registrada</option>
                                                    </>
                                                )}
                                            </select>
                                        )}
                                    </td>
                                    <td>
                                        {haContado && diff !== 0 && (
                                            <button className="btn-ajustar" onClick={() => onGuardarAjuste(p)}>
                                                Guardar Ajuste
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        {productosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                                    {busqueda ? 'No se encontraron productos' : 'Selecciona un día con inventario programado o busca un producto.'}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
