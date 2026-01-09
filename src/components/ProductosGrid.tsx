import { useState } from 'react'
import { Producto, Categoria } from '../types'
import './ProductosGrid.css'

interface ProductosGridProps {
  productos: Producto[]
  categorias: Categoria[]
  onAgregar: (producto: Producto) => void
}

export default function ProductosGrid({ productos, onAgregar }: ProductosGridProps) {
  const [filtro, setFiltro] = useState('')

  const obtenerRangoPrecios = (producto: Producto) => {
    if (!producto.preciosPorSubcategoria || Object.keys(producto.preciosPorSubcategoria).length === 0) {
      return null
    }
    
    const precios = Object.values(producto.preciosPorSubcategoria)
    const minPrecio = Math.min(...precios, producto.precio)
    const maxPrecio = Math.max(...precios, producto.precio)
    
    if (minPrecio === maxPrecio) {
      return null
    }
    
    return { min: minPrecio, max: maxPrecio }
  }

  const productosFiltrados = productos.filter(producto => {
    if (!filtro.trim()) return true
    const busqueda = filtro.toLowerCase()
    return (
      producto.nombre.toLowerCase().includes(busqueda) ||
      producto.categoria.toLowerCase().includes(busqueda) ||
      (producto.subcategoria && producto.subcategoria.toLowerCase().includes(busqueda)) ||
      (producto.codigoBarras && producto.codigoBarras.toLowerCase().includes(busqueda)) ||
      (producto.codigoBarras && producto.codigoBarras === filtro.trim()) // Búsqueda exacta por código de barras
    )
  })

  return (
    <div className="productos-container">
      <div className="filtro-container">
          <input
            type="text"
            className="filtro-input"
            placeholder="Buscar por nombre, categoría, subcategoría o código de barras..."
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
          />
        {filtro && (
          <button 
            className="btn-limpiar-filtro"
            onClick={() => setFiltro('')}
            title="Limpiar búsqueda"
          >
            ×
          </button>
        )}
      </div>
      
      <div className="productos-lista">
        {productosFiltrados.length === 0 ? (
          <div className="sin-resultados">
            <p>No se encontraron productos</p>
            <p className="hint">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          productosFiltrados.map(producto => {
            const sinStock = producto.stock === 0
            const rangoPrecios = obtenerRangoPrecios(producto)
            
            return (
              <div 
                key={producto.id} 
                className={`producto-item-lista ${sinStock ? 'sin-stock' : ''}`}
                onClick={() => !sinStock && onAgregar(producto)}
                style={{ cursor: sinStock ? 'not-allowed' : 'pointer' }}
              >
                <div className="producto-info-lista">
                  <div className="producto-nombre-lista">
                    <h3>{producto.nombre}</h3>
                    {producto.subcategoria && (
                      <span className="subcategoria-badge-lista">{producto.subcategoria}</span>
                    )}
                  </div>
                  <p className="producto-categoria-lista">{producto.categoria}</p>
                </div>
                
                <div className="producto-precio-lista">
                  {rangoPrecios ? (
                    <span className="precio-rango">
                      S/ {rangoPrecios.min.toFixed(2)} - S/ {rangoPrecios.max.toFixed(2)}
                    </span>
                  ) : (
                    <span className="precio-unico">S/ {producto.precio.toFixed(2)}</span>
                  )}
                </div>
                
                <div className="producto-stock-lista">
                  {sinStock ? (
                    <span className="stock-agotado-lista">Sin stock</span>
                  ) : producto.stock < 10 ? (
                    <span className="stock-bajo-lista">Stock: {producto.stock}</span>
                  ) : (
                    <span className="stock-ok">Stock: {producto.stock}</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
