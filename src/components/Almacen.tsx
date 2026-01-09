import { useState } from 'react'
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
    setFormularioProducto({ nombre: '', precio: 0, categoria: '', subcategoria: '', stock: 0, codigoBarras: '', fechaVencimiento: undefined })
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

  return (
    <div className="almacen">
      <div className="almacen-header">
        <h1>Almacén</h1>
        <div className="header-actions">
          <button className="btn-categorias" onClick={() => setMostrarGestionCategorias(true)}>
            ⚙️ Gestionar Categorías
          </button>
          <button className="btn-agregar" onClick={iniciarNuevoProducto}>
            + Agregar Producto
          </button>
          <button className="btn-ingreso" onClick={() => onCambiarVista?.('ingresoMercaderia')}>
            📥 Ingreso Mercadería
          </button>
          <button className="btn-movimientos" onClick={() => onCambiarVista?.('movimientosInventario')}>
            📊 Movimientos
          </button>
          <button className="btn-vencimientos" onClick={() => onCambiarVista?.('vencimientos')}>
            ⏰ Vencimientos
          </button>
          <button className="btn-volver" onClick={onVolver}>
            ← Volver a Venta
          </button>
        </div>
      </div>
      
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
            <span className="stat-label">Total de Productos</span>
            <span className="stat-value">{productos.length}</span>
          </div>
          <div className="stat-card">
            <span className="stat-label">Productos con Stock Bajo</span>
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
                <label>Nombre del Producto</label>
                <input
                  type="text"
                  value={formularioProducto.nombre || ''}
                  onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                  placeholder="Ej: Arroz 1kg"
                />
              </div>
              <div className="form-group">
                <label>Categoría</label>
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
          <h2>Inventario</h2>
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
            {productos.map(producto => (
              editandoId === producto.id ? (
                <div key={producto.id} className="table-row edicion">
                  <div className="col-nombre-vencimiento">
                    <input
                      type="text"
                      value={formularioProducto.nombre || ''}
                      onChange={(e) => setFormularioProducto({ ...formularioProducto, nombre: e.target.value })}
                      style={{ marginBottom: '0.25rem' }}
                    />
                    <input
                      type="date"
                      value={formularioProducto.fechaVencimiento ? new Date(formularioProducto.fechaVencimiento).toISOString().split('T')[0] : ''}
                      onChange={(e) => {
                        const fecha = e.target.value ? new Date(e.target.value) : undefined
                        setFormularioProducto({ ...formularioProducto, fechaVencimiento: fecha })
                      }}
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
        </div>
      </div>
    </div>
  )
}
