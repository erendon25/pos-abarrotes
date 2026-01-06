import { useState } from 'react'
import { Producto, Categoria } from '../types'
import './SelectorSubcategoria.css'

interface SelectorSubcategoriaProps {
  producto: Producto
  categorias: Categoria[]
  onSeleccionar: (subcategoria: string | null) => void
  onCancelar: () => void
}

export default function SelectorSubcategoria({ 
  producto, 
  categorias, 
  onSeleccionar, 
  onCancelar 
}: SelectorSubcategoriaProps) {
  const [subcategoriaSeleccionada, setSubcategoriaSeleccionada] = useState<string | null>(null)
  
  const categoria = categorias.find(c => c.nombre === producto.categoria)
  const subcategoriasDisponibles = categoria?.subcategorias || []
  const tienePreciosPorSubcategoria = producto.preciosPorSubcategoria && Object.keys(producto.preciosPorSubcategoria).length > 0

  const obtenerPrecio = (subcategoria: string | null) => {
    if (subcategoria && producto.preciosPorSubcategoria) {
      return producto.preciosPorSubcategoria[subcategoria] || producto.precio
    }
    return producto.precio
  }

  const handleConfirmar = () => {
    onSeleccionar(subcategoriaSeleccionada)
  }

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-content-selector" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Seleccionar Variante</h2>
          <button className="btn-cerrar" onClick={onCancelar}>×</button>
        </div>
        
        <div className="modal-body-selector">
          <div className="producto-info-modal">
            <h3>{producto.nombre}</h3>
            <p className="categoria-modal">{producto.categoria}</p>
          </div>

          {tienePreciosPorSubcategoria && subcategoriasDisponibles.length > 0 ? (
            <div className="subcategorias-selector">
              <p className="selector-label">Selecciona la variante:</p>
              <div className="opciones-subcategoria">
                <div 
                  className={`opcion-subcategoria ${subcategoriaSeleccionada === null ? 'seleccionada' : ''}`}
                  onClick={() => setSubcategoriaSeleccionada(null)}
                >
                  <span className="opcion-nombre">Sin variante</span>
                  <span className="opcion-precio">S/ {producto.precio.toFixed(2)}</span>
                </div>
                {subcategoriasDisponibles.map(subcategoria => {
                  const precio = obtenerPrecio(subcategoria)
                  return (
                    <div 
                      key={subcategoria}
                      className={`opcion-subcategoria ${subcategoriaSeleccionada === subcategoria ? 'seleccionada' : ''}`}
                      onClick={() => setSubcategoriaSeleccionada(subcategoria)}
                    >
                      <span className="opcion-nombre">{subcategoria}</span>
                      <span className="opcion-precio">S/ {precio.toFixed(2)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="sin-variantes">
              <p>Este producto no tiene variantes de precio disponibles.</p>
              <p className="precio-base">Precio: S/ {producto.precio.toFixed(2)}</p>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCancelar}>
            Cancelar
          </button>
          <button className="btn-confirmar" onClick={handleConfirmar}>
            Agregar al Carrito
          </button>
        </div>
      </div>
    </div>
  )
}

