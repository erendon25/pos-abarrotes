import { useState } from 'react'
import { Venta, ItemCarrito, Usuario } from '../types'
import './Reportes.css'

interface ReportesProps {
  ventas: Venta[]
  onVolver: () => void
  onAnularVenta: (id: string) => void
  onReimprimirTicket: (venta: Venta) => void
  usuario: Usuario
}

interface ProductoVendido {
  nombre: string
  cantidad: number
  total: number
  categoria: string
  subcategoria?: string
}

export default function Reportes({ ventas, onVolver, onAnularVenta, onReimprimirTicket, usuario }: ReportesProps) {
  // ... (existing state)
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null)
  const [subcategoriaExpandida, setSubcategoriaExpandida] = useState<string | null>(null)
  const [filtroFechaDesde, setFiltroFechaDesde] = useState('')
  const [filtroFechaHasta, setFiltroFechaHasta] = useState('')

  const handleAnular = async (id: string) => {
    // Check permission - Default safe fallback is true if permission structure is partial old
    const canAnul = usuario.permisos.ventas_anular
    const canAnulNoPass = usuario.permisos.ventas_anular_sin_clave

    if (!canAnul) {
      alert("No tiene permisos para anular ventas.")
      return
    }

    // Check if auth is required
    if (!canAnulNoPass) {
      const pass = prompt("Acción restringida. Ingrese contraseña de Administrador:")

      // Basic Check against saved users in localStorage to find an admin credentials
      const saved = localStorage.getItem('pos_usuarios')
      let adminFound = false
      if (saved) {
        try {
          const users = JSON.parse(saved) as Usuario[]
          // Find any admin user matching this password
          const admin = users.find(u => u.rol === 'admin' && u.password === pass)
          if (admin) adminFound = true
        } catch (e) { }
      }

      // Fallback or specific hardcoded superadmin if loading fails
      if (!adminFound && pass === 'admin') adminFound = true

      if (!adminFound) {
        alert("Contraseña incorrecta o permisos insuficientes.")
        return
      }
    }

    onAnularVenta(id)
  }

  // Filtrar ventas por fecha
  const ventasFiltradas = ventas.filter(venta => {
    if (!filtroFechaDesde && !filtroFechaHasta) return true

    const fechaVenta = new Date(venta.fecha)
    fechaVenta.setHours(0, 0, 0, 0)

    if (filtroFechaDesde) {
      const [year, month, day] = filtroFechaDesde.split('-').map(Number)
      const fechaDesde = new Date(year, month - 1, day)
      if (fechaVenta < fechaDesde) return false
    }

    if (filtroFechaHasta) {
      const [year, month, day] = filtroFechaHasta.split('-').map(Number)
      const fechaHasta = new Date(year, month - 1, day)
      fechaHasta.setHours(23, 59, 59, 999)
      if (fechaVenta > fechaHasta) return false
    }

    return true
  })

  // ... (existing calculations logic - no changes needed there)
  // Calcular venta total
  const ventaTotal = ventasFiltradas.reduce((sum, venta) => sum + (venta.anulada ? 0 : venta.total), 0)

  // Calcular ventas por categoría
  const ventasPorCategoria: Record<string, number> = {}
  const productosPorCategoria: Record<string, ProductoVendido[]> = {}

  // Calcular ventas por subcategoría
  const ventasPorSubcategoria: Record<string, number> = {}
  const productosPorSubcategoria: Record<string, ProductoVendido[]> = {}

  const obtenerPrecioItem = (item: ItemCarrito) => {
    if (item.subcategoriaSeleccionada && item.producto.preciosPorSubcategoria) {
      return item.producto.preciosPorSubcategoria[item.subcategoriaSeleccionada] || item.producto.precio
    }
    return item.producto.precio
  }

  ventasFiltradas.forEach(venta => {
    if (venta.anulada) return // Skip anuladas for stats

    venta.items.forEach(item => {
      const categoria = item.producto.categoria
      const precio = obtenerPrecioItem(item)
      const totalItem = precio * item.cantidad

      // Sumar a venta por categoría
      ventasPorCategoria[categoria] = (ventasPorCategoria[categoria] || 0) + totalItem

      // Agrupar productos por categoría
      if (!productosPorCategoria[categoria]) {
        productosPorCategoria[categoria] = []
      }

      const keyProducto = `${item.producto.nombre}-${item.subcategoriaSeleccionada || 'base'}`
      const productoExistente = productosPorCategoria[categoria].find(
        p => `${p.nombre}-${p.subcategoria || 'base'}` === keyProducto
      )

      if (productoExistente) {
        productoExistente.cantidad += item.cantidad
        productoExistente.total += totalItem
      } else {
        productosPorCategoria[categoria].push({
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          total: totalItem,
          categoria: item.producto.categoria,
          subcategoria: item.subcategoriaSeleccionada || item.producto.subcategoria
        })
      }

      // Agrupar por subcategoría
      const subcategoria = item.subcategoriaSeleccionada || item.producto.subcategoria || 'Sin subcategoría'
      const totalItemSub = precio * item.cantidad

      // Sumar a venta por subcategoría
      ventasPorSubcategoria[subcategoria] = (ventasPorSubcategoria[subcategoria] || 0) + totalItemSub

      // Agrupar productos por subcategoría
      if (!productosPorSubcategoria[subcategoria]) {
        productosPorSubcategoria[subcategoria] = []
      }

      const keyProductoSub = `${item.producto.nombre}-${item.subcategoriaSeleccionada || 'base'}`
      const productoExistenteSub = productosPorSubcategoria[subcategoria].find(
        p => `${p.nombre}-${p.subcategoria || 'base'}` === keyProductoSub
      )

      if (productoExistenteSub) {
        productoExistenteSub.cantidad += item.cantidad
        productoExistenteSub.total += totalItemSub
      } else {
        productosPorSubcategoria[subcategoria].push({
          nombre: item.producto.nombre,
          cantidad: item.cantidad,
          total: totalItemSub,
          categoria: item.producto.categoria,
          subcategoria: item.subcategoriaSeleccionada || item.producto.subcategoria
        })
      }
    })
  })

  // Calcular productos más y menos vendidos
  const productosVendidos: Record<string, number> = {}
  ventasFiltradas.forEach(venta => {
    if (venta.anulada) return
    venta.items.forEach(item => {
      const nombre = item.producto.nombre
      productosVendidos[nombre] = (productosVendidos[nombre] || 0) + item.cantidad
    })
  })

  // ... (rest of stats logic)
  const productosArray = Object.entries(productosVendidos).map(([nombre, cantidad]) => ({
    nombre,
    cantidad
  }))

  const productoMasVendido = productosArray.length > 0
    ? productosArray.reduce((max, prod) => prod.cantidad > max.cantidad ? prod : max)
    : null

  const productoMenosVendido = productosArray.length > 0
    ? productosArray.reduce((min, prod) => prod.cantidad < min.cantidad ? prod : min)
    : null

  // Calcular ventas por método de pago
  const ventasPorMetodo: Record<string, number> = {
    efectivo: 0,
    yape: 0,
    tarjeta: 0
  }

  ventasFiltradas.forEach(venta => {
    if (venta.anulada) return
    venta.metodosPago.forEach(metodo => {
      ventasPorMetodo[metodo.tipo] = (ventasPorMetodo[metodo.tipo] || 0) + metodo.monto
    })
  })

  // ... (existing helper functions)
  const toggleCategoria = (categoria: string) => {
    setCategoriaExpandida(categoriaExpandida === categoria ? null : categoria)
  }

  const toggleSubcategoria = (subcategoria: string) => {
    setSubcategoriaExpandida(subcategoriaExpandida === subcategoria ? null : subcategoria)
  }

  const limpiarFiltros = () => {
    setFiltroFechaDesde('')
    setFiltroFechaHasta('')
  }

  const formatearFecha = (fecha: string) => {
    if (!fecha) return ''
    const [year, month, day] = fecha.split('-').map(Number)
    const date = new Date(year, month - 1, day)
    return date.toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="reportes">
      <div className="reportes-header">
        <h1>Reportes y Estadísticas</h1>
        <button className="btn-volver" onClick={onVolver}>
          ← Volver a Venta
        </button>
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
            {filtroFechaDesde && (
              <span className="fecha-seleccionada">{formatearFecha(filtroFechaDesde)}</span>
            )}
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
            {filtroFechaHasta && (
              <span className="fecha-seleccionada">{formatearFecha(filtroFechaHasta)}</span>
            )}
          </div>
        </div>
        {(filtroFechaDesde || filtroFechaHasta) && (
          <div className="filtro-fechas-info">
            <span>
              Mostrando {ventasFiltradas.length} de {ventas.length} ventas
              {filtroFechaDesde && filtroFechaHasta && ` del ${formatearFecha(filtroFechaDesde)} al ${formatearFecha(filtroFechaHasta)}`}
              {filtroFechaDesde && !filtroFechaHasta && ` desde ${formatearFecha(filtroFechaDesde)}`}
              {!filtroFechaDesde && filtroFechaHasta && ` hasta ${formatearFecha(filtroFechaHasta)}`}
            </span>
          </div>
        )}
      </div>

      <div className="reportes-content">
        {/* Venta Total */}
        <div className="stat-card grande">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-label">Venta Total (Activa)</span>
            <span className="stat-value">S/ {ventaTotal.toFixed(2)}</span>
            <span className="stat-subtitle">{ventasFiltradas.filter(v => !v.anulada).length} venta{ventasFiltradas.filter(v => !v.anulada).length !== 1 ? 's' : ''} activa{ventasFiltradas.filter(v => !v.anulada).length !== 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* ... (Existing charts logic same, passed props) */}

        {/* Ventas por Método de Pago */}
        <div className="section-card">
          <h2>Ventas por Método de Pago</h2>
          <div className="metodos-pago-stats">
            {/* ... same content ... */}
            <div className="metodo-pago-stat">
              <div className="metodo-header">
                <span className="metodo-icon-stat">💵</span>
                <span className="metodo-nombre-stat">Efectivo</span>
              </div>
              <span className="metodo-total-stat">S/ {ventasPorMetodo.efectivo.toFixed(2)}</span>
            </div>
            <div className="metodo-pago-stat">
              <div className="metodo-header">
                <span className="metodo-icon-stat">📱</span>
                <span className="metodo-nombre-stat">Yape</span>
              </div>
              <span className="metodo-total-stat">S/ {ventasPorMetodo.yape.toFixed(2)}</span>
            </div>
            <div className="metodo-pago-stat">
              <div className="metodo-header">
                <span className="metodo-icon-stat">💳</span>
                <span className="metodo-nombre-stat">Tarjeta</span>
              </div>
              <span className="metodo-total-stat">S/ {ventasPorMetodo.tarjeta.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Venta por Subcategorías - same logic */}
        <div className="section-card">
          <h2>Venta por Subcategorías</h2>
          {Object.keys(ventasPorSubcategoria).length > 0 ? (
            <div className="categorias-list">
              {Object.entries(ventasPorSubcategoria)
                .sort(([, a], [, b]) => b - a)
                .map(([subcategoria, total]) => {
                  const expandida = subcategoriaExpandida === subcategoria
                  const productos = productosPorSubcategoria[subcategoria] || []

                  return (
                    <div key={subcategoria} className="categoria-container">
                      <div
                        className="categoria-item clickeable"
                        onClick={() => toggleSubcategoria(subcategoria)}
                      >
                        <div className="categoria-info">
                          <span className="categoria-nombre">{subcategoria}</span>
                          <span className="categoria-total">S/ {total.toFixed(2)}</span>
                        </div>
                        <span className="categoria-toggle">
                          {expandida ? '▼' : '▶'}
                        </span>
                      </div>

                      {expandida && productos.length > 0 && (
                        <div className="productos-desglose">
                          <div className="desglose-header">
                            <span>Producto</span>
                            <span>Cantidad</span>
                            <span>Total</span>
                          </div>
                          {productos
                            .sort((a, b) => b.total - a.total)
                            .map((producto, index) => (
                              <div key={index} className="producto-desglose-item">
                                <span className="producto-nombre-desglose">
                                  {producto.nombre}
                                  {producto.categoria && (
                                    <span className="subcategoria-badge" style={{ background: '#10b981' }}>
                                      {producto.categoria}
                                    </span>
                                  )}
                                </span>
                                <span className="producto-cantidad-desglose">{producto.cantidad} unid.</span>
                                <span className="producto-total-desglose">S/ {producto.total.toFixed(2)}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="sin-datos">No hay ventas registradas por subcategorías</p>
          )}
        </div>

        {/* Venta por Categorías - same logic */}
        <div className="section-card">
          <h2>Venta por Categorías</h2>
          {Object.keys(ventasPorCategoria).length > 0 ? (
            <div className="categorias-list">
              {Object.entries(ventasPorCategoria)
                .sort(([, a], [, b]) => b - a)
                .map(([categoria, total]) => {
                  const expandida = categoriaExpandida === categoria
                  const productos = productosPorCategoria[categoria] || []

                  return (
                    <div key={categoria} className="categoria-container">
                      <div
                        className="categoria-item clickeable"
                        onClick={() => toggleCategoria(categoria)}
                      >
                        <div className="categoria-info">
                          <span className="categoria-nombre">{categoria}</span>
                          <span className="categoria-total">S/ {total.toFixed(2)}</span>
                        </div>
                        <span className="categoria-toggle">
                          {expandida ? '▼' : '▶'}
                        </span>
                      </div>

                      {expandida && productos.length > 0 && (
                        <div className="productos-desglose">
                          <div className="desglose-header">
                            <span>Producto</span>
                            <span>Cantidad</span>
                            <span>Total</span>
                          </div>
                          {productos
                            .sort((a, b) => b.total - a.total)
                            .map((producto, index) => (
                              <div key={index} className="producto-desglose-item">
                                <span className="producto-nombre-desglose">
                                  {producto.nombre}
                                  {producto.subcategoria && (
                                    <span className="subcategoria-badge">{producto.subcategoria}</span>
                                  )}
                                </span>
                                <span className="producto-cantidad-desglose">{producto.cantidad} unid.</span>
                                <span className="producto-total-desglose">S/ {producto.total.toFixed(2)}</span>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          ) : (
            <p className="sin-datos">No hay ventas registradas por categorías</p>
          )}
        </div>

        {/* Productos más y menos vendidos */}
        <div className="productos-stats">
          <div className="section-card">
            <h2>Producto Más Vendido</h2>
            {productoMasVendido ? (
              <div className="producto-stat">
                <span className="producto-nombre">{productoMasVendido.nombre}</span>
                <span className="producto-cantidad">{productoMasVendido.cantidad} unidad{productoMasVendido.cantidad !== 1 ? 'es' : ''}</span>
              </div>
            ) : (
              <p className="sin-datos">No hay productos vendidos</p>
            )}
          </div>

          <div className="section-card">
            <h2>Producto Menos Vendido</h2>
            {productoMenosVendido ? (
              <div className="producto-stat">
                <span className="producto-nombre">{productoMenosVendido.nombre}</span>
                <span className="producto-cantidad">{productoMenosVendido.cantidad} unidad{productoMenosVendido.cantidad !== 1 ? 'es' : ''}</span>
              </div>
            ) : (
              <p className="sin-datos">No hay productos vendidos</p>
            )}
          </div>
        </div>

        {/* Historial de Transacciones */}
        <div className="section-card full-width">
          <h2>Historial de Transacciones</h2>
          {ventasFiltradas.length > 0 ? (
            <table className="tabla-transacciones">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>N° Ticket / ID</th>
                  <th>Productos</th>
                  <th>Método Pago</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {ventasFiltradas.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(venta => (
                  <tr key={venta.id} className={venta.anulada ? 'venta-anulada' : ''}>
                    <td>{new Date(venta.fecha).toLocaleString('es-PE')}</td>
                    <td>{venta.numeroTicket || venta.numeroBoleta || venta.id.slice(-6)}</td>
                    <td>
                      {venta.items.length} item{venta.items.length !== 1 ? 's' : ''}
                      <span className="tooltip-items">
                        ({venta.items.map(i => i.producto.nombre).join(', ')})
                      </span>
                    </td>
                    <td>
                      {venta.metodosPago.map(m => m.tipo).join(', ')}
                    </td>
                    <td className="font-bold">S/ {venta.total.toFixed(2)}</td>
                    <td>
                      {venta.anulada ? (
                        <span className="badge-estado anulada">Anulada</span>
                      ) : (
                        <span className="badge-estado activa">Completada</span>
                      )}
                    </td>
                    <td>
                      <div className="acciones-row">
                        {!venta.anulada ? (
                          <>
                            <button className="btn-icon" title="Reimprimir" onClick={() => onReimprimirTicket(venta)}>🖨️</button>
                            <button className="btn-icon delete" title="Anular Venta" onClick={() => handleAnular(venta.id)}>🚫</button>
                          </>
                        ) : (
                          <span className="text-muted" style={{ fontSize: '0.8rem', color: '#94a3b8 italic' }}>Sin acciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="sin-datos">No hay transacciones en este periodo</p>
          )}
        </div>
      </div>
    </div>
  )
}
