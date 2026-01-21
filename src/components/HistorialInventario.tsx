import { useState, useMemo } from 'react'
import { MovimientoInventario, Producto } from '../types'
import './HistorialInventario.css'

interface HistorialInventarioProps {
    movimientos: MovimientoInventario[]
    productos: Producto[]
    onVolver: () => void
}

export default function HistorialInventario({ movimientos, productos, onVolver }: HistorialInventarioProps) {
    // Fechas en formato YYYY-MM-DD para inputs date
    const fechaHoy = new Date().toISOString().split('T')[0]
    const [fechaInicio, setFechaInicio] = useState(fechaHoy)
    const [fechaFin, setFechaFin] = useState(fechaHoy)

    // Filtro de solo 'ajustes' o mostrar todo (según requerimiento, "inventarios hechos" suele ser ajustes)
    // El usuario pidió: "inventarios hechos con las diferencias y motivos" -> ajustes.
    // Aunque también podrían incluirse mermas manuales. Filtraré por tipo 'ajuste' y 'merma' principalmente,
    // o todo lo que tenga motivo explícito. Normalmente 'ajuste' cubre lo hecho en inventario.

    const movimientosFiltrados = useMemo(() => {
        // Normalizar fechas para comparación (inicio 00:00:00, fin 23:59:59)
        const dInicio = new Date(fechaInicio)
        dInicio.setHours(0, 0, 0, 0)

        const dFin = new Date(fechaFin)
        dFin.setHours(23, 59, 59, 999)

        return movimientos.filter(m => {
            const fechaMov = new Date(m.fecha)

            const dentroRango = fechaMov >= dInicio && fechaMov <= dFin
            // Filtrar solo ajustes de inventario que tienen motivo (los de la pantalla Inventario)
            // 'ajuste' es el tipo que usamos en Inventario.tsx
            const esInventario = m.tipo === 'ajuste' || m.tipo === 'merma'

            return dentroRango && esInventario
        }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    }, [movimientos, fechaInicio, fechaFin])

    const totalDiferencias = movimientosFiltrados.reduce((acc, m) => acc + (m.cantidadNueva - m.cantidadAnterior), 0)

    const totalValor = movimientosFiltrados.reduce((acc, m) => {
        const diff = m.cantidadNueva - m.cantidadAnterior
        // Use precioUnitario if available, otherwise find current product price
        const precio = m.precioUnitario ?? (productos.find(p => p.id === m.productoId)?.precio || 0)
        return acc + (diff * precio)
    }, 0)

    const resumenPorMotivo = movimientosFiltrados.reduce((acc, m) => {
        const motivo = m.motivo || 'Sin Motivo'
        if (!acc[motivo]) acc[motivo] = { cantidad: 0, valor: 0 }

        const diff = m.cantidadNueva - m.cantidadAnterior
        const precio = m.precioUnitario ?? (productos.find(p => p.id === m.productoId)?.precio || 0)

        acc[motivo].cantidad += diff
        acc[motivo].valor += (diff * precio)
        return acc
    }, {} as Record<string, { cantidad: number, valor: number }>)

    // Agrupar visualmente por sesiones? O solo lista plana?
    // Lista plana es más fácil de filtrar y ordenar.

    return (
        <div className="historial-inventario-container">
            <div className="historial-header">
                <h2>Historial de Inventarios y Ajustes</h2>
                <button className="btn-volver" onClick={onVolver}>← Volver al Conteo</button>
            </div>

            <div className="filtros-historial">
                <div className="form-group-inline">
                    <label>Desde:</label>
                    <input
                        type="date"
                        value={fechaInicio}
                        onChange={e => setFechaInicio(e.target.value)}
                    />
                </div>
                <div className="form-group-inline">
                    <label>Hasta:</label>
                    <input
                        type="date"
                        value={fechaFin}
                        onChange={e => setFechaFin(e.target.value)}
                    />
                </div>
            </div>

            <div className="historial-resumen">
                <div className="card-resumen">
                    <span>Movimientos</span>
                    <strong>{movimientosFiltrados.length}</strong>
                </div>
                <div className="card-resumen">
                    <span>Diferencia (Unid.)</span>
                    <strong style={{ color: totalDiferencias < 0 ? 'red' : totalDiferencias > 0 ? 'green' : 'inherit' }}>
                        {totalDiferencias > 0 ? '+' : ''}{totalDiferencias}
                    </strong>
                </div>
                <div className="card-resumen">
                    <span>Diferencia (Valor)</span>
                    <strong style={{ color: totalValor < 0 ? 'red' : totalValor > 0 ? 'green' : 'inherit' }}>
                        S/ {Math.abs(totalValor).toFixed(2)}
                    </strong>
                </div>
            </div>

            <div className="motivos-breakdown text-sm mb-4 bg-white p-3 rounded shadow-sm">
                <h4 style={{ margin: '0 0 0.5rem 0', borderBottom: '1px solid #eee', paddingBottom: '0.2rem' }}>Desglose por Motivo</h4>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    {Object.entries(resumenPorMotivo).map(([motivo, vals]) => (
                        <div key={motivo} style={{ padding: '0.5rem', background: '#f8fafc', borderRadius: '4px', minWidth: '120px' }}>
                            <div style={{ fontWeight: 600, color: '#475569' }}>{motivo}</div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
                                <span>Cant:</span>
                                <span style={{ fontWeight: 'bold', color: vals.cantidad < 0 ? 'red' : 'green' }}>{vals.cantidad > 0 ? '+' : ''}{vals.cantidad}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9em' }}>
                                <span>Monto:</span>
                                <span>S/ {vals.valor.toFixed(2)}</span>
                            </div>
                        </div>
                    ))}
                    {Object.keys(resumenPorMotivo).length === 0 && <span style={{ fontStyle: 'italic', color: '#888' }}>Sin datos...</span>}
                </div>
            </div>

            <div className="tabla-historial-container">
                <table className="tabla-historial">
                    <thead>
                        <tr>
                            <th>Fecha / Hora</th>
                            <th>Producto</th>
                            <th>Stock Ant.</th>
                            <th>Stock Nuevo</th>
                            <th>Diferencia</th>
                            <th>Motivo</th>
                            <th>Usuario</th>
                        </tr>
                    </thead>
                    <tbody>
                        {movimientosFiltrados.map(m => {
                            const diff = m.cantidadNueva - m.cantidadAnterior
                            return (
                                <tr key={m.id}>
                                    <td>{new Date(m.fecha).toLocaleString()}</td>
                                    <td style={{ fontWeight: 500 }}>{m.productoNombre}</td>
                                    <td>{m.cantidadAnterior}</td>
                                    <td>{m.cantidadNueva}</td>
                                    <td>
                                        <span className={`badge-diff ${diff < 0 ? 'neg' : diff > 0 ? 'pos' : 'neu'}`}>
                                            {diff > 0 ? '+' : ''}{diff}
                                        </span>
                                    </td>
                                    <td>{m.motivo || '-'}</td>
                                    <td>{m.usuario?.nombre || 'Sistema'}</td>
                                </tr>
                            )
                        })}
                        {movimientosFiltrados.length === 0 && (
                            <tr>
                                <td colSpan={7} className="text-center">No hay movimientos en este rango de fechas.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
