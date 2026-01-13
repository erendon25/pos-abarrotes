import { Producto, Categoria, Usuario, ConfiguracionEmpresa } from '../types'

export const STORAGE_KEYS = {
  productos: 'pos_productos',
  categorias: 'pos_categorias',
  carrito: 'pos_carrito',
  ventas: 'pos_ventas',
  ingresos: 'pos_ingresos_mercaderia',
  movimientos: 'pos_movimientos_inventario',
  usuarios: 'pos_usuarios',
  empresa: 'pos_empresa',
  ticketPrefijo: 'pos_ticket_prefijo',
  ticketNumero: 'pos_ticket_numero',
  boletaPrefijo: 'pos_boleta_prefijo',
  boletaNumero: 'pos_boleta_numero',
  porcentajeBoleta: 'pos_porcentaje_boleta',
  porcentajeTarjeta: 'pos_porcentaje_tarjeta',
  proveedoresFrecuentes: 'pos_proveedores_frecuentes',
} as const

export type RespaldoPOSv1 = {
  version: 1
  exportedAt: string
  app: 'pos-abarrotes'
  data: {
    productos?: Producto[]
    categorias?: Categoria[]
    ventas?: any[]
    ingresos?: any[]
    movimientos?: any[]
    usuarios?: Usuario[]
    empresa?: ConfiguracionEmpresa
    numeracion?: {
      ticketPrefijo?: string
      ticketNumero?: string
      boletaPrefijo?: string
      boletaNumero?: string
    }
    porcentajes?: {
      boleta?: string
      tarjeta?: string
    }
    proveedoresFrecuentes?: any[]
  }
}

function safeParseJSON<T>(value: string | null, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

function asArray<T>(value: any): T[] {
  if (!value) return []
  return Array.isArray(value) ? value : []
}

function indexById<T extends { id: string }>(arr: T[]): Map<string, T> {
  const map = new Map<string, T>()
  arr.forEach((item) => {
    if (item && typeof item.id === 'string' && item.id) map.set(item.id, item)
  })
  return map
}

function toNumber(value: any, fallback = 0): number {
  const n = typeof value === 'number' ? value : parseFloat(String(value))
  return Number.isFinite(n) ? n : fallback
}

function normalizarNombreProveedor(nombre: string): string {
  return nombre.trim()
}

export function crearRespaldoDesdeLocalStorage(): RespaldoPOSv1 {
  const productos = safeParseJSON<Producto[]>(localStorage.getItem(STORAGE_KEYS.productos), [])
  const categorias = safeParseJSON<Categoria[]>(localStorage.getItem(STORAGE_KEYS.categorias), [])
  const ventas = safeParseJSON<any[]>(localStorage.getItem(STORAGE_KEYS.ventas), [])
  const ingresos = safeParseJSON<any[]>(localStorage.getItem(STORAGE_KEYS.ingresos), [])
  const movimientos = safeParseJSON<any[]>(localStorage.getItem(STORAGE_KEYS.movimientos), [])
  const usuarios = safeParseJSON<Usuario[]>(localStorage.getItem(STORAGE_KEYS.usuarios), [])
  const empresa = safeParseJSON<ConfiguracionEmpresa | null>(
    localStorage.getItem(STORAGE_KEYS.empresa),
    null
  )
  const proveedoresFrecuentes = safeParseJSON<any[]>(
    localStorage.getItem(STORAGE_KEYS.proveedoresFrecuentes),
    []
  )

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    app: 'pos-abarrotes',
    data: {
      productos,
      categorias,
      ventas,
      ingresos,
      movimientos,
      usuarios,
      empresa: empresa || undefined,
      numeracion: {
        ticketPrefijo: localStorage.getItem(STORAGE_KEYS.ticketPrefijo) || undefined,
        ticketNumero: localStorage.getItem(STORAGE_KEYS.ticketNumero) || undefined,
        boletaPrefijo: localStorage.getItem(STORAGE_KEYS.boletaPrefijo) || undefined,
        boletaNumero: localStorage.getItem(STORAGE_KEYS.boletaNumero) || undefined,
      },
      porcentajes: {
        boleta: localStorage.getItem(STORAGE_KEYS.porcentajeBoleta) || undefined,
        tarjeta: localStorage.getItem(STORAGE_KEYS.porcentajeTarjeta) || undefined,
      },
      proveedoresFrecuentes,
    },
  }
}

type MergeResult = {
  nuevos: {
    productos: number
    categorias: number
    ventas: number
    ingresos: number
    movimientos: number
  }
  stockActualizado: boolean
}

function aplicarIngresoAProducto(producto: Producto, itemIngreso: any): Producto {
  const cantidad = toNumber(itemIngreso?.cantidad, 0)
  const fechaVencimiento = itemIngreso?.fechaVencimiento ? new Date(itemIngreso.fechaVencimiento) : undefined

  // Producto cerrado
  if (producto.esCerrado && producto.unidadesPorCaja) {
    const cajas = itemIngreso?.cantidadCajas !== undefined ? toNumber(itemIngreso.cantidadCajas, 0) : undefined
    const unidades = itemIngreso?.cantidadUnidades !== undefined ? toNumber(itemIngreso.cantidadUnidades, 0) : undefined

    const stockCaja = Math.max(0, (producto.stockCaja || 0) + (cajas || 0))
    const stockUnidad = Math.max(0, (producto.stockUnidad || 0) + (unidades || 0))
    const stock = (stockCaja * producto.unidadesPorCaja) + stockUnidad

    return {
      ...producto,
      stock,
      stockCaja,
      stockUnidad,
      fechaVencimiento: fechaVencimiento || producto.fechaVencimiento,
    }
  }

  // Producto normal
  return {
    ...producto,
    stock: Math.max(0, (producto.stock || 0) + cantidad),
    fechaVencimiento: fechaVencimiento || producto.fechaVencimiento,
  }
}

function aplicarVentaAProducto(producto: Producto, itemVenta: any): Producto {
  const cantidad = toNumber(itemVenta?.cantidad, 0)

  if (producto.esCerrado && producto.unidadesPorCaja && producto.stockCaja !== undefined && producto.stockUnidad !== undefined) {
    let stockCaja = producto.stockCaja || 0
    let stockUnidad = producto.stockUnidad || 0

    // Si se vendió en unidades, restar unidades; si se vendió en cajas, convertir a unidades
    let unidadesARestar = itemVenta?.vendidoEnUnidades
      ? cantidad
      : cantidad * (producto.unidadesPorCaja || 1)

    while (unidadesARestar > 0) {
      if (stockUnidad >= unidadesARestar) {
        stockUnidad -= unidadesARestar
        unidadesARestar = 0
      } else {
        if (stockCaja > 0) {
          stockCaja -= 1
          stockUnidad += (producto.unidadesPorCaja || 0) - unidadesARestar
          unidadesARestar = 0
        } else {
          unidadesARestar -= stockUnidad
          stockUnidad = 0
        }
      }
    }

    const stock = (Math.max(0, stockCaja) * (producto.unidadesPorCaja || 0)) + Math.max(0, stockUnidad)
    return { ...producto, stock: Math.max(0, stock), stockCaja: Math.max(0, stockCaja), stockUnidad: Math.max(0, stockUnidad) }
  }

  // Producto normal
  return { ...producto, stock: Math.max(0, (producto.stock || 0) - cantidad) }
}

export function aplicarRespaldoMergeEnLocalStorage(respaldoRaw: any): MergeResult {
  // Validación mínima
  const respaldo: RespaldoPOSv1 = respaldoRaw
  if (!respaldo || respaldo.version !== 1 || respaldo.app !== 'pos-abarrotes') {
    throw new Error('Archivo de respaldo inválido o de otra versión.')
  }

  const data = respaldo.data || ({} as any)

  const productosExist = safeParseJSON<Producto[]>(localStorage.getItem(STORAGE_KEYS.productos), [])
  const categoriasExist = safeParseJSON<Categoria[]>(localStorage.getItem(STORAGE_KEYS.categorias), [])
  const ventasExist = safeParseJSON<any[]>(localStorage.getItem(STORAGE_KEYS.ventas), [])
  const ingresosExist = safeParseJSON<any[]>(localStorage.getItem(STORAGE_KEYS.ingresos), [])
  const movimientosExist = safeParseJSON<any[]>(localStorage.getItem(STORAGE_KEYS.movimientos), [])

  const productosImp = asArray<Producto>(data.productos)
  const categoriasImp = asArray<Categoria>(data.categorias)
  const ventasImp = asArray<any>(data.ventas)
  const ingresosImp = asArray<any>(data.ingresos)
  const movimientosImp = asArray<any>(data.movimientos)

  const productosMap = indexById(productosExist)
  const categoriasSet = new Set(categoriasExist.map(c => c.nombre))
  const ventasMap = new Map<string, any>(ventasExist.filter(v => v?.id).map(v => [String(v.id), v]))
  const ingresosMap = new Map<string, any>(ingresosExist.filter(i => i?.id).map(i => [String(i.id), i]))
  const movimientosMap = new Map<string, any>(movimientosExist.filter(m => m?.id).map(m => [String(m.id), m]))

  let nuevosProductos = 0
  let nuevasCategorias = 0
  let nuevasVentas = 0
  let nuevosIngresos = 0
  let nuevosMovimientos = 0

  // 1) Asegurar productos (para que ventas/ingresos importados puedan ajustar stock)
  productosImp.forEach((p) => {
    if (!p?.id) return
    if (!productosMap.has(p.id)) {
      productosMap.set(p.id, p)
      nuevosProductos++
    }
  })

  // 2) Categorías (solo agregar si no existen por nombre)
  categoriasImp.forEach((c) => {
    if (!c?.nombre) return
    if (!categoriasSet.has(c.nombre)) {
      categoriasExist.push(c)
      categoriasSet.add(c.nombre)
      nuevasCategorias++
    }
  })

  // 3) Determinar nuevas ventas e ingresos (para ajustar stock sin duplicar)
  const ventasNuevas: any[] = []
  ventasImp.forEach((v) => {
    if (!v?.id) return
    if (!ventasMap.has(String(v.id))) {
      ventasMap.set(String(v.id), v)
      ventasNuevas.push(v)
      nuevasVentas++
    }
  })

  const ingresosNuevos: any[] = []
  ingresosImp.forEach((i) => {
    if (!i?.id) return
    if (!ingresosMap.has(String(i.id))) {
      ingresosMap.set(String(i.id), i)
      ingresosNuevos.push(i)
      nuevosIngresos++
    }
  })

  // 4) Movimientos: merge por id (sin reemplazar existentes)
  movimientosImp.forEach((m) => {
    if (!m?.id) return
    if (!movimientosMap.has(String(m.id))) {
      movimientosMap.set(String(m.id), m)
      nuevosMovimientos++
    }
  })

  // 5) Ajustar stock SOLO con lo nuevo importado (ventas + ingresos + mermas/ajustes)
  let stockActualizado = false
  const productosArr = Array.from(productosMap.values())
  const productosById = new Map<string, Producto>(productosArr.map(p => [p.id, p]))

  // Ingresos nuevos
  ingresosNuevos.forEach((ing) => {
    const items = asArray<any>(ing?.items)
    items.forEach((it) => {
      const pid = String(it?.productoId || '')
      if (!pid) return
      const prod = productosById.get(pid)
      if (!prod) return
      const actualizado = aplicarIngresoAProducto(prod, it)
      productosById.set(pid, actualizado)
      stockActualizado = true
    })
  })

  // Ventas nuevas
  ventasNuevas.forEach((venta) => {
    const items = asArray<any>(venta?.items)
    items.forEach((it) => {
      const pid = String(it?.producto?.id || it?.productoId || '')
      if (!pid) return
      const prod = productosById.get(pid)
      if (!prod) return
      const actualizado = aplicarVentaAProducto(prod, it)
      productosById.set(pid, actualizado)
      stockActualizado = true
    })
  })

  // Movimientos nuevos de merma/ajuste (por si se usan en el teléfono)
  movimientosImp.forEach((mov) => {
    if (!mov?.id) return
    if (!movimientosExist.find(m => String(m.id) === String(mov.id))) return // solo los que son nuevos
  })
  const movimientosNuevosSolo: any[] = movimientosImp.filter(m => m?.id && !movimientosExist.some(e => String(e.id) === String(m.id)))
  movimientosNuevosSolo.forEach((mov) => {
    const tipo = String(mov?.tipo || '')
    if (tipo !== 'merma' && tipo !== 'ajuste') return
    const pid = String(mov?.productoId || '')
    if (!pid) return
    const prod = productosById.get(pid)
    if (!prod) return
    const delta = toNumber(mov?.cantidad, 0)
    // Ajuste simple (en unidades)
    const nuevoStock = Math.max(0, (prod.stock || 0) + delta)
    productosById.set(pid, { ...prod, stock: nuevoStock })
    stockActualizado = true
  })

  // Guardar productos actualizados
  const productosFinal = Array.from(productosById.values())
  localStorage.setItem(STORAGE_KEYS.productos, JSON.stringify(productosFinal))
  localStorage.setItem(STORAGE_KEYS.categorias, JSON.stringify(categoriasExist))
  localStorage.setItem(STORAGE_KEYS.ventas, JSON.stringify(Array.from(ventasMap.values())))
  localStorage.setItem(STORAGE_KEYS.ingresos, JSON.stringify(Array.from(ingresosMap.values())))
  localStorage.setItem(STORAGE_KEYS.movimientos, JSON.stringify(Array.from(movimientosMap.values())))

  // Usuarios/empresa: solo completar si faltan (no reemplazar)
  const usuariosExist = safeParseJSON<Usuario[]>(localStorage.getItem(STORAGE_KEYS.usuarios), [])
  if (usuariosExist.length === 0 && Array.isArray(data.usuarios) && data.usuarios.length > 0) {
    localStorage.setItem(STORAGE_KEYS.usuarios, JSON.stringify(data.usuarios))
  }
  const empresaExist = localStorage.getItem(STORAGE_KEYS.empresa)
  if (!empresaExist && data.empresa) {
    localStorage.setItem(STORAGE_KEYS.empresa, JSON.stringify(data.empresa))
  }

  // Numeración: tomar el mayor para evitar duplicados
  const ticketNumImp = toNumber(data?.numeracion?.ticketNumero, 0)
  const ticketNumCur = toNumber(localStorage.getItem(STORAGE_KEYS.ticketNumero), 0)
  const boletaNumImp = toNumber(data?.numeracion?.boletaNumero, 0)
  const boletaNumCur = toNumber(localStorage.getItem(STORAGE_KEYS.boletaNumero), 0)
  if (ticketNumImp > ticketNumCur) localStorage.setItem(STORAGE_KEYS.ticketNumero, String(ticketNumImp))
  if (boletaNumImp > boletaNumCur) localStorage.setItem(STORAGE_KEYS.boletaNumero, String(boletaNumImp))
  if (!localStorage.getItem(STORAGE_KEYS.ticketPrefijo) && data?.numeracion?.ticketPrefijo) {
    localStorage.setItem(STORAGE_KEYS.ticketPrefijo, String(data.numeracion.ticketPrefijo))
  }
  if (!localStorage.getItem(STORAGE_KEYS.boletaPrefijo) && data?.numeracion?.boletaPrefijo) {
    localStorage.setItem(STORAGE_KEYS.boletaPrefijo, String(data.numeracion.boletaPrefijo))
  }

  // Porcentajes: no reemplazar si ya existen
  if (!localStorage.getItem(STORAGE_KEYS.porcentajeBoleta) && data?.porcentajes?.boleta) {
    localStorage.setItem(STORAGE_KEYS.porcentajeBoleta, String(data.porcentajes.boleta))
  }
  if (!localStorage.getItem(STORAGE_KEYS.porcentajeTarjeta) && data?.porcentajes?.tarjeta) {
    localStorage.setItem(STORAGE_KEYS.porcentajeTarjeta, String(data.porcentajes.tarjeta))
  }

  // Proveedores frecuentes: merge por nombre (sumando conteos)
  if (Array.isArray(data.proveedoresFrecuentes) && data.proveedoresFrecuentes.length > 0) {
    const cur = safeParseJSON<any[]>(localStorage.getItem(STORAGE_KEYS.proveedoresFrecuentes), [])
    const map = new Map<string, any>()
    cur.forEach((p) => {
      const nombre = normalizarNombreProveedor(String(p?.nombre || ''))
      if (!nombre) return
      map.set(nombre.toLowerCase(), { ...p, nombre })
    })
    data.proveedoresFrecuentes.forEach((p) => {
      const nombre = normalizarNombreProveedor(String(p?.nombre || ''))
      if (!nombre) return
      const key = nombre.toLowerCase()
      const prev = map.get(key)
      if (!prev) {
        map.set(key, { ...p, nombre })
      } else {
        map.set(key, {
          ...prev,
          conteo: toNumber(prev.conteo, 0) + toNumber(p?.conteo, 0),
          ultima: String(p?.ultima || prev.ultima || new Date().toISOString()),
        })
      }
    })
    localStorage.setItem(STORAGE_KEYS.proveedoresFrecuentes, JSON.stringify(Array.from(map.values())))
  }

  return {
    nuevos: {
      productos: nuevosProductos,
      categorias: nuevasCategorias,
      ventas: nuevasVentas,
      ingresos: nuevosIngresos,
      movimientos: nuevosMovimientos,
    },
    stockActualizado,
  }
}



