export interface Usuario {
  id: string
  nombre: string
  usuario: string // Login username
  password?: string
  rol: 'admin' | 'venta' | 'almacen'
  permisos: {
    // Módulos
    ventas: boolean
    reportes: boolean
    catalogo: boolean
    categorias: boolean
    ingresos: boolean
    usuarios: boolean
    configuracion: boolean
    inventario: boolean

    // Acciones Específicas
    ventas_anular: boolean // Puede anular ventas propias o de otros? General anular.
    ventas_anular_sin_clave: boolean // Si falso, pide clave de admin

    catalogo_crear: boolean
    catalogo_editar: boolean
    catalogo_eliminar: boolean
    catalogo_editar_stock: boolean // Solo Almacén (y Admin?)
    catalogo_editar_precio: boolean // Almacén y Admin

    inventario_realizar: boolean // Puede hacer ajustes
  }
}

export interface Producto {
  id: string
  nombre: string
  marca?: string // Marca del producto (ej: "Gloria", "Primor")
  presentacion?: string // Presentación/tamaño (ej: "1kg", "500g", "Lata 400g")
  precio: number // Precio base
  costo?: number // Costo de compra
  activo?: boolean // Estado del producto
  preciosPorSubcategoria?: Record<string, number> // Precios por subcategoría
  categoria: string
  subcategoria?: string
  stock: number // Stock total en unidades (calculado automáticamente si tiene cajas/unidades)
  codigoBarras?: string // Código de barras del producto
  fechaVencimiento?: Date // Fecha de vencimiento del producto
  // Para productos cerrados/abiertos (ej: cigarros)
  esCerrado?: boolean // true si el producto se vende en caja y unidades
  unidadesPorCaja?: number // Número de unidades por caja (ej: 20)
  stockCaja?: number // Stock en cajas cerradas
  stockUnidad?: number // Stock en unidades sueltas
  precioUnidad?: number // Precio por unidad (si es diferente al precio base)
  sincronizado?: boolean // true si ya está en la nube, false si hay cambios pendientes
}

export interface ItemCarrito {
  producto: Producto
  cantidad: number
  subcategoriaSeleccionada?: string // Subcategoría seleccionada para este item
  vendidoEnUnidades?: boolean // true si se vendió en unidades (para productos cerrados/abiertos)
}

export interface MetodoPago {
  tipo: 'efectivo' | 'yape' | 'tarjeta' | 'credito'
  monto: number
}

export interface Venta {
  id: string
  fecha: Date
  items: ItemCarrito[]
  total: number
  metodosPago: MetodoPago[]
  vuelto?: number
  porcentajeTarjeta?: number
  usuario?: Usuario // Usuario que realizó la venta
  tipoComprobante: 'ticket' | 'boleta' // Tipo de comprobante
  numeroTicket?: string
  numeroBoleta?: string
  requiereBoleta?: boolean // true si se solicitó boleta (cobra comisión)
  porcentajeBoleta?: number // Porcentaje adicional por boleta
  reimpresiones: number // Número de veces que se reimprimió
  anulada: boolean // true si la venta fue anulada

  // Para Créditos
  clienteId?: string // Si es venta a crédito o asociada a cliente
  estadoPago?: 'pagado' | 'pendiente' // Pendiente si hay monto en crédito no pagado
  montoPendiente?: number
}

export interface Categoria {
  nombre: string
  subcategorias: string[]
}

export interface ConfiguracionEmpresa {
  nombre: string
  ruc: string
  direccion: string
  telefono: string
}

// Tipo de documento del proveedor
export type TipoDocumentoProveedor = 'boleta' | 'factura' | 'guia'

// Ingreso de mercadería desde proveedor
export interface IngresoMercaderia {
  id: string
  fecha: Date
  proveedor: string // Nombre del proveedor
  tipoDocumento: TipoDocumentoProveedor // boleta, factura o guía
  numeroDocumento: string // Número de boleta/factura/guía
  items: {
    productoId: string
    productoNombre: string
    cantidad: number
    precioCompra: number // Precio al que se compró
    fechaVencimiento?: Date // Fecha de vencimiento del lote
    // Para productos cerrados
    cantidadCajas?: number
    cantidadUnidades?: number
  }[]
  usuario?: Usuario // Usuario que registró el ingreso
}

// Tipo de movimiento de inventario
export type TipoMovimiento = 'ingreso' | 'venta' | 'merma' | 'ajuste'

// Movimiento de inventario
export interface MovimientoInventario {
  id: string
  fecha: Date
  tipo: TipoMovimiento // ingreso, venta, merma, ajuste
  productoId: string
  productoNombre: string
  cantidad: number // Cantidad positiva para ingresos, negativa para salidas
  cantidadAnterior: number // Stock anterior
  cantidadNueva: number // Stock nuevo
  motivo?: string // Motivo del movimiento (especialmente para mermas)
  referencia?: string // Referencia (número de venta, ingreso, etc.)
  usuario?: Usuario // Usuario que realizó el movimiento
  // Para productos cerrados
  cantidadCajas?: number
  cantidadUnidades?: number
  costoUnitario?: number // Costo del producto al momento del movimiento
  precioUnitario?: number // Precio del producto al momento del movimiento
}

// Clientes
export interface Cliente {
  id: string
  nombre: string
  telefono?: string
  deudaActual: number // Monto total que debe
}

// Cuentas por Cobrar (Historial de pagos o deudas?)
// Realmente la 'Venta' con metodoPago 'credito' es la deuda.
// Pero necesitamos registrar los pagos a esas deudas.

export interface PagoDeuda {
  id: string
  clienteId: string
  fecha: Date
  monto: number
  metodoPago: 'efectivo' | 'yape' | 'tarjeta'
  usuarioId?: string
}


