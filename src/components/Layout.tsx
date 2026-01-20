import { ReactNode } from 'react'
import Sidebar from './Sidebar'
import { Usuario } from '../types'

interface LayoutProps {
    children: ReactNode
    vistaActual: string
    cambiarVista: (vista: any) => void
    usuario: Usuario
    cerrarSesion: () => void
}

export default function Layout({ children, vistaActual, cambiarVista, usuario, cerrarSesion }: LayoutProps) {
    return (
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar
                vistaActual={vistaActual}
                cambiarVista={cambiarVista}
                usuario={usuario}
                cerrarSesion={cerrarSesion}
            />
            <main style={{ flex: 1, overflow: 'auto', background: '#f8fafc' }}>
                {children}
            </main>
        </div>
    )
}
