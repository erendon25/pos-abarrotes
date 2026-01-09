import { useState } from 'react'
import { Producto } from '../types'
import './SelectorTipoVenta.css'

interface SelectorTipoVentaProps {
  producto: Producto
  onSeleccionar: (vendidoEnUnidades: boolean) => void
  onCancelar: () => void
}

export default function SelectorTipoVenta({ 
  producto, 
  onSeleccionar, 
  onCancelar 
}: SelectorTipoVentaProps) {
  const [tipoVenta, setTipoVenta] = useState<'caja' | 'unidad'>('caja')
  const [cantidad, setCantidad] = useState(1)
  
  const unidadesPorCaja = producto.unidadesPorCaja || 20
  const stockCaja = producto.stockCaja || 0
  const stockUnidad = producto.stockUnidad || 0
  const stockTotal = (stockCaja * unidadesPorCaja) + stockUnidad
  
  const precioCaja = producto.precio
  const precioUnidad = producto.precioUnidad || producto.precio / unidadesPorCaja
  
  const handleConfirmar = () => {
    // Validar stock disponible
    if (tipoVenta === 'caja') {
      if (cantidad > stockCaja) {
        alert(`No hay suficiente stock. Disponible: ${stockCaja} cajas`)
        return
      }
    } else {
      if (cantidad > stockTotal) {
        alert(`No hay suficiente stock. Disponible: ${stockTotal} unidades`)
        return
      }
    }
    
    onSeleccionar(tipoVenta === 'unidad')
  }

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-content-tipo-venta" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Seleccionar Tipo de Venta</h2>
          <button className="btn-cerrar" onClick={onCancelar}>×</button>
        </div>
        
        <div className="modal-body-tipo-venta">
          <div className="producto-info-modal">
            <h3>{producto.nombre}</h3>
            <p className="categoria-modal">{producto.categoria}</p>
            <p className="info-stock">
              Stock disponible: {stockCaja} cajas + {stockUnidad} unidades = {stockTotal} unidades totales
            </p>
          </div>

          <div className="tipo-venta-selector">
            <p className="selector-label">Selecciona cómo deseas vender:</p>
            <div className="opciones-tipo-venta">
              <div 
                className={`opcion-tipo-venta ${tipoVenta === 'caja' ? 'seleccionada' : ''}`}
                onClick={() => setTipoVenta('caja')}
              >
                <div className="opcion-header">
                  <span className="opcion-icon">📦</span>
                  <span className="opcion-nombre">Por Caja</span>
                </div>
                <div className="opcion-details">
                  <span className="opcion-precio">S/ {precioCaja.toFixed(2)} por caja</span>
                  <span className="opcion-stock">Disponible: {stockCaja} cajas</span>
                  <span className="opcion-info">{unidadesPorCaja} unidades por caja</span>
                </div>
              </div>
              
              <div 
                className={`opcion-tipo-venta ${tipoVenta === 'unidad' ? 'seleccionada' : ''}`}
                onClick={() => setTipoVenta('unidad')}
              >
                <div className="opcion-header">
                  <span className="opcion-icon">📄</span>
                  <span className="opcion-nombre">Por Unidad</span>
                </div>
                <div className="opcion-details">
                  <span className="opcion-precio">S/ {precioUnidad.toFixed(2)} por unidad</span>
                  <span className="opcion-stock">Disponible: {stockTotal} unidades</span>
                  <span className="opcion-info">Se descontará automáticamente de cajas si es necesario</span>
                </div>
              </div>
            </div>
          </div>

          <div className="cantidad-selector">
            <label className="cantidad-label">
              Cantidad {tipoVenta === 'caja' ? '(cajas)' : '(unidades)'}:
            </label>
            <input
              type="number"
              min="1"
              max={tipoVenta === 'caja' ? stockCaja : stockTotal}
              value={cantidad}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 1
                const max = tipoVenta === 'caja' ? stockCaja : stockTotal
                setCantidad(Math.min(Math.max(1, val), max))
              }}
              className="cantidad-input"
            />
            <div className="cantidad-preview">
              {tipoVenta === 'caja' ? (
                <>
                  <span>Total: {cantidad} cajas = {cantidad * unidadesPorCaja} unidades</span>
                  <span className="precio-total">S/ {(cantidad * precioCaja).toFixed(2)}</span>
                </>
              ) : (
                <>
                  <span>Total: {cantidad} unidades</span>
                  <span className="precio-total">S/ {(cantidad * precioUnidad).toFixed(2)}</span>
                </>
              )}
            </div>
          </div>
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


