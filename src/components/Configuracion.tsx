import { useRef, useState, useEffect } from 'react'
import { Usuario, ConfiguracionEmpresa } from '../types'
import './Configuracion.css'
import { crearRespaldoDesdeLocalStorage, aplicarRespaldoMergeEnLocalStorage } from '../utils/respaldo'

interface ConfiguracionProps {
  onVolver: () => void
}

export default function Configuracion({ onVolver }: ConfiguracionProps) {
  const [prefijoTicket, setPrefijoTicket] = useState('BOL')
  const [numeroTicket, setNumeroTicket] = useState('1')
  const [prefijoBoleta, setPrefijoBoleta] = useState('BOL')
  const [numeroBoleta, setNumeroBoleta] = useState('1')
  const [porcentajeBoleta, setPorcentajeBoleta] = useState('18')
  const [porcentajeTarjeta, setPorcentajeTarjeta] = useState('3')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [nuevoUsuario, setNuevoUsuario] = useState('')
  const [empresa, setEmpresa] = useState<ConfiguracionEmpresa>({
    nombre: 'MINIMARKET COOL MARKET',
    ruc: '10444309852',
    direccion: 'AV. PORONGOCHE 701 - PAUCARPA',
    telefono: '933424625 / 999999999'
  })
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    // Cargar valores guardados
    const prefijoT = localStorage.getItem('pos_ticket_prefijo') || 'BOL'
    const numT = localStorage.getItem('pos_ticket_numero') || '1'
    const prefijoB = localStorage.getItem('pos_boleta_prefijo') || 'BOL'
    const numB = localStorage.getItem('pos_boleta_numero') || '1'
    const porcBol = localStorage.getItem('pos_porcentaje_boleta') || '18'
    const porcTarj = localStorage.getItem('pos_porcentaje_tarjeta') || '3'
    
    // Cargar usuarios
    const usuariosGuardados = localStorage.getItem('pos_usuarios')
    if (usuariosGuardados) {
      setUsuarios(JSON.parse(usuariosGuardados))
    } else {
      // Usuario por defecto
      const usuarioDefault: Usuario = { id: '1', nombre: 'LUIS' }
      setUsuarios([usuarioDefault])
      localStorage.setItem('pos_usuarios', JSON.stringify([usuarioDefault]))
    }
    
    // Cargar datos de empresa
    const empresaGuardada = localStorage.getItem('pos_empresa')
    if (empresaGuardada) {
      setEmpresa(JSON.parse(empresaGuardada))
    }

    setPrefijoTicket(prefijoT)
    setNumeroTicket(numT)
    setPrefijoBoleta(prefijoB)
    setNumeroBoleta(numB)
    setPorcentajeBoleta(porcBol)
    setPorcentajeTarjeta(porcTarj)
  }, [])

  const guardarConfiguracion = () => {
    // Validar números
    const numT = parseInt(numeroTicket, 10)
    const numB = parseInt(numeroBoleta, 10)
    if (isNaN(numT) || numT < 1 || numT > 9999) {
      alert('El número de ticket debe estar entre 1 y 9999')
      return
    }
    if (isNaN(numB) || numB < 1 || numB > 9999) {
      alert('El número de boleta debe estar entre 1 y 9999')
      return
    }

    // Guardar numeración
    localStorage.setItem('pos_ticket_prefijo', prefijoTicket)
    localStorage.setItem('pos_ticket_numero', numT.toString())
    localStorage.setItem('pos_boleta_prefijo', prefijoBoleta)
    localStorage.setItem('pos_boleta_numero', numB.toString())

    // Guardar porcentajes
    localStorage.setItem('pos_porcentaje_boleta', porcentajeBoleta)
    localStorage.setItem('pos_porcentaje_tarjeta', porcentajeTarjeta)
    
    // Guardar usuarios
    localStorage.setItem('pos_usuarios', JSON.stringify(usuarios))
    
    // Guardar empresa
    localStorage.setItem('pos_empresa', JSON.stringify(empresa))

    alert('Configuración guardada correctamente')
  }

  const exportarRespaldo = () => {
    const respaldo = crearRespaldoDesdeLocalStorage()
    const nombreArchivo = `respaldo-pos-${new Date().toISOString().replace(/[:.]/g, '-')}.json`
    const blob = new Blob([JSON.stringify(respaldo, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nombreArchivo
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const abrirImportacion = () => {
    fileInputRef.current?.click()
  }

  const importarRespaldo = async (file: File) => {
    const texto = await file.text()
    const json = JSON.parse(texto)
    const res = aplicarRespaldoMergeEnLocalStorage(json)

    alert(
      `Importación completada (se SUMÓ, no se reemplazó):\n` +
      `- Nuevos productos: ${res.nuevos.productos}\n` +
      `- Nuevas categorías: ${res.nuevos.categorias}\n` +
      `- Nuevas ventas: ${res.nuevos.ventas}\n` +
      `- Nuevos ingresos: ${res.nuevos.ingresos}\n` +
      `- Nuevos movimientos: ${res.nuevos.movimientos}\n\n` +
      `Se recomienda recargar para ver todo actualizado.`
    )

    // Recargar para que App vuelva a leer localStorage y se reflejen ventas/ingresos/stock
    window.location.reload()
  }

  const agregarUsuario = () => {
    if (!nuevoUsuario.trim()) {
      alert('Ingrese un nombre de usuario')
      return
    }
    const nuevo: Usuario = {
      id: Date.now().toString(),
      nombre: nuevoUsuario.trim().toUpperCase()
    }
    const usuariosActualizados = [...usuarios, nuevo]
    setUsuarios(usuariosActualizados)
    setNuevoUsuario('')
  }

  const eliminarUsuario = (id: string) => {
    if (usuarios.length === 1) {
      alert('Debe haber al menos un usuario')
      return
    }
    if (confirm('¿Está seguro de eliminar este usuario?')) {
      setUsuarios(usuarios.filter(u => u.id !== id))
    }
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
                  placeholder="933424625 / 999999999"
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

        {/* Usuarios */}
        <div className="config-section">
          <h2>Usuarios</h2>
          <div className="config-campos">
            <div className="usuarios-list">
              {usuarios.map(usuario => (
                <div key={usuario.id} className="usuario-item">
                  <span>{usuario.nombre}</span>
                  {usuarios.length > 1 && (
                    <button 
                      className="btn-eliminar-usuario"
                      onClick={() => eliminarUsuario(usuario.id)}
                      title="Eliminar usuario"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="form-group-config">
              <label>Agregar Usuario</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={nuevoUsuario}
                  onChange={(e) => setNuevoUsuario(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && agregarUsuario()}
                  placeholder="Nombre del usuario"
                  className="input-config"
                />
                <button className="btn-agregar-usuario" onClick={agregarUsuario}>
                  Agregar
                </button>
              </div>
            </div>
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
              <h3>Porcentaje de Boleta (IGV)</h3>
              <div className="config-campos">
                <div className="form-group-config">
                  <label>Porcentaje (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={porcentajeBoleta}
                    onChange={(e) => setPorcentajeBoleta(e.target.value)}
                    placeholder="18"
                    className="input-config"
                  />
                </div>
                <div className="config-info">
                  Este porcentaje se aplicará automáticamente cuando se solicite una boleta
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

        {/* Respaldo e importación */}
        <div className="config-section">
          <h2>Respaldo e Importación (Teléfono ↔ PC)</h2>
          <div className="config-info" style={{ background: '#fffbeb', color: '#92400e' }}>
            El respaldo se guarda en un archivo. Al importar, los datos <strong>se suman</strong> a lo que ya tienes (no reemplaza).
            Úsalo si trabajaste en el teléfono por un corte de luz y luego quieres traer ventas/ingresos/salidas a la PC.
          </div>

          <div className="backup-actions">
            <button className="btn-backup" onClick={exportarRespaldo}>
              ⬇️ Exportar respaldo (JSON)
            </button>
            <button className="btn-backup" onClick={abrirImportacion}>
              ⬆️ Importar respaldo (sumar)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (!f) return
                importarRespaldo(f).catch((err) => {
                  alert(`No se pudo importar el archivo: ${err?.message || err}`)
                }).finally(() => {
                  e.currentTarget.value = ''
                })
              }}
            />
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
