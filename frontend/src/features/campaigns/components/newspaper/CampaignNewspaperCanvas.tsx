import type { FC } from 'react';
import { useState } from 'react';
import type { CampaignResponse, CampaignUpdateItem } from '../../../../shared/api/campaignsApi.ts';
import type { NewspaperBlock, NewspaperBlockType } from './types.ts';
import { createInitialNewspaperBlocks } from './sampleNewspaperData.ts';
import {
  Newspaper,
  Edit3,
  Eye,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  RotateCcw,
  Quote,
  Type,
  Columns,
  Image as ImageIcon,
  Radio,
  Calendar,
} from 'lucide-react';
import './CampaignNewspaperCanvas.css';

export interface CampaignNewspaperCanvasProps {
  campaign: CampaignResponse;
  updates?: CampaignUpdateItem[];
  isOwner?: boolean;
}

export const CampaignNewspaperCanvas: FC<CampaignNewspaperCanvasProps> = ({
  campaign,
  updates = [],
  isOwner = false,
}) => {
  const [blocks, setBlocks] = useState<NewspaperBlock[]>(() =>
    createInitialNewspaperBlocks(campaign, updates),
  );
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [activeEditingId, setActiveEditingId] = useState<string | null>(null);

  const handleResetToInitial = () => {
    setBlocks(createInitialNewspaperBlocks(campaign, updates));
    setActiveEditingId(null);
  };

  const handleMoveBlock = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= blocks.length) return;

    setBlocks((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(index, 1);
      copy.splice(targetIndex, 0, moved);
      return copy;
    });
  };

  const handleDeleteBlock = (id: string) => {
    setBlocks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddBlock = (type: NewspaperBlockType) => {
    const newId = `block-${Date.now()}`;
    let newBlock: NewspaperBlock;

    switch (type) {
      case 'headline':
        newBlock = {
          id: newId,
          type: 'headline',
          kicker: 'NUEVA SECCIÓN',
          title: 'Nuevo Titular Editorial',
          subtitle: 'Breve bajada periodística para contextualizar la noticia.',
        };
        break;
      case 'lead_paragraph':
        newBlock = {
          id: newId,
          type: 'lead_paragraph',
          text: 'Párrafo de apertura con formato editorial destacado para captar la atención del lector.',
        };
        break;
      case 'paragraph':
        newBlock = {
          id: newId,
          type: 'paragraph',
          text: 'Escribe aquí el relato o detalle de las actividades de tu proyecto con completa libertad editorial.',
        };
        break;
      case 'pull_quote':
        newBlock = {
          id: newId,
          type: 'pull_quote',
          quote: 'Una frase inspiradora que resume el corazón del proyecto.',
          attribution: campaign.creatorName || 'Voz comunitaria',
        };
        break;
      case 'two_columns':
        newBlock = {
          id: newId,
          type: 'two_columns',
          col1Title: 'Columna A: Contexto',
          col1Text: 'Describe aquí un aspecto específico del proyecto en formato de doble columna periodística.',
          col2Title: 'Columna B: Solución',
          col2Text: 'Complementa la idea con la acción directa o los próximos pasos a realizar.',
        };
        break;
      case 'image_feature':
        newBlock = {
          id: newId,
          type: 'image_feature',
          imageUrl: campaign.coverImageUrl || 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&auto=format&fit=crop&q=80',
          caption: 'Fotografía testimonial de los avances del proyecto.',
          layout: 'wide',
        };
        break;
      case 'bulletin':
        newBlock = {
          id: newId,
          type: 'bulletin',
          badge: 'NOTICIA',
          date: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
          title: 'Titular del avance',
          body: 'Descripción concisa de la última novedad o hito completado.',
        };
        break;
      case 'metrics_grid':
        newBlock = {
          id: newId,
          type: 'metrics_grid',
          title: 'Metas Clave',
          items: [
            { label: 'Voluntarios', value: '45 personas' },
            { label: 'Hectáreas', value: '2.5 ha' },
            { label: 'Comunidades', value: '3 aliadas' },
          ],
        };
        break;
      default:
        return;
    }

    setBlocks((prev) => [...prev, newBlock]);
    setActiveEditingId(newId);
  };

  const handleUpdateBlockField = (id: string, field: string, value: any) => {
    setBlocks((prev) =>
      prev.map((block) => (block.id === id ? { ...block, [field]: value } : block)),
    );
  };

  const editionDate = new Date().toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="brotar-newspaper-wrapper">
      {/* 1. Auxiliary Control Bar */}
      <div className="brotar-newspaper-aux-bar">
        <div className="brotar-newspaper-aux-left">
          <span className="brotar-newspaper-aux-pill">
            <Newspaper size={14} />
            <span>Formato Periódico Digital {isOwner ? '(Editor)' : '(Demostración)'}</span>
          </span>
          <p className="brotar-newspaper-aux-hint">
            Visualiza y personaliza la historia del proyecto como una publicación editorial estructurada.
          </p>
        </div>

        <div className="brotar-newspaper-aux-actions">
          <button
            type="button"
            className={`brotar-newspaper-mode-btn ${isEditMode ? 'is-active' : ''}`}
            onClick={() => setIsEditMode((prev) => !prev)}
            title={isEditMode ? 'Ver vista de lectura' : 'Personalizar bloques'}
          >
            {isEditMode ? (
              <>
                <Eye size={15} />
                <span>Vista Lector</span>
              </>
            ) : (
              <>
                <Edit3 size={15} />
                <span>Personalizar Periódico</span>
              </>
            )}
          </button>

          {isEditMode && (
            <button
              type="button"
              className="brotar-newspaper-reset-btn"
              onClick={handleResetToInitial}
              title="Restaurar a la edición generada por defecto"
            >
              <RotateCcw size={14} />
              <span>Restaurar</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Newspaper Sheet Container */}
      <article className="brotar-newspaper-sheet">
        {/* Masthead (Cabecera del Periódico) */}
        <header className="brotar-newspaper-masthead">
          <div className="brotar-newspaper-masthead-top">
            <span className="brotar-masthead-meta">
              <Calendar size={13} />
              <span>{editionDate}</span>
            </span>
            <span className="brotar-masthead-badge">EDICIÓN COMUNITARIA BROTAR</span>
            <span className="brotar-masthead-meta">
              {campaign.location ? `Plaza: ${campaign.location}` : 'Cobertura Nacional'}
            </span>
          </div>

          <div className="brotar-newspaper-title-row">
            <h1 className="brotar-newspaper-masthead-title">
              {campaign.title}
            </h1>
            <span className="brotar-newspaper-masthead-slug">
              Diario de Regeneración y Acción Ecológica
            </span>
          </div>

          <div className="brotar-newspaper-masthead-bottom-bar">
            <span>SECCIÓN: {campaign.category.toUpperCase()}</span>
            <span>PUBLICADO POR: {campaign.creatorName || 'CREADOR DEL PROYECTO'}</span>
            <span>TRANSPARENCIA VERIFICADA</span>
          </div>
        </header>

        {/* 3. Newspaper Body Blocks Stack */}
        <div className="brotar-newspaper-body">
          {blocks.map((block, index) => {
            const isEditing = isEditMode && activeEditingId === block.id;

            return (
              <div
                key={block.id}
                className={`brotar-newspaper-block-wrap ${
                  isEditMode ? 'is-editable-block' : ''
                } ${isEditing ? 'is-active-editing' : ''}`}
                onClick={() => isEditMode && setActiveEditingId(block.id)}
              >
                {/* Block Controls Toolbar (Only shown in Edit Mode) */}
                {isEditMode && (
                  <div className="brotar-block-toolbar">
                    <span className="brotar-block-type-tag">{block.type}</span>

                    <div className="brotar-block-toolbar-actions">
                      <button
                        type="button"
                        className="brotar-block-tool-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(index, 'up');
                        }}
                        disabled={index === 0}
                        title="Mover arriba"
                      >
                        <ArrowUp size={13} />
                      </button>

                      <button
                        type="button"
                        className="brotar-block-tool-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMoveBlock(index, 'down');
                        }}
                        disabled={index === blocks.length - 1}
                        title="Mover abajo"
                      >
                        <ArrowDown size={13} />
                      </button>

                      <button
                        type="button"
                        className="brotar-block-tool-btn is-danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteBlock(block.id);
                        }}
                        title="Eliminar bloque"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                )}

                {/* Render Block by Type */}
                <div className="brotar-block-content">
                  {/* TYPE: HEADLINE */}
                  {block.type === 'headline' && (
                    <div className="np-headline-block">
                      {isEditMode ? (
                        <div className="np-edit-fields">
                          <input
                            type="text"
                            className="np-input np-input-kicker"
                            value={block.kicker || ''}
                            onChange={(e) =>
                              handleUpdateBlockField(block.id, 'kicker', e.target.value)
                            }
                            placeholder="Cintillo (ej: CRÓNICA AMBIENTAL)"
                          />
                          <input
                            type="text"
                            className="np-input np-input-title"
                            value={block.title}
                            onChange={(e) =>
                              handleUpdateBlockField(block.id, 'title', e.target.value)
                            }
                            placeholder="Titular principal..."
                          />
                          <textarea
                            className="np-textarea np-textarea-sub"
                            value={block.subtitle || ''}
                            onChange={(e) =>
                              handleUpdateBlockField(block.id, 'subtitle', e.target.value)
                            }
                            placeholder="Subtítulo o bajada periodística..."
                            rows={2}
                          />
                        </div>
                      ) : (
                        <>
                          {block.kicker && (
                            <span className="np-headline-kicker">{block.kicker}</span>
                          )}
                          <h2 className="np-headline-title">{block.title}</h2>
                          {block.subtitle && (
                            <p className="np-headline-subtitle">{block.subtitle}</p>
                          )}
                        </>
                      )}
                    </div>
                  )}

                  {/* TYPE: LEAD PARAGRAPH */}
                  {block.type === 'lead_paragraph' && (
                    <div className="np-lead-block">
                      {isEditMode ? (
                        <textarea
                          className="np-textarea np-textarea-lead"
                          value={block.text}
                          onChange={(e) =>
                            handleUpdateBlockField(block.id, 'text', e.target.value)
                          }
                          rows={3}
                          placeholder="Párrafo de apertura..."
                        />
                      ) : (
                        <p className="np-lead-text">{block.text}</p>
                      )}
                    </div>
                  )}

                  {/* TYPE: TWO COLUMNS */}
                  {block.type === 'two_columns' && (
                    <div className="np-two-columns-block">
                      {isEditMode ? (
                        <div className="np-two-columns-edit">
                          <div className="np-col-field">
                            <input
                              type="text"
                              className="np-input np-input-col-title"
                              value={block.col1Title}
                              onChange={(e) =>
                                handleUpdateBlockField(block.id, 'col1Title', e.target.value)
                              }
                              placeholder="Título Columna 1"
                            />
                            <textarea
                              className="np-textarea"
                              value={block.col1Text}
                              onChange={(e) =>
                                handleUpdateBlockField(block.id, 'col1Text', e.target.value)
                              }
                              rows={4}
                              placeholder="Contenido Columna 1..."
                            />
                          </div>

                          <div className="np-col-field">
                            <input
                              type="text"
                              className="np-input np-input-col-title"
                              value={block.col2Title}
                              onChange={(e) =>
                                handleUpdateBlockField(block.id, 'col2Title', e.target.value)
                              }
                              placeholder="Título Columna 2"
                            />
                            <textarea
                              className="np-textarea"
                              value={block.col2Text}
                              onChange={(e) =>
                                handleUpdateBlockField(block.id, 'col2Text', e.target.value)
                              }
                              rows={4}
                              placeholder="Contenido Columna 2..."
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="np-two-columns-grid">
                          <div className="np-col">
                            <h3 className="np-col-title">{block.col1Title}</h3>
                            <p className="np-col-text">{block.col1Text}</p>
                          </div>
                          <div className="np-col-divider" />
                          <div className="np-col">
                            <h3 className="np-col-title">{block.col2Title}</h3>
                            <p className="np-col-text">{block.col2Text}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TYPE: PARAGRAPH */}
                  {block.type === 'paragraph' && (
                    <div className="np-paragraph-block">
                      {isEditMode ? (
                        <textarea
                          className="np-textarea"
                          value={block.text}
                          onChange={(e) =>
                            handleUpdateBlockField(block.id, 'text', e.target.value)
                          }
                          rows={3}
                          placeholder="Texto del párrafo..."
                        />
                      ) : (
                        <p className="np-paragraph-text">{block.text}</p>
                      )}
                    </div>
                  )}

                  {/* TYPE: PULL QUOTE */}
                  {block.type === 'pull_quote' && (
                    <blockquote className="np-quote-block">
                      <Quote size={28} className="np-quote-icon" />
                      {isEditMode ? (
                        <div className="np-quote-edit">
                          <textarea
                            className="np-textarea np-textarea-quote"
                            value={block.quote}
                            onChange={(e) =>
                              handleUpdateBlockField(block.id, 'quote', e.target.value)
                            }
                            rows={2}
                            placeholder="Frase inspiradora o testimonio..."
                          />
                          <input
                            type="text"
                            className="np-input np-input-quote-author"
                            value={block.attribution || ''}
                            onChange={(e) =>
                              handleUpdateBlockField(block.id, 'attribution', e.target.value)
                            }
                            placeholder="Autor o atribución de la cita..."
                          />
                        </div>
                      ) : (
                        <div className="np-quote-content">
                          <p className="np-quote-text">“{block.quote}”</p>
                          {block.attribution && (
                            <cite className="np-quote-author">— {block.attribution}</cite>
                          )}
                        </div>
                      )}
                    </blockquote>
                  )}

                  {/* TYPE: IMAGE FEATURE */}
                  {block.type === 'image_feature' && (
                    <figure className="np-image-block">
                      <div className="np-image-container">
                        <img
                          src={block.imageUrl}
                          alt={block.caption || 'Imagen del proyecto'}
                          className="np-image-element"
                        />
                      </div>
                      {isEditMode ? (
                        <input
                          type="text"
                          className="np-input np-input-caption"
                          value={block.caption}
                          onChange={(e) =>
                            handleUpdateBlockField(block.id, 'caption', e.target.value)
                          }
                          placeholder="Pie de foto descriptivo..."
                        />
                      ) : (
                        block.caption && (
                          <figcaption className="np-image-caption">
                            {block.caption}
                          </figcaption>
                        )
                      )}
                    </figure>
                  )}

                  {/* TYPE: BULLETIN (ÚLTIMA HORA) */}
                  {block.type === 'bulletin' && (
                    <div className="np-bulletin-block">
                      <div className="np-bulletin-header">
                        <span className="np-bulletin-badge">
                          <Radio size={12} className="brotar-pulse-icon" />
                          <span>{block.badge}</span>
                        </span>
                        <span className="np-bulletin-date">{block.date}</span>
                      </div>
                      {isEditMode ? (
                        <div className="np-bulletin-edit">
                          <input
                            type="text"
                            className="np-input np-input-bulletin-title"
                            value={block.title}
                            onChange={(e) =>
                              handleUpdateBlockField(block.id, 'title', e.target.value)
                            }
                            placeholder="Titular de la noticia o avance..."
                          />
                          <textarea
                            className="np-textarea"
                            value={block.body}
                            onChange={(e) =>
                              handleUpdateBlockField(block.id, 'body', e.target.value)
                            }
                            rows={2}
                            placeholder="Cuerpo de la noticia..."
                          />
                        </div>
                      ) : (
                        <div className="np-bulletin-content">
                          <h4 className="np-bulletin-title">{block.title}</h4>
                          <p className="np-bulletin-body">{block.body}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TYPE: METRICS GRID */}
                  {block.type === 'metrics_grid' && (
                    <div className="np-metrics-block">
                      {block.title && <h3 className="np-metrics-title">{block.title}</h3>}
                      <div className="np-metrics-grid">
                        {block.items.map((item, mIdx) => (
                          <div key={mIdx} className="np-metric-cell">
                            <span className="np-metric-val">{item.value}</span>
                            <span className="np-metric-lbl">{item.label}</span>
                            {item.description && (
                              <span className="np-metric-desc">{item.description}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 4. Add Block Bar (Active in Edit Mode) */}
        {isEditMode && (
          <div className="brotar-add-block-panel">
            <span className="brotar-add-block-label">
              <Plus size={15} />
              <span>Añadir sección editorial al periódico:</span>
            </span>

            <div className="brotar-add-block-buttons">
              <button
                type="button"
                className="brotar-add-btn"
                onClick={() => handleAddBlock('headline')}
              >
                <Type size={14} />
                <span>Titular</span>
              </button>

              <button
                type="button"
                className="brotar-add-btn"
                onClick={() => handleAddBlock('paragraph')}
              >
                <Type size={14} />
                <span>Párrafo</span>
              </button>

              <button
                type="button"
                className="brotar-add-btn"
                onClick={() => handleAddBlock('two_columns')}
              >
                <Columns size={14} />
                <span>2 Columnas</span>
              </button>

              <button
                type="button"
                className="brotar-add-btn"
                onClick={() => handleAddBlock('pull_quote')}
              >
                <Quote size={14} />
                <span>Cita destacada</span>
              </button>

              <button
                type="button"
                className="brotar-add-btn"
                onClick={() => handleAddBlock('bulletin')}
              >
                <Radio size={14} />
                <span>Cable de Noticia</span>
              </button>

              <button
                type="button"
                className="brotar-add-btn"
                onClick={() => handleAddBlock('image_feature')}
              >
                <ImageIcon size={14} />
                <span>Foto con pie</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer of the newspaper sheet */}
        <footer className="brotar-newspaper-footer">
          <div className="brotar-np-footer-line" />
          <div className="brotar-np-footer-content">
            <span>© BROTAR CROWDFUNDING • EDICIÓN TRANSPARENTE</span>
            <span>PROYECTO: {campaign.title.toUpperCase()}</span>
          </div>
        </footer>
      </article>
    </div>
  );
};
