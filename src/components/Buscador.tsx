import { useState, useEffect, useRef } from 'react'
import LectorCodigoBarras from './LectorCodigoBarras'
import { useDebounce } from '../utils/hooks'
import './Buscador.css'

interface BuscadorProps {
    onFiltroChange: (filtro: string) => void
    onScan: (code: string) => void
    activo: boolean
    filtroExterno: string
}

export default function Buscador({ onFiltroChange, onScan, activo, filtroExterno }: BuscadorProps) {
    const [localFiltro, setLocalFiltro] = useState(filtroExterno)
    const inputRef = useRef<HTMLInputElement>(null)
    const bufferRef = useRef(localFiltro) // Buffer for rapid scanning

    // Sync buffer when localFiltro changes (e.g. from parent props or typing)
    useEffect(() => {
        bufferRef.current = localFiltro
    }, [localFiltro])

    // Update local state if parent changes it (e.g. clearing after scan)
    useEffect(() => {
        setLocalFiltro(filtroExterno)
        bufferRef.current = filtroExterno
    }, [filtroExterno])

    // Debounce local input to update parent occasionally if needed, 
    // OR we just rely on the parent's debounce logic? 
    // Better: We update parent immediately? No, that causes the re-render loop.
    // We use useDebounce here.
    const debouncedFiltro = useDebounce(localFiltro, 200)

    // Notify parent when debounced value changes
    useEffect(() => {
        // Avoid loop: only notify if different
        if (debouncedFiltro !== filtroExterno) {
            onFiltroChange(debouncedFiltro)
        }
    }, [debouncedFiltro, onFiltroChange, filtroExterno])

    // Global Keydown to capture scanning/typing anywhere
    useEffect(() => {
        if (!activo) return

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore control keys, but allow normal typing
            if (e.ctrlKey || e.altKey || e.metaKey) return

            // If we are already in an input/textarea/select, let browser handle it
            // EXCEPTION: If it is OUR input, handle Enter if needed? 
            // No, Input's onKeyDown handles Enter.
            if (document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA' ||
                document.activeElement?.tagName === 'SELECT') {
                return
            }

            // If it's a printable character (length 1)
            if (e.key.length === 1) {
                e.preventDefault()
                inputRef.current?.focus()
                // Append to buffer and update state
                bufferRef.current += e.key
                setLocalFiltro(bufferRef.current)
            }
            // If it's Backspace
            else if (e.key === 'Backspace') {
                inputRef.current?.focus()
                bufferRef.current = bufferRef.current.slice(0, -1)
                setLocalFiltro(bufferRef.current)
            }
            // If it's Enter (Scanner finished)
            else if (e.key === 'Enter') {
                e.preventDefault()
                const code = bufferRef.current.trim()
                if (code) {
                    onScan(code)
                    bufferRef.current = ''
                    setLocalFiltro('')
                }
            }
        }

        window.addEventListener('keydown', handleGlobalKeyDown)
        // Focus on mount
        const timer = setTimeout(() => inputRef.current?.focus(), 50)

        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown)
            clearTimeout(timer)
        }
    }, [activo, onScan])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            const val = localFiltro.trim()
            if (val) {
                onScan(val)
                setLocalFiltro('')
                bufferRef.current = ''
            }
        }
    }

    // Handle Scan from Camera
    const handleCameraScan = (code: string) => {
        onScan(code)
        // No need to set text
    }

    return (
        <div className="search-section-main">
            <div className="filtro-container-main" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', width: '100%' }}>
                <div style={{ position: 'relative', width: '100%' }}>
                    <input
                        ref={inputRef}
                        type="text"
                        className="filtro-input-main"
                        placeholder="Buscar por nombre, código de barras..."
                        value={localFiltro}
                        onChange={(e) => {
                            setLocalFiltro(e.target.value)
                            bufferRef.current = e.target.value
                        }}
                        onKeyDown={handleKeyDown}
                        autoFocus
                    />
                    {localFiltro && (
                        <button
                            className="btn-limpiar-filtro-main"
                            onClick={() => setLocalFiltro('')}
                            title="Limpiar búsqueda"
                        >
                            ×
                        </button>
                    )}
                </div>
                <LectorCodigoBarras onScan={handleCameraScan} activo={activo} />
            </div>
        </div>
    )
}
