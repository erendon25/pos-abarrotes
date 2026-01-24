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

    // Update local state if parent changes it (e.g. clearing after scan)
    useEffect(() => {
        setLocalFiltro(filtroExterno)
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

    // Global Keydown (moved from App.tsx mostly)
    // Logic: "Global listener for scanning/typing"
    useEffect(() => {
        if (!activo) return

        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            // Ignore control keys
            if (e.ctrlKey || e.altKey || e.metaKey || e.key.length > 1) return

            // Ignore if some other input is active
            if (document.activeElement?.tagName === 'INPUT' ||
                document.activeElement?.tagName === 'TEXTAREA' ||
                document.activeElement?.tagName === 'SELECT') {
                return
            }

            inputRef.current?.focus()
        }

        window.addEventListener('keydown', handleGlobalKeyDown)
        // Focus on mount
        const timer = setTimeout(() => inputRef.current?.focus(), 50)

        return () => {
            window.removeEventListener('keydown', handleGlobalKeyDown)
            clearTimeout(timer)
        }
    }, [activo])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && localFiltro.trim()) {
            // Immediate trigger for Enter
            onScan(localFiltro.trim())
            setLocalFiltro('') // Optional: clear after scan/enter? 
            // In original App, scanning cleared filter if found, or left it if not.
            // We'll let parent handle the logic, but usually scanners end with Enter.
            // If parent finds product, it clears passed prop? 
            // Wait, if parent clears 'filtro' state, we need to clear 'localFiltro'.
            // So we need a prop 'filtroExterno' or similar to sync back if needed.
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
                        onChange={(e) => setLocalFiltro(e.target.value)}
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
