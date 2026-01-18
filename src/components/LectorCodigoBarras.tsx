import { useRef, useState, useCallback, useEffect } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface LectorCodigoBarrasProps {
    onScan: (codigo: string) => void
}

export default function LectorCodigoBarras({ onScan }: LectorCodigoBarrasProps) {
    const [escaneando, setEscaneando] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const html5QrcodeRef = useRef<Html5Qrcode | null>(null)

    useEffect(() => {
        return () => {
            if (html5QrcodeRef.current) {
                html5QrcodeRef.current.stop().catch(() => { })
            }
        }
    }, [])

    const detenerEscaner = useCallback(() => {
        if (html5QrcodeRef.current) {
            html5QrcodeRef.current.stop().then(() => {
                html5QrcodeRef.current = null
                setEscaneando(false)
            }).catch(() => {
                html5QrcodeRef.current = null
                setEscaneando(false)
            })
        } else {
            setEscaneando(false)
        }
    }, [])

    const iniciarEscaner = async () => {
        setEscaneando(true)
        setError(null)

        await new Promise(resolve => setTimeout(resolve, 200))

        try {
            const html5Qrcode = new Html5Qrcode("reader-container")
            html5QrcodeRef.current = html5Qrcode

            await html5Qrcode.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 280, height: 120 }
                },
                (decodedText: string) => {
                    console.log("Código detectado:", decodedText)
                    html5Qrcode.stop().then(() => {
                        html5QrcodeRef.current = null
                        setEscaneando(false)
                        onScan(decodedText)
                    }).catch(() => {
                        setEscaneando(false)
                        onScan(decodedText)
                    })
                },
                () => { }
            )
        } catch (err) {
            console.error("Error al iniciar escáner:", err)
            const mensaje = err instanceof Error ? err.message : 'Error al acceder a la cámara'
            setError(mensaje)
            setEscaneando(false)
        }
    }

    return (
        <div className="lector-codigo-container">
            {!escaneando ? (
                <button
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
                <div style={{
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
                        fontSize: '1.1rem',
                        textAlign: 'center'
                    }}>
                        📷 Apunta la cámara al código de barras
                    </div>

                    <div
                        id="reader-container"
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
                            color: '#fbbf24',
                            marginTop: '15px',
                            padding: '12px 20px',
                            background: 'rgba(251, 191, 36, 0.1)',
                            borderRadius: '8px',
                            textAlign: 'center',
                            maxWidth: '400px'
                        }}>
                            ⚠️ {error}
                        </div>
                    )}

                    <button
                        onClick={detenerEscaner}
                        style={{
                            marginTop: '20px',
                            padding: '14px 40px',
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
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
