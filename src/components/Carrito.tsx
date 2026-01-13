import { useState } from 'react'
import { ItemCarrito, Categoria } from '../types'
import SelectorSubcategoria from './SelectorSubcategoria'
import './Carrito.css'

interface CarritoProps {
  items: ItemCarrito[]
  categorias: Categoria[]
  onActualizarCantidad: (id: string, cantidad: number, subcategoria?: string, vendidoEnUnidades?: boolean) => void
  onEliminar: (id: string, subcategoria?: string, vendidoEnUnidades?: boolean) => void
  onCambiarSubcategoria: (item: ItemCarrito, nuevaSubcategoria: string | null) => void
  onProcesarVenta: () => void
  total: number
  obtenerPrecio: (item: ItemCarrito) => number
}

export default function Carrito({ 
  items, 
  categorias,
  onActualizarCantidad, 
  onEliminar, 
  onCambiarSubcategoria,
  onProcesarVenta,
  total,
  obtenerPrecio
}: CarritoProps) {
  const [itemEditando, setItemEditando] = useState<ItemCarrito | null>(null)

  const handleCambiarSubcategoria = (subcategoria: string | null) => {
    if (itemEditando) {
      onCambiarSubcategoria(itemEditando, subcategoria)
      setItemEditando(null)
    }
  }

  return (
    <div className="carrito">
      {itemEditando && (
        <SelectorSubcategoria
          producto={itemEditando.producto}
          categorias={categorias}
          onSeleccionar={handleCambiarSubcategoria}
          onCancelar={() => setItemEditando(null)}
        />
      )}
      
      <h2>Carrito de Compras</h2>
      
      {items.length === 0 ? (
        <div className="carrito-vacio">
          <p>El carrito está vacío</p>
          <p className="hint">Haz clic en un producto para agregarlo</p>
        </div>
      ) : (
        <>
          <div className="carrito-items">
            {items.map((item, index) => {
              const precio = obtenerPrecio(item)
              const itemKey = `${item.producto.id}-${item.subcategoriaSeleccionada || 'base'}-${item.vendidoEnUnidades ? 'unidades' : 'caja'}-${index}`
              const esProductoCerrado = item.producto.esCerrado
              const tipoVenta = esProductoCerrado ? (item.vendidoEnUnidades ? 'unidades' : 'cajas') : null
              
              return (
                <div key={itemKey} className="carrito-item">
                  <div className="item-info">
                    <h4>{item.producto.nombre}</h4>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                      {item.producto.marca && (
                        <span className="marca-badge-carrito">{item.producto.marca}</span>
                      )}
                      {item.producto.presentacion && (
                        <span className="presentacion-badge-carrito">{item.producto.presentacion}</span>
                      )}
                      {item.subcategoriaSeleccionada && (
                        <span className="subcategoria-badge-carrito">{item.subcategoriaSeleccionada}</span>
                      )}
                      {tipoVenta && (
                        <span className="tipo-venta-badge">
                          {tipoVenta === 'unidades' ? '📄 Por unidad' : '📦 Por caja'}
                        </span>
                      )}
                    </div>
                    <p className="item-precio-unitario">
                      S/ {precio.toFixed(2)} {tipoVenta === 'unidades' ? 'c/unidad' : tipoVenta === 'cajas' ? 'c/caja' : 'c/u'}
                    </p>
                  </div>
                  
                  <div className="item-controls">
                    <button
                      className="btn-cantidad"
                      onClick={() => onActualizarCantidad(item.producto.id, item.cantidad - 1, item.subcategoriaSeleccionada, item.vendidoEnUnidades)}
                    >
                      −
                    </button>
                    <span className="cantidad">
                      {item.cantidad} {tipoVenta === 'unidades' ? 'unid.' : tipoVenta === 'cajas' ? 'cajas' : ''}
                    </span>
                    <button
                      className="btn-cantidad"
                      onClick={() => onActualizarCantidad(item.producto.id, item.cantidad + 1, item.subcategoriaSeleccionada, item.vendidoEnUnidades)}
                    >
                      +
                    </button>
                    {item.producto.preciosPorSubcategoria && Object.keys(item.producto.preciosPorSubcategoria).length > 0 && (
                      <button
                        className="btn-cambiar-variante"
                        onClick={() => setItemEditando(item)}
                        title="Cambiar variante"
                      >
                        🔄
                      </button>
                    )}
                    <button
                      className="btn-eliminar"
                      onClick={() => onEliminar(item.producto.id, item.subcategoriaSeleccionada, item.vendidoEnUnidades)}
                    >
                      ×
                    </button>
                  </div>
                  
                  <div className="item-subtotal">
                    S/ {(precio * item.cantidad).toFixed(2)}
                  </div>
                </div>
              )
            })}
          </div>
          
          <div className="carrito-footer">
            <div className="total-section">
              <span className="total-label">Total:</span>
              <span className="total-amount">S/ {total.toFixed(2)}</span>
            </div>
            
            <button 
              className="btn-procesar"
              onClick={onProcesarVenta}
            >
              Procesar Venta
            </button>
          </div>
        </>
      )}
    </div>
  )
}
