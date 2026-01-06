// Utilidades para manejar la numeración de boletas y facturas

const STORAGE_KEY_BOLETA = 'pos_boleta_numero'
const STORAGE_KEY_FACTURA = 'pos_factura_numero'
const STORAGE_KEY_BOLETA_PREFIJO = 'pos_boleta_prefijo'
const STORAGE_KEY_FACTURA_PREFIJO = 'pos_factura_prefijo'

interface Numeracion {
  prefijo: string
  numero: number
}

export function obtenerSiguienteBoleta(): string {
  const numeracion = obtenerNumeracion(STORAGE_KEY_BOLETA, STORAGE_KEY_BOLETA_PREFIJO, 'B')
  const siguiente = incrementarNumeracion(numeracion)
  guardarNumeracion(STORAGE_KEY_BOLETA, STORAGE_KEY_BOLETA_PREFIJO, siguiente)
  return formatearNumero(siguiente)
}

export function obtenerSiguienteFactura(): string {
  const numeracion = obtenerNumeracion(STORAGE_KEY_FACTURA, STORAGE_KEY_FACTURA_PREFIJO, 'F')
  const siguiente = incrementarNumeracion(numeracion)
  guardarNumeracion(STORAGE_KEY_FACTURA, STORAGE_KEY_FACTURA_PREFIJO, siguiente)
  return formatearNumero(siguiente)
}

function obtenerNumeracion(
  keyNumero: string,
  keyPrefijo: string,
  prefijoDefault: string
): Numeracion {
  const numeroStr = localStorage.getItem(keyNumero)
  const prefijoStr = localStorage.getItem(keyPrefijo)
  
  if (numeroStr && prefijoStr) {
    return {
      prefijo: prefijoStr,
      numero: parseInt(numeroStr, 10)
    }
  }
  
  // Inicializar con valores por defecto
  return {
    prefijo: prefijoDefault + '001',
    numero: 0
  }
}

function incrementarNumeracion(numeracion: Numeracion): Numeracion {
  let { prefijo, numero } = numeracion
  
  numero++
  
  // Si llegamos a 99999, incrementar el prefijo y resetear el número
  if (numero > 99999) {
    const prefijoNumero = parseInt(prefijo.substring(1), 10)
    const nuevoPrefijoNumero = prefijoNumero + 1
    prefijo = prefijo[0] + nuevoPrefijoNumero.toString().padStart(3, '0')
    numero = 1
  }
  
  return { prefijo, numero }
}

function guardarNumeracion(
  keyNumero: string,
  keyPrefijo: string,
  numeracion: Numeracion
): void {
  localStorage.setItem(keyNumero, numeracion.numero.toString())
  localStorage.setItem(keyPrefijo, numeracion.prefijo)
}

function formatearNumero(numeracion: Numeracion): string {
  return `${numeracion.prefijo}-${numeracion.numero.toString().padStart(6, '0')}`
}

