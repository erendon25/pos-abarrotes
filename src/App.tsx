import { useState, useEffect, useRef, useMemo } from 'react'
import { Producto, ItemCarrito, Venta, Categoria, MetodoPago, Usuario, IngresoMercaderia, MovimientoInventario } from './types'
import ProductosGrid from './components/ProductosGrid'
import Carrito from './components/Carrito'
import Almacen from './components/Almacen'
import Reportes from './components/Reportes'
import Configuracion from './components/Configuracion'
import RegistroVentas from './components/RegistroVentas'
import IngresoMercaderiaComponent from './components/IngresoMercaderia'
import MovimientosInventario from './components/MovimientosInventario'
import Vencimientos from './components/Vencimientos'
import SelectorSubcategoria from './components/SelectorSubcategoria'
import SelectorTipoVenta from './components/SelectorTipoVenta'
import ModalPago from './components/ModalPago'
import Comprobante from './components/Comprobante'
import { obtenerSiguienteTicket, obtenerSiguienteBoleta } from './utils/numeracion'
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

type Vista = 'venta' | 'almacen' | 'reportes' | 'configuracion' | 'registroVentas' | 'ingresoMercaderia' | 'movimientosInventario' | 'vencimientos'

function App() {
  const [vista, setVista] = useState<Vista>('venta')
  const [productos, setProductos] = useState<Producto[]>(productosIniciales)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [productoCerradoSeleccionado, setProductoCerradoSeleccionado] = useState<Producto | null>(null)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [ventaComprobante, setVentaComprobante] = useState<Venta | null>(null)
  const [ingresos, setIngresos] = useState<IngresoMercaderia[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [mostrarNotificacionVencimientos, setMostrarNotificacionVencimientos] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  
  // Referencias para el manejo de códigos de barras
  const codigoBarrasBuffer = useRef('')
  const tiempoUltimaTecla = useRef(0)
  const inputFocused = useRef(false)

  const STORAGE_KEY_INGRESOS = 'pos_ingresos_mercaderia'
  const STORAGE_KEY_MOVIMIENTOS = 'pos_movimientos_inventario'
  const STORAGE_KEY_USUARIOS = 'pos_usuarios'
  const STORAGE_KEY_PRODUCTOS = 'pos_productos'
  const STORAGE_KEY_CATEGORIAS = 'pos_categorias'
  const STORAGE_KEY_CARRITO = 'pos_carrito'
  const STORAGE_KEY_VENTAS = 'pos_ventas'

  const obtenerPrecio = (item: ItemCarrito) => {
    // Si tiene subcategoría seleccionada, usar ese precio
    if (item.subcategoriaSeleccionada && item.producto.preciosPorSubcategoria) {
      return item.producto.preciosPorSubcategoria[item.subcategoriaSeleccionada] || item.producto.precio
    }
    
    // Si es producto cerrado vendido en unidades, usar precio por unidad
    if (item.producto.esCerrado && item.vendidoEnUnidades && item.producto.precioUnidad) {
      return item.producto.precioUnidad
    }
    
    // Precio base (por caja si es cerrado, precio normal si no)
    return item.producto.precio
  }

  const agregarAlCarrito = (producto: Producto) => {
    // Validar que el producto tenga stock disponible
    if (producto.stock === 0) {
      alert('Este producto no tiene stock disponible')
      return
    }

    // Si el producto es cerrado (cajas/unidades), mostrar selector
    if (producto.esCerrado && producto.unidadesPorCaja && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
      // Validar que haya stock disponible
      if (producto.stockCaja === 0 && producto.stockUnidad === 0) {
        alert('Este producto no tiene stock disponible')
        return
      }
      setProductoCerradoSeleccionado(producto)
      return
    }

    // Si el producto tiene precios por subcategoría, mostrar selector
    const categoria = categorias.find(c => c.nombre === producto.categoria)
    const tienePreciosPorSubcategoria = producto.preciosPorSubcategoria && Object.keys(producto.preciosPorSubcategoria).length > 0
    const tieneSubcategorias = categoria && categoria.subcategorias.length > 0

    if (tienePreciosPorSubcategoria && tieneSubcategorias) {
      setProductoSeleccionado(producto)
      return
    }

    // Si no tiene variantes, agregar directamente
    agregarAlCarritoConSubcategoria(producto, null)
  }

  const agregarAlCarritoConSubcategoria = (producto: Producto, subcategoria: string | null, vendidoEnUnidades?: boolean) => {
    setProductoSeleccionado(null)
    setProductoCerradoSeleccionado(null)

    setCarrito((prev: ItemCarrito[]) => {
      const subcategoriaValue = subcategoria || undefined
      const vendidoEnUnidadesValue = vendidoEnUnidades !== undefined ? vendidoEnUnidades : undefined
      
      // Para productos cerrados, también considerar si se vendió en unidades
      const existe = prev.find(item => 
        item.producto.id === producto.id && 
        item.subcategoriaSeleccionada === subcategoriaValue &&
        item.vendidoEnUnidades === vendidoEnUnidadesValue
      )
      
      if (existe) {
        // Validar que no se exceda el stock disponible
        const nuevaCantidad = existe.cantidad + 1
        
        // Validación especial para productos cerrados
        if (producto.esCerrado && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
          if (vendidoEnUnidades) {
            // Validar unidades disponibles
            const unidadesDisponibles = (producto.stockCaja * (producto.unidadesPorCaja || 0)) + producto.stockUnidad
            if (nuevaCantidad > unidadesDisponibles) {
              alert(`No hay suficiente stock. Disponible: ${unidadesDisponibles} unidades`)
              return prev
            }
          } else {
            // Validar cajas disponibles
            if (nuevaCantidad > producto.stockCaja) {
              alert(`No hay suficiente stock. Disponible: ${producto.stockCaja} cajas`)
              return prev
            }
          }
        } else {
          // Validación normal para productos no cerrados
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

  const cambiarSubcategoria = (item: ItemCarrito, nuevaSubcategoria: string | null) => {
    // Eliminar el item actual
    setCarrito(prev => prev.filter(i => 
      !(i.producto.id === item.producto.id && i.subcategoriaSeleccionada === item.subcategoriaSeleccionada)
    ))
    // Agregar con la nueva subcategoría
    agregarAlCarritoConSubcategoria(item.producto, nuevaSubcategoria)
  }

  const procesarVenta = () => {
    if (carrito.length === 0) return
    setMostrarModalPago(true)
  }

  const confirmarPago = (
    metodosPago: MetodoPago[], 
    vuelto: number, 
    requiereBoleta: boolean,
    porcentajeBoleta?: number,
    usuario?: Usuario,
    porcentajeTarjeta?: number
  ) => {
    const subtotal = calcularTotal()
    
    // Calcular total con adicionales
    let total = subtotal
    if (requiereBoleta && porcentajeBoleta) {
      total += subtotal * (porcentajeBoleta / 100)
    }
    if (porcentajeTarjeta) {
      const totalConBoleta = requiereBoleta && porcentajeBoleta 
        ? subtotal + (subtotal * (porcentajeBoleta / 100))
        : subtotal
      total += totalConBoleta * (porcentajeTarjeta / 100)
    }
    
    // Obtener número de comprobante (por defecto ticket, boleta si se solicita)
    const tipoComprobante = requiereBoleta ? 'boleta' : 'ticket'
    const numeroTicket = !requiereBoleta ? obtenerSiguienteTicket() : undefined
    const numeroBoleta = requiereBoleta ? obtenerSiguienteBoleta() : undefined
    
    // Guardar la venta en el historial
    const nuevaVenta: Venta = {
      id: Date.now().toString(),
      fecha: new Date(),
      items: [...carrito],
      total,
      metodosPago,
      vuelto: vuelto > 0 ? vuelto : undefined,
      usuario,
      tipoComprobante,
      numeroTicket,
      numeroBoleta,
      requiereBoleta,
      porcentajeBoleta,
      porcentajeTarjeta,
      reimpresiones: 0,
      anulada: false
    }
    setVentas(prev => [...prev, nuevaVenta])
    
    // Mostrar comprobante
    setVentaComprobante(nuevaVenta)
    
    // Restar stock de los productos vendidos (con lógica de productos cerrados/abiertos) y registrar movimientos
    setProductos(prev => {
      const productosActualizados = prev.map(producto => {
        const itemsVendidos = carrito.filter(item => item.producto.id === producto.id)
        if (itemsVendidos.length > 0) {
          const stockAnterior = producto.stock
          
          // Si el producto es cerrado (se vende en cajas y unidades)
          if (producto.esCerrado && producto.unidadesPorCaja && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
            let stockCaja = producto.stockCaja
            let stockUnidad = producto.stockUnidad
            let unidadesRestantes = 0
            
            itemsVendidos.forEach(item => {
              const cantidad = item.cantidad
              
              // Si se vendió en unidades
              if (item.vendidoEnUnidades) {
                unidadesRestantes = cantidad
              } else {
                // Si se vendió en cajas, convertir a unidades
                unidadesRestantes = cantidad * (producto.unidadesPorCaja || 1)
              }
              
              // Procesar las unidades a restar
              while (unidadesRestantes > 0) {
                if (stockUnidad >= unidadesRestantes) {
                  // Hay suficientes unidades sueltas
                  stockUnidad -= unidadesRestantes
                  unidadesRestantes = 0
                } else {
                  // No hay suficientes unidades, abrir una caja
                  if (stockCaja > 0) {
                    stockCaja -= 1
                    stockUnidad += (producto.unidadesPorCaja || 0) - unidadesRestantes
                    unidadesRestantes = 0
                  } else {
                    // No hay más cajas, usar las unidades disponibles
                    unidadesRestantes -= stockUnidad
                    stockUnidad = 0
                  }
                }
              }
            })
            
            // Calcular stock total en unidades
            const stockTotal = (stockCaja * (producto.unidadesPorCaja || 0)) + stockUnidad
            
            // Registrar movimiento
            const cantidadTotalVendida = itemsVendidos.reduce((sum, item) => {
              if (item.vendidoEnUnidades) {
                return sum + item.cantidad
              } else {
                return sum + (item.cantidad * (producto.unidadesPorCaja || 1))
              }
            }, 0)
            
            const movimiento: MovimientoInventario = {
              id: Date.now().toString() + Math.random().toString(),
              fecha: new Date(),
              tipo: 'venta',
              productoId: producto.id,
              productoNombre: producto.nombre,
              cantidad: -cantidadTotalVendida,
              cantidadAnterior: stockAnterior,
              cantidadNueva: stockTotal,
              referencia: `Venta ${numeroTicket || numeroBoleta}`,
              usuario
            }
            setMovimientos(prev => [...prev, movimiento])
            
            return { 
              ...producto, 
              stock: Math.max(0, stockTotal),
              stockCaja: Math.max(0, stockCaja),
              stockUnidad: Math.max(0, stockUnidad)
            }
          } else {
            // Producto normal (sin cajas/unidades)
            const cantidadTotal = itemsVendidos.reduce((sum, item) => sum + item.cantidad, 0)
            const nuevoStock = producto.stock - cantidadTotal
            
            // Registrar movimiento
            const movimiento: MovimientoInventario = {
              id: Date.now().toString() + Math.random().toString(),
              fecha: new Date(),
              tipo: 'venta',
              productoId: producto.id,
              productoNombre: producto.nombre,
              cantidad: -cantidadTotal,
              cantidadAnterior: stockAnterior,
              cantidadNueva: nuevoStock,
              referencia: `Venta ${numeroTicket || numeroBoleta}`,
              usuario
            }
            setMovimientos(prev => [...prev, movimiento])
            
            return { ...producto, stock: Math.max(0, nuevoStock) }
          }
        }
        return producto
      })
      return productosActualizados
    })

    setCarrito([])
    setMostrarModalPago(false)
  }

  // Función para registrar ingreso de mercadería
  const registrarIngreso = (ingreso: IngresoMercaderia) => {
    setIngresos(prev => [...prev, ingreso])
    
    // Actualizar stock de productos y registrar movimientos
    setProductos(prev =>
      prev.map(producto => {
        const itemIngreso = ingreso.items.find(item => item.productoId === producto.id)
        if (itemIngreso) {
          const stockAnterior = producto.stock
          let nuevoStock = stockAnterior
          let nuevoStockCaja = producto.stockCaja
          let nuevoStockUnidad = producto.stockUnidad
          
          if (producto.esCerrado && itemIngreso.cantidadCajas !== undefined && itemIngreso.cantidadUnidades !== undefined) {
            // Producto cerrado
            nuevoStockCaja = (nuevoStockCaja || 0) + (itemIngreso.cantidadCajas || 0)
            nuevoStockUnidad = (nuevoStockUnidad || 0) + (itemIngreso.cantidadUnidades || 0)
            nuevoStock = (nuevoStockCaja * (producto.unidadesPorCaja || 1)) + nuevoStockUnidad
          } else {
            // Producto normal
            nuevoStock = stockAnterior + itemIngreso.cantidad
          }

          // Registrar movimiento de ingreso
          const movimiento: MovimientoInventario = {
            id: Date.now().toString() + Math.random().toString(),
            fecha: new Date(),
            tipo: 'ingreso',
            productoId: producto.id,
            productoNombre: producto.nombre,
            cantidad: itemIngreso.cantidad,
            cantidadAnterior: stockAnterior,
            cantidadNueva: nuevoStock,
            referencia: `${ingreso.tipoDocumento.toUpperCase()} ${ingreso.numeroDocumento}`,
            usuario: ingreso.usuario,
            cantidadCajas: itemIngreso.cantidadCajas,
            cantidadUnidades: itemIngreso.cantidadUnidades
          }
          setMovimientos(prev => [...prev, movimiento])

          return {
            ...producto,
            stock: nuevoStock,
            stockCaja: nuevoStockCaja,
            stockUnidad: nuevoStockUnidad,
            fechaVencimiento: itemIngreso.fechaVencimiento || producto.fechaVencimiento
          }
        }
        return producto
      })
    )
  }

  // Función para registrar merma (comentada para uso futuro)
  // Se puede descomentar cuando se necesite implementar la funcionalidad de mermas
  /*
  const registrarMerma = (productoId: string, cantidad: number, motivo: string, usuario?: Usuario) => {
    const producto = productos.find(p => p.id === productoId)
    if (!producto) return

    const stockAnterior = producto.stock
    const nuevoStock = Math.max(0, stockAnterior - cantidad)

    // Actualizar producto
    setProductos(prev =>
      prev.map(p =>
        p.id === productoId
          ? { ...p, stock: nuevoStock }
          : p
      )
    )

    // Registrar movimiento
    const movimiento: MovimientoInventario = {
      id: Date.now().toString() + Math.random().toString(),
      fecha: new Date(),
      tipo: 'merma',
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad: -cantidad,
      cantidadAnterior: stockAnterior,
      cantidadNueva: nuevoStock,
      motivo,
      usuario
    }
    setMovimientos(prev => [...prev, movimiento])
  }
  */

  const calcularTotal = () => {
    return carrito.reduce((total, item) => {
      const precio = obtenerPrecio(item)
      return total + precio * item.cantidad
    }, 0)
  }

  const actualizarProductos = (productosActualizados: Producto[]) => {
    setProductos(productosActualizados)
  }

  const actualizarCategorias = (categoriasActualizadas: Categoria[]) => {
    setCategorias(categoriasActualizadas)
  }

  const actualizarVenta = (ventaActualizada: Venta) => {
    setVentas(prev => prev.map(v => v.id === ventaActualizada.id ? ventaActualizada : v))
  }

  // Cargar datos desde localStorage
  useEffect(() => {
    // Productos
    const productosStr = localStorage.getItem(STORAGE_KEY_PRODUCTOS)
    if (productosStr) {
      try {
        const productosCargados: Producto[] = JSON.parse(productosStr).map((p: any) => ({
          ...p,
          fechaVencimiento: p.fechaVencimiento ? new Date(p.fechaVencimiento) : undefined,
        }))
        setProductos(productosCargados)
      } catch {
        // ignorar
      }
    } else {
      localStorage.setItem(STORAGE_KEY_PRODUCTOS, JSON.stringify(productosIniciales))
    }

    // Categorías
    const categoriasStr = localStorage.getItem(STORAGE_KEY_CATEGORIAS)
    if (categoriasStr) {
      try {
        setCategorias(JSON.parse(categoriasStr))
      } catch {
        // ignorar
      }
    } else {
      localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(categoriasIniciales))
    }

    // Carrito (opcional)
    const carritoStr = localStorage.getItem(STORAGE_KEY_CARRITO)
    if (carritoStr) {
      try {
        const carritoCargado: ItemCarrito[] = JSON.parse(carritoStr).map((it: any) => ({
          ...it,
          producto: {
            ...it.producto,
            fechaVencimiento: it.producto?.fechaVencimiento ? new Date(it.producto.fechaVencimiento) : undefined,
          },
        }))
        setCarrito(carritoCargado)
      } catch {
        // ignorar
      }
    }

    // Ventas
    const ventasStr = localStorage.getItem(STORAGE_KEY_VENTAS)
    if (ventasStr) {
      try {
        const ventasCargadas: Venta[] = JSON.parse(ventasStr).map((v: any) => ({
          ...v,
          fecha: new Date(v.fecha),
          items: (v.items || []).map((it: any) => ({
            ...it,
            producto: {
              ...it.producto,
              fechaVencimiento: it.producto?.fechaVencimiento ? new Date(it.producto.fechaVencimiento) : undefined,
            },
          })),
        }))
        setVentas(ventasCargadas)
      } catch {
        // ignorar
      }
    }

    const ingresosStr = localStorage.getItem(STORAGE_KEY_INGRESOS)
    if (ingresosStr) {
      const ingresosCargados: IngresoMercaderia[] = JSON.parse(ingresosStr).map((ing: any) => ({
        ...ing,
        fecha: new Date(ing.fecha),
        items: ing.items.map((item: any) => ({
          ...item,
          fechaVencimiento: item.fechaVencimiento ? new Date(item.fechaVencimiento) : undefined
        }))
      }))
      setIngresos(ingresosCargados)
    }

    const movimientosStr = localStorage.getItem(STORAGE_KEY_MOVIMIENTOS)
    if (movimientosStr) {
      const movimientosCargados: MovimientoInventario[] = JSON.parse(movimientosStr).map((mov: any) => ({
        ...mov,
        fecha: new Date(mov.fecha)
      }))
      setMovimientos(movimientosCargados)
    }

    // Cargar usuarios
    const usuariosStr = localStorage.getItem(STORAGE_KEY_USUARIOS)
    if (usuariosStr) {
      const usuariosCargados: Usuario[] = JSON.parse(usuariosStr)
      setUsuarios(usuariosCargados)
    } else {
      // Si no hay usuarios, crear uno por defecto
      const usuarioPorDefecto: Usuario = { id: '1', nombre: 'Usuario por Defecto' }
      setUsuarios([usuarioPorDefecto])
      localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify([usuarioPorDefecto]))
    }
  }, [])

  // Guardar datos en localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRODUCTOS, JSON.stringify(productos))
  }, [productos])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(categorias))
  }, [categorias])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CARRITO, JSON.stringify(carrito))
  }, [carrito])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_VENTAS, JSON.stringify(ventas))
  }, [ventas])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_INGRESOS, JSON.stringify(ingresos))
  }, [ingresos])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_MOVIMIENTOS, JSON.stringify(movimientos))
  }, [movimientos])

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_USUARIOS, JSON.stringify(usuarios))
  }, [usuarios])

  // Verificar vencimientos y mostrar notificación
  const productosVencidos = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    return productos.filter(p => {
      if (!p.fechaVencimiento) return false
      const fechaVenc = new Date(p.fechaVencimiento)
      fechaVenc.setHours(0, 0, 0, 0)
      return fechaVenc < hoy
    })
  }, [productos])

  const productosProximosAVencer = useMemo(() => {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const en30Dias = new Date()
    en30Dias.setDate(en30Dias.getDate() + 30)
    en30Dias.setHours(0, 0, 0, 0)
    
    return productos.filter(p => {
      if (!p.fechaVencimiento) return false
      const fechaVenc = new Date(p.fechaVencimiento)
      fechaVenc.setHours(0, 0, 0, 0)
      return fechaVenc >= hoy && fechaVenc <= en30Dias
    })
  }, [productos])

  useEffect(() => {
    if (productosVencidos.length > 0 || productosProximosAVencer.length > 0) {
      setMostrarNotificacionVencimientos(true)
    }
  }, [productosVencidos.length, productosProximosAVencer.length])

  // Efecto para capturar códigos de barras cuando la vista es 'venta'
  useEffect(() => {
    if (vista !== 'venta') return

    const handleKeyPress = (e: KeyboardEvent) => {
      // Si hay un input enfocado, no procesar el código de barras
      const activeElement = document.activeElement
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        inputFocused.current = true
        return
      }
      
      inputFocused.current = false
      const ahora = Date.now()

      // Si pasó más de 100ms desde la última tecla, reiniciar el buffer
      if (ahora - tiempoUltimaTecla.current > 100) {
        codigoBarrasBuffer.current = ''
      }

      tiempoUltimaTecla.current = ahora

      // Si es Enter, procesar el código de barras
      if (e.key === 'Enter' && codigoBarrasBuffer.current.length > 0) {
        e.preventDefault()
        const codigo = codigoBarrasBuffer.current.trim()
        codigoBarrasBuffer.current = ''
        
        if (codigo.length > 0) {
          const producto = productos.find(p => p.codigoBarras === codigo)
          
          if (producto) {
            // Si el producto tiene stock, agregarlo al carrito
            if (producto.stock > 0) {
              agregarAlCarrito(producto)
            } else {
              alert(`El producto "${producto.nombre}" no tiene stock disponible`)
            }
          } else {
            alert(`No se encontró ningún producto con el código de barras: ${codigo}`)
          }
        }
        return
      }

      // Acumular caracteres (solo números y letras)
      if (e.key.length === 1 && /[a-zA-Z0-9]/.test(e.key)) {
        codigoBarrasBuffer.current += e.key
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    
    return () => {
      window.removeEventListener('keydown', handleKeyPress)
    }
  }, [vista, productos, agregarAlCarrito])

  if (vista === 'almacen') {
    return (
      <Almacen 
        productos={productos}
        categorias={categorias}
        onVolver={() => setVista('venta')}
        onActualizarProductos={actualizarProductos}
        onActualizarCategorias={actualizarCategorias}
        onCambiarVista={(vista) => setVista(vista)}
      />
    )
  }

  if (vista === 'reportes') {
    return (
      <Reportes
        ventas={ventas}
        onVolver={() => setVista('venta')}
      />
    )
  }

  if (vista === 'configuracion') {
    return (
      <Configuracion
        onVolver={() => setVista('venta')}
      />
    )
  }

  if (vista === 'registroVentas') {
    return (
      <RegistroVentas
        ventas={ventas}
        onVolver={() => setVista('venta')}
        onActualizarVenta={actualizarVenta}
      />
    )
  }

  if (vista === 'ingresoMercaderia') {
    return (
      <IngresoMercaderiaComponent
        productos={productos}
        onVolver={() => setVista('almacen')}
        onRegistrarIngreso={registrarIngreso}
        usuarios={usuarios}
      />
    )
  }

  if (vista === 'movimientosInventario') {
    return (
      <MovimientosInventario
        movimientos={movimientos}
        onVolver={() => setVista('almacen')}
      />
    )
  }

  if (vista === 'vencimientos') {
    return (
      <Vencimientos
        productos={productos}
        onVolver={() => setVista('almacen')}
      />
    )
  }

  return (
    <div className="app">
      {productoSeleccionado && (
        <SelectorSubcategoria
          producto={productoSeleccionado}
          categorias={categorias}
          onSeleccionar={(subcategoria) => agregarAlCarritoConSubcategoria(productoSeleccionado, subcategoria)}
          onCancelar={() => setProductoSeleccionado(null)}
        />
      )}

      {productoCerradoSeleccionado && (
        <SelectorTipoVenta
          producto={productoCerradoSeleccionado}
          onSeleccionar={(vendidoEnUnidades) => {
            // Agregar al carrito con el tipo de venta seleccionado
            agregarAlCarritoConSubcategoria(productoCerradoSeleccionado, null, vendidoEnUnidades)
          }}
          onCancelar={() => setProductoCerradoSeleccionado(null)}
        />
      )}

      {mostrarModalPago && (
        <ModalPago
          total={calcularTotal()}
          onConfirmar={confirmarPago}
          onCancelar={() => setMostrarModalPago(false)}
        />
      )}

      {ventaComprobante && (
        <Comprobante
          venta={ventaComprobante}
          onCerrar={() => setVentaComprobante(null)}
        />
      )}
      
      <header className="header">
        <div className="header-content">
          <div>
            <h1>MINIMARKET COOL MARKET</h1>
            <p className="subtitle">Punto de Venta</p>
          </div>
          <div className="header-buttons">
            {mostrarNotificacionVencimientos && (productosVencidos.length > 0 || productosProximosAVencer.length > 0) && (
              <button 
                className="btn-vencimientos-alerta" 
                onClick={() => {
                  setVista('vencimientos')
                  setMostrarNotificacionVencimientos(false)
                }}
                title={`${productosVencidos.length} productos vencidos, ${productosProximosAVencer.length} próximos a vencer`}
              >
                ⚠️ Vencimientos ({productosVencidos.length + productosProximosAVencer.length})
              </button>
            )}
            <button className="btn-registro-ventas" onClick={() => setVista('registroVentas')}>
              📋 Registro de Ventas
            </button>
            <button className="btn-reportes" onClick={() => setVista('reportes')}>
              📊 Reportes
            </button>
            <button className="btn-almacen" onClick={() => setVista('almacen')}>
              📦 Almacén
            </button>
            <button className="btn-configuracion" onClick={() => setVista('configuracion')}>
              ⚙️ Configuración
            </button>
          </div>
        </div>
      </header>
      
      <div className="main-container">
        <div className="productos-section">
          <h2>Productos</h2>
          <ProductosGrid 
            productos={productos} 
            categorias={categorias}
            onAgregar={agregarAlCarrito}
          />
        </div>
        
        <div className="carrito-section">
          <Carrito
            items={carrito}
            categorias={categorias}
            onActualizarCantidad={actualizarCantidad}
            onEliminar={eliminarDelCarrito}
            onCambiarSubcategoria={cambiarSubcategoria}
            onProcesarVenta={procesarVenta}
            total={calcularTotal()}
            obtenerPrecio={obtenerPrecio}
          />
        </div>
      </div>
    </div>
  )
}

export default App

