import { useState } from 'react'
import { MetodoPago, Usuario } from '../types'
import './ModalPago.css'

interface ModalPagoProps {
  total: number
  onConfirmar: (
    metodosPago: MetodoPago[],
    vuelto: number,
    requiereBoleta: boolean,
    usuario?: Usuario,
    porcentajeTarjeta?: number
  ) => void
  onCancelar: () => void
  usuario?: Usuario | null
}

export default function ModalPago({ total, onConfirmar, onCancelar, usuario }: ModalPagoProps) {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [montoEfectivo, setMontoEfectivo] = useState('')
  const [montoYape, setMontoYape] = useState('')
  const [montoTarjeta, setMontoTarjeta] = useState('')
  const [requiereBoleta, setRequiereBoleta] = useState(false)
  const [aplicarPorcentajeTarjeta, setAplicarPorcentajeTarjeta] = useState(false)
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState(() => {
    return localStorage.getItem('pos_porcentaje_tarjeta') || '3'
  })

  // Removed internal user state

  const calcularTotalPagado = () => {
    return metodosPago.reduce((sum, metodo) => sum + metodo.monto, 0)
  }

  const calcularTotalConBoleta = () => {
    return total
  }

  const calcularPorcentajeTarjetaAdicional = () => {
    if (!aplicarPorcentajeTarjeta || !porcentajeTarjeta) return 0

    const porcentaje = parseFloat(porcentajeTarjeta) || 0
    const totalConBoleta = calcularTotalConBoleta()
    return totalConBoleta * (porcentaje / 100)
  }

  const calcularTotalConAdicionales = () => {
    const totalConBoleta = calcularTotalConBoleta()
    const porcentajeTarjetaAdicional = calcularPorcentajeTarjetaAdicional()
    return totalConBoleta + porcentajeTarjetaAdicional
  }

  const calcularVuelto = () => {
    const totalConAdicionales = calcularTotalConAdicionales()
    const totalPagado = calcularTotalPagado()
    const vuelto = totalPagado - totalConAdicionales
    return vuelto > 0 ? vuelto : 0
  }

  const actualizarMetodoPago = (tipo: 'efectivo' | 'yape' | 'tarjeta', monto: number) => {
    setMetodosPago(prev => {
      const otros = prev.filter(m => m.tipo !== tipo)
      if (monto > 0) {
        return [...otros, { tipo, monto }]
      }
      return otros
    })
  }

  const handleMontoEfectivo = (valor: string) => {
    setMontoEfectivo(valor)
    const monto = parseFloat(valor) || 0
    actualizarMetodoPago('efectivo', monto)
  }

  const handleMontoYape = (valor: string) => {
    setMontoYape(valor)
    const monto = parseFloat(valor) || 0
    actualizarMetodoPago('yape', monto)
  }

  const handleMontoTarjeta = (valor: string) => {
    setMontoTarjeta(valor)
    const monto = parseFloat(valor) || 0
    actualizarMetodoPago('tarjeta', monto)
  }

  const totalConAdicionales = calcularTotalConAdicionales()
  const totalPagado = calcularTotalPagado()
  const vuelto = calcularVuelto()
  const faltaPagar = totalConAdicionales - totalPagado
  const porcentajeTarjetaAdicional = calcularPorcentajeTarjetaAdicional()

  const puedeConfirmar = totalPagado >= totalConAdicionales

  const handleConfirmar = () => {
    const porcentajeTarjetaNum = aplicarPorcentajeTarjeta ? (parseFloat(porcentajeTarjeta) || 0) : undefined

    // Si no hay ningún monto ingresado, usar efectivo por defecto con el total a pagar
    let metodosPagoFinal = metodosPago
    let vueltoFinal = vuelto

    if (metodosPago.length === 0 || totalPagado === 0) {
      // Agregar efectivo por defecto con el monto del total
      metodosPagoFinal = [{ tipo: 'efectivo' as const, monto: totalConAdicionales }]
      vueltoFinal = 0
    }

    const puedeConfirmarFinal = metodosPagoFinal.reduce((sum, metodo) => sum + metodo.monto, 0) >= totalConAdicionales

    if (puedeConfirmarFinal) {
      onConfirmar(
        metodosPagoFinal,
        vueltoFinal,
        requiereBoleta,
        usuario || undefined,
        porcentajeTarjetaNum
      )
    }
  }

  return (
    <div className="modal-overlay" onClick={onCancelar}>
      <div className="modal-content-pago" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-pago">
          <h2>Procesar Pago</h2>
          <button className="btn-cerrar" onClick={onCancelar}>×</button>
        </div>

        <div className="modal-body-pago">
          {/* Usuario Display */}
          {usuario && (
            <div className="usuario-section" style={{ marginBottom: '1rem', color: '#64748b', fontSize: '0.9rem' }}>
              Vendedor: <strong>{usuario.nombre}</strong>
            </div>
          )}

          <div className="total-pago">
            <div className="total-info">
              <span className="total-label-pago">Subtotal:</span>
              <span className="total-amount-pago">S/ {total.toFixed(2)}</span>
            </div>
            {porcentajeTarjetaAdicional > 0 && (
              <div className="adicional-info">
                <span>Adicional por tarjeta ({porcentajeTarjeta}%):</span>
                <span>S/ {porcentajeTarjetaAdicional.toFixed(2)}</span>
              </div>
            )}
            <div className="total-final">
              <span className="total-label-pago">Total a Pagar:</span>
              <span className="total-amount-pago">S/ {totalConAdicionales.toFixed(2)}</span>
            </div>
          </div>

          {/* Sección de opciones en dos columnas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {/* Checkbox de boleta */}
            <div className="boleta-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={requiereBoleta}
                  onChange={(e) => setRequiereBoleta(e.target.checked)}
                  className="checkbox-input"
                />
                <span>Requiere Boleta</span>
              </label>

            </div>

            {/* Checkbox de porcentaje por tarjeta */}
            <div className="tarjeta-porcentaje-section">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={aplicarPorcentajeTarjeta}
                  onChange={(e) => setAplicarPorcentajeTarjeta(e.target.checked)}
                  className="checkbox-input"
                />
                <span>% Adicional por Tarjeta</span>
              </label>

              {aplicarPorcentajeTarjeta && (
                <div className="tarjeta-porcentaje-campos">
                  <div className="form-group-factura" style={{ gridColumn: '1 / -1' }}>
                    <label>Porcentaje POS (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={porcentajeTarjeta}
                      onChange={(e) => setPorcentajeTarjeta(e.target.value)}
                      placeholder="3"
                      className="input-factura"
                      readOnly
                      style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                      title="Configurado en Configuración"
                    />
                    <span className="config-hint">Configurado en Configuración</span>
                  </div>
                  {porcentajeTarjetaAdicional > 0 && (
                    <div className="tarjeta-porcentaje-info" style={{ gridColumn: '1 / -1' }}>
                      <span>Se sumará:</span>
                      <span>S/ {porcentajeTarjetaAdicional.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="metodos-pago">
            <div className="metodo-pago-item">
              <label className="metodo-label">
                <span className="metodo-icon">💵</span>
                Efectivo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoEfectivo}
                onChange={(e) => handleMontoEfectivo(e.target.value)}
                placeholder="0.00"
                className="monto-input"
                autoFocus
              />
              {parseFloat(montoEfectivo) > 0 && (
                <span className="monto-ingresado">S/ {parseFloat(montoEfectivo).toFixed(2)}</span>
              )}
            </div>

            <div className="metodo-pago-item">
              <label className="metodo-label">
                <span className="metodo-icon">📱</span>
                Yape
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoYape}
                onChange={(e) => handleMontoYape(e.target.value)}
                placeholder="0.00"
                className="monto-input"
              />
              {parseFloat(montoYape) > 0 && (
                <span className="monto-ingresado">S/ {parseFloat(montoYape).toFixed(2)}</span>
              )}
            </div>

            <div className="metodo-pago-item">
              <label className="metodo-label">
                <span className="metodo-icon">💳</span>
                Tarjeta
                {aplicarPorcentajeTarjeta && (
                  <span className="tarjeta-nota">(Total con porcentaje: S/ {totalConAdicionales.toFixed(2)})</span>
                )}
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={montoTarjeta}
                onChange={(e) => handleMontoTarjeta(e.target.value)}
                placeholder={aplicarPorcentajeTarjeta ? totalConAdicionales.toFixed(2) : "0.00"}
                className="monto-input"
              />
              {parseFloat(montoTarjeta) > 0 && (
                <span className="monto-ingresado">S/ {parseFloat(montoTarjeta).toFixed(2)}</span>
              )}
            </div>
          </div>

          <div className="resumen-pago">
            <div className="resumen-item">
              <span>Total Pagado:</span>
              <span className={totalPagado >= totalConAdicionales ? 'pago-completo' : 'pago-incompleto'}>
                S/ {totalPagado.toFixed(2)}
              </span>
            </div>
            {faltaPagar > 0 && (
              <div className="resumen-item falta">
                <span>Falta Pagar:</span>
                <span>S/ {faltaPagar.toFixed(2)}</span>
              </div>
            )}
            {vuelto > 0 && (
              <div className="resumen-item vuelto">
                <span>Vuelto:</span>
                <span className="vuelto-amount">S/ {vuelto.toFixed(2)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer-pago">
          <button className="btn-cancelar-pago" onClick={onCancelar}>
            Cancelar
          </button>
          <button
            className={`btn-confirmar-pago ${(puedeConfirmar || metodosPago.length === 0 || totalPagado === 0) ? '' : 'disabled'}`}
            onClick={handleConfirmar}
            disabled={!(puedeConfirmar || metodosPago.length === 0 || totalPagado === 0)}
          >
            Confirmar Pago
          </button>
        </div>
      </div>
    </div>
  )
}
