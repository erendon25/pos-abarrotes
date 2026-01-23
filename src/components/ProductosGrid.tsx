import { useState, useMemo, useCallback, memo } from 'react'
import { Producto, Categoria } from '../types'
import './ProductosGrid.css'

interface ProductosGridProps {
  productos: Producto[]
  categorias: Categoria[]
  onAgregar: (producto: Producto) => void
  filtro: string
  setFiltro?: (filtro: string) => void
}

// Producto individual memoizado para evitar re-renders
const ProductoItem = memo(function ProductoItem({
  producto,
  onAgregar
}: {
  producto: Producto
  onAgregar: (producto: Producto) => void
}) {
  const sinStock = producto.stock === 0

  // Calcular rango de precios solo si es necesario
  const rangoPrecios = useMemo(() => {
    if (!producto.preciosPorSubcategoria || Object.keys(producto.preciosPorSubcategoria).length === 0) {
      return null
    }
    const precios = Object.values(producto.preciosPorSubcategoria)
    const minPrecio = Math.min(...precios, producto.precio)
    const maxPrecio = Math.max(...precios, producto.precio)
    if (minPrecio === maxPrecio) return null
    return { min: minPrecio, max: maxPrecio }
  }, [producto.precio, producto.preciosPorSubcategoria])

  const handleClick = useCallback(() => {
    if (!sinStock) onAgregar(producto)
  }, [sinStock, onAgregar, producto])

  return (
    <div
      className={`producto-item-lista ${sinStock ? 'sin-stock' : ''}`}
      onClick={handleClick}
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
})

function ProductosGrid({ productos, onAgregar, filtro }: ProductosGridProps) {
  const [limiteVisible, setLimiteVisible] = useState(30) // Reducido para mejor rendimiento inicial
  const [filtroAnterior, setFiltroAnterior] = useState('')

  // Resetear límite cuando cambia el filtro
  if (filtro !== filtroAnterior) {
    setFiltroAnterior(filtro)
    setLimiteVisible(30)
  }

  // Filtrar productos con useMemo para evitar recálculos
  const productosFiltrados = useMemo(() => {
    if (!filtro.trim()) return productos.filter(p => p.activo !== false)

    const busqueda = filtro.toLowerCase().trim()
    return productos.filter(producto => {
      if (producto.activo === false) return false

      // Búsqueda exacta por código de barras primero (más rápida)
      if (producto.codigoBarras && producto.codigoBarras === filtro.trim()) {
        return true
      }

      return (
        producto.nombre.toLowerCase().includes(busqueda) ||
        (producto.marca && producto.marca.toLowerCase().includes(busqueda)) ||
        (producto.presentacion && producto.presentacion.toLowerCase().includes(busqueda)) ||
        producto.categoria.toLowerCase().includes(busqueda) ||
        (producto.subcategoria && producto.subcategoria.toLowerCase().includes(busqueda)) ||
        (producto.codigoBarras && producto.codigoBarras.toLowerCase().includes(busqueda))
      )
    })
  }, [productos, filtro])

  // Productos visibles limitados
  const productosVisibles = useMemo(() => {
    return productosFiltrados.slice(0, limiteVisible)
  }, [productosFiltrados, limiteVisible])

  // Manejador de scroll con throttling simple
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget
    if (scrollHeight - scrollTop - clientHeight < 150) {
      if (limiteVisible < productosFiltrados.length) {
        setLimiteVisible(prev => Math.min(prev + 30, productosFiltrados.length))
      }
    }
  }, [limiteVisible, productosFiltrados.length])

  return (
    <div className="productos-container">
      <div className="productos-lista" onScroll={handleScroll}>
        {productosVisibles.length === 0 ? (
          <div className="sin-resultados">
            <p>No se encontraron productos</p>
            <p className="hint">Intenta con otros términos de búsqueda</p>
          </div>
        ) : (
          <>
            {productosVisibles.map(producto => (
              <ProductoItem
                key={producto.id}
                producto={producto}
                onAgregar={onAgregar}
              />
            ))}
            {limiteVisible < productosFiltrados.length && (
              <div style={{ textAlign: 'center', padding: '0.5rem', color: '#888', fontSize: '0.9rem' }}>
                Desplaza para ver más ({productosFiltrados.length - limiteVisible} restantes)
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default memo(ProductosGrid)
