import { useState, useEffect } from 'react'
import { MetodoPago, Usuario } from '../types'
import './ModalPago.css'

interface ModalPagoProps {
  total: number
  onConfirmar: (
    metodosPago: MetodoPago[], 
    vuelto: number, 
    requiereBoleta: boolean,
    porcentajeBoleta?: number,
    usuario?: Usuario,
    porcentajeTarjeta?: number
  ) => void
  onCancelar: () => void
}

export default function ModalPago({ total, onConfirmar, onCancelar }: ModalPagoProps) {
  const [metodosPago, setMetodosPago] = useState<MetodoPago[]>([])
  const [montoEfectivo, setMontoEfectivo] = useState('')
  const [montoYape, setMontoYape] = useState('')
  const [montoTarjeta, setMontoTarjeta] = useState('')
  const [requiereBoleta, setRequiereBoleta] = useState(false)
  const [porcentajeBoleta, setPorcentajeBoleta] = useState(() => {
    return localStorage.getItem('pos_porcentaje_boleta') || '18'
  })
  const [aplicarPorcentajeTarjeta, setAplicarPorcentajeTarjeta] = useState(false)
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState(() => {
    return localStorage.getItem('pos_porcentaje_tarjeta') || '3'
  })
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('')

  useEffect(() => {
    // Cargar usuarios
    const usuariosGuardados = localStorage.getItem('pos_usuarios')
    if (usuariosGuardados) {
      const usuariosList = JSON.parse(usuariosGuardados)
      setUsuarios(usuariosList)
      // Seleccionar el primer usuario por defecto
      if (usuariosList.length > 0) {
        setUsuarioSeleccionado(usuariosList[0].id)
      }
    } else {
      // Usuario por defecto si no hay usuarios configurados
      const usuarioDefault: Usuario = { id: '1', nombre: 'LUIS' }
      setUsuarios([usuarioDefault])
      setUsuarioSeleccionado('1')
    }
  }, [])

  const calcularTotalPagado = () => {
    return metodosPago.reduce((sum, metodo) => sum + metodo.monto, 0)
  }

  const calcularPorcentajeAdicional = () => {
    let adicional = 0
    
    // Porcentaje por boleta (sobre el subtotal)
    if (requiereBoleta && porcentajeBoleta) {
      const porcentaje = parseFloat(porcentajeBoleta) || 0
      adicional += total * (porcentaje / 100)
    }
    
    return adicional
  }

  const calcularTotalConBoleta = () => {
    return total + calcularPorcentajeAdicional()
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
  const porcentajeAdicional = calcularPorcentajeAdicional()
  const porcentajeTarjetaAdicional = calcularPorcentajeTarjetaAdicional()

  const puedeConfirmar = totalPagado >= totalConAdicionales

  const handleConfirmar = () => {
    const porcentajeBoletaNum = requiereBoleta ? (parseFloat(porcentajeBoleta) || 0) : undefined
    const porcentajeTarjetaNum = aplicarPorcentajeTarjeta ? (parseFloat(porcentajeTarjeta) || 0) : undefined
    const usuario = usuarios.find(u => u.id === usuarioSeleccionado)
    
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
        porcentajeBoletaNum,
        usuario,
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
          {/* Selector de Usuario */}
          <div className="usuario-section">
            <label className="usuario-label">
              Usuario:
            </label>
            <select
              value={usuarioSeleccionado}
              onChange={(e) => setUsuarioSeleccionado(e.target.value)}
              className="usuario-select"
            >
              {usuarios.map(usuario => (
                <option key={usuario.id} value={usuario.id}>
                  {usuario.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="total-pago">
            <div className="total-info">
              <span className="total-label-pago">Subtotal:</span>
              <span className="total-amount-pago">S/ {total.toFixed(2)}</span>
            </div>
            {porcentajeAdicional > 0 && (
              <div className="adicional-info">
                <span>Adicional por boleta ({porcentajeBoleta}%):</span>
                <span>S/ {porcentajeAdicional.toFixed(2)}</span>
              </div>
            )}
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
              
              {requiereBoleta && (
                <div className="boleta-info">
                  <div className="form-group-factura">
                    <label>% Adicional (IGV)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={porcentajeBoleta}
                      onChange={(e) => setPorcentajeBoleta(e.target.value)}
                      placeholder="18"
                      className="input-factura"
                      readOnly
                      style={{ background: '#f3f4f6', cursor: 'not-allowed' }}
                      title="Configurado en Configuración"
                    />
                    <span className="config-hint">Configurado en Configuración</span>
                  </div>
                </div>
              )}
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
