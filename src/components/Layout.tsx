import { ReactNode, useState, useEffect } from 'react'
import Sidebar from './Sidebar'
import { Usuario } from '../types'
import './Layout.css'

interface LayoutProps {
    children: ReactNode
    vistaActual: string
    cambiarVista: (vista: any) => void
    usuario: Usuario
    cerrarSesion: () => void
}

export default function Layout({ children, vistaActual, cambiarVista, usuario, cerrarSesion }: LayoutProps) {
    const [menuAbierto, setMenuAbierto] = useState(false)
    const [esMobile, setEsMobile] = useState(window.innerWidth <= 768)

    useEffect(() => {
        const handleResize = () => {
            setEsMobile(window.innerWidth <= 768)
            if (window.innerWidth > 768) {
                setMenuAbierto(false)
            }
        }

        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const toggleMenu = () => {
        setMenuAbierto(!menuAbierto)
    }

    const handleCambiarVista = (vista: any) => {
        cambiarVista(vista)
        setMenuAbierto(false) // Cerrar menú al cambiar de vista en mobile
    }

    return (
        <div className="layout-container">
            {/* Header Mobile con Hamburguesa */}
            {esMobile && (
                <header className="mobile-header">
                    <button className="btn-hamburger" onClick={toggleMenu}>
                        <span className={`hamburger-icon ${menuAbierto ? 'active' : ''}`}>
                            <span></span>
                            <span></span>
                            <span></span>
                        </span>
                    </button>
                    <h1 className="mobile-title">
                        {localStorage.getItem('pos_empresa')
                            ? JSON.parse(localStorage.getItem('pos_empresa')!).nombre
                            : 'Sistema POS'}
                    </h1>
                    <div className="mobile-user">
                        <span className="mobile-user-avatar">
                            {usuario.usuario.charAt(0).toUpperCase()}
                        </span>
                    </div>
                </header>
            )}

            {/* Overlay para cerrar menú */}
            {esMobile && menuAbierto && (
                <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)}></div>
            )}

            {/* Sidebar - siempre visible en desktop, colapsable en mobile */}
            <aside className={`sidebar-wrapper ${esMobile ? 'mobile' : ''} ${menuAbierto ? 'open' : ''}`}>
                <Sidebar
                    vistaActual={vistaActual}
                    cambiarVista={handleCambiarVista}
                    usuario={usuario}
                    cerrarSesion={cerrarSesion}
                />
            </aside>

            {/* Main Content */}
            <main className={`main-content ${esMobile ? 'mobile' : ''}`}>
                {children}
            </main>
        </div>
    )
}
