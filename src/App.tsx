import { useState, useEffect, useRef, useMemo } from 'react'
import { db } from './firebase'
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore'
import { Producto, ItemCarrito, Venta, Categoria, MetodoPago, Usuario, IngresoMercaderia, MovimientoInventario } from './types'
import ProductosGrid from './components/ProductosGrid'
import Carrito from './components/Carrito'
import Inventario from './components/Inventario'

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

type Vista = 'venta' | 'almacen' | 'reportes' | 'configuracion' | 'registroVentas' | 'ingresoMercaderia' | 'movimientosInventario' | 'vencimientos' | 'inventario'

function App() {
  const [vista, setVista] = useState<Vista>('venta')
  const [productos, setProductos] = useState<Producto[]>(productosIniciales)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [productoCerradoSeleccionado, setProductoCerradoSeleccionado] = useState<Producto | null>(null)
  const [filtro, setFiltro] = useState('') // Estado del filtro levantado
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [ventaComprobante, setVentaComprobante] = useState<Venta | null>(null)
  const [ingresos, setIngresos] = useState<IngresoMercaderia[]>([])
  const [movimientos, setMovimientos] = useState<MovimientoInventario[]>([])
  const [mostrarNotificacionVencimientos, setMostrarNotificacionVencimientos] = useState(false)
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => {
    try {
      const saved = localStorage.getItem('pos_usuarios')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed
        }
      }
    } catch (e) {
      console.error('Error cargando usuarios iniciales:', e)
    }
    // Default si no hay nada o falló
    return [{ id: '1', nombre: 'CAJERO' }]
  })

  // Referencias para el manejo de códigos de barras
  const codigoBarrasBuffer = useRef('')
  const tiempoUltimaTecla = useRef(0)

  // Estado del menú lateral
  const [menuAbierto, setMenuAbierto] = useState(false)

  const handleConfigSaved = () => {
    // Recargar usuarios y configuraciones sin reiniciar toda la app
    try {
      const usuariosGuardados = localStorage.getItem('pos_usuarios')
      if (usuariosGuardados) {
        setUsuarios(JSON.parse(usuariosGuardados))
      }
      // Aquí se pueden recargar otros estados si fuera necesario
    } catch (error) {
      console.error('Error recargando configuración:', error)
    }
  }

  const handleAjustarStock = (producto: Producto, nuevoStock: number, nuevoStockCaja: number | undefined, nuevoStockUnidad: number | undefined, motivo: string, cantidadDiferencia: number) => {
    const stockAnterior = producto.stock

    // Actualizar producto
    setProductos(prev => prev.map(p => {
      if (p.id === producto.id) {
        return {
          ...p,
          stock: nuevoStock,
          stockCaja: nuevoStockCaja,
          stockUnidad: nuevoStockUnidad
        }
      }
      return p
    }))

    // Registrar movimiento
    const movimiento: MovimientoInventario = {
      id: Date.now().toString() + Math.random().toString(),
      fecha: new Date(),
      tipo: 'ajuste',
      productoId: producto.id,
      productoNombre: producto.nombre,
      cantidad: cantidadDiferencia,
      cantidadAnterior: stockAnterior,
      cantidadNueva: nuevoStock,
      referencia: `Inventario: ${motivo}`, // Usamos referencia para guardar el motivo específico
      usuario: usuarios[0]
    }
    setMovimientos(prev => [...prev, movimiento])
  }

  // Función centralizada para sincronizar
  const ejecutarSincronizacion = async (silencioso = false) => {
    // Filtrar solo lo que falta subir para ahorrar cuota
    const productosPendientes = productos.filter(p => !p.sincronizado)

    if (productosPendientes.length === 0) {
      if (!silencioso) alert('✅ Todo está actualizado. No hay cambios pendientes.')
      else console.log('Nada que sincronizar.')
      return
    }

    if (!silencioso) {
      if (!window.confirm(`¿Sincronizar ${productosPendientes.length} cambios con la nube?`)) {
        return
      }
    }

    console.log(`Iniciando sincronización de ${productosPendientes.length} productos...`)
    try {
      // Firebase limita batch a 500 operaciones. Procesar en chunks.
      const chunks = []
      for (let i = 0; i < productosPendientes.length; i += 450) {
        chunks.push(productosPendientes.slice(i, i + 450))
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db)
        chunk.forEach(p => {
          const ref = doc(db, 'productos', p.id)
          // Sanitizar y marcar como sincronizado en la nube
          const pSubida = { ...p, sincronizado: true }
          const data = JSON.parse(JSON.stringify(pSubida))
          batch.set(ref, data, { merge: true })
        })
        await batch.commit()
      }

      // Marcar localmente como sincronizados
      const productosSincronizados = productos.map(p => ({ ...p, sincronizado: true }))
      setProductos(productosSincronizados)
      localStorage.setItem('pos_productos', JSON.stringify(productosSincronizados))

      if (!silencioso) {
        alert('✅ Sincronización completada. Tus datos están seguros en la nube.')
      } else {
        console.log('✅ Corte de mediodía completado automáticamente.')
      }

      // Registrar fecha de última sync exitosa
      localStorage.setItem('ultimo_corte_nuve', new Date().toISOString())

    } catch (error: any) {
      console.error('Error al sincronizar:', error)
      if (error.code === 'resource-exhausted') {
        alert('⚠️ Has superado tu cuota gratuita de hoy en Firebase. Intenta mañana.')
      } else if (!silencioso) {
        alert('❌ Error al sincronizar. Revisa tu conexión.')
      }
    }
  }

  // Scheduler para "Corte Inteligente" (Mediodía)
  useEffect(() => {
    const chequearHora = () => {
      const ahora = new Date()
      const hora = ahora.getHours()
      const fechaHoy = ahora.toLocaleDateString()
      // Usamos una key única por día
      const keySyncHoy = `sync_mediodia_${fechaHoy.replace(/\//g, '-')}`

      // Si es mediodía (12:00 - 12:59) y NO se ha hecho hoy
      if (hora === 12 && !localStorage.getItem(keySyncHoy)) {
        console.log("⏰ Ejecutando corte automático de mediodía...")
        ejecutarSincronizacion(true) // Modo silencioso
        localStorage.setItem(keySyncHoy, 'true')
      }
    }

    // Chequear cada minuto (60,000 ms)
    const intervalo = setInterval(chequearHora, 60000)
    chequearHora()

    return () => clearInterval(intervalo)
  }, [productos])


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

  const confirmarPago = async (
    metodosPago: MetodoPago[],
    vuelto: number,
    requiereBoleta: boolean,
    usuario?: Usuario,
    porcentajeTarjeta?: number
  ) => {
    const subtotal = calcularTotal()

    // Calcular total con adicionales
    let total = subtotal
    if (porcentajeTarjeta) {
      total += subtotal * (porcentajeTarjeta / 100)
    }

    // Obtener número de comprobante (por defecto ticket, boleta si se solicita)
    const tipoComprobante = requiereBoleta ? 'boleta' : 'ticket'
    const numeroTicket = !requiereBoleta ? obtenerSiguienteTicket() : undefined
    const numeroBoleta = requiereBoleta ? obtenerSiguienteBoleta() : undefined

    // Ajustar metodos de pago para restar el vuelto del efectivo
    // Esto corrige el reporte para que la suma de pagos sea igual al total de venta (ingreso real)
    const metodosPagoAjustados = metodosPago.map(m => {
      if (m.tipo === 'efectivo' && vuelto > 0) {
        return { ...m, monto: m.monto - vuelto }
      }
      return m
    })

    // Guardar la venta en el historial
    const nuevaVenta: Venta = {
      id: Date.now().toString(),
      fecha: new Date(),
      items: [...carrito],
      total,
      metodosPago: metodosPagoAjustados,
      vuelto: vuelto > 0 ? vuelto : undefined,
      usuario,
      tipoComprobante,
      numeroTicket,
      numeroBoleta,
      requiereBoleta,
      porcentajeTarjeta,
      reimpresiones: 0,
      anulada: false
    }
    setVentas(prev => [...prev, nuevaVenta])

    // Mostrar comprobante
    setVentaComprobante(nuevaVenta)

    // Restar stock de los productos vendidos (con lógica de productos cerrados/abiertos) y registrar movimientos
    // Guardamos referencia a los productos modificados para subirlos a Firebase
    const productosModificados: Producto[] = []

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

            const prodActualizado = {
              ...producto,
              stock: Math.max(0, stockTotal),
              stockCaja: Math.max(0, stockCaja),
              stockUnidad: Math.max(0, stockUnidad),
              sincronizado: false
            }
            productosModificados.push(prodActualizado)
            return prodActualizado
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

            const prodActualizado = { ...producto, stock: Math.max(0, nuevoStock), sincronizado: false }
            productosModificados.push(prodActualizado)
            return prodActualizado
          }
        }
        return producto
      })

      // SINCRONIZACIÓN AUTOMÁTICA CON FIREBASE (FIRE AND FORGET)
      // Desactivada para ahorrar lecturas/escrituras en Plan Gratuito (20k/día).
      // Si deseas reactivarla para máxima seguridad de datos, descomenta la siguiente línea:
      // sincronizarVentaFirebase(nuevaVenta, productosModificados).catch(err => console.error("Error autosync venta:", err))

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
            fechaVencimiento: itemIngreso.fechaVencimiento || producto.fechaVencimiento,
            sincronizado: false
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



  // Cargar datos desde localStorage o Firebase
  useEffect(() => {
    const cargarDatos = async () => {
      // 1. Cargar caché local para renderizado inmediato
      const productosStr = localStorage.getItem(STORAGE_KEY_PRODUCTOS)
      if (productosStr) {
        try {
          const productosCargados: Producto[] = JSON.parse(productosStr).map((p: any) => ({
            ...p,
            fechaVencimiento: p.fechaVencimiento ? new Date(p.fechaVencimiento) : undefined,
          }))
          setProductos(productosCargados)
        } catch {
          // Si falla, no hacemos nada, esperamos a Firebase
        }
      }

      // 2. Sincronizar con Firebase (SOLO SI NO HAY DATOS LOCALES para ahorrar cuota de lectura)
      // Si ya tenemos datos en local, asumimos que son los más recientes o que el usuario sincronizará manualmente.
      if (productosStr) {
        console.log('✅ Datos cargados desde caché local. Saltando lectura de Firebase para ahorrar cuota.')
      } else {
        try {
          console.log('☁️ No hay datos locales, descargando de Firebase...')
          const querySnapshot = await getDocs(collection(db, 'productos'))
          const productosFirebase: Producto[] = []
          querySnapshot.forEach((doc) => {
            const data = doc.data() as Producto
            productosFirebase.push({
              ...data,
              // Asegurar fechas
              fechaVencimiento: data.fechaVencimiento ? new Date((data.fechaVencimiento as any).seconds * 1000) : undefined
            })
          })

          if (productosFirebase.length > 0) {
            console.log(`Cargados ${productosFirebase.length} productos de Firebase`)
            // Al venir de la nube, están sincronizados
            const productosConSync = productosFirebase.map(p => ({ ...p, sincronizado: true }))
            setProductos(productosConSync)
            localStorage.setItem(STORAGE_KEY_PRODUCTOS, JSON.stringify(productosConSync))
          } else {
            // Solo si no habia nada en local y nada en firebase, ponemos iniciales
            setProductos(productosIniciales)
          }
        } catch (error) {
          console.error('Error sincronizando con Firebase:', error)
          // Fallback a iniciales si no hay nada en local
          setProductos(productosIniciales)
        }
      }

      // 2. Sincronizar categorías con Firebase (SOLO SI NO HAY LOCAL para ahorrar cuota)
      // Recuperar de local primero para tener referencia en caso de fallo
      const categoriasStr = localStorage.getItem(STORAGE_KEY_CATEGORIAS)

      if (categoriasStr) {
        console.log('✅ Categorías cargadas desde caché local.')
        // Ya se cargaron con el hook de inicialización o podríamos cargarlas aquí explícitamente si hiciera falta,
        // pero setCategorias inicializa con localStorage si existe (ver useState inicial en App.tsx).
        // Si no, deberíamos parsear aquí igual que productos.
        // Revisando App.tsx arriba (no visible), setCategorias suele inicializar con un callback que lee localStorage.
        // Pero para asegurar, si no se hizo arriba, lo hacemos aquí o asumimos que ya está.
        // Dado que la lógica de productos hace `setProductos` explícito al leer local, voy a asumir que las categorías también necesitan ser seteadas si leemos strings.
        // Sin embargo, en el código original de productos, la parte 1 lee localStorage.
        // Para categorías, no vi la parte 1. Voy a agregar lectura local explícita aquí para garantizar que se carguen.
        try {
          setCategorias(JSON.parse(categoriasStr))
        } catch (e) { }
      } else {
        try {
          console.log('☁️ Descargando categorías de Firebase...')
          const querySnapshot = await getDocs(collection(db, 'categorias'))
          const categoriasFirebase: Categoria[] = []
          querySnapshot.forEach((doc) => {
            categoriasFirebase.push(doc.data() as Categoria)
          })

          if (categoriasFirebase.length > 0) {
            console.log('Categorías cargadas de Firebase:', categoriasFirebase)
            setCategorias(categoriasFirebase)
            localStorage.setItem(STORAGE_KEY_CATEGORIAS, JSON.stringify(categoriasFirebase))
          } else {
            // Si no hay nada en Firebase ni local, usar iniciales
            setCategorias(categoriasIniciales)
          }
        } catch (error) {
          console.error('Error sincronizando categorías con Firebase:', error)
          setCategorias(categoriasIniciales)
        }
      }

      // ... resto de lógica (carrito, ventas, etc) ...

      // Carrito (solo local)
      const carritoStr = localStorage.getItem(STORAGE_KEY_CARRITO)
      if (carritoStr) {
        try {
          const carritoCargado: ItemCarrito[] = JSON.parse(carritoStr).map((it: any) => ({
            ...it,
            producto: {
              ...it.producto,
              fechaVencimiento: it.producto.fechaVencimiento ? new Date(it.producto.fechaVencimiento) : undefined
            }
          }))
          setCarrito(carritoCargado)
        } catch {
          // ignorar
        }
      }

      // Ventas, ingresos, etc...
      // ... (mantener resto de lógica de carga) ...
    }

    cargarDatos()
  }, []) // Fin del useEffect de carga inicial

  // Listener para lector de código de barras (teclado)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input (para no interferir con escritura manual)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      // Si es Enter, intentamos procesar el código acumulado
      if (e.key === 'Enter') {
        const codigo = codigoBarrasBuffer.current.trim()
        if (codigo.length > 0) {
          // Buscar producto por ID o código de barras
          const productoEncontrado = productos.find(p => p.id === codigo || p.codigoBarras === codigo)

          if (productoEncontrado) {
            agregarAlCarrito(productoEncontrado)
            // Feedback visual o auditivo opcional
          } else {
            console.log(`Producto con código ${codigo} no encontrado`)
          }
          // Limpiar buffer
          codigoBarrasBuffer.current = ''
        }
      } else if (e.key.length === 1) {
        // Es un caracter imprimible, agregarlo al buffer
        // Resetear buffer si pasó mucho tiempo desde la última tecla (evitar basura de tecleo lento accidental)
        const ahora = Date.now()
        if (ahora - tiempoUltimaTecla.current > 100) { // 100ms threshold común para lectores
          if (codigoBarrasBuffer.current.length > 0) {
            // Si pasó mucho tiempo, asumimos que es una nueva entrada manual o error, reseteamos salvo que sea muy corto
            // Pero para lectores, todo llega muy rápido.
            // Mejor estrategia para mezcla manual/lector:
            // Simplemente acumular. El usuario borrará si se equivoca, pero aquí no hay UI visible del buffer.
            // Reseteamos si pasaron 2 segundos para evitar acumular teclas de hace horas.
            if (ahora - tiempoUltimaTecla.current > 2000) {
              codigoBarrasBuffer.current = ''
            }
          }
        }
        codigoBarrasBuffer.current += e.key
        tiempoUltimaTecla.current = ahora
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [productos, categorias])

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

  // Listener para lector de código de barras (teclado)
  useEffect(() => {
    if (vista !== 'venta') return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignorar si el foco está en un input (para no interferir con escritura manual)
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return
      }

      // Si es Enter, intentamos procesar el código acumulado
      if (e.key === 'Enter') {
        const codigo = codigoBarrasBuffer.current.trim()
        if (codigo.length > 0) {
          // Buscar producto por ID o código de barras
          // Normalizar código si es necesario
          const codigoLimpio = codigo.toUpperCase()
          const productoEncontrado = productos.find(p =>
            p.id === codigo ||
            p.codigoBarras === codigo ||
            p.id.toUpperCase() === codigoLimpio
          )

          // SIEMPRE llenar el filtro para feedback visual, exista o no el producto
          setFiltro(codigo)

          if (productoEncontrado) {
            agregarAlCarrito(productoEncontrado)
          } else {
            console.log(`Producto con código ${codigo} no encontrado`)
          }
          // Limpiar buffer
          codigoBarrasBuffer.current = ''
        }
      } else if (e.key.length === 1) {
        // Es un caracter imprimible, agregarlo al buffer
        const ahora = Date.now()
        // Resetear si pasó mucho tiempo (estrategia para diferenciar tecleo manual vs scanner)
        if (ahora - tiempoUltimaTecla.current > 100) {
          if (ahora - tiempoUltimaTecla.current > 2000) {
            codigoBarrasBuffer.current = ''
          }
        }
        codigoBarrasBuffer.current += e.key
        tiempoUltimaTecla.current = ahora
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [productos, categorias, vista])

  if (vista === 'inventario') {
    return (
      <Inventario
        productos={productos}
        onVolver={() => setVista('venta')}
        onAjustarStock={handleAjustarStock}
      />
    )
  }

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
        categorias={categorias}
        onConfigSaved={handleConfigSaved}
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

  // Función para sincronizar datos manualmente con la nube
  // Función centralizada para sincronizar


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
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {/* Botón Menú Hamburguesa */}
            {/* Botón Menú Hamburguesa */}
            <button
              className="btn-menu-hamburger"
              onClick={() => setMenuAbierto(true)}
              title="Abrir menú de navegación"
            >
              <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>☰</span>
              <span>MENÚ</span>
            </button>
            <div>
              <h1>MINIMARKET COOL MARKET</h1>
              <p className="subtitle">Punto de Venta</p>
            </div>
          </div>

          <div className="header-buttons">
            {/* Botón de Sincronización (siempre visible) */}
            <button
              className="btn-registro-ventas"
              style={{ backgroundColor: '#2196F3', marginRight: '10px' }}
              onClick={() => ejecutarSincronizacion(false)}
              title="Sube tu stock actual a la nube para no perder datos"
            >
              ☁️ Guardando
            </button>

            {mostrarNotificacionVencimientos && (productosVencidos.length > 0 || productosProximosAVencer.length > 0) && (
              <button
                className="btn-vencimientos-alerta"
                onClick={() => {
                  setVista('vencimientos')
                  setMostrarNotificacionVencimientos(false)
                }}
                title={`${productosVencidos.length} productos vencidos, ${productosProximosAVencer.length} próximos a vencer`}
              >
                ⚠️ ({productosVencidos.length + productosProximosAVencer.length})
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Sidebar / Panel Deslizante */}
      <div
        className={`sidebar-overlay ${menuAbierto ? 'open' : ''}`}
        onClick={() => setMenuAbierto(false)}
        style={{
          position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
          background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          visibility: menuAbierto ? 'visible' : 'hidden',
          opacity: menuAbierto ? 1 : 0, transition: '0.3s'
        }}
      >
        <div
          className="sidebar-content"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 0, left: 0, width: '280px', height: '100%',
            background: 'white', padding: '2rem 1rem', display: 'flex', flexDirection: 'column', gap: '1rem',
            transform: menuAbierto ? 'translateX(0)' : 'translateX(-100%)', transition: '0.3s',
            boxShadow: '2px 0 10px rgba(0,0,0,0.1)'
          }}
        >
          <h2 style={{ marginTop: 0, color: '#1a1a1a', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>Menú</h2>

          <button className="btn-menu-item" onClick={() => { setVista('venta'); setMenuAbierto(false); }}>
            🛒 Venta
          </button>
          <button className="btn-menu-item" onClick={() => { setVista('registroVentas'); setMenuAbierto(false); }}>
            📋 Registro de Ventas
          </button>
          <button className="btn-menu-item" onClick={() => { setVista('inventario'); setMenuAbierto(false); }}>
            📝 Inventario Diario
          </button>
          <button className="btn-menu-item" onClick={() => { setVista('reportes'); setMenuAbierto(false); }}>
            📊 Reportes
          </button>
          <button className="btn-menu-item" onClick={() => { setVista('almacen'); setMenuAbierto(false); }}>
            📦 Almacén
          </button>
          <button className="btn-menu-item" onClick={() => { setVista('configuracion'); setMenuAbierto(false); }}>
            ⚙️ Configuración
          </button>

          <button
            onClick={() => setMenuAbierto(false)}
            style={{ marginTop: 'auto', background: '#f5f5f5', border: 'none', padding: '1rem', cursor: 'pointer', borderRadius: '8px' }}
          >
            Cerrar Menú
          </button>
        </div>
      </div>

      <div className="main-container">
        <div className="productos-section">
          <h2>Productos</h2>
          <ProductosGrid
            productos={productos}
            categorias={categorias}
            onAgregar={agregarAlCarrito}
            filtro={filtro}
            setFiltro={setFiltro}
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

