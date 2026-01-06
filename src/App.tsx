import { useState, useEffect, useRef } from 'react'
import { Producto, ItemCarrito, Venta, Categoria, MetodoPago, Factura } from './types'
import ProductosGrid from './components/ProductosGrid'
import Carrito from './components/Carrito'
import Almacen from './components/Almacen'
import Reportes from './components/Reportes'
import Configuracion from './components/Configuracion'
import SelectorSubcategoria from './components/SelectorSubcategoria'
import ModalPago from './components/ModalPago'
import Comprobante from './components/Comprobante'
import { obtenerSiguienteBoleta, obtenerSiguienteFactura } from './utils/numeracion'
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

type Vista = 'venta' | 'almacen' | 'reportes' | 'configuracion'

function App() {
  const [vista, setVista] = useState<Vista>('venta')
  const [productos, setProductos] = useState<Producto[]>(productosIniciales)
  const [categorias, setCategorias] = useState<Categoria[]>(categoriasIniciales)
  const [carrito, setCarrito] = useState<ItemCarrito[]>([])
  const [ventas, setVentas] = useState<Venta[]>([])
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null)
  const [mostrarModalPago, setMostrarModalPago] = useState(false)
  const [ventaComprobante, setVentaComprobante] = useState<Venta | null>(null)
  
  // Referencias para el manejo de códigos de barras
  const codigoBarrasBuffer = useRef('')
  const tiempoUltimaTecla = useRef(0)
  const inputFocused = useRef(false)

  const obtenerPrecio = (item: ItemCarrito) => {
    if (item.subcategoriaSeleccionada && item.producto.preciosPorSubcategoria) {
      return item.producto.preciosPorSubcategoria[item.subcategoriaSeleccionada] || item.producto.precio
    }
    return item.producto.precio
  }

  const agregarAlCarrito = (producto: Producto) => {
    // Validar que el producto tenga stock disponible
    if (producto.stock === 0) {
      alert('Este producto no tiene stock disponible')
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

  const agregarAlCarritoConSubcategoria = (producto: Producto, subcategoria: string | null) => {
    setProductoSeleccionado(null)

    setCarrito((prev: ItemCarrito[]) => {
      const subcategoriaValue = subcategoria || undefined
      const existe = prev.find(item => 
        item.producto.id === producto.id && 
        item.subcategoriaSeleccionada === subcategoriaValue
      )
      
      if (existe) {
        // Validar que no se exceda el stock disponible
        const nuevaCantidad = existe.cantidad + 1
        if (nuevaCantidad > producto.stock) {
          alert(`No hay suficiente stock. Disponible: ${producto.stock}`)
          return prev
        }
        return prev.map(item =>
          item.producto.id === producto.id && item.subcategoriaSeleccionada === subcategoriaValue
            ? { ...item, cantidad: nuevaCantidad }
            : item
        )
      }
      const nuevoItem: ItemCarrito = {
        producto,
        cantidad: 1,
        ...(subcategoriaValue && { subcategoriaSeleccionada: subcategoriaValue })
      }
      return [...prev, nuevoItem]
    })
  }

  const actualizarCantidad = (id: string, cantidad: number, subcategoria?: string) => {
    if (cantidad <= 0) {
      eliminarDelCarrito(id, subcategoria)
      return
    }

    // Validar stock disponible
    const item = carrito.find(i => i.producto.id === id && i.subcategoriaSeleccionada === subcategoria)
    if (item) {
      const producto = productos.find(p => p.id === id)
      if (producto && cantidad > producto.stock) {
        alert(`No hay suficiente stock. Disponible: ${producto.stock}`)
        return
      }
    }

    setCarrito(prev =>
      prev.map(item =>
        item.producto.id === id && item.subcategoriaSeleccionada === subcategoria
          ? { ...item, cantidad }
          : item
      )
    )
  }

  const eliminarDelCarrito = (id: string, subcategoria?: string) => {
    setCarrito(prev => prev.filter(item => 
      !(item.producto.id === id && item.subcategoriaSeleccionada === subcategoria)
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

  const confirmarPago = (metodosPago: MetodoPago[], vuelto: number, factura?: Factura, porcentajeTarjeta?: number) => {
    const subtotal = calcularTotal()
    
    // Calcular total con adicionales
    let total = subtotal
    if (factura && factura.porcentajeAdicional) {
      total += subtotal * (factura.porcentajeAdicional / 100)
    }
    if (porcentajeTarjeta) {
      const totalConFactura = factura && factura.porcentajeAdicional 
        ? subtotal + (subtotal * (factura.porcentajeAdicional / 100))
        : subtotal
      total += totalConFactura * (porcentajeTarjeta / 100)
    }
    
    // Obtener número de comprobante
    const numeroBoleta = factura ? undefined : obtenerSiguienteBoleta()
    const numeroFactura = factura ? obtenerSiguienteFactura() : undefined
    
    // Guardar la venta en el historial
    const nuevaVenta: Venta = {
      id: Date.now().toString(),
      fecha: new Date(),
      items: [...carrito],
      total,
      metodosPago,
      vuelto: vuelto > 0 ? vuelto : undefined,
      factura,
      porcentajeTarjeta,
      numeroBoleta,
      numeroFactura
    }
    setVentas(prev => [...prev, nuevaVenta])
    
    // Mostrar comprobante
    setVentaComprobante(nuevaVenta)
    
    // Restar stock de los productos vendidos
    setProductos(prev => 
      prev.map(producto => {
        const itemsVendidos = carrito.filter(item => item.producto.id === producto.id)
        if (itemsVendidos.length > 0) {
          const cantidadTotal = itemsVendidos.reduce((sum, item) => sum + item.cantidad, 0)
          const nuevoStock = producto.stock - cantidadTotal
          return { ...producto, stock: Math.max(0, nuevoStock) }
        }
        return producto
      })
    )
    
    setCarrito([])
    setMostrarModalPago(false)
  }

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
            <h1>Punto de Venta</h1>
            <p className="subtitle">Tienda de Abarrotes</p>
          </div>
          <div className="header-buttons">
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

