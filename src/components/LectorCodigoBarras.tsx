import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface LectorCodigoBarrasProps {
    onScan: (codigo: string) => void
    onError?: (error: string) => void
}

export default function LectorCodigoBarras({
    onScan,
    onError
}: LectorCodigoBarrasProps) {
    const [escaneando, setEscaneando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const html5QrcodeRef = useRef<Html5Qrcode | null>(null)
    const containerRef = useRef<HTMLDivElement>(null)

    // Cleanup al desmontar
    useEffect(() => {
        return () => {
            if (html5QrcodeRef.current) {
                html5QrcodeRef.current.stop().catch(() => { })
            }
        }
    }, [])

    const iniciarEscaner = async () => {
        setEscaneando(true)
        setError(null)

        // Esperar a que el DOM se actualice
        await new Promise(resolve => setTimeout(resolve, 100))

        try {
            const html5Qrcode = new Html5Qrcode("barcode-reader")
            html5QrcodeRef.current = html5Qrcode

            // Obtener cámaras disponibles
            const devices = await Html5Qrcode.getCameras()

            if (devices && devices.length > 0) {
                // Preferir cámara trasera
                const camaraTrasera = devices.find(d =>
                    d.label.toLowerCase().includes('back') ||
                    d.label.toLowerCase().includes('rear') ||
                    d.label.toLowerCase().includes('trasera') ||
                    d.label.toLowerCase().includes('environment')
                )
                const camaraId = camaraTrasera?.id || devices[devices.length - 1].id

                await html5Qrcode.start(
                    camaraId,
                    {
                        fps: 10,
                        qrbox: { width: 280, height: 150 } // Rectangular para códigos de barras
                    },
                    (decodedText) => {
                        console.log("Código detectado:", decodedText)
                        // Detener escáner y llamar callback
                        detenerEscaner()
                        onScan(decodedText)
                    },
                    () => {
                        // Ignorar errores de frame sin código
                    }
                )
            } else {
                throw new Error("No se encontraron cámaras disponibles")
            }
        } catch (err: unknown) {
            console.error("Error al iniciar escáner:", err)
            const errorMsg = err instanceof Error ? err.message : "Error al acceder a la cámara"
            setError(errorMsg)
            if (onError) onError(errorMsg)
            setEscaneando(false)
        }
    }

    const detenerEscaner = async () => {
        if (html5QrcodeRef.current) {
            try {
                await html5QrcodeRef.current.stop()
                html5QrcodeRef.current = null
            } catch (err) {
                console.error("Error al detener scanner:", err)
            }
        }
        setEscaneando(false)
    }

    return (
        <div className="lector-codigo-container" ref={containerRef}>
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
                    background: 'rgba(0,0,0,0.95)',
                    zIndex: 3000,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        color: 'white',
                        marginBottom: '15px',
                        fontSize: '1.2rem',
                        textAlign: 'center'
                    }}>
                        📷 Apunta al código de barras
                    </div>

                    <div
                        id="barcode-reader"
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            background: 'white',
                            borderRadius: '12px',
                            overflow: 'hidden'
                        }}
                    />

                    {error && (
                        <div style={{
                            color: '#ef4444',
                            marginTop: '15px',
                            padding: '10px',
                            background: 'rgba(255,255,255,0.1)',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        onClick={detenerEscaner}
                        style={{
                            marginTop: '20px',
                            padding: '12px 30px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '1.1rem',
                            cursor: 'pointer',
                            fontWeight: 'bold'
                        }}
                    >
                        ✖ Cancelar
                    </button>
                </div>
            )}
        </div>
    )
}
