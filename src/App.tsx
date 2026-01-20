import { useState, useEffect } from 'react'
import { Producto, ItemCarrito, Venta, Categoria, MetodoPago, Usuario, IngresoMercaderia } from './types'
import ProductosGrid from './components/ProductosGrid'
import Carrito from './components/Carrito'
import Reportes from './components/Reportes'
import Configuracion from './components/Configuracion'
// import RegistroVentas from './components/RegistroVentas' // Keep if needed later or remove
import IngresoMercaderiaComponent from './components/IngresoMercaderia'
import SelectorSubcategoria from './components/SelectorSubcategoria'
import ModalPago from './components/ModalPago'
import Comprobante from './components/Comprobante'
import Login from './components/Login'
import Layout from './components/Layout'
import Usuarios from './components/Usuarios'
import CatalogoProductos from './components/CatalogoProductos'
import GestionCategorias from './components/GestionCategorias'
import Inventario from './components/Inventario'
import { obtenerSiguienteTicket, obtenerSiguienteBoleta } from './utils/numeracion'
import { collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'
import './App.css'


// Productos de ejemplo
const productosIniciales: Producto[] = [
  { id: '1', nombre: 'Arroz 1kg', precio: 12.50, categoria: 'Granos', stock: 50 },
  { id: '2', nombre: 'Frijoles 1kg', precio: 18.00, categoria: 'Granos', stock: 30 },
  { id: '3', nombre: 'Aceite 1L', precio: 25.00, categoria: 'Aceites', stock: 40 },
  { id: '4', nombre: 'Azúcar 1kg', precio: 15.00, categoria: 'Endulzantes', stock: 35 },
  { id: '5', nombre: 'Sal 1kg', precio: 8.50, categoria: 'Condimentos', stock: 45 },
  { id: '6', nombre: 'Leche 1L', precio: 16.00, categoria: 'Lácteos', stock: 25 },
  { id: '7', nombre: 'Huevos x12', precio: 32.00, categoria: 'Lácteos', stock: 20 },
  { id: '8', nombre: 'Pan Bimbo', precio: 22.00, categoria: 'Panadería', stock: 15 },
  { id: '9', nombre: 'Coca Cola 2L', precio: 28.00, categoria: 'Bebidas', stock: 30 },
  { id: '10', nombre: 'Agua 1.5L', precio: 12.00, categoria: 'Bebidas', stock: 50 },
  { id: '11', nombre: 'Jabón', precio: 14.00, categoria: 'Limpieza', stock: 40 },
  { id: '12', nombre: 'Detergente', precio: 18.50, categoria: 'Limpieza', stock: 25 },
]

// Categorías iniciales
const categoriasIniciales: Categoria[] = [
  { nombre: 'Granos', subcategorias: [] },
  { nombre: 'Aceites', subcategorias: [] },
  { nombre: 'Endulzantes', subcategorias: [] },
  { nombre: 'Condimentos', subcategorias: [] },
  { nombre: 'Lácteos', subcategorias: [] },
  { nombre: 'Panadería', subcategorias: [] },
  { nombre: 'Bebidas', subcategorias: [] },
  { nombre: 'Limpieza', subcategorias: [] },
]

// Tipos de Vista actualizados
type Vista = 'venta' | 'reportes' | 'catalogo' | 'categorias' | 'ingresoMercaderia' | 'usuarios' | 'configuracion' | 'inventario'

function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<Usuario | null>(() => {
    const saved = localStorage.getItem('pos_currentUser')
    return saved ? JSON.parse(saved) : null
  })

  // App state
  const [vista, setVista] = useState<Vista>('venta')
  const [productos, setProductos] = useState<Producto[]>(() => {
    const saved = localStorage.getItem('pos_productos')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.length > 0) return parsed.map((p: any) => ({ ...p, fechaVencimiento: p.fechaVencimiento ? new Date(p.fechaVencimiento) : undefined }))
      } catch (e) {
        console.error("Error parsing productos", e)
      }
    }
    return productosIniciales
  })

  const [categorias, setCategorias] = useState<Categoria[]>(() => {
    const saved = localStorage.getItem('pos_categorias')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        if (parsed.length > 0) return parsed
      } catch (e) { }
    }
    return categoriasIniciales
  })

  const [carrito, setCarrito] = useState<ItemCarrito[]>([])

  const [ventas, setVentas] = useState<Venta[]>(() => {
    const saved = localStorage.getItem('pos_ventas')
    if (saved) {
      try {
        return JSON.parse(saved).map((v: any) => ({ ...v, fecha: new Date(v.fecha) }))
      } catch (e) { }
    }
    return []
  })

  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [productoCerradoSeleccionado, setProductoCerradoSeleccionado] = useState<Producto | null>(null)
  const [filtro, setFiltro] = useState('')
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [ventaComprobante, setVentaComprobante] = useState<Venta | null>(null)

  const [ingresos, setIngresos] = useState<IngresoMercaderia[]>(() => {
    const saved = localStorage.getItem('pos_ingresos')
    if (saved) {
      try {
        return JSON.parse(saved).map((i: any) => ({ ...i, fecha: new Date(i.fecha) }))
      } catch (e) { }
    }
    return []
  })

  // Usuarios state with default admin
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const saved = localStorage.getItem('pos_usuarios')
      if (saved) {
        const loadedUsers: Usuario[] = JSON.parse(saved)
        // Ensure admin always exists in the loaded list
        const adminExists = loadedUsers.some(u => u.usuario === 'admin')
        if (!adminExists) {
          return [
            ...loadedUsers,
            {
              id: loadedUsers.some(u => u.id === '1') ? 'admin-restored' : '1',
              nombre: 'Administrador Principal',
              usuario: 'admin',
              password: 'admin',
              rol: 'admin',
              permisos: { ventas: true, reportes: true, catalogo: true, categorias: true, ingresos: true, usuarios: true, configuracion: true }
            }
          ]
        }
        return loadedUsers
      }
    } catch (e) { }
    // Usuario por defecto
    return [{
      id: '1',
      nombre: 'Administrador',
      usuario: 'admin',
      password: 'admin',
      rol: 'admin',
      permisos: { ventas: true, reportes: true, catalogo: true, categorias: true, ingresos: true, usuarios: true, configuracion: true }
    }]
  })

  // Load products from Firebase (prioritize DB over local for synchronization)
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "productos"))
        const docs: Producto[] = []
        querySnapshot.forEach((doc) => {
          docs.push({ id: doc.id, ...doc.data() } as Producto)
        })

        if (docs.length > 0) {
          setProductos(docs)
          localStorage.setItem('pos_productos', JSON.stringify(docs))
        } else {
          // If DB is empty, check local or use initial
          const local = localStorage.getItem('pos_productos')
          if (local) {
            setProductos(JSON.parse(local))
          } else {
            setProductos(productosIniciales)
          }
        }
      } catch (error) {
        console.error("Error loading from Firebase:", error)
        // Fallback to local
        const local = localStorage.getItem('pos_productos')
        if (local) {
          setProductos(JSON.parse(local))
        }
      }
    }
    fetchProductos()
  }, [])

  const handleLogin = (usuario: Usuario) => {
    setCurrentUser(usuario)
    localStorage.setItem('pos_currentUser', JSON.stringify(usuario))
  }

  const handleLogout = () => {
    setCurrentUser(null)
    localStorage.removeItem('pos_currentUser')
    setVista('venta')
  }

  // ... (Keeping core logic functions)

  const obtenerPrecio = (item: ItemCarrito) => {
    if (item.subcategoriaSeleccionada && item.producto.preciosPorSubcategoria) {
      return item.producto.preciosPorSubcategoria[item.subcategoriaSeleccionada] || item.producto.precio
    }
    if (item.producto.esCerrado && item.vendidoEnUnidades && item.producto.precioUnidad) {
      return item.producto.precioUnidad
    }
    return item.producto.precio
  }

  const agregarAlCarrito = (producto: Producto) => {
    if (producto.activo === false) { // Check active status
      alert('Este producto está inactivo.')
      return
    }

    if (producto.stock === 0) {
      alert('Este producto no tiene stock disponible')
      return
    }

    if (producto.esCerrado && producto.unidadesPorCaja && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
      if (producto.stockCaja === 0 && producto.stockUnidad === 0) {
        alert('Este producto no tiene stock disponible')
        return
      }
      setProductoCerradoSeleccionado(producto)
      return
    }

    const categoria = categorias.find(c => c.nombre === producto.categoria)
    const tienePreciosPorSubcategoria = producto.preciosPorSubcategoria && Object.keys(producto.preciosPorSubcategoria).length > 0
    const tieneSubcategorias = categoria && categoria.subcategorias.length > 0

    if (tienePreciosPorSubcategoria && tieneSubcategorias) {
      setProductoSeleccionado(producto)
      return
    }

    agregarAlCarritoConSubcategoria(producto, null)
  }

  const agregarAlCarritoConSubcategoria = (producto: Producto, subcategoria: string | null, vendidoEnUnidades?: boolean) => {
    setProductoSeleccionado(null)
    setProductoCerradoSeleccionado(null)

    setCarrito((prev: ItemCarrito[]) => {
      const subcategoriaValue = subcategoria || undefined
      const vendidoEnUnidadesValue = vendidoEnUnidades !== undefined ? vendidoEnUnidades : undefined

      const existe = prev.find(item =>
        item.producto.id === producto.id &&
        item.subcategoriaSeleccionada === subcategoriaValue &&
        item.vendidoEnUnidades === vendidoEnUnidadesValue
      )

      if (existe) {
        const nuevaCantidad = existe.cantidad + 1
        if (producto.esCerrado && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
          if (vendidoEnUnidades) {
            const unidadesDisponibles = (producto.stockCaja * (producto.unidadesPorCaja || 0)) + producto.stockUnidad
            if (nuevaCantidad > unidadesDisponibles) {
              alert(`No hay suficiente stock. Disponible: ${unidadesDisponibles} unidades`)
              return prev
            }
          } else {
            if (nuevaCantidad > producto.stockCaja) {
              alert(`No hay suficiente stock. Disponible: ${producto.stockCaja} cajas`)
              return prev
            }
          }
        } else {
          if (nuevaCantidad > producto.stock) {
            alert(`No hay suficiente stock. Disponible: ${producto.stock}`)
            return prev
          }
        }

        return prev.map(item =>
          item.producto.id === producto.id &&
            item.subcategoriaSeleccionada === subcategoriaValue &&
            item.vendidoEnUnidades === vendidoEnUnidadesValue
            ? { ...item, cantidad: nuevaCantidad }
            : item
        )
      }

      const nuevoItem: ItemCarrito = {
        producto,
        cantidad: 1,
        ...(subcategoriaValue && { subcategoriaSeleccionada: subcategoriaValue }),
        ...(vendidoEnUnidadesValue !== undefined && { vendidoEnUnidades: vendidoEnUnidadesValue })
      }
      return [...prev, nuevoItem]
    })
  }

  const actualizarCantidad = (id: string, cantidad: number, subcategoria?: string, vendidoEnUnidades?: boolean) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(id, subcategoria, vendidoEnUnidades)
      return
    }

    // Validar stock disponible
    const item = carrito.find(i =>
      i.producto.id === id &&
      i.subcategoriaSeleccionada === subcategoria &&
      i.vendidoEnUnidades === vendidoEnUnidades
    )
    if (item) {
      const producto = productos.find(p => p.id === id)
      if (producto) {
        // Validación especial para productos cerrados
        if (producto.esCerrado && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
          if (vendidoEnUnidades) {
            // Validar unidades disponibles
            const unidadesDisponibles = (producto.stockCaja * (producto.unidadesPorCaja || 0)) + producto.stockUnidad
            if (cantidad > unidadesDisponibles) {
              alert(`No hay suficiente stock. Disponible: ${unidadesDisponibles} unidades`)
              return
            }
          } else {
            // Validar cajas disponibles
            if (cantidad > producto.stockCaja) {
              alert(`No hay suficiente stock. Disponible: ${producto.stockCaja} cajas`)
              return
            }
          }
        } else {
          // Validación normal para productos no cerrados
          if (cantidad > producto.stock) {
            alert(`No hay suficiente stock. Disponible: ${producto.stock}`)
            return
          }
        }
      }
    }

    setCarrito(prev =>
      prev.map(item =>
        item.producto.id === id &&
          item.subcategoriaSeleccionada === subcategoria &&
          item.vendidoEnUnidades === vendidoEnUnidades
          ? { ...item, cantidad }
          : item
      )
    )
  }

  const eliminarDelCarrito = (id: string, subcategoria?: string, vendidoEnUnidades?: boolean) => {
    setCarrito(prev => prev.filter(item =>
      !(item.producto.id === id &&
        item.subcategoriaSeleccionada === subcategoria &&
        item.vendidoEnUnidades === vendidoEnUnidades)
    ))
  }

  const calcularTotal = () => {
    return carrito.reduce((total, item) => {
      const precio = obtenerPrecio(item)
      return total + precio * item.cantidad
    }, 0)
  }

  const procesarVenta = () => {
    if (carrito.length === 0) return
    setMostrarModalPago(true)
  }

  const confirmarPago = async (metodosPago: MetodoPago[], vuelto: number, requiereBoleta: boolean, usuario?: Usuario, porcentajeTarjeta?: number) => {
    const subtotal = calcularTotal()
    let total = subtotal
    if (porcentajeTarjeta) {
      total += subtotal * (porcentajeTarjeta / 100)
    }

    const tipoComprobante = requiereBoleta ? 'boleta' : 'ticket'
    const numeroTicket = !requiereBoleta ? obtenerSiguienteTicket() : undefined
    const numeroBoleta = requiereBoleta ? obtenerSiguienteBoleta() : undefined

    const metodosPagoAjustados = metodosPago.map(m => {
      if (m.tipo === 'efectivo' && vuelto > 0) {
        return { ...m, monto: m.monto - vuelto }
      }
      return m
    })

    const nuevaVenta: Venta = {
      id: Date.now().toString(),
      fecha: new Date(),
      items: [...carrito],
      total,
      metodosPago: metodosPagoAjustados,
      vuelto: vuelto > 0 ? vuelto : undefined,
      usuario: usuario || currentUser || undefined,
      tipoComprobante,
      numeroTicket,
      numeroBoleta,
      requiereBoleta,
      porcentajeTarjeta,
      reimpresiones: 0,
      anulada: false
    }
    setVentas(prev => [...prev, nuevaVenta])
    setVentaComprobante(nuevaVenta)

    // Update Stock Logic (Simplified ref copy)
    setProductos(prev => {
      return prev.map(producto => {
        const itemsVendidos = carrito.filter(item => item.producto.id === producto.id)
        if (itemsVendidos.length > 0) {
          if (producto.esCerrado && producto.unidadesPorCaja && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
            let stockCaja = producto.stockCaja
            let stockUnidad = producto.stockUnidad
            let unidadesRestantes = 0

            itemsVendidos.forEach(item => {
              const cantidad = item.cantidad
              if (item.vendidoEnUnidades) {
                unidadesRestantes = cantidad
              } else {
                unidadesRestantes = cantidad * (producto.unidadesPorCaja || 1)
              }

              while (unidadesRestantes > 0) {
                if (stockUnidad >= unidadesRestantes) {
                  stockUnidad -= unidadesRestantes
                  unidadesRestantes = 0
                } else {
                  if (stockCaja > 0) {
                    stockCaja -= 1
                    stockUnidad += (producto.unidadesPorCaja || 0) - unidadesRestantes
                    unidadesRestantes = 0
                  } else {
                    unidadesRestantes -= stockUnidad
                    stockUnidad = 0
                  }
                }
              }
            })

            const stockTotal = (stockCaja * (producto.unidadesPorCaja || 0)) + stockUnidad
            return { ...producto, stock: Math.max(0, stockTotal), stockCaja: Math.max(0, stockCaja), stockUnidad: Math.max(0, stockUnidad), sincronizado: false }
          } else {
            const cantidadTotal = itemsVendidos.reduce((sum, item) => sum + item.cantidad, 0)
            const nuevoStock = producto.stock - cantidadTotal
            return { ...producto, stock: Math.max(0, nuevoStock), sincronizado: false }
          }
        }
        return producto
      })
    })

    setCarrito([])
    setMostrarModalPago(false)
  }

  const registrarIngreso = (ingreso: IngresoMercaderia) => {
    setIngresos(prev => [...prev, ingreso])
    setProductos(prev =>
      prev.map(producto => {
        const itemIngreso = ingreso.items.find(item => item.productoId === producto.id)
        if (itemIngreso) {
          let nuevoStock = producto.stock
          let nuevoStockCaja = producto.stockCaja
          let nuevoStockUnidad = producto.stockUnidad

          if (producto.esCerrado && itemIngreso.cantidadCajas !== undefined && itemIngreso.cantidadUnidades !== undefined) {
            nuevoStockCaja = (nuevoStockCaja || 0) + (itemIngreso.cantidadCajas || 0)
            nuevoStockUnidad = (nuevoStockUnidad || 0) + (itemIngreso.cantidadUnidades || 0)
            nuevoStock = (nuevoStockCaja * (producto.unidadesPorCaja || 1)) + nuevoStockUnidad
          } else {
            nuevoStock = producto.stock + itemIngreso.cantidad
          }

          return {
            ...producto,
            stock: nuevoStock,
            stockCaja: nuevoStockCaja,
            stockUnidad: nuevoStockUnidad,
            fechaVencimiento: itemIngreso.fechaVencimiento || producto.fechaVencimiento,
            sincronizado: false
          }
        }
        return producto
      })
    )
  }

  // Persist Data
  useEffect(() => { localStorage.setItem('pos_productos', JSON.stringify(productos)) }, [productos])
  useEffect(() => { localStorage.setItem('pos_categorias', JSON.stringify(categorias)) }, [categorias])
  useEffect(() => { localStorage.setItem('pos_usuarios', JSON.stringify(usuarios)) }, [usuarios])
  useEffect(() => { localStorage.setItem('pos_ventas', JSON.stringify(ventas)) }, [ventas])
  useEffect(() => { localStorage.setItem('pos_ingresos', JSON.stringify(ingresos)) }, [ingresos])


  // Views Rendering
  if (!currentUser) {
    return <Login onLogin={handleLogin} usuarios={usuarios} />
  }

  return (
    <Layout
      vistaActual={vista}
      cambiarVista={setVista}
      usuario={currentUser}
      cerrarSesion={handleLogout}
    >
      <div className="app-content-wrapper">
        {vista === 'venta' && (
          <div className="layout-grid">
            <div className="panel-izquierdo">
              <ProductosGrid
                productos={productos}
                categorias={categorias}
                onAgregar={agregarAlCarrito}
                filtro={filtro}
                setFiltro={setFiltro}
              />
            </div>
            <div className="panel-derecho">
              <Carrito
                items={carrito}
                onEliminar={eliminarDelCarrito}
                onProcesarVenta={procesarVenta}
                onActualizarCantidad={actualizarCantidad}
                categorias={categorias}
                onCambiarSubcategoria={(() => { }) as any} // Simplification for now
                total={calcularTotal()}
                obtenerPrecio={obtenerPrecio}
              />
            </div>
          </div>
        )}

        {vista === 'reportes' && (
          <Reportes
            ventas={ventas}
            onVolver={() => setVista('venta')}
            onAnularVenta={async (id) => {
              if (!confirm('¿Estás seguro de anular esta venta? El stock será devuelto.')) return

              // 1. Mark sale as anulada
              const updatedVentas = ventas.map(v => v.id === id ? { ...v, anulada: true } : v)
              setVentas(updatedVentas)

              // 2. Restore Stock
              const venta = ventas.find(v => v.id === id)
              if (venta) {
                setProductos(prev => prev.map(prod => {
                  const itemVendido = venta.items.find(i => i.producto.id === prod.id)
                  if (itemVendido) {
                    if (prod.esCerrado && itemVendido.vendidoEnUnidades) {
                      // Restore logic complex, simple approach: add to units
                      return { ...prod, stockUnidad: (prod.stockUnidad || 0) + itemVendido.cantidad, stock: prod.stock + itemVendido.cantidad, sincronizado: false }
                    }
                    // Simple restore
                    return { ...prod, stock: prod.stock + itemVendido.cantidad, sincronizado: false }
                  }
                  return prod
                }))
              }

              // 3. Sync Firebase (Best effort placeholder)
              console.log("Venta anulada localmente: ", id)
            }}
            onReimprimirTicket={(venta) => setVentaComprobante(venta)}
          />
        )}

        {vista === 'catalogo' && (
          <CatalogoProductos
            productos={productos}
            setProductos={setProductos}
            categorias={categorias}
          />
        )}

        {vista === 'categorias' && (
          <GestionCategorias
            categorias={categorias}
            setCategorias={setCategorias}
          />
        )}

        {vista === 'inventario' && (
          <Inventario
            productos={productos}
            onVolver={() => setVista('venta')}
            onAjustarStock={(producto, nuevoStock, nuevoStockCaja, nuevoStockUnidad, motivo) => {
              // Lógica de ajuste de stock
              const productoActualizado = { ...producto, stock: nuevoStock, stockCaja: nuevoStockCaja, stockUnidad: nuevoStockUnidad, sincronizado: false }
              setProductos(productos.map(p => p.id === producto.id ? productoActualizado : p))
              alert(`Stock ajustado correctamente. Motivo: ${motivo}`)
            }}
          />
        )}

        {vista === 'ingresoMercaderia' && (
          <IngresoMercaderiaComponent
            productos={productos}
            onVolver={() => setVista('venta')}
            onRegistrarIngreso={registrarIngreso}
            usuarios={usuarios}
          />
        )}

        {vista === 'usuarios' && (
          <Usuarios
            usuarios={usuarios}
            setUsuarios={setUsuarios}
          />
        )}

        {vista === 'configuracion' && (
          <Configuracion
            onConfigSaved={() => { }}
            categorias={categorias}
          />
        )}
      </div>

      {productoSeleccionado && (
        <SelectorSubcategoria
          producto={productoSeleccionado}
          categorias={categorias}
          onSeleccionar={(subcat) => agregarAlCarritoConSubcategoria(productoSeleccionado, subcat)}
          onCancelar={() => setProductoSeleccionado(null)}
        />
      )}

      {productoCerradoSeleccionado && (
        <div className="modal-overlay-selector">
          {/* Simple selection logic for box/unit if needed, reusing SelectorTipoVenta or custom */}
          {/* For now assuming logic inside SelectorTipoVenta or similar, or just simplified prompts as in original code */}
          {/* Since original code had logic for stock checks inline, we might need SelectorTipoVenta here if it was used */}
          <div className="selector-modal">
            <h3>¿Cómo vender {productoCerradoSeleccionado.nombre}?</h3>
            <div className="opciones-venta">
              <button onClick={() => agregarAlCarritoConSubcategoria(productoCerradoSeleccionado, null, false)}>
                Caja Cerrada (x{productoCerradoSeleccionado.unidadesPorCaja})
              </button>
              <button onClick={() => agregarAlCarritoConSubcategoria(productoCerradoSeleccionado, null, true)}>
                Unidad Suelta
              </button>
            </div>
            <button className="btn-cancelar-selector" onClick={() => setProductoCerradoSeleccionado(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {mostrarModalPago && (
        <ModalPago
          total={calcularTotal()}
          onConfirmar={confirmarPago}
          onCancelar={() => setMostrarModalPago(false)}
          usuario={currentUser} // Pass current user
        />
      )}

      {ventaComprobante && (
        <Comprobante
          venta={ventaComprobante}
          onCerrar={() => setVentaComprobante(null)}
        />
      )}
    </Layout>
  )
}

export default App
