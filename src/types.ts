export interface Producto {
  id: string
  nombre: string
  precio: number // Precio base
  preciosPorSubcategoria?: Record<string, number> // Precios por subcategoría
  categoria: string
  subcategoria?: string
  stock: number
  codigoBarras?: string // Código de barras del producto
}

export interface ItemCarrito {
  producto: Producto
  cantidad: number
  subcategoriaSeleccionada?: string // Subcategoría seleccionada para este item
}

export interface MetodoPago {
  tipo: 'efectivo' | 'yape' | 'tarjeta'
  monto: number
}

export interface Factura {
  requiereFactura: boolean
  ruc?: string
  razonSocial?: string
  porcentajeAdicional?: number
}

export interface Venta {
  id: string
  fecha: Date
  items: ItemCarrito[]
  total: number
  metodosPago: MetodoPago[]
  vuelto?: number
  factura?: Factura
  porcentajeTarjeta?: number
  numeroBoleta?: string
  numeroFactura?: string
}

export interface Categoria {
  nombre: string
  subcategorias: string[]
}
