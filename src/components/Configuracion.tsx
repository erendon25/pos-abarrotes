import { useState, useEffect } from 'react'
import './Configuracion.css'

interface ConfiguracionProps {
  onVolver: () => void
}

export default function Configuracion({ onVolver }: ConfiguracionProps) {
  const [prefijoBoleta, setPrefijoBoleta] = useState('B001')
  const [numeroBoleta, setNumeroBoleta] = useState('000001')
  const [prefijoFactura, setPrefijoFactura] = useState('F001')
  const [numeroFactura, setNumeroFactura] = useState('000001')
  const [porcentajeFactura, setPorcentajeFactura] = useState('18')
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState('3')

  useEffect(() => {
    // Cargar valores guardados
    const prefijoB = localStorage.getItem('pos_boleta_prefijo') || 'B001'
    const numB = localStorage.getItem('pos_boleta_numero') || '0'
    const prefijoF = localStorage.getItem('pos_factura_prefijo') || 'F001'
    const numF = localStorage.getItem('pos_factura_numero') || '0'
    const porcFact = localStorage.getItem('pos_porcentaje_factura') || '18'
    const porcTarj = localStorage.getItem('pos_porcentaje_tarjeta') || '3'

    setPrefijoBoleta(prefijoB)
    setNumeroBoleta(numB.padStart(6, '0'))
    setPrefijoFactura(prefijoF)
    setNumeroFactura(numF.padStart(6, '0'))
    setPorcentajeFactura(porcFact)
    setPorcentajeTarjeta(porcTarj)
  }, [])

  const guardarConfiguracion = () => {
    // Validar prefijos
    if (!prefijoBoleta.match(/^B\d{3}$/)) {
      alert('El prefijo de boleta debe tener el formato B001 (B seguido de 3 dígitos)')
      return
    }
    if (!prefijoFactura.match(/^F\d{3}$/)) {
      alert('El prefijo de factura debe tener el formato F001 (F seguido de 3 dígitos)')
      return
    }

    // Validar números
    const numB = parseInt(numeroBoleta, 10)
    const numF = parseInt(numeroFactura, 10)
    if (isNaN(numB) || numB < 1 || numB > 99999) {
      alert('El número de boleta debe estar entre 1 y 99999')
      return
    }
    if (isNaN(numF) || numF < 1 || numF > 99999) {
      alert('El número de factura debe estar entre 1 y 99999')
      return
    }

    // Guardar numeración
    localStorage.setItem('pos_boleta_prefijo', prefijoBoleta)
    localStorage.setItem('pos_boleta_numero', numB.toString())
    localStorage.setItem('pos_factura_prefijo', prefijoFactura)
    localStorage.setItem('pos_factura_numero', numF.toString())

    // Guardar porcentajes
    localStorage.setItem('pos_porcentaje_factura', porcentajeFactura)
    localStorage.setItem('pos_porcentaje_tarjeta', porcentajeTarjeta)

    alert('Configuración guardada correctamente')
  }

  return (
    <div className="configuracion">
      <div className="configuracion-header">
        <h1>Configuración</h1>
        <button className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
      </div>

      <div className="configuracion-content">
        {/* Numeración */}
        <div className="config-section">
          <h2>Numeración de Comprobantes</h2>
          
          <div className="config-grid">
            <div className="config-item">
              <h3>Boletas</h3>
              <div className="config-campos">
                <div className="form-group-config">
                  <label>Prefijo (ej: B001)</label>
                  <input
                    type="text"
                    value={prefijoBoleta}
                    onChange={(e) => setPrefijoBoleta(e.target.value.toUpperCase())}
                    placeholder="B001"
                    className="input-config"
                    maxLength={4}
                  />
                </div>
                <div className="form-group-config">
                  <label>Número de secuencia (1-99999)</label>
                  <input
                    type="number"
                    value={numeroBoleta}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 99999)) {
                        setNumeroBoleta(val.padStart(6, '0'))
                      }
                    }}
                    placeholder="000001"
                    className="input-config"
                    min="1"
                    max="99999"
                  />
                </div>
                <div className="config-preview">
                  <span className="preview-label">Siguiente boleta será:</span>
                  <span className="preview-value">
                    {prefijoBoleta}-{numeroBoleta.padStart(6, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div className="config-item">
              <h3>Facturas</h3>
              <div className="config-campos">
                <div className="form-group-config">
                  <label>Prefijo (ej: F001)</label>
                  <input
                    type="text"
                    value={prefijoFactura}
                    onChange={(e) => setPrefijoFactura(e.target.value.toUpperCase())}
                    placeholder="F001"
                    className="input-config"
                    maxLength={4}
                  />
                </div>
                <div className="form-group-config">
                  <label>Número de secuencia (1-99999)</label>
                  <input
                    type="number"
                    value={numeroFactura}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 99999)) {
                        setNumeroFactura(val.padStart(6, '0'))
                      }
                    }}
                    placeholder="000001"
                    className="input-config"
                    min="1"
                    max="99999"
                  />
                </div>
                <div className="config-preview">
                  <span className="preview-label">Siguiente factura será:</span>
                  <span className="preview-value">
                    {prefijoFactura}-{numeroFactura.padStart(6, '0')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Porcentajes */}
        <div className="config-section">
          <h2>Porcentajes por Defecto</h2>
          
          <div className="config-grid">
            <div className="config-item">
              <h3>Porcentaje de Factura (IGV)</h3>
              <div className="config-campos">
                <div className="form-group-config">
                  <label>Porcentaje (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={porcentajeFactura}
                    onChange={(e) => setPorcentajeFactura(e.target.value)}
                    placeholder="18"
                    className="input-config"
                  />
                </div>
                <div className="config-info">
                  Este porcentaje se aplicará automáticamente cuando se seleccione "Requiere Factura"
                </div>
              </div>
            </div>

            <div className="config-item">
              <h3>Porcentaje por Pago con Tarjeta</h3>
              <div className="config-campos">
                <div className="form-group-config">
                  <label>Porcentaje (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={porcentajeTarjeta}
                    onChange={(e) => setPorcentajeTarjeta(e.target.value)}
                    placeholder="3"
                    className="input-config"
                  />
                </div>
                <div className="config-info">
                  Este porcentaje se aplicará automáticamente cuando se active el checkbox de tarjeta
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="config-actions">
          <button className="btn-guardar-config" onClick={guardarConfiguracion}>
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  )
}

