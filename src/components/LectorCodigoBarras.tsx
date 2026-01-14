
import { useEffect, useRef, useState } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface LectorCodigoBarrasProps {
    onScan: (codigo: string) => void
    onError?: (error: any) => void
    ancho?: number
    altura?: number
    cerrarAlEscanear?: boolean
}

export default function LectorCodigoBarras({
    onScan,
    cerrarAlEscanear = true
}: LectorCodigoBarrasProps) {
    const [escaneando, setEscaneando] = useState(false)
    const scannerRef = useRef<Html5QrcodeScanner | null>(null)
    // const [permisoCamara, setPermisoCamara] = useState<boolean | null>(null)

    useEffect(() => {
        // Verificar permisos inicialmente puede ser útil para UI futura
        // navigator.mediaDevices.getUserMedia({ video: true })
        //   .then(() => setPermisoCamara(true))
        //   .catch(() => setPermisoCamara(false))

        return () => {
            if (scannerRef.current) {
                scannerRef.current.clear().catch(console.error)
            }
        }
    }, [])

    const iniciarEscaner = () => {
        setEscaneando(true)
        // Pequeño delay para asegurar que el div exista
        setTimeout(() => {
            if (!scannerRef.current) {
                const scanner = new Html5QrcodeScanner(
                    "reader",
                    {
                        fps: 10,
                        qrbox: { width: 250, height: 250 },
                        aspectRatio: 1.0,
                        showTorchButtonIfSupported: true
                    },
          /* verbose= */ false
                )

                scanner.render(
                    (decodedText) => {
                        console.log("Código detectado:", decodedText)
                        onScan(decodedText)
                        if (cerrarAlEscanear) {
                            detenerEscaner()
                        }
                    },
                    () => {
                        // Ignorar errores de "no code detected" para no spammear
                        // if (onError) onError(errorMessage)
                    }
                )
                scannerRef.current = scanner
            }
        }, 100)
    }

    const detenerEscaner = () => {
        if (scannerRef.current) {
            scannerRef.current.clear()
                .then(() => {
                    setEscaneando(false)
                    scannerRef.current = null
                })
                .catch((err) => {
                    console.error("Error al detener scanner", err)
                    setEscaneando(false)
                })
        } else {
            setEscaneando(false)
        }
    }

    return (
        <div className="lector-codigo-container">
            {!escaneando ? (
                <button
                    className="btn-escanear-camara"
                    onClick={iniciarEscaner}
                    title="Escanear con cámara"
                    style={{
                        background: '#2563eb',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        padding: 0
                    }}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                        <circle cx="12" cy="13" r="4"></circle>
                    </svg>
                </button>
            ) : (
                <div className="scanner-overlay" style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.9)',
                    zIndex: 3000,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div id="reader" style={{ width: '100%', maxWidth: '500px', background: 'white', padding: '10px', borderRadius: '8px' }}></div>
                    <button
                        onClick={detenerEscaner}
                        style={{
                            marginTop: '20px',
                            padding: '10px 20px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar Escaneo
                    </button>
                </div>
            )}
        </div>
    )
}
