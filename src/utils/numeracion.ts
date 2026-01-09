// Utilidades para manejar la numeración de tickets y boletas

const STORAGE_KEY_TICKET = 'pos_ticket_numero'
const STORAGE_KEY_BOLETA = 'pos_boleta_numero'
const STORAGE_KEY_TICKET_PREFIJO = 'pos_ticket_prefijo'
const STORAGE_KEY_BOLETA_PREFIJO = 'pos_boleta_prefijo'

interface Numeracion {
  prefijo: string
  numero: number
}

export function obtenerSiguienteTicket(): string {
  const numeracion = obtenerNumeracion(STORAGE_KEY_TICKET, STORAGE_KEY_TICKET_PREFIJO, 'T')
  const siguiente = incrementarNumeracion(numeracion)
  guardarNumeracion(STORAGE_KEY_TICKET, STORAGE_KEY_TICKET_PREFIJO, siguiente)
  return formatearNumero(siguiente)
}

export function obtenerSiguienteBoleta(): string {
  const numeracion = obtenerNumeracion(STORAGE_KEY_BOLETA, STORAGE_KEY_BOLETA_PREFIJO, 'B')
  const siguiente = incrementarNumeracion(numeracion)
  guardarNumeracion(STORAGE_KEY_BOLETA, STORAGE_KEY_BOLETA_PREFIJO, siguiente)
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
  // Para tickets: prefijo "BOL", para boletas: prefijo "BOL"
  const prefijoInicial = prefijoDefault === 'T' ? 'BOL' : prefijoDefault === 'B' ? 'BOL' : prefijoDefault + '001'
  return {
    prefijo: prefijoInicial,
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
  // Formato: BOL1938 (prefijo + número sin guión)
  return `${numeracion.prefijo}${numeracion.numero.toString().padStart(4, '0')}`
}

