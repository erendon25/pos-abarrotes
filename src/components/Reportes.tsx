import { useState } from 'react'
import { Venta, ItemCarrito, Usuario, Cliente } from '../types'
import './Reportes.css'

interface ReportesProps {
  ventas: Venta[]
  onVolver: () => void
  onAnularVenta: (id: string) => void
  onReimprimirTicket: (venta: Venta) => void
  usuario: Usuario
  clientes: Cliente[]
}

interface ProductoVendido {
  nombre: string
  cantidad: number
  total: number
  categoria: string
  subcategoria?: string
}

export default function Reportes({ ventas, onVolver, onAnularVenta, onReimprimirTicket, usuario, clientes }: ReportesProps) {
  // ... (existing state)
  const [categoriaExpandida, setCategoriaExpandida] = useState<string | null>(null)
  const [subcategoriaExpandida, setSubcategoriaExpandida] = useState<string | null>(null)
  const [filtroFechaDesde, setFiltroFechaDesde] = useState(() => new Date().toLocaleDateString('en-CA')) // YYYY-MM-DD
  const [filtroFechaHasta, setFiltroFechaHasta] = useState(() => new Date().toLocaleDateString('en-CA'))

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
  // Calcular venta total (Legacy variable removed)


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
    tarjeta: 0,
    credito: 0
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
    const today = new Date().toLocaleDateString('en-CA')
    setFiltroFechaDesde(today)
    setFiltroFechaHasta(today)
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

  const handleImprimirReporte = () => {
    // Generate simple thermal print HTML
    const printWindow = window.open('', '', 'width=300,height=600')
    if (!printWindow) return

    const totalCobrado = ventasPorMetodo.efectivo + ventasPorMetodo.yape + ventasPorMetodo.tarjeta

    // Separar Ingresos: Ventas Varios vs Cobros de Deuda
    // 1. Cobros de Deuda (Ventas sin items)
    const cobrosDeudaVentas = ventasFiltradas.filter(v => v.items.length === 0 && !v.anulada)
    const totalCobroDeudas = cobrosDeudaVentas.reduce((sum, v) => sum + v.total, 0)

    // 2. Ventas de Productos (Total Cobrado - Cobros Deuda)
    // OJO: TotalCobrado ya incluye todo lo que entró en dinero. Restamos lo que es deuda para saber venta neta.
    const totalVentaProductos = totalCobrado - totalCobroDeudas

    // 3. Deuda Total Global (Saldo Pendiente de todos los clientes)
    // Usamos el prop 'clientes' que ahora recibimos
    const totalDeudaPendienteGlobal = clientes.reduce((sum, c) => sum + (c.deudaActual || 0), 0)

    const fechaStr = new Date().toLocaleString('es-PE')
    const desdeStr = filtroFechaDesde ? formatearFecha(filtroFechaDesde) : 'Inicio'
    const hastaStr = filtroFechaHasta ? formatearFecha(filtroFechaHasta) : 'Hoy'

    const html = `
      <html>
      <head>
        <style>
          @page { margin: 0; size: auto; }
          body { 
            font-family: 'Courier New', Courier, monospace; 
            width: 100%;
            max-width: 72mm;
            margin: 0;
            padding: 2mm; 
            font-size: 11px;
            color: #000;
          }
          .bold { font-weight: bold; }
          .center { text-align: center; }
          .right { text-align: right; }
          .header { text-align: center; margin-bottom: 5px; border-bottom: 1px dashed #000; padding-bottom: 5px; }
          .title { font-size: 14px; font-weight: bold; margin: 0; }
          .row { display: flex; justify-content: space-between; margin-bottom: 2px; }
          .row-indent { display: flex; justify-content: space-between; margin-bottom: 2px; padding-left: 10px; font-size: 10px; }
          .divider { border-top: 1px dashed #000; margin: 5px 0; }
          .section-title { font-weight: bold; margin-top: 5px; margin-bottom: 2px; text-decoration: underline; }
          .subtitle { font-size: 10px; font-style: italic; margin-bottom: 4px; }
        </style>
      </head>
      <body>
        <div class="header">
          <p class="title">REPORTE DE CIERRE</p>
          <p style="margin:2px 0; font-size:10px;">${fechaStr}</p>
          <p style="margin:2px 0; font-size:10px;">Del: ${desdeStr} Al: ${hastaStr}</p>
          <p style="margin:2px 0; font-size:10px;">Usuario: ${usuario.nombre}</p>
        </div>

        <div class="row bold" style="font-size: 13px;">
          <span>TOTAL INGRESOS CAJA:</span>
          <span>S/ ${totalCobrado.toFixed(2)}</span>
        </div>
        
        <div class="row-indent">
          <span>> Venta Productos:</span>
          <span>S/ ${totalVentaProductos.toFixed(2)}</span>
        </div>
        <div class="row-indent">
          <span>> Cobro Ctas. Por Cobrar:</span>
          <span>S/ ${totalCobroDeudas.toFixed(2)}</span>
        </div>

        <div class="divider"></div>

        <p class="section-title">DETALLE MEDIOS PAGO</p>
        <div class="row"><span>Efectivo:</span><span>S/ ${ventasPorMetodo.efectivo.toFixed(2)}</span></div>
        <div class="row"><span>Yape:</span><span>S/ ${ventasPorMetodo.yape.toFixed(2)}</span></div>
        <div class="row"><span>Tarjeta:</span><span>S/ ${ventasPorMetodo.tarjeta.toFixed(2)}</span></div>
        
        <div class="divider"></div>
        <div class="row bold">
          <span>CRÉDITOS NUEVOS (HOY):</span>
          <span>S/ ${ventasPorMetodo.credito.toFixed(2)}</span>
        </div>
        <div class="subtitle center">Ventas al crédito realizadas hoy</div>

        <div class="divider"></div>
        <div class="row bold" style="font-size:12px;">
          <span>TOTAL CTAS. POR COBRAR:</span>
          <span>S/ ${totalDeudaPendienteGlobal.toFixed(2)}</span>
        </div>
        <div class="subtitle center">Saldo deudores (Global Pendiente)</div>

        <div class="divider"></div>
        <p class="section-title">RESUMEN OPERACIONES</p>
        <div class="row"><span>Ventas Realizadas:</span><span>${ventasFiltradas.filter(v => v.items.length > 0 && !v.anulada).length}</span></div>
        <div class="row"><span>Pagos Deuda Recibidos:</span><span>${cobrosDeudaVentas.length}</span></div>
        <div class="row"><span>Anuladas:</span><span>${ventasFiltradas.filter(v => v.anulada).length}</span></div>
        
        <br/><br/>
        <div class="center" style="font-size:10px;">--- FIN DEL REPORTE ---</div>
      </body>
      </html>
    `
    printWindow.document.write(html)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 250)
  }

  return (
    <div className="reportes">
      <div className="reportes-header">
        <h1>Reportes y Estadísticas</h1>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={handleImprimirReporte}
            className="btn-volver"
            style={{ background: '#0f172a', color: 'white', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            🖨️ Imprimir Reporte
          </button>
          <button className="btn-volver" onClick={onVolver}>
            ← Volver a Venta
          </button>
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
        {/* Venta Total (Cash Flow) */}
        <div className="stat-card grande">
          <div className="stat-icon">💰</div>
          <div className="stat-info">
            <span className="stat-label">Venta Cobrada (Dia)</span>
            <span className="stat-value">S/ {(ventasPorMetodo.efectivo + ventasPorMetodo.yape + ventasPorMetodo.tarjeta).toFixed(2)}</span>
            <span className="stat-subtitle">Efectivo + Yape + Tarjeta</span>
          </div>
        </div>

        {/* Cuentas Por Cobrar */}
        <div className="stat-card grande" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <span className="stat-label">Créditos (Por Cobrar)</span>
            <span className="stat-value">S/ {ventasPorMetodo.credito.toFixed(2)}</span>
            <span className="stat-subtitle">Ventas al crédito del periodo</span>
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
            {ventasPorMetodo.credito > 0 && (
              <div className="metodo-pago-stat">
                <div className="metodo-header">
                  <span className="metodo-icon-stat">📝</span>
                  <span className="metodo-nombre-stat">Crédito</span>
                </div>
                <span className="metodo-total-stat">S/ {ventasPorMetodo.credito.toFixed(2)}</span>
              </div>
            )}
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
