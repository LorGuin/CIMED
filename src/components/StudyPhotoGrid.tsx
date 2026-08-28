import { useState } from 'react'
import type { StudyPhoto } from '../firebase/patientStudies'
import { formatDateDisplay } from '../utils/availability'
import './StudyPhotoGrid.scss'

interface Props {
  studies: StudyPhoto[]
  emptyHint?: string
}

// Grilla de fotos de estudios + visor ampliado (lightbox). Extraído como componente propio porque
// se usa tanto en la ficha rápida por turno (`PatientQuickRecord`) como en el historial general de
// pacientes (`PatientHistory`) — mismo look, mismo comportamiento en los dos lados.
export default function StudyPhotoGrid({ studies, emptyHint }: Props) {
  const [viewer, setViewer] = useState<StudyPhoto | null>(null)

  return (
    <div className="study-photo-grid">
      {studies.length === 0 && (
        <p className="study-photo-grid__hint">{emptyHint ?? 'Todavía no hay fotos de estudios cargadas.'}</p>
      )}

      {studies.length > 0 && (
        <div className="study-photo-grid__grid">
          {studies.map((s) => (
            <button key={s.id} type="button" className="study-photo-grid__item" onClick={() => setViewer(s)}>
              <img src={s.imageData} alt={s.label} />
              <span>{s.label}</span>
              <span className="study-photo-grid__date">{formatDateDisplay(s.date)}</span>
            </button>
          ))}
        </div>
      )}

      {viewer && (
        <div className="study-photo-grid__lightbox" onClick={() => setViewer(null)}>
          <div className="study-photo-grid__lightbox-inner" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="study-photo-grid__lightbox-close" onClick={() => setViewer(null)}>
              ✕ Cerrar
            </button>
            <img src={viewer.imageData} alt={viewer.label} />
            <p>
              {viewer.label} — {formatDateDisplay(viewer.date)}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
