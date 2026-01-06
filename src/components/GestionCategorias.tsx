import { useState } from 'react'
import { Categoria } from '../types'
import './GestionCategorias.css'

interface GestionCategoriasProps {
  categorias: Categoria[]
  onGuardar: (categorias: Categoria[]) => void
  onCerrar: () => void
}

export default function GestionCategorias({ categorias, onGuardar, onCerrar }: GestionCategoriasProps) {
  const [categoriasEdit, setCategoriasEdit] = useState<Categoria[]>(categorias)
  const [nuevaCategoria, setNuevaCategoria] = useState('')
  const [nuevaSubcategoria, setNuevaSubcategoria] = useState<{ categoria: string, subcategoria: string } | null>(null)

  const agregarCategoria = () => {
    if (!nuevaCategoria.trim()) return
    
    const existe = categoriasEdit.find(c => c.nombre.toLowerCase() === nuevaCategoria.trim().toLowerCase())
    if (existe) {
      alert('Esta categoría ya existe')
      return
    }
    
    setCategoriasEdit([...categoriasEdit, { nombre: nuevaCategoria.trim(), subcategorias: [] }])
    setNuevaCategoria('')
  }

  const eliminarCategoria = (nombre: string) => {
    if (confirm(`¿Estás seguro de eliminar la categoría "${nombre}"?`)) {
      setCategoriasEdit(categoriasEdit.filter(c => c.nombre !== nombre))
    }
  }

  const iniciarAgregarSubcategoria = (categoriaNombre: string) => {
    setNuevaSubcategoria({ categoria: categoriaNombre, subcategoria: '' })
  }

  const cancelarSubcategoria = () => {
    setNuevaSubcategoria(null)
  }

  const guardarSubcategoria = () => {
    if (!nuevaSubcategoria || !nuevaSubcategoria.subcategoria.trim()) return
    
    setCategoriasEdit(categoriasEdit.map(c => {
      if (c.nombre === nuevaSubcategoria.categoria) {
        const existe = c.subcategorias.find(s => s.toLowerCase() === nuevaSubcategoria.subcategoria.trim().toLowerCase())
        if (existe) {
          alert('Esta subcategoría ya existe')
          return c
        }
        return { ...c, subcategorias: [...c.subcategorias, nuevaSubcategoria.subcategoria.trim()] }
      }
      return c
    }))
    setNuevaSubcategoria(null)
  }

  const eliminarSubcategoria = (categoriaNombre: string, subcategoria: string) => {
    setCategoriasEdit(categoriasEdit.map(c => {
      if (c.nombre === categoriaNombre) {
        return { ...c, subcategorias: c.subcategorias.filter(s => s !== subcategoria) }
      }
      return c
    }))
  }

  const guardar = () => {
    onGuardar(categoriasEdit)
    onCerrar()
  }

  return (
    <div className="modal-overlay" onClick={onCerrar}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Gestión de Categorías y Subcategorías</h2>
          <button className="btn-cerrar" onClick={onCerrar}>×</button>
        </div>
        
        <div className="modal-body">
          {/* Agregar nueva categoría */}
          <div className="agregar-categoria">
            <h3>Agregar Categoría</h3>
            <div className="input-group">
              <input
                type="text"
                value={nuevaCategoria}
                onChange={(e) => setNuevaCategoria(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && agregarCategoria()}
                placeholder="Nombre de la categoría"
              />
              <button className="btn-agregar" onClick={agregarCategoria}>
                + Agregar
              </button>
            </div>
          </div>

          {/* Lista de categorías */}
          <div className="categorias-lista">
            <h3>Categorías Existentes</h3>
            {categoriasEdit.map(categoria => (
              <div key={categoria.nombre} className="categoria-item-gestion">
                <div className="categoria-header-gestion">
                  <span className="categoria-nombre-gestion">{categoria.nombre}</span>
                  <div className="categoria-acciones">
                    {nuevaSubcategoria?.categoria === categoria.nombre ? (
                      <div className="subcategoria-form">
                        <input
                          type="text"
                          value={nuevaSubcategoria.subcategoria}
                          onChange={(e) => setNuevaSubcategoria({ ...nuevaSubcategoria, subcategoria: e.target.value })}
                          onKeyPress={(e) => e.key === 'Enter' && guardarSubcategoria()}
                          placeholder="Nombre de la subcategoría"
                          autoFocus
                        />
                        <button className="btn-guardar-sub" onClick={guardarSubcategoria}>
                          ✓
                        </button>
                        <button className="btn-cancelar-sub" onClick={cancelarSubcategoria}>
                          ×
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          className="btn-subcategoria"
                          onClick={() => iniciarAgregarSubcategoria(categoria.nombre)}
                        >
                          + Subcategoría
                        </button>
                        <button 
                          className="btn-eliminar-cat"
                          onClick={() => eliminarCategoria(categoria.nombre)}
                        >
                          Eliminar
                        </button>
                      </>
                    )}
                  </div>
                </div>
                
                {categoria.subcategorias.length > 0 && (
                  <div className="subcategorias-lista">
                    {categoria.subcategorias.map(subcategoria => (
                      <div key={subcategoria} className="subcategoria-item">
                        <span>{subcategoria}</span>
                        <button 
                          className="btn-eliminar-sub"
                          onClick={() => eliminarSubcategoria(categoria.nombre, subcategoria)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-cancelar" onClick={onCerrar}>
            Cancelar
          </button>
          <button className="btn-guardar" onClick={guardar}>
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  )
}
