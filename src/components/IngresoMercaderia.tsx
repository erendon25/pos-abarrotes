import { useState, useEffect, useMemo } from 'react'
import { Producto, IngresoMercaderia as IngresoMercaderiaType, TipoDocumentoProveedor, Usuario } from '../types'
import './IngresoMercaderia.css'

interface IngresoMercaderiaProps {
  productos: Producto[]
  onVolver: () => void
  onRegistrarIngreso: (ingreso: IngresoMercaderiaType) => void
  usuarios: Usuario[]
}

interface ItemIngreso {
  productoId: string
  productoNombre: string
  cantidad: number
  precioCompra: number
  fechaVencimiento?: string // String para el input date
  cantidadCajas?: number
  cantidadUnidades?: number
}

const STORAGE_KEY_USUARIOS = 'pos_usuarios'
const STORAGE_KEY_PROVEEDORES = 'pos_proveedores_frecuentes'
const STORAGE_KEY_INGRESOS = 'pos_ingresos_mercaderia'

interface ProveedorStat {
  nombre: string
  conteo: number
  ultima: string // ISO date
}

function IngresoMercaderiaComponent({
  productos,
  onVolver,
  onRegistrarIngreso,
  usuarios: usuariosProp
}: IngresoMercaderiaProps) {
  const [proveedor, setProveedor] = useState('')
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoProveedor>('boleta')
  const [numeroDocumento, setNumeroDocumento] = useState('')
  const [items, setItems] = useState<ItemIngreso[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<string>('')
  const [cantidad, setCantidad] = useState('')
  const [precioCompra, setPrecioCompra] = useState('')
  const [fechaVencimiento, setFechaVencimiento] = useState('')
  const [cantidadCajas, setCantidadCajas] = useState('')
  const [cantidadUnidades, setCantidadUnidades] = useState('')
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState<string>('')
  const [proveedoresFrecuentes, setProveedoresFrecuentes] = useState<ProveedorStat[]>([])

  const proveedoresTop = useMemo(() => {
    return [...proveedoresFrecuentes]
      .sort((a, b) => b.conteo - a.conteo || b.ultima.localeCompare(a.ultima))
      .slice(0, 5)
  }, [proveedoresFrecuentes])

  useEffect(() => {
    // Usar usuarios de props o cargar de localStorage
    if (usuariosProp && usuariosProp.length > 0) {
      setUsuarios(usuariosProp)
      setUsuarioSeleccionado(usuariosProp[0].id)
    } else {
      const usuariosStr = localStorage.getItem(STORAGE_KEY_USUARIOS)
      if (usuariosStr) {
        const usuariosList = JSON.parse(usuariosStr)
        setUsuarios(usuariosList)
        if (usuariosList.length > 0) {
          setUsuarioSeleccionado(usuariosList[0].id)
        }
      }
    }

    // Cargar proveedores frecuentes
    const proveedoresStr = localStorage.getItem(STORAGE_KEY_PROVEEDORES)
    if (proveedoresStr) {
      try {
        setProveedoresFrecuentes(JSON.parse(proveedoresStr))
      } catch {
        setProveedoresFrecuentes([])
      }
    } else {
      // Si no existe la lista, intentar inferir desde ingresos previos
      const ingresosStr = localStorage.getItem(STORAGE_KEY_INGRESOS)
      if (ingresosStr) {
        try {
          const ingresos: Array<{ proveedor?: string; fecha?: string }> = JSON.parse(ingresosStr)
          const mapa = new Map<string, ProveedorStat>()
          ingresos.forEach((ing) => {
            if (!ing.proveedor) return
            const nombre = String(ing.proveedor).trim()
            if (!nombre) return
            const prev = mapa.get(nombre) || { nombre, conteo: 0, ultima: ing.fecha || new Date().toISOString() }
            mapa.set(nombre, { nombre, conteo: prev.conteo + 1, ultima: ing.fecha || prev.ultima })
          })
          const lista = Array.from(mapa.values()).sort((a, b) => b.conteo - a.conteo)
          setProveedoresFrecuentes(lista)
          localStorage.setItem(STORAGE_KEY_PROVEEDORES, JSON.stringify(lista))
        } catch {
          // ignorar errores de parseo
        }
      }
    }
  }, [usuariosProp])

  const agregarItem = () => {
    if (!productoSeleccionado || !cantidad || !precioCompra) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    const producto = productos.find(p => p.id === productoSeleccionado)
    if (!producto) return

    const cantidadNum = parseFloat(cantidad) || 0
    const precioCompraNum = parseFloat(precioCompra) || 0

    if (cantidadNum <= 0 || precioCompraNum <= 0) {
      alert('La cantidad y el precio de compra deben ser mayores a 0')
      return
    }

    // Si es producto cerrado, validar cajas y unidades
    if (producto.esCerrado) {
      const cajas = parseFloat(cantidadCajas) || 0
      const unidades = parseFloat(cantidadUnidades) || 0
      
      if (cajas === 0 && unidades === 0) {
        alert('Debe ingresar al menos una caja o unidad')
        return
      }

      const nuevoItem: ItemIngreso = {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: cantidadNum,
        precioCompra: precioCompraNum,
        fechaVencimiento: fechaVencimiento || undefined,
        cantidadCajas: cajas > 0 ? cajas : undefined,
        cantidadUnidades: unidades > 0 ? unidades : undefined
      }

      setItems([...items, nuevoItem])
    } else {
      const nuevoItem: ItemIngreso = {
        productoId: producto.id,
        productoNombre: producto.nombre,
        cantidad: cantidadNum,
        precioCompra: precioCompraNum,
        fechaVencimiento: fechaVencimiento || undefined
      }

      setItems([...items, nuevoItem])
    }

    // Limpiar campos
    setProductoSeleccionado('')
    setCantidad('')
    setPrecioCompra('')
    setFechaVencimiento('')
    setCantidadCajas('')
    setCantidadUnidades('')
  }

  const eliminarItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const registrarIngreso = () => {
    if (!proveedor || !numeroDocumento || items.length === 0) {
      alert('Por favor completa todos los campos requeridos')
      return
    }

    const usuario = usuarios.find(u => u.id === usuarioSeleccionado)

    const ingreso: IngresoMercaderiaType = {
      id: Date.now().toString(),
      fecha: new Date(),
      proveedor,
      tipoDocumento,
      numeroDocumento,
      items: items.map(item => ({
        productoId: item.productoId,
        productoNombre: item.productoNombre,
        cantidad: item.cantidad,
        precioCompra: item.precioCompra,
        fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : undefined,
        cantidadCajas: item.cantidadCajas,
        cantidadUnidades: item.cantidadUnidades
      })),
      usuario
    }

    onRegistrarIngreso(ingreso)

    // Actualizar estadísticas de proveedores frecuentes
    const nombreProveedor = proveedor.trim()
    if (nombreProveedor) {
      const ahoraIso = new Date().toISOString()
      const lista = [...proveedoresFrecuentes]
      const idx = lista.findIndex(p => p.nombre.toLowerCase() === nombreProveedor.toLowerCase())
      if (idx >= 0) {
        lista[idx] = { ...lista[idx], conteo: lista[idx].conteo + 1, ultima: ahoraIso }
      } else {
        lista.push({ nombre: nombreProveedor, conteo: 1, ultima: ahoraIso })
      }
      setProveedoresFrecuentes(lista)
      localStorage.setItem(STORAGE_KEY_PROVEEDORES, JSON.stringify(lista))
    }
    
    // Limpiar formulario
    setProveedor('')
    setNumeroDocumento('')
    setItems([])
    alert('Ingreso de mercadería registrado correctamente')
  }

  const productoSeleccionadoObj = productos.find(p => p.id === productoSeleccionado)

  return (
    <div className="ingreso-mercaderia">
      <div className="ingreso-header">
        <h1>Registro de Ingreso de Mercadería</h1>
        <button className="btn-volver" onClick={onVolver}>
          ← Volver
        </button>
      </div>

      <div className="ingreso-form">
        <div className="form-section">
          <h2>Datos del Proveedor</h2>
          <div className="form-grid">
            <div className="form-group">
              <label>Proveedor *</label>
              <input
                type="text"
                value={proveedor}
                onChange={(e) => setProveedor(e.target.value)}
                placeholder="Nombre del proveedor"
                className="input-form"
                list="proveedores-list"
              />
              {proveedoresTop.length > 0 && (
                <div className="proveedores-rapidos">
                  {proveedoresTop.map(p => (
                    <button
                      key={p.nombre}
                      type="button"
                      className="chip-proveedor"
                      title={`Usado ${p.conteo} veces`}
                      onClick={() => setProveedor(p.nombre)}
                    >
                      {p.nombre}
                    </button>
                  ))}
                </div>
              )}
              <datalist id="proveedores-list">
                {proveedoresFrecuentes.map(p => (
                  <option key={p.nombre} value={p.nombre} />
                ))}
              </datalist>
            </div>
            <div className="form-group">
              <label>Tipo de Documento *</label>
              <select
                value={tipoDocumento}
                onChange={(e) => setTipoDocumento(e.target.value as TipoDocumentoProveedor)}
                className="input-form"
              >
                <option value="boleta">Boleta</option>
                <option value="factura">Factura</option>
                <option value="guia">Guía de Remisión</option>
              </select>
            </div>
            <div className="form-group">
              <label>Número de Documento *</label>
              <input
                type="text"
                value={numeroDocumento}
                onChange={(e) => setNumeroDocumento(e.target.value)}
                placeholder="Número de boleta/factura/guía"
                className="input-form"
              />
            </div>
            <div className="form-group">
              <label>Usuario que registra</label>
              <select
                value={usuarioSeleccionado}
                onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                className="input-form"
              >
                {usuarios.map(u => (
                  <option key={u.id} value={u.id}>{u.nombre}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Agregar Productos</h2>
          <p className="form-hint">
            Puedes agregar múltiples productos diferentes en este ingreso. Agrega un producto a la vez y luego continúa agregando más.
          </p>
          <div className="form-grid">
            <div className="form-group">
              <label>Producto *</label>
              <select
                value={productoSeleccionado}
                onChange={(e) => setProductoSeleccionado(e.target.value)}
                className="input-form"
              >
                <option value="">Seleccionar producto</option>
                {productos.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            {productoSeleccionadoObj?.esCerrado ? (
              <>
                <div className="form-group">
                  <label>Cantidad de Cajas</label>
                  <input
                    type="number"
                    min="0"
                    value={cantidadCajas}
                    onChange={(e) => setCantidadCajas(e.target.value)}
                    placeholder="0"
                    className="input-form"
                  />
                </div>
                <div className="form-group">
                  <label>Cantidad de Unidades</label>
                  <input
                    type="number"
                    min="0"
                    value={cantidadUnidades}
                    onChange={(e) => setCantidadUnidades(e.target.value)}
                    placeholder="0"
                    className="input-form"
                  />
                </div>
                <div className="form-group">
                  <label>Cantidad Total *</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Cantidad total en unidades"
                    className="input-form"
                  />
                </div>
              </>
            ) : (
              <div className="form-group">
                <label>Cantidad *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  placeholder="Cantidad"
                  className="input-form"
                />
              </div>
            )}
            <div className="form-group">
              <label>Precio de Compra *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precioCompra}
                onChange={(e) => setPrecioCompra(e.target.value)}
                placeholder="0.00"
                className="input-form"
              />
            </div>
            <div className="form-group">
              <label>Fecha de Vencimiento (opcional)</label>
              <input
                type="date"
                value={fechaVencimiento}
                onChange={(e) => setFechaVencimiento(e.target.value)}
                className="input-form"
              />
            </div>
            <div className="form-group">
              <button className="btn-agregar-item" onClick={agregarItem}>
                + Agregar Producto
              </button>
            </div>
          </div>
        </div>

        {items.length > 0 && (
          <div className="form-section">
            <h2>Productos a Ingresar ({items.length})</h2>
            <p className="form-hint">
              {items.length === 1 
                ? '1 producto agregado. Puedes agregar más productos antes de registrar el ingreso.'
                : `${items.length} productos agregados. Puedes agregar más productos antes de registrar el ingreso.`}
            </p>
            <div className="items-table">
              <div className="table-header">
                <div>Producto</div>
                <div>Cantidad</div>
                <div>Precio Compra</div>
                <div>Vencimiento</div>
                <div>Acciones</div>
              </div>
              {items.map((item, index) => (
                <div key={index} className="table-row">
                  <div>{item.productoNombre}</div>
                  <div>
                    {item.cantidadCajas !== undefined && item.cantidadUnidades !== undefined
                      ? `${item.cantidadCajas} cajas, ${item.cantidadUnidades} unidades`
                      : item.cantidad}
                  </div>
                  <div>S/ {item.precioCompra.toFixed(2)}</div>
                  <div>
                    {item.fechaVencimiento
                      ? new Date(item.fechaVencimiento).toLocaleDateString('es-PE')
                      : 'N/A'}
                  </div>
                  <div>
                    <button
                      className="btn-eliminar-item"
                      onClick={() => eliminarItem(index)}
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="form-actions">
          <button className="btn-cancelar" onClick={onVolver}>
            Cancelar
          </button>
          <button
            className="btn-registrar"
            onClick={registrarIngreso}
            disabled={items.length === 0}
          >
            Registrar Ingreso
          </button>
        </div>
      </div>
    </div>
  )
}

export default IngresoMercaderiaComponent
