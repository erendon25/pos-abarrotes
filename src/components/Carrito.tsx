import { useState } from 'react'
import { ItemCarrito, Categoria } from '../types'
import SelectorSubcategoria from './SelectorSubcategoria'
import './Carrito.css'

interface CarritoProps {
  items: ItemCarrito[]
  categorias: Categoria[]
  onActualizarCantidad: (id: string, cantidad: number, subcategoria?: string) => void
  onEliminar: (id: string, subcategoria?: string) => void
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
              const itemKey = `${item.producto.id}-${item.subcategoriaSeleccionada || 'base'}-${index}`
              
              return (
                <div key={itemKey} className="carrito-item">
                  <div className="item-info">
                    <h4>{item.producto.nombre}</h4>
                    {item.subcategoriaSeleccionada && (
                      <span className="subcategoria-badge-carrito">{item.subcategoriaSeleccionada}</span>
                    )}
                    <p className="item-precio-unitario">
                      S/ {precio.toFixed(2)} c/u
                    </p>
                  </div>
                  
                  <div className="item-controls">
                    <button
                      className="btn-cantidad"
                      onClick={() => onActualizarCantidad(item.producto.id, item.cantidad - 1, item.subcategoriaSeleccionada)}
                    >
                      −
                    </button>
                    <span className="cantidad">{item.cantidad}</span>
                    <button
                      className="btn-cantidad"
                      onClick={() => onActualizarCantidad(item.producto.id, item.cantidad + 1, item.subcategoriaSeleccionada)}
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
                      onClick={() => onEliminar(item.producto.id, item.subcategoriaSeleccionada)}
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
