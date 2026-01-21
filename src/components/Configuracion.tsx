import { useState, useEffect } from 'react'
import { ConfiguracionEmpresa, Categoria } from '../types'
import { crearRespaldoDesdeLocalStorage, aplicarRespaldoMergeEnLocalStorage } from '../utils/respaldo'
import { db } from '../firebase'
import { writeBatch, doc } from 'firebase/firestore'
import './Configuracion.css'

interface ConfiguracionProps {
  categorias: Categoria[] // Necesitamos las categorías para la periodicidad
  onConfigSaved?: () => void
}

export default function Configuracion({ categorias, onConfigSaved }: ConfiguracionProps) {
  const [prefijoTicket, setPrefijoTicket] = useState('BOL')
  const [numeroTicket, setNumeroTicket] = useState('1')
  const [prefijoBoleta, setPrefijoBoleta] = useState('BOL')
  const [numeroBoleta, setNumeroBoleta] = useState('1')
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState('3')
  const [empresa, setEmpresa] = useState<ConfiguracionEmpresa>({
    nombre: 'MINIMARKET COOL MARKET',
    ruc: '10444309852',
    direccion: 'AV. PORONGOCHE 701 - PAUCARPATA',
    telefono: '933424625 / 999999999'
  })

  // Configuración de Inventario: Día -> [Categorias]
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']
  const [configInventario, setConfigInventario] = useState<Record<string, string[]>>({})
  const [inicializado, setInicializado] = useState(false)

  useEffect(() => {
    // Cargar valores guardados
    const prefijoT = localStorage.getItem('pos_ticket_prefijo') || 'TICK'
    const numT = localStorage.getItem('pos_ticket_numero') || '1'
    const prefijoB = localStorage.getItem('pos_boleta_prefijo') || 'BOL'
    const numB = localStorage.getItem('pos_boleta_numero') || '1'
    const porcTarj = localStorage.getItem('pos_porcentaje_tarjeta') || '3'

    // Cargar datos de empresa
    const empresaGuardada = localStorage.getItem('pos_empresa')
    if (empresaGuardada) {
      setEmpresa(JSON.parse(empresaGuardada))
    }

    // Cargar config inventario
    const invGuardado = localStorage.getItem('pos_config_inventario')
    if (invGuardado) {
      setConfigInventario(JSON.parse(invGuardado))
    }

    setPrefijoTicket(prefijoT)
    setNumeroTicket(numT)
    setPrefijoBoleta(prefijoB)
    setNumeroBoleta(numB)
    setPorcentajeTarjeta(porcTarj)

    setInicializado(true)
  }, [])

  // Auto-guardado de Empresa
  useEffect(() => {
    if (!inicializado) return
    localStorage.setItem('pos_empresa', JSON.stringify(empresa))
  }, [empresa, inicializado])

  // Auto-guardado de Inventario
  useEffect(() => {
    if (!inicializado) return
    localStorage.setItem('pos_config_inventario', JSON.stringify(configInventario))
  }, [configInventario, inicializado])

  // Auto-guardado de Numeración y Otros
  useEffect(() => {
    if (!inicializado) return
    localStorage.setItem('pos_ticket_prefijo', prefijoTicket)
    localStorage.setItem('pos_ticket_numero', numeroTicket)
    localStorage.setItem('pos_boleta_prefijo', prefijoBoleta)
    localStorage.setItem('pos_boleta_numero', numeroBoleta)
    localStorage.setItem('pos_porcentaje_tarjeta', porcentajeTarjeta)
  }, [prefijoTicket, numeroTicket, prefijoBoleta, numeroBoleta, porcentajeTarjeta, inicializado])

  const guardarConfiguracion = () => {
    // Validar números
    const numT = parseInt(numeroTicket, 10)
    const numB = parseInt(numeroBoleta, 10)
    if (isNaN(numT) || numT < 1 || numT > 999999) {
      alert('El número de ticket debe ser válido')
      return
    }
    if (isNaN(numB) || numB < 1 || numB > 999999) {
      alert('El número de boleta debe ser válido')
      return
    }

    // Guardar numeración explícitamente
    localStorage.setItem('pos_ticket_prefijo', prefijoTicket)
    localStorage.setItem('pos_ticket_numero', numT.toString())
    localStorage.setItem('pos_boleta_prefijo', prefijoBoleta)
    localStorage.setItem('pos_boleta_numero', numB.toString())

    // Guardar porcentajes
    localStorage.setItem('pos_porcentaje_tarjeta', porcentajeTarjeta)

    // Guardar empresa
    localStorage.setItem('pos_empresa', JSON.stringify(empresa))

    // Guardar inventario
    localStorage.setItem('pos_config_inventario', JSON.stringify(configInventario))

    alert('✅ Configuración y Numeración Guardadas Correctamente.')

    if (onConfigSaved) {
      onConfigSaved()
    }
  }

  const toggleCategoriaDia = (dia: string, catNombre: string) => {
    setConfigInventario(prev => {
      const catsDelDia = prev[dia] || []
      if (catsDelDia.includes(catNombre)) {
        return { ...prev, [dia]: catsDelDia.filter(c => c !== catNombre) }
      } else {
        return { ...prev, [dia]: [...catsDelDia, catNombre] }
      }
    })
  }

  return (
    <div className="configuracion">
      <div className="configuracion-header">
        <h1>Configuración</h1>
        {/* Removed Volver button as it might be redundant if used in sidebar layout, but keeping it optional just in case logic needs it, though requested removal of users implies layout change */}
      </div>

      <div className="configuracion-content">
        {/* Datos de Empresa */}
        <div className="config-section">
          <h2>Datos de la Empresa</h2>
          <div className="empresa-form">
            <div className="form-group-config">
              <label>Nombre de la Empresa</label>
              <input
                type="text"
                value={empresa.nombre}
                onChange={(e) => setEmpresa({ ...empresa, nombre: e.target.value.toUpperCase() })}
                placeholder="MINIMARKET COOL MARKET"
                className="input-config input-full"
              />
            </div>
            <div className="empresa-row">
              <div className="form-group-config">
                <label>RUC</label>
                <input
                  type="text"
                  value={empresa.ruc}
                  onChange={(e) => setEmpresa({ ...empresa, ruc: e.target.value })}
                  placeholder="10444309852"
                  className="input-config"
                />
              </div>
              <div className="form-group-config">
                <label>Teléfono</label>
                <input
                  type="text"
                  value={empresa.telefono}
                  onChange={(e) => setEmpresa({ ...empresa, telefono: e.target.value })}
                  placeholder="933424625"
                  className="input-config"
                />
              </div>
            </div>
            <div className="form-group-config">
              <label>Dirección</label>
              <input
                type="text"
                value={empresa.direccion}
                onChange={(e) => setEmpresa({ ...empresa, direccion: e.target.value.toUpperCase() })}
                placeholder="AV. PORONGOCHE 701 - PAUCARPA"
                className="input-config input-full"
              />
            </div>
          </div>
        </div>

        {/* Periodicidad de Inventario */}
        <div className="config-section">
          <h2>Periodicidad de Inventario</h2>
          <p style={{ marginBottom: '1rem', color: '#666' }}>Selecciona qué categorías se inventariarán cada día de la semana.</p>
          <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '10px' }}>
            {diasSemana.map(dia => (
              <div key={dia} style={{ minWidth: '150px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ fontSize: '1rem', textAlign: 'center', marginBottom: '10px', color: '#0d9488' }}>{dia}</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {categorias.map(cat => (
                    <label key={cat.nombre} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.85rem' }}>
                      <input
                        type="checkbox"
                        checked={(configInventario[dia] || []).includes(cat.nombre)}
                        onChange={() => toggleCategoriaDia(dia, cat.nombre)}
                      />
                      {cat.nombre}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Numeración */}
        <div className="config-section">
          <h2>Numeración de Comprobantes</h2>

          <div className="config-grid">
            <div className="config-item">
              <h3>Tickets</h3>
              <div className="config-campos">
                <div className="form-group-config">
                  <label>Prefijo (ej: BOL)</label>
                  <input
                    type="text"
                    value={prefijoTicket}
                    onChange={(e) => setPrefijoTicket(e.target.value.toUpperCase())}
                    placeholder="BOL"
                    className="input-config"
                    maxLength={10}
                  />
                </div>
                <div className="form-group-config">
                  <label>Número de secuencia (1-9999)</label>
                  <input
                    type="number"
                    value={numeroTicket}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 9999)) {
                        setNumeroTicket(val)
                      }
                    }}
                    placeholder="1"
                    className="input-config"
                    min="1"
                    max="9999"
                  />
                </div>
                <div className="config-preview">
                  <span className="preview-label">Siguiente ticket será:</span>
                  <span className="preview-value">
                    {prefijoTicket}{numeroTicket.padStart(4, '0')}
                  </span>
                </div>
              </div>
            </div>

            <div className="config-item">
              <h3>Boletas</h3>
              <div className="config-campos">
                <div className="form-group-config">
                  <label>Prefijo (ej: BOL)</label>
                  <input
                    type="text"
                    value={prefijoBoleta}
                    onChange={(e) => setPrefijoBoleta(e.target.value.toUpperCase())}
                    placeholder="BOL"
                    className="input-config"
                    maxLength={10}
                  />
                </div>
                <div className="form-group-config">
                  <label>Número de secuencia (1-9999)</label>
                  <input
                    type="number"
                    value={numeroBoleta}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 9999)) {
                        setNumeroBoleta(val)
                      }
                    }}
                    placeholder="1"
                    className="input-config"
                    min="1"
                    max="9999"
                  />
                </div>
                <div className="config-preview">
                  <span className="preview-label">Siguiente boleta será:</span>
                  <span className="preview-value">
                    {prefijoBoleta}{numeroBoleta.padStart(4, '0')}
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

        {/* Copia de Seguridad */}
        <div className="config-section">
          <h2>Copia de Seguridad (Respaldo)</h2>
          <div className="config-info" style={{ marginBottom: '15px' }}>
            Guarda una copia de todos tus datos (Productos, Ventas, Inventario) en un archivo para protegerte ante fallos o formateo de PC.
          </div>

          <div className="backups-actions" style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            <button
              className="btn-guardar-config"
              style={{ backgroundColor: '#0ea5e9', display: 'flex', alignItems: 'center', gap: '8px' }}
              onClick={() => {
                try {
                  const respaldo = crearRespaldoDesdeLocalStorage()
                  const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = `backup-pos-${new Date().toISOString().split('T')[0]}.json`
                  document.body.appendChild(a)
                  a.click()
                  document.body.removeChild(a)
                  URL.revokeObjectURL(url)
                  alert('✅ Respaldo generado y descargado correctamente.')
                } catch (error) {
                  console.error(error)
                  alert('❌ Error al generar respaldo.')
                }
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar Respaldo
            </button>

            <div style={{ position: 'relative' }}>
              <input
                type="file"
                accept=".json"
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0, cursor: 'pointer' }}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (!file) return

                  if (!confirm('⚠️ ATENCIÓN: Al restaurar, se SOBRESCRIBIRÁ la información actual con la del respaldo.\n\nEsto actualizará el stock y productos tanto en este equipo como en la nube.\n\n¿Estás seguro de continuar?')) {
                    e.target.value = ''
                    return
                  }

                  const reader = new FileReader()
                  reader.onload = async (event) => {
                    try {
                      const json = JSON.parse(event.target?.result as string)

                      // Usar modo 'sobrescribir' para garantizar que el backup mande
                      const resultado = aplicarRespaldoMergeEnLocalStorage(json, 'sobrescribir')

                      alert(`✅ Datos restaurados localmente.\nAhora se sincronizarán con la nube para evitar pérdidas...`)

                      // Sincronizar con Firebase (Batch Update)
                      try {
                        const batchLimit = 400 // Firestore limit is 500
                        const productos = resultado.productosRestaurados
                        const total = productos.length
                        let processed = 0

                        while (processed < total) {
                          const batch = writeBatch(db)
                          const chunk = productos.slice(processed, processed + batchLimit)
                          chunk.forEach((p) => {
                            // Asegurar que no enviamos undefineds
                            const data: any = { ...p }
                            // Serializar fechas si es necesario o dejar que Firestore maneje Date
                            // Firestore acepta Date objects.
                            batch.set(doc(db, "productos", p.id), data)
                          })
                          await batch.commit()
                          processed += chunk.length
                        }
                        console.log("Sincronización completa con Firebase")
                      } catch (errSync) {
                        console.error("Error al sincronizar con Firebase:", errSync)
                        alert("⚠️ Advertencia: Los datos se restauraron localmente, pero hubo un error al sincronizar con la nube. Verifique su conexión.")
                      }

                      alert(`✅ Restauración y Sincronización completadas con éxito.\nEl sistema se reiniciará.`)
                      window.location.reload()

                    } catch (error) {
                      console.error(error)
                      alert('❌ Error al restaurar el archivo. Asegúrate de que sea un respaldo válido.')
                    }
                  }
                  reader.readAsText(file)
                  e.target.value = ''
                }}
              />
              <button
                className="btn-guardar-config"
                style={{ backgroundColor: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Restaurar Respaldo
              </button>
            </div>
          </div>
        </div>

        {/* Actualizaciones */}
        <div className="config-section">
          <h2>Actualizaciones del Sistema</h2>
          <div className="config-info">
            Conecta con GitHub para buscar la última versión disponible del sistema.
          </div>
          <div className="config-actions" style={{ justifyContent: 'flex-start', marginTop: '15px' }}>
            <button
              className="btn-guardar-config"
              style={{ backgroundColor: '#333' }}
              onClick={() => {
                const ipcRenderer = (window as any).require ? (window as any).require('electron').ipcRenderer : null;
                if (ipcRenderer) {
                  ipcRenderer.send('check-for-updates');
                  alert('🔍 Buscando actualizaciones en segundo plano...');
                } else {
                  alert('Funcionalidad solo disponible en la versión de escritorio.');
                }
              }}
            >
              <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ marginRight: '8px' }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Buscar Actualizaciones
            </button>
          </div>
        </div>

        <div className="config-actions">
          <button className="btn-guardar-config" onClick={guardarConfiguracion}>
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
