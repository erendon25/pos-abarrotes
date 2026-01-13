import { useState, useEffect } from 'react'
import { Producto, Categoria } from '../types'
import GestionCategorias from './GestionCategorias'
import './Almacen.css'

interface AlmacenProps {
  productos: Producto[]
  categorias: Categoria[]
  onVolver: () => void
  onActualizarProductos: (productos: Producto[]) => void
  onActualizarCategorias: (categorias: Categoria[]) => void
  onCambiarVista?: (vista: 'ingresoMercaderia' | 'movimientosInventario' | 'vencimientos') => void
}

export default function Almacen({
  productos,
  categorias,
  onVolver,
  onActualizarProductos,
  onActualizarCategorias,
  onCambiarVista
}: AlmacenProps) {
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [mostrarGestionCategorias, setMostrarGestionCategorias] = useState(false)
  const [formularioProducto, setFormularioProducto] = useState<Partial<Producto>>({
    nombre: '',
    marca: '',
    presentacion: '',
    precio: 0,
    categoria: '',
    subcategoria: '',
    stock: 0,
    codigoBarras: ''
  })

  const iniciarEdicion = (producto: Producto) => {
    setEditandoId(producto.id)
    setFormularioProducto(producto)
    setPreciosSubcategoria(producto.preciosPorSubcategoria || {})
    setEditandoPreciosSubcategoria(false)
  }

  const cancelarEdicion = () => {
    setEditandoId(null)
    setFormularioProducto({ nombre: '', marca: '', presentacion: '', precio: 0, categoria: '', subcategoria: '', stock: 0, codigoBarras: '', fechaVencimiento: undefined })
    setPreciosSubcategoria({})
    setEditandoPreciosSubcategoria(false)
  }

  const guardarEdicion = () => {
    if (!editandoId || !formularioProducto.nombre || !formularioProducto.categoria) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    // Calcular stock total si es producto cerrado
    let stockTotal = formularioProducto.stock || 0
    if (formularioProducto.esCerrado) {
      const stockCaja = formularioProducto.stockCaja || 0
      const stockUnidad = formularioProducto.stockUnidad || 0
      const unidadesPorCaja = formularioProducto.unidadesPorCaja || 20
      stockTotal = (stockCaja * unidadesPorCaja) + stockUnidad
    }

    const productoActualizado: Producto = {
      ...formularioProducto as Producto,
      stock: stockTotal,
      preciosPorSubcategoria: Object.keys(preciosSubcategoria).length > 0 ? preciosSubcategoria : undefined
    }

    const productosActualizados = productos.map(p =>
      p.id === editandoId ? productoActualizado : p
    )
    onActualizarProductos(productosActualizados)
    cancelarEdicion()
  }

  const iniciarNuevoProducto = () => {
    setFormularioProducto({
      nombre: '',
      marca: '',
      presentacion: '',
      precio: 0,
      categoria: '',
      subcategoria: '',
      stock: 0,
      codigoBarras: '',
      fechaVencimiento: undefined,
      esCerrado: false,
      unidadesPorCaja: undefined,
      stockCaja: undefined,
      stockUnidad: undefined,
      precioUnidad: undefined
    })
    setMostrarFormulario(true)
  }

  const guardarNuevoProducto = () => {
    if (!formularioProducto.nombre || !formularioProducto.categoria) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    // Calcular stock total si es producto cerrado
    let stockTotal = formularioProducto.stock || 0
    if (formularioProducto.esCerrado) {
      const stockCaja = formularioProducto.stockCaja || 0
      const stockUnidad = formularioProducto.stockUnidad || 0
      const unidadesPorCaja = formularioProducto.unidadesPorCaja || 20
      stockTotal = (stockCaja * unidadesPorCaja) + stockUnidad
    }

    const nuevoProducto: Producto = {
      id: Date.now().toString(),
      nombre: formularioProducto.nombre,
      marca: formularioProducto.marca || undefined,
      presentacion: formularioProducto.presentacion || undefined,
      precio: formularioProducto.precio || 0,
      categoria: formularioProducto.categoria,
      subcategoria: formularioProducto.subcategoria || undefined,
      stock: stockTotal,
      codigoBarras: formularioProducto.codigoBarras || undefined,
      esCerrado: formularioProducto.esCerrado || undefined,
      unidadesPorCaja: formularioProducto.unidadesPorCaja || undefined,
      stockCaja: formularioProducto.stockCaja || undefined,
      stockUnidad: formularioProducto.stockUnidad || undefined,
      precioUnidad: formularioProducto.precioUnidad || undefined
    }

    onActualizarProductos([...productos, nuevoProducto])
    setMostrarFormulario(false)
    setFormularioProducto({
      nombre: '',
      marca: '',
      presentacion: '',
      precio: 0,
      categoria: '',
      subcategoria: '',
      stock: 0,
      codigoBarras: '',
      esCerrado: false,
      unidadesPorCaja: undefined,
      stockCaja: undefined,
      stockUnidad: undefined,
      precioUnidad: undefined
    })
  }

  const eliminarProducto = (id: string) => {
    if (confirm('¿Estás seguro de eliminar este producto?')) {
      onActualizarProductos(productos.filter(p => p.id !== id))
    }
  }

  const categoriaSeleccionada = categorias.find(c => c.nombre === formularioProducto.categoria)
  const subcategoriasDisponibles = categoriaSeleccionada?.subcategorias || []
  const [editandoPreciosSubcategoria, setEditandoPreciosSubcategoria] = useState(false)
  const [preciosSubcategoria, setPreciosSubcategoria] = useState<Record<string, number>>(
    formularioProducto.preciosPorSubcategoria || {}
  )

  const actualizarPrecioSubcategoria = (subcategoria: string, precio: number) => {
    setPreciosSubcategoria(prev => ({
      ...prev,
      [subcategoria]: precio
    }))
  }

  const eliminarPrecioSubcategoria = (subcategoria: string) => {
    const nuevosPrecios = { ...preciosSubcategoria }
    delete nuevosPrecios[subcategoria]
    setPreciosSubcategoria(nuevosPrecios)
  }

  const guardarPreciosSubcategoria = () => {
    setFormularioProducto({
      ...formularioProducto,
      preciosPorSubcategoria: Object.keys(preciosSubcategoria).length > 0 ? preciosSubcategoria : undefined
    })
    setEditandoPreciosSubcategoria(false)
  }

  const [menuAbierto, setMenuAbierto] = useState(false)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroCategoria, setFiltroCategoria] = useState('')
  const [filtroStock, setFiltroStock] = useState('todos') // todos, bajo, sin
  const [limiteVisible, setLimiteVisible] = useState(50)

  // Resetear límite cuando cambian los filtros
  useEffect(() => {
    setLimiteVisible(50)
  }, [filtroTexto, filtroCategoria, filtroStock])

  // Lógica de filtrado y ordenamiento
  const productosFiltrados = productos.filter(p => {
    // Filtro por texto (nombre, marca, código)
    const texto = filtroTexto.toLowerCase()
    const coincideTexto =
      p.nombre.toLowerCase().includes(texto) ||
      (p.marca && p.marca.toLowerCase().includes(texto)) ||
      (p.codigoBarras && p.codigoBarras.includes(texto))

    if (!coincideTexto) return false

    // Filtro por categoría
    if (filtroCategoria && p.categoria !== filtroCategoria) return false

    // Filtro por stock
    if (filtroStock === 'bajo') return p.stock < 10 && p.stock > 0
    if (filtroStock === 'sin') return p.stock === 0

    return true
  }).sort((a, b) => {
    // Ordenar por nombre primero
    const nombreA = (a.nombre || '').toLowerCase()
    const nombreB = (b.nombre || '').toLowerCase()
    if (nombreA !== nombreB) {
      return nombreA.localeCompare(nombreB, 'es', { sensitivity: 'base' })
    }
    return 0
  })

  const productosVisibles = productosFiltrados.slice(0, limiteVisible)

  return (
    <div className="almacen">
      {/* ... (Header y Menú igual que antes) ... */}
      <div className="almacen-header">
        <h1>Almacén</h1>
        <div className="header-actions">
          <button
            className="btn-menu-toggle"
            onClick={() => setMenuAbierto(!menuAbierto)}
            aria-label="Toggle menu"
          >
            ☰
          </button>
          <button className="btn-volver" onClick={onVolver}>
            ← Volver a Venta
          </button>
        </div>
      </div>

      {/* Menú deslizante */}
      <div className={`menu-deslizante ${menuAbierto ? 'abierto' : ''}`}>
        <h3 className="menu-titulo">Opciones</h3>
        <button className="btn-menu-item" onClick={() => {
          setMostrarGestionCategorias(true)
          setMenuAbierto(false)
        }}>
          ⚙️ Gestionar Categorías
        </button>
        <button className="btn-menu-item" onClick={() => {
          iniciarNuevoProducto()
          setMenuAbierto(false)
        }}>
          + Agregar Producto
        </button>
        <button className="btn-menu-item" onClick={() => {
          onCambiarVista?.('movimientosInventario')
          setMenuAbierto(false)
        }}>
          📊 Movimientos
        </button>
        <button className="btn-menu-item" onClick={() => {
          onCambiarVista?.('vencimientos')
          setMenuAbierto(false)
        }}>
          ⏰ Vencimientos
        </button>
      </div>

      {/* Overlay para cerrar menú */}
      {menuAbierto && (
        <div className="menu-overlay" onClick={() => setMenuAbierto(false)}></div>
      )}

      {/* Botón flotante para ingreso mercadería */}
      <button
        className="btn-flotante-ingreso"
        onClick={() => onCambiarVista?.('ingresoMercaderia')}
        title="Ingreso de Mercadería"
      >
        +
      </button>

      {mostrarGestionCategorias && (
        <GestionCategorias
          categorias={categorias}
          onGuardar={onActualizarCategorias}
          onCerrar={() => setMostrarGestionCategorias(false)}
        />
      )}

      <div className="almacen-content">

        <div className="almacen-stats">
          <div className="stat-card">
            <span className="stat-label">Total Productos</span>
            <span className="stat-value">{productosFiltrados.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Stock Bajo</span>
            <span className="stat-value warning">
              {productos.filter(p => p.stock < 10).length}
            </span>
          </div>
        </div>

        {mostrarFormulario && (
          <div className="formulario-card">
            <h2>Nuevo Producto</h2>
            <div className="form-grid">
              <div className="form-group">
                <label>Nombre del Producto *</label>
                <input
                  type="text"
                  value={formularioProducto.nombre || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                  placeholder="Ej: Arroz"
                />
              </div>
              <div className="form-group">
                <label>Marca (Opcional)</label>
                <input
                  type="text"
                  value={formularioProducto.marca || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, marca: e.target.value })}
                  placeholder="Ej: Gloria, Primor, Costeño"
                />
              </div>
              <div className="form-group">
                <label>Presentación/Tamaño (Opcional)</label>
                <input
                  type="text"
                  value={formularioProducto.presentacion || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, presentacion: e.target.value })}
                  placeholder="Ej: 1kg, 500g, Lata 400g"
                />
              </div>
              <div className="form-group">
                <label>Categoría *</label>
                <select
                  value={formularioProducto.categoria || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, categoria: e.target.value, subcategoria: '' })}
                >
                  <option value="">Selecciona una categoría</option>
                  {categorias.map(cat => (
                    <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                  ))}
                </select>
              </div>
              {subcategoriasDisponibles.length > 0 && (
                <div className="form-group">
                  <label>Subcategoría (Opcional)</label>
                  <select
                    value={formularioProducto.subcategoria || ''}
                    onChange={(e) => setFormularioProducto({ ...formularioProducto, subcategoria: e.target.value })}
                  >
                    <option value="">Sin subcategoría</option>
                    {subcategoriasDisponibles.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="form-group">
                <label>Precio (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formularioProducto.precio || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                />
              </div>
              <div className="form-group">
                <label>Stock Inicial</label>
                <input
                  type="number"
                  min="0"
                  value={formularioProducto.stock || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                />
              </div>
              <div className="form-group">
                <label>Código de Barras</label>
                <input
                  type="text"
                  value={formularioProducto.codigoBarras || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, codigoBarras: e.target.value })}
                  placeholder="Ej: 7891234567890"
                />
              </div>
              <div className="form-group">
                <label>Fecha de Vencimiento (Opcional)</label>
                <input
                  type="date"
                  value={formularioProducto.fechaVencimiento ? new Date(formularioProducto.fechaVencimiento).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    const fecha = e.target.value ? new Date(e.target.value) : undefined
                    setFormularioProducto({ ...formularioProducto, fechaVencimiento: fecha })
                  }}
                />
              </div>

              {/* Producto cerrado (cajas/unidades) */}
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={formularioProducto.esCerrado || false}
                    onChange={(e) => {
                      const esCerrado = e.target.checked
                      setFormularioProducto({
                        ...formularioProducto,
                        esCerrado,
                        unidadesPorCaja: esCerrado ? (formularioProducto.unidadesPorCaja || 20) : undefined,
                        stockCaja: esCerrado ? (formularioProducto.stockCaja || 0) : undefined,
                        stockUnidad: esCerrado ? (formularioProducto.stockUnidad || 0) : undefined,
                        precioUnidad: esCerrado ? (formularioProducto.precioUnidad || formularioProducto.precio) : undefined,
                        stock: esCerrado ? (
                          ((formularioProducto.stockCaja || 0) * (formularioProducto.unidadesPorCaja || 20)) + (formularioProducto.stockUnidad || 0)
                        ) : formularioProducto.stock
                      })
                    }}
                  />
                  <span>Producto cerrado (se vende en cajas y unidades, ej: cigarros)</span>
                </label>
              </div>

              {formularioProducto.esCerrado && (
                <>
                  <div className="form-group">
                    <label>Unidades por Caja</label>
                    <input
                      type="number"
                      min="1"
                      value={formularioProducto.unidadesPorCaja || ''}
                      onChange={(e) => {
                        const unidadesPorCaja = parseInt(e.target.value) || 0
                        const stockCaja = formularioProducto.stockCaja || 0
                        const stockUnidad = formularioProducto.stockUnidad || 0
                        const stockTotal = (stockCaja * unidadesPorCaja) + stockUnidad
                        setFormularioProducto({
                          ...formularioProducto,
                          unidadesPorCaja,
                          stock: stockTotal
                        })
                      }}
                      placeholder="20"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock en Cajas</label>
                    <input
                      type="number"
                      min="0"
                      value={formularioProducto.stockCaja || ''}
                      onChange={(e) => {
                        const stockCaja = parseInt(e.target.value) || 0
                        const unidadesPorCaja = formularioProducto.unidadesPorCaja || 20
                        const stockUnidad = formularioProducto.stockUnidad || 0
                        const stockTotal = (stockCaja * unidadesPorCaja) + stockUnidad
                        setFormularioProducto({
                          ...formularioProducto,
                          stockCaja,
                          stock: stockTotal
                        })
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Stock en Unidades</label>
                    <input
                      type="number"
                      min="0"
                      value={formularioProducto.stockUnidad || ''}
                      onChange={(e) => {
                        const stockUnidad = parseInt(e.target.value) || 0
                        const unidadesPorCaja = formularioProducto.unidadesPorCaja || 20
                        const stockCaja = formularioProducto.stockCaja || 0
                        const stockTotal = (stockCaja * unidadesPorCaja) + stockUnidad
                        setFormularioProducto({
                          ...formularioProducto,
                          stockUnidad,
                          stock: stockTotal
                        })
                      }}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Precio por Unidad (S/)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formularioProducto.precioUnidad || formularioProducto.precio || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, precioUnidad: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                    />
                    <small style={{ color: '#6b7280', fontSize: '0.75rem' }}>
                      Precio base ({formularioProducto.precio || 0}) es el precio por caja
                    </small>
                  </div>
                </>
              )}
            </div>
            <div className="form-actions">
              <button className="btn-guardar" onClick={guardarNuevoProducto}>
                Guardar Producto
              </button>
              <button className="btn-cancelar" onClick={() => setMostrarFormulario(false)}>
                Cancelar
              </button>
            </div>
          </div>
        )}

        <div className="productos-almacen">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ margin: 0 }}>Inventario</h2>

            {/* Filtros */}
            <div className="filtros-container" style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                placeholder="🔍 Buscar..."
                value={filtroTexto}
                onChange={e => setFiltroTexto(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              />

              <select
                value={filtroCategoria}
                onChange={e => setFiltroCategoria(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="">Todas las Categorías</option>
                {categorias.map(c => <option key={c.nombre} value={c.nombre}>{c.nombre}</option>)}
              </select>

              <select
                value={filtroStock}
                onChange={e => setFiltroStock(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
              >
                <option value="todos">Todos los Stocks</option>
                <option value="bajo">Stock Bajo (&lt;10)</option>
                <option value="sin">Sin Stock (0)</option>
              </select>
            </div>
          </div>

          <div className="productos-table">
            <div className="table-header">
              <div className="col-nombre-vencimiento">
                <div>Producto</div>
                <div className="header-subtitle">Vencimiento</div>
              </div>
              <div className="col-acciones">Acciones</div>
              <div className="col-categoria">Categoría</div>
              <div className="col-stock">Stock</div>
              <div className="col-precio">Precio</div>
              <div className="col-codigo-barras">Código Barras</div>
            </div>
            {productosVisibles.map(producto => (
              editandoId === producto.id ? (
                <div key={producto.id} className="table-row edicion">
                  <div className="col-nombre-vencimiento">
                    <input
                      type="text"
                      value={formularioProducto.nombre || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                      placeholder="Nombre"
                      style={{ marginBottom: '0.25rem' }}
                    />
                    <input
                      type="text"
                      value={formularioProducto.marca || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, marca: e.target.value })}
                      placeholder="Marca (opcional)"
                      style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}
                    />
                    <input
                      type="text"
                      value={formularioProducto.presentacion || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, presentacion: e.target.value })}
                      placeholder="Presentación (opcional)"
                      style={{ marginBottom: '0.25rem', fontSize: '0.75rem' }}
                    />
                    <input
                      type="date"
                      value={formularioProducto.fechaVencimiento ? new Date(formularioProducto.fechaVencimiento).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const fecha = e.target.value ? new Date(e.target.value) : undefined
                        setFormularioProducto({ ...formularioProducto, fechaVencimiento: fecha })
                      }}
                      style={{ fontSize: '0.75rem' }}
                    />
                  </div>
                  <div className="col-acciones">
                    <button className="btn-icon guardar" onClick={guardarEdicion} title="Guardar">
                      ✓
                    </button>
                    <button className="btn-icon cancelar" onClick={cancelarEdicion} title="Cancelar">
                      ×
                    </button>
                  </div>
                  <div className="col-categoria">
                    <select
                      value={formularioProducto.categoria || ''}
                      onChange={(e) => {
                        setFormularioProducto({
                          ...formularioProducto,
                          categoria: e.target.value,
                          subcategoria: ''
                        })
                      }}
                    >
                      {categorias.map(cat => (
                        <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                      ))}
                    </select>
                    {(categorias.find(c => c.nombre === formularioProducto.categoria)?.subcategorias.length ?? 0) > 0 && (
                      <select
                        value={formularioProducto.subcategoria || ''}
                        onChange={(e) => setFormularioProducto({ ...formularioProducto, subcategoria: e.target.value })}
                        style={{ marginTop: '0.5rem' }}
                      >
                        <option value="">Sin subcategoría</option>
                        {categorias.find(c => c.nombre === formularioProducto.categoria)?.subcategorias.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div className="col-stock">
                    <input
                      type="number"
                      min="0"
                      value={formularioProducto.stock || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, stock: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                  <div className="col-precio">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formularioProducto.precio || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, precio: parseFloat(e.target.value) || 0 })}
                    />
                    {subcategoriasDisponibles.length > 0 && (
                      <button
                        className="btn-precios-subcategoria"
                        onClick={() => setEditandoPreciosSubcategoria(!editandoPreciosSubcategoria)}
                        style={{ marginTop: '0.5rem', width: '100%' }}
                      >
                        {editandoPreciosSubcategoria ? 'Ocultar' : 'Gestionar'} Precios por Subcategoría
                      </button>
                    )}
                    {editandoPreciosSubcategoria && subcategoriasDisponibles.length > 0 && (
                      <div className="precios-subcategoria-edicion">
                        {subcategoriasDisponibles.map(sub => (
                          <div key={sub} className="precio-subcategoria-item">
                            <label>{sub}:</label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={preciosSubcategoria[sub] || ''}
                              onChange={(e) => actualizarPrecioSubcategoria(sub, parseFloat(e.target.value) || 0)}
                              placeholder={formularioProducto.precio?.toFixed(2) || '0.00'}
                            />
                            <button
                              className="btn-eliminar-precio-sub"
                              onClick={() => eliminarPrecioSubcategoria(sub)}
                              title="Eliminar precio"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                        <button
                          className="btn-guardar-precios-sub"
                          onClick={guardarPreciosSubcategoria}
                        >
                          Guardar Precios
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="col-codigo-barras">
                    <input
                      type="text"
                      value={formularioProducto.codigoBarras || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, codigoBarras: e.target.value })}
                      placeholder="Código de barras"
                    />
                  </div>
                </div>
              ) : (
                <div
                  key={producto.id}
                  className={`table-row ${producto.stock === 0 ? 'sin-stock' : producto.stock < 10 ? 'stock-bajo' : ''}`}
                >
                  <div className="col-nombre-vencimiento">
                    <div className="producto-nombre">
                      {producto.nombre}
                      {producto.marca && (
                        <span className="marca-badge-table">{producto.marca}</span>
                      )}
                      {producto.presentacion && (
                        <span className="presentacion-badge-table">{producto.presentacion}</span>
                      )}
                      {producto.subcategoria && (
                        <span className="subcategoria-badge-table">{producto.subcategoria}</span>
                      )}
                    </div>
                    <div className="producto-vencimiento">
                      {producto.fechaVencimiento
                        ? new Date(producto.fechaVencimiento).toLocaleDateString('es-PE')
                        : '-'}
                    </div>
                  </div>
                  <div className="col-acciones">
                    <button className="btn-icon editar" onClick={() => iniciarEdicion(producto)} title="Editar">
                      ✎
                    </button>
                    <button className="btn-icon eliminar" onClick={() => eliminarProducto(producto.id)} title="Eliminar">
                      🗑
                    </button>
                  </div>
                  <div className="col-categoria">{producto.categoria}</div>
                  <div className="col-stock">
                    {producto.esCerrado && producto.stockCaja !== undefined && producto.stockUnidad !== undefined ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem' }}>
                        <span className={producto.stock === 0 ? 'stock-cero' : producto.stock < 10 ? 'stock-bajo-badge' : ''}>
                          Total: {producto.stock}
                        </span>
                        <span style={{ color: '#6b7280' }}>
                          {producto.stockCaja} cajas + {producto.stockUnidad} unidades
                        </span>
                      </div>
                    ) : (
                      <span className={producto.stock === 0 ? 'stock-cero' : producto.stock < 10 ? 'stock-bajo-badge' : ''}>
                        {producto.stock}
                      </span>
                    )}
                  </div>
                  <div className="col-precio">
                    S/ {producto.precio.toFixed(2)}
                    {producto.preciosPorSubcategoria && Object.keys(producto.preciosPorSubcategoria).length > 0 && (
                      <span className="tiene-variantes"> (con variantes)</span>
                    )}
                  </div>
                  <div className="col-codigo-barras">{producto.codigoBarras || '-'}</div>
                </div>
              )
            ))}
          </div>
          {limiteVisible < productosFiltrados.length && (
            <div style={{ textAlign: 'center', margin: '2rem 0' }}>
              <button
                className="btn-guardar"
                onClick={() => setLimiteVisible(prev => prev + 50)}
                style={{ padding: '0.75rem 2rem', fontSize: '1rem' }}
              >
                Cargar más productos ({productosFiltrados.length - limiteVisible} restantes)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
