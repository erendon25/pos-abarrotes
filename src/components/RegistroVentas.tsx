import { useState } from 'react'
import { Venta } from '../types'
import Comprobante from './Comprobante'
import './RegistroVentas.css'

interface RegistroVentasProps {
  ventas: Venta[]
  onVolver: () => void
  onActualizarVenta: (venta: Venta) => void
}

export default function RegistroVentas({ ventas, onVolver, onActualizarVenta }: RegistroVentasProps) {
  const [ventaReimprimir, setVentaReimprimir] = useState<Venta | null>(null)
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  // Filtrar ventas por fecha
  const ventasFiltradas = ventas.filter(venta => {
    if (!filtroFechaDesde && !filtroFechaHasta) return true
    
    const fechaVenta = new Date(venta.fecha)
    fechaVenta.setHours(0, 0, 0, 0)
    
    if (filtroFechaDesde) {
      const fechaDesde = new Date(filtroFechaDesde)
      fechaDesde.setHours(0, 0, 0, 0)
      if (fechaVenta < fechaDesde) return false
    }
    
    if (filtroFechaHasta) {
      const fechaHasta = new Date(filtroFechaHasta)
      fechaHasta.setHours(23, 59, 59, 999)
      if (fechaVenta > fechaHasta) return false
    }
    
    return true
  })

  // Calcular estadísticas de anulaciones
  const ventasAnuladas = ventasFiltradas.filter(v => v.anulada)
  const totalAnulaciones = ventasAnuladas.length
  const montoAnulaciones = ventasAnuladas.reduce((sum, v) => sum + v.total, 0)
  
  const boletasAnuladas = ventasAnuladas.filter(v => v.tipoComprobante === 'boleta')
  const ticketsAnulados = ventasAnuladas.filter(v => v.tipoComprobante === 'ticket')
  const montoBoletasAnuladas = boletasAnuladas.reduce((sum, v) => sum + v.total, 0)
  const montoTicketsAnulados = ticketsAnulados.reduce((sum, v) => sum + v.total, 0)

  const formatearFecha = (fecha: Date) => {
    const date = new Date(fecha)
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const año = date.getFullYear()
    const horas = date.getHours().toString().padStart(2, '0')
    const minutos = date.getMinutes().toString().padStart(2, '0')
    return `${dia}/${mes}/${año} ${horas}:${minutos}`
  }

  const handleReimprimir = (venta: Venta) => {
    // Incrementar contador de reimpresiones
    const ventaActualizada: Venta = {
      ...venta,
      reimpresiones: venta.reimpresiones + 1
    }
    onActualizarVenta(ventaActualizada)
    setVentaReimprimir(ventaActualizada)
  }

  const handleAnular = (venta: Venta) => {
    if (venta.anulada) {
      alert('Esta venta ya está anulada')
      return
    }
    
    if (!confirm(`¿Está seguro de anular esta ${venta.tipoComprobante === 'boleta' ? 'boleta' : 'ticket'}?`)) {
      return
    }
    
    const ventaActualizada: Venta = {
      ...venta,
      anulada: true
    }
    onActualizarVenta(ventaActualizada)
    alert(`${venta.tipoComprobante === 'boleta' ? 'Boleta' : 'Ticket'} anulado correctamente`)
  }

  const limpiarFiltros = () => {
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
  }

  return (
    <div className="registro-ventas">
      <div className="registro-header">
        <h1>Registro de Ventas</h1>
        <button className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
      </div>

      {/* Estadísticas de anulaciones */}
      <div className="estadisticas-anulaciones">
        <h2>Estadísticas de Anulaciones</h2>
        <div className="stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Anulaciones</span>
            <span className="stat-value">{totalAnulaciones}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Monto Total Anulado</span>
            <span className="stat-value">S/ {montoAnulaciones.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Boletas Anuladas</span>
            <span className="stat-value">{boletasAnuladas.length}</span>
            <span className="stat-sub">S/ {montoBoletasAnuladas.toFixed(2)}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Tickets Anulados</span>
            <span className="stat-value">{ticketsAnulados.length}</span>
            <span className="stat-sub">S/ {montoTicketsAnulados.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Filtro de fechas */}
      <div className="filtro-fechas">
        <div className="filtro-fechas-header">
          <h2>Filtro por Fecha</h2>
          {(filtroFechaDesde || filtroFechaHasta) && (
            <button className="btn-limpiar-filtro" onClick={limpiarFiltros}>
              Limpiar Filtros
            </button>
          )}
        </div>
        <div className="filtro-fechas-campos">
          <div className="filtro-fecha-item">
            <label>Desde:</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="input-fecha"
            />
          </div>
          <div className="filtro-fecha-item">
            <label>Hasta:</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="input-fecha"
              min={filtroFechaDesde || undefined}
            />
          </div>
        </div>
      </div>

      {/* Lista de ventas */}
      <div className="ventas-lista">
        <h2>Ventas Realizadas</h2>
        {ventasFiltradas.length === 0 ? (
          <div className="sin-ventas">
            <p>No hay ventas registradas</p>
          </div>
        ) : (
          <div className="ventas-table">
            <div className="table-header">
              <div className="col-fecha">Fecha</div>
              <div className="col-tipo">Tipo</div>
              <div className="col-numero">Número</div>
              <div className="col-usuario">Usuario</div>
              <div className="col-total">Total</div>
              <div className="col-reimpresiones">Reimpresiones</div>
              <div className="col-acciones">Acciones</div>
            </div>
            {ventasFiltradas
              .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
              .map(venta => (
                <div 
                  key={venta.id} 
                  className={`table-row ${venta.anulada ? 'anulada' : ''}`}
                >
                  <div className="col-fecha">{formatearFecha(venta.fecha)}</div>
                  <div className="col-tipo">
                    <span className={`tipo-badge ${venta.tipoComprobante}`}>
                      {venta.tipoComprobante === 'boleta' ? 'BOLETA' : 'TICKET'}
                    </span>
                    {venta.anulada && (
                      <span className="anulada-badge">ANULADA</span>
                    )}
                  </div>
                  <div className="col-numero">
                    {venta.tipoComprobante === 'boleta' ? venta.numeroBoleta : venta.numeroTicket}
                  </div>
                  <div className="col-usuario">{venta.usuario?.nombre || 'N/A'}</div>
                  <div className="col-total">S/ {venta.total.toFixed(2)}</div>
                  <div className="col-reimpresiones">
                    {venta.reimpresiones > 0 ? (
                      <span className="reimpresiones-badge">{venta.reimpresiones}</span>
                    ) : (
                      <span>-</span>
                    )}
                  </div>
                  <div className="col-acciones">
                    <button 
                      className="btn-reimprimir"
                      onClick={() => handleReimprimir(venta)}
                      title={venta.anulada ? "No se puede imprimir una venta anulada" : "Reimprimir"}
                      disabled={venta.anulada}
                    >
                      🖨️
                    </button>
                    {!venta.anulada && (
                      <button 
                        className="btn-anular"
                        onClick={() => handleAnular(venta)}
                        title="Anular venta"
                      >
                        ✖️
                      </button>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Modal de reimpresión */}
      {ventaReimprimir && (
        <Comprobante
          venta={ventaReimprimir}
          onCerrar={() => setVentaReimprimir(null)}
        />
      )}
    </div>
  )
}

