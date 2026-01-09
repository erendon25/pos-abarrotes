import { useState, useMemo } from 'react'
import { Producto } from '../types'
import './Vencimientos.css'

interface VencimientosProps {
  productos: Producto[]
  onVolver: () => void
}

export default function Vencimientos({
  productos,
  onVolver
}: VencimientosProps) {
  const [diasAdvertencia, setDiasAdvertencia] = useState(30) // Días antes de vencer para mostrar advertencia
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'vencidos' | 'proximos' | 'vigentes'>('todos')

  const productosConVencimiento = useMemo(() => {
    return productos
      .filter(p => p.fechaVencimiento)
      .map(p => {
        const fechaVenc = new Date(p.fechaVencimiento!)
        const hoy = new Date()
        hoy.setHours(0, 0, 0, 0)
        fechaVenc.setHours(0, 0, 0, 0)
        
        const diasRestantes = Math.ceil((fechaVenc.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
        
        let estado: 'vencido' | 'proximo' | 'vigente'
        if (diasRestantes < 0) {
          estado = 'vencido'
        } else if (diasRestantes <= diasAdvertencia) {
          estado = 'proximo'
        } else {
          estado = 'vigente'
        }

        return {
          producto: p,
          fechaVencimiento: fechaVenc,
          diasRestantes,
          estado
        }
      })
      .sort((a, b) => {
        // Ordenar: vencidos primero, luego por días restantes
        if (a.estado === 'vencido' && b.estado !== 'vencido') return -1
        if (a.estado !== 'vencido' && b.estado === 'vencido') return 1
        return a.diasRestantes - b.diasRestantes
      })
  }, [productos, diasAdvertencia])

  const productosFiltrados = useMemo(() => {
    if (filtroEstado === 'todos') return productosConVencimiento
    // Mapear los valores del filtro a los valores del estado
    const estadoMap: Record<'vencidos' | 'proximos' | 'vigentes', 'vencido' | 'proximo' | 'vigente'> = {
      vencidos: 'vencido',
      proximos: 'proximo',
      vigentes: 'vigente'
    }
    const estadoFiltro = estadoMap[filtroEstado]
    return productosConVencimiento.filter(p => p.estado === estadoFiltro)
  }, [productosConVencimiento, filtroEstado])

  const estadisticas = useMemo(() => {
    const vencidos = productosConVencimiento.filter(p => p.estado === 'vencido').length
    const proximos = productosConVencimiento.filter(p => p.estado === 'proximo').length
    const vigentes = productosConVencimiento.filter(p => p.estado === 'vigente').length
    return { vencidos, proximos, vigentes, total: productosConVencimiento.length }
  }, [productosConVencimiento])

  const formatearFecha = (fecha: Date) => {
    const dia = fecha.getDate().toString().padStart(2, '0')
    const mes = (fecha.getMonth() + 1).toString().padStart(2, '0')
    const año = fecha.getFullYear()
    return `${dia}/${mes}/${año}`
  }

  const obtenerEstadoBadge = (estado: 'vencido' | 'proximo' | 'vigente', diasRestantes: number) => {
    if (estado === 'vencido') {
      return { texto: 'VENCIDO', color: '#dc2626', bg: '#fee2e2' }
    } else if (estado === 'proximo') {
      return { texto: `VENCE EN ${diasRestantes} DÍAS`, color: '#f59e0b', bg: '#fef3c7' }
    } else {
      return { texto: 'VIGENTE', color: '#10b981', bg: '#d1fae5' }
    }
  }

  return (
    <div className="vencimientos">
      <div className="vencimientos-header">
        <h1>Control de Vencimientos</h1>
        <button className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
      </div>

      {/* Estadísticas */}
      <div className="estadisticas-vencimientos">
        <h2>Estadísticas</h2>
        <div className="stats-grid">
          <div className="stat-card vencidos">
            <span className="stat-label">Productos Vencidos</span>
            <span className="stat-value">{estadisticas.vencidos}</span>
          </div>
          <div className="stat-card proximos">
            <span className="stat-label">Próximos a Vencer</span>
            <span className="stat-value">{estadisticas.proximos}</span>
          </div>
          <div className="stat-card vigentes">
            <span className="stat-label">Vigentes</span>
            <span className="stat-value">{estadisticas.vigentes}</span>
          </div>
          <div className="stat-card total">
            <span className="stat-label">Total con Vencimiento</span>
            <span className="stat-value">{estadisticas.total}</span>
          </div>
        </div>
      </div>

      {/* Configuración */}
      <div className="configuracion-vencimientos">
        <h2>Configuración</h2>
        <div className="config-item">
          <label>Días de advertencia (productos próximos a vencer):</label>
          <input
            type="number"
            min="1"
            value={diasAdvertencia}
            onChange={(e) => setDiasAdvertencia(parseInt(e.target.value) || 30)}
            className="input-config"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-vencimientos">
        <h2>Filtros</h2>
        <div className="filtros-buttons">
          <button
            className={`filtro-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('todos')}
          >
            Todos ({estadisticas.total})
          </button>
          <button
            className={`filtro-btn ${filtroEstado === 'vencidos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('vencidos')}
          >
            Vencidos ({estadisticas.vencidos})
          </button>
          <button
            className={`filtro-btn ${filtroEstado === 'proximos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('proximos')}
          >
            Próximos ({estadisticas.proximos})
          </button>
          <button
            className={`filtro-btn ${filtroEstado === 'vigentes' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('vigentes')}
          >
            Vigentes ({estadisticas.vigentes})
          </button>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="productos-vencimientos">
        <h2>Productos con Fecha de Vencimiento</h2>
        {productosFiltrados.length === 0 ? (
          <div className="sin-productos">
            <p>No hay productos con fecha de vencimiento registrada</p>
          </div>
        ) : (
          <div className="productos-table">
            <div className="table-header">
              <div className="col-producto">Producto</div>
              <div className="col-categoria">Categoría</div>
              <div className="col-stock">Stock</div>
              <div className="col-fecha-vencimiento">Fecha Vencimiento</div>
              <div className="col-dias-restantes">Días Restantes</div>
              <div className="col-estado">Estado</div>
            </div>
            {productosFiltrados.map(({ producto, fechaVencimiento, diasRestantes, estado }) => {
              const badge = obtenerEstadoBadge(estado, diasRestantes)
              return (
                <div key={producto.id} className={`table-row ${estado}`}>
                  <div className="col-producto">{producto.nombre}</div>
                  <div className="col-categoria">{producto.categoria}</div>
                  <div className="col-stock">
                    {producto.esCerrado && producto.stockCaja !== undefined && producto.stockUnidad !== undefined
                      ? `${producto.stockCaja} cajas, ${producto.stockUnidad} unidades`
                      : producto.stock}
                  </div>
                  <div className="col-fecha-vencimiento">{formatearFecha(fechaVencimiento)}</div>
                  <div className={`col-dias-restantes ${estado === 'vencido' ? 'vencido' : estado === 'proximo' ? 'proximo' : 'vigente'}`}>
                    {diasRestantes < 0 ? `Vencido hace ${Math.abs(diasRestantes)} días` : `${diasRestantes} días`}
                  </div>
                  <div className="col-estado">
                    <span
                      className="estado-badge"
                      style={{ background: badge.bg, color: badge.color }}
                    >
                      {badge.texto}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

