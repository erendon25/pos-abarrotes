import { useState } from 'react'
import { MovimientoInventario, TipoMovimiento } from '../types'
import './MovimientosInventario.css'

interface MovimientosInventarioProps {
  movimientos: MovimientoInventario[]
  onVolver: () => void
}

export default function MovimientosInventario({
  movimientos,
  onVolver
}: MovimientosInventarioProps) {
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')
  const [filtroTipo, setFiltroTipo] = useState<TipoMovimiento | 'todos'>('todos')
  const [filtroProducto, setFiltroProducto] = useState('')

  const movimientosFiltrados = movimientos.filter(mov => {
    // Filtro por fecha
    if (filtroFechaDesde || filtroFechaHasta) {
      const fechaMov = new Date(mov.fecha)
      fechaMov.setHours(0, 0, 0, 0)
      
      if (filtroFechaDesde) {
        const fechaDesde = new Date(filtroFechaDesde)
        fechaDesde.setHours(0, 0, 0, 0)
        if (fechaMov < fechaDesde) return false
      }
      
      if (filtroFechaHasta) {
        const fechaHasta = new Date(filtroFechaHasta)
        fechaHasta.setHours(23, 59, 59, 999)
        if (fechaMov > fechaHasta) return false
      }
    }

    // Filtro por tipo
    if (filtroTipo !== 'todos' && mov.tipo !== filtroTipo) {
      return false
    }

    // Filtro por producto
    if (filtroProducto && !mov.productoNombre.toLowerCase().includes(filtroProducto.toLowerCase())) {
      return false
    }

    return true
  }).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  const formatearFecha = (fecha: Date) => {
    const date = new Date(fecha)
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const año = date.getFullYear()
    const horas = date.getHours().toString().padStart(2, '0')
    const minutos = date.getMinutes().toString().padStart(2, '0')
    return `${dia}/${mes}/${año} ${horas}:${minutos}`
  }

  const obtenerTipoBadge = (tipo: TipoMovimiento) => {
    const badges = {
      ingreso: { texto: 'INGRESO', color: '#10b981', bg: '#d1fae5' },
      venta: { texto: 'VENTA', color: '#3b82f6', bg: '#dbeafe' },
      merma: { texto: 'MERMA', color: '#f59e0b', bg: '#fef3c7' },
      ajuste: { texto: 'AJUSTE', color: '#8b5cf6', bg: '#ede9fe' }
    }
    return badges[tipo] || badges.ingreso
  }

  const limpiarFiltros = () => {
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
    setFiltroTipo('todos')
    setFiltroProducto('')
  }

  return (
    <div className="movimientos-inventario">
      <div className="movimientos-header">
        <h1>Movimientos de Inventario</h1>
        <button className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-section">
        <h2>Filtros</h2>
        <div className="filtros-grid">
          <div className="filtro-item">
            <label>Fecha Desde:</label>
            <input
              type="date"
              value={filtroFechaDesde}
              onChange={(e) => setFiltroFechaDesde(e.target.value)}
              className="input-filtro"
            />
          </div>
          <div className="filtro-item">
            <label>Fecha Hasta:</label>
            <input
              type="date"
              value={filtroFechaHasta}
              onChange={(e) => setFiltroFechaHasta(e.target.value)}
              className="input-filtro"
              min={filtroFechaDesde || undefined}
            />
          </div>
          <div className="filtro-item">
            <label>Tipo de Movimiento:</label>
            <select
              value={filtroTipo}
              onChange={(e) => setFiltroTipo(e.target.value as TipoMovimiento | 'todos')}
              className="input-filtro"
            >
              <option value="todos">Todos</option>
              <option value="ingreso">Ingreso</option>
              <option value="venta">Venta</option>
              <option value="merma">Merma</option>
              <option value="ajuste">Ajuste</option>
            </select>
          </div>
          <div className="filtro-item">
            <label>Buscar Producto:</label>
            <input
              type="text"
              value={filtroProducto}
              onChange={(e) => setFiltroProducto(e.target.value)}
              placeholder="Nombre del producto"
              className="input-filtro"
            />
          </div>
          {(filtroFechaDesde || filtroFechaHasta || filtroTipo !== 'todos' || filtroProducto) && (
            <div className="filtro-item">
              <button className="btn-limpiar-filtros" onClick={limpiarFiltros}>
                Limpiar Filtros
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de movimientos */}
      <div className="movimientos-lista">
        <h2>Movimientos ({movimientosFiltrados.length})</h2>
        {movimientosFiltrados.length === 0 ? (
          <div className="sin-movimientos">
            <p>No hay movimientos registrados</p>
          </div>
        ) : (
          <div className="movimientos-table">
            <div className="table-header">
              <div className="col-fecha">Fecha</div>
              <div className="col-tipo">Tipo</div>
              <div className="col-producto">Producto</div>
              <div className="col-cantidad">Cantidad</div>
              <div className="col-stock-anterior">Stock Anterior</div>
              <div className="col-stock-nuevo">Stock Nuevo</div>
              <div className="col-motivo">Motivo/Referencia</div>
              <div className="col-usuario">Usuario</div>
            </div>
            {movimientosFiltrados.map(mov => {
              const badge = obtenerTipoBadge(mov.tipo)
              return (
                <div key={mov.id} className="table-row">
                  <div className="col-fecha">{formatearFecha(mov.fecha)}</div>
                  <div className="col-tipo">
                    <span
                      className="tipo-badge"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.texto}
                    </span>
                  </div>
                  <div className="col-producto">{mov.productoNombre}</div>
                  <div className={`col-cantidad ${mov.cantidad > 0 ? 'positivo' : 'negativo'}`}>
                    {mov.cantidad > 0 ? '+' : ''}{mov.cantidad}
                    {mov.cantidadCajas !== undefined && mov.cantidadUnidades !== undefined && (
                      <span className="detalle-cantidad">
                        ({mov.cantidadCajas} cajas, {mov.cantidadUnidades} unidades)
                      </span>
                    )}
                  </div>
                  <div className="col-stock-anterior">{mov.cantidadAnterior}</div>
                  <div className="col-stock-nuevo">{mov.cantidadNueva}</div>
                  <div className="col-motivo">{mov.motivo || mov.referencia || '-'}</div>
                  <div className="col-usuario">{mov.usuario?.nombre || '-'}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

