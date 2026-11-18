import './Sidebar.css';

export interface SidebarItem {
  id: string;
  label: string;
}

export interface SidebarProps {
  activeItem?: string;
  items?: SidebarItem[];
  onItemClick?: (itemId: string) => void;
  className?: string;
}

const DEFAULT_ITEMS: SidebarItem[] = [
  { id: 'admin-panel', label: 'Panel de Administración' },
  { id: 'review-panel', label: 'Panel de Revisión' },
  { id: 'verification', label: 'Verificación' },
  { id: 'finance', label: 'Finanzas' },
  { id: 'reconciliation', label: 'Conciliación' },
  { id: 'disbursements', label: 'Desembolsos' },
  { id: 'disputes', label: 'Disputas' },
];

export function Sidebar({
  activeItem,
  items = DEFAULT_ITEMS,
  onItemClick,
  className = '',
}: SidebarProps) {
  return (
    <aside className={`brotar-sidebar ${className}`.trim()} aria-label="Menú de administración">
      <div className="brotar-sidebar__brand">
        <span className="brotar-sidebar__brand-mark">B</span>
        <div>
          <p className="brotar-sidebar__brand-name">Brotar</p>
          <p className="brotar-sidebar__brand-role">ADMIN</p>
        </div>
      </div>

      <nav className="brotar-sidebar__nav">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`brotar-sidebar__item ${activeItem === item.id ? 'is-active' : ''}`}
            onClick={() => onItemClick?.(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}
