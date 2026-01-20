import { useState } from 'react'
import { Producto, Categoria } from '../types'
import './ProductosGrid.css'

interface ProductosGridProps {
  productos: Producto[]
  categorias: Categoria[]
  onAgregar: (producto: Producto) => void
  filtro: string
  setFiltro?: (filtro: string) => void // Opcional o removido si no se usa internamente
}

export default function ProductosGrid({ productos, onAgregar, filtro }: ProductosGridProps) {
  const [limiteVisible, setLimiteVisible] = useState(50)

  // Resetear límite cuando cambia el filtro
  if (filtro !== '' && limiteVisible !== 50) {
    // Nota: Esto es un efecto secundario en render, pero React lo maneja si es un setState condicional simple
  }

  // Efecto para resetear cuando cambia el filtro (mejor práctica)
  const [filtroAnterior, setFiltroAnterior] = useState('')
  if (filtro !== filtroAnterior) {
    setFiltroAnterior(filtro)
    setLimiteVisible(50)
  }

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
      (producto.marca && producto.marca.toLowerCase().includes(busqueda)) ||
      (producto.presentacion && producto.presentacion.toLowerCase().includes(busqueda)) ||
      producto.categoria.toLowerCase().includes(busqueda) ||
      (producto.subcategoria && producto.subcategoria.toLowerCase().includes(busqueda)) ||
      (producto.codigoBarras && producto.codigoBarras.toLowerCase().includes(busqueda)) ||
      (producto.codigoBarras && producto.codigoBarras === filtro.trim()) // Búsqueda exacta por código de barras
    )
  })

  // Manejador de scroll infinito
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    // Si estamos cerca del final (100px)
    if (scrollHeight - scrollTop - clientHeight < 100) {
      if (limiteVisible < productosFiltrados.length) {
        setLimiteVisible(prev => prev + 50)
      }
    }
  }

  const productosVisibles = productosFiltrados.slice(0, limiteVisible)

  return (
    <div className="productos-container">
      {/* Filtro removido - ahora manejado por App.tsx */}

      <div className="productos-lista" onScroll={handleScroll}>
        {productosVisibles.length === 0 ? (
          <div className="sin-resultados">
            <p>No se encontraron productos</p>
            <p className="hint">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <>
            {productosVisibles.map(producto => {
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
                      {producto.marca && (
                        <span className="marca-badge-lista">{producto.marca}</span>
                      )}
                      {producto.presentacion && (
                        <span className="presentacion-badge-lista">{producto.presentacion}</span>
                      )}
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
            })}
            {limiteVisible < productosFiltrados.length && (
              <div style={{ textAlign: 'center', padding: '1rem', color: '#888' }}>
                Cargando más productos...
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
