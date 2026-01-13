export interface Usuario {
  id: string
  nombre: string
}

export interface Producto {
  id: string
  nombre: string
  marca?: string // Marca del producto (ej: "Gloria", "Primor")
  presentacion?: string // Presentación/tamaño (ej: "1kg", "500g", "Lata 400g")
  precio: number // Precio base
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
}

export interface ItemCarrito {
  producto: Producto
  cantidad: number
  subcategoriaSeleccionada?: string // Subcategoría seleccionada para este item
  vendidoEnUnidades?: boolean // true si se vendió en unidades (para productos cerrados/abiertos)
}

export interface MetodoPago {
  tipo: 'efectivo' | 'yape' | 'tarjeta'
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
}
