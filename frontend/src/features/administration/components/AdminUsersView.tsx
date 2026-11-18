import type { FC } from 'react';
import { useState } from 'react';
import {
  UserPlus,
  ArrowRight,
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Trash2,
} from 'lucide-react';
import { useUsersManagement, type UserSortField } from '../hooks/useUsersManagement.ts';
import { KycStatusBadge } from './KycStatusBadge.tsx';
import { UserDetailDrawer } from './UserDetailDrawer.tsx';
import { CreateUserModal } from './CreateUserModal.tsx';
import { DeactivateUserModal } from './DeactivateUserModal.tsx';
import { DynamicPagination } from './DynamicPagination.tsx';
import type { UserDto } from '../../../shared/api/usersApi.ts';

export interface AdminUsersViewProps {
  onNavigateToKyc: (user?: UserDto) => void;
}

export const AdminUsersView: FC<AdminUsersViewProps> = ({ onNavigateToKyc }) => {
  const {
    selectedRole,
    setSelectedRole,
    selectedKycStatus,
    setSelectedKycStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    paginationMeta,
    users,
    sortField,
    sortDirection,
    handleSort,
    isLoading,
    selectedUser,
    isDetailModalOpen,
    setIsDetailModalOpen,
    handleOpenUserDetail,
    refresh,
  } = useUsersManagement();

  const [showKycFilterDropdown, setShowKycFilterDropdown] = useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [deactivateModalUser, setDeactivateModalUser] = useState<UserDto | null>(null);

  const renderSortIndicator = (field: UserSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown size={14} className="sort-icon-idle" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp size={14} className="sort-icon-active" />
    ) : (
      <ArrowDown size={14} className="sort-icon-active" />
    );
  };

  const handleUserCreated = (newUser: UserDto) => {
    refresh();
    handleOpenUserDetail(newUser);
  };

  const handleUserUpdated = () => {
    refresh();
  };

  return (
    <div className="admin-users-view">
      {/* 1. Header & Actions (OUTSIDE the table card) */}
      <div className="admin-section-header">
        <div className="section-title-wrap">
          <h1 className="admin-page-title">Gestión de Usuarios</h1>
          <p className="admin-page-subtitle">
            Administra todos los usuarios registrados, roles de plataforma y estado de verificación
          </p>
        </div>

        <div className="section-top-actions">
          <button
            type="button"
            className="btn-create-user-primary"
            onClick={() => setIsCreateModalOpen(true)}
          >
            <UserPlus size={18} />
            <span>Nuevo Usuario</span>
          </button>

          <button
            type="button"
            className="btn-secondary-pill"
            onClick={() => onNavigateToKyc()}
          >
            <span>Ir a Cola KYC</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* 2. Unified Toolbar: Search + Filter Dropdown + Role Pills (OUTSIDE the table card) */}
      <div className="admin-outside-toolbar">
        {/* Search & Status Filter */}
        <div className="search-filter-cluster">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, correo o CI..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="admin-search-input"
            />
          </div>

          <div className="filter-dropdown-wrapper">
            <button
              type="button"
              className={`filter-btn ${showKycFilterDropdown ? 'active' : ''}`}
              onClick={() => setShowKycFilterDropdown(!showKycFilterDropdown)}
              title="Filtrar por estado KYC"
            >
              <Filter size={18} />
              {selectedKycStatus !== 'all' && <span className="filter-active-indicator" />}
            </button>

            {showKycFilterDropdown && (
              <div className="filter-menu dropdown-portal-fixed">
                <button
                  type="button"
                  className={`filter-option ${selectedKycStatus === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedKycStatus('all');
                    setShowKycFilterDropdown(false);
                  }}
                >
                  Todos los estados KYC
                </button>
                <button
                  type="button"
                  className={`filter-option ${selectedKycStatus === 'verified' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedKycStatus('verified');
                    setShowKycFilterDropdown(false);
                  }}
                >
                  Verificados
                </button>
                <button
                  type="button"
                  className={`filter-option ${selectedKycStatus === 'pending' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedKycStatus('pending');
                    setShowKycFilterDropdown(false);
                  }}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  className={`filter-option ${selectedKycStatus === 'requires_documentation' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedKycStatus('requires_documentation');
                    setShowKycFilterDropdown(false);
                  }}
                >
                  Requiere Documentación
                </button>
                <button
                  type="button"
                  className={`filter-option ${selectedKycStatus === 'rejected' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedKycStatus('rejected');
                    setShowKycFilterDropdown(false);
                  }}
                >
                  Rechazados
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Role Pills */}
        <div className="queue-pill-group role-pills-row">
          <button
            type="button"
            className={`queue-pill ${selectedRole === 'all' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('all');
              setCurrentPage(1);
            }}
          >
            Todos los Usuarios
          </button>
          <button
            type="button"
            className={`queue-pill ${selectedRole === 'creator' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('creator');
              setCurrentPage(1);
            }}
          >
            Creadores (ONGs)
          </button>
          <button
            type="button"
            className={`queue-pill ${selectedRole === 'sponsor' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('sponsor');
              setCurrentPage(1);
            }}
          >
            Sponsors / Donantes
          </button>
          <button
            type="button"
            className={`queue-pill ${selectedRole === 'admin' ? 'active' : ''}`}
            onClick={() => {
              setSelectedRole('admin');
              setCurrentPage(1);
            }}
          >
            Administradores
          </button>
        </div>
      </div>

      {/* 3. Clean Table Card (Holds ONLY the table) */}
      <div className="admin-table-card">
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th
                  style={{ width: '34%', cursor: 'pointer' }}
                  onClick={() => handleSort('name')}
                  className="th-sortable"
                  title="Ordenar por Nombre"
                >
                  <div className="th-content">
                    <span>Usuario / Organización</span>
                    {renderSortIndicator('name')}
                  </div>
                </th>
                <th
                  style={{ width: '16%', cursor: 'pointer' }}
                  onClick={() => handleSort('role')}
                  className="th-sortable"
                  title="Ordenar por Rol"
                >
                  <div className="th-content">
                    <span>Rol</span>
                    {renderSortIndicator('role')}
                  </div>
                </th>
                <th
                  style={{ width: '18%', cursor: 'pointer' }}
                  onClick={() => handleSort('documentId')}
                  className="th-sortable"
                  title="Ordenar por Documento / CI"
                >
                  <div className="th-content">
                    <span>Documento / CI</span>
                    {renderSortIndicator('documentId')}
                  </div>
                </th>
                <th
                  style={{ width: '18%', cursor: 'pointer' }}
                  onClick={() => handleSort('kycStatus')}
                  className="th-sortable"
                  title="Ordenar por Estado KYC"
                >
                  <div className="th-content">
                    <span>Estado KYC</span>
                    {renderSortIndicator('kycStatus')}
                  </div>
                </th>
                <th style={{ width: '14%', textAlign: 'right' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    <div className="loading-spinner-row">
                      <span className="spinner-dot"></span> Cargando usuarios de la plataforma...
                    </div>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="empty-state">
                    No se encontraron usuarios con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                users.map((u: UserDto) => {
                  const isRowSelected = selectedUser?.id === u.id && isDetailModalOpen;
                  const initials = (u.organizationName || u.fullName)
                    .split(' ')
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((w) => w[0].toUpperCase())
                    .join('');

                  return (
                    <tr
                      key={u.id}
                      className={`verification-row ${isRowSelected ? 'row-selected' : ''}`}
                      onClick={() => handleOpenUserDetail(u)}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {u.avatarUrl ? (
                            <img
                              src={u.avatarUrl}
                              alt={u.fullName}
                              style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover' }}
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '36px',
                                height: '36px',
                                borderRadius: '50%',
                                background: '#e2e8f0',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.82rem',
                                fontWeight: 700,
                                flexShrink: 0,
                              }}
                            >
                              {initials || 'U'}
                            </div>
                          )}
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <strong style={{ color: '#0f172a', fontWeight: 600 }}>
                              {u.organizationName || u.fullName}
                            </strong>
                            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{u.email}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`role-badge ${u.role}`}>
                          {u.role === 'admin' ? 'Admin' : u.role === 'creator' ? 'Creador' : 'Sponsor'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontWeight: 500, color: '#334155' }}>
                          {u.documentId || (u.phone ? `CI ${u.phone.replace(/[^0-9]/g, '').slice(0, 8)} LP` : '—')}
                        </span>
                      </td>
                      <td>
                        <KycStatusBadge status={u.kycStatus} />
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="table-actions-cluster">
                          <button
                            type="button"
                            className="btn-table-action-danger"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeactivateModalUser(u);
                            }}
                            title="Borrar usuario"
                          >
                            <Trash2 size={14} />
                            <span>Borrar</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          <div className="table-card-accent-footer"></div>
        </div>
      </div>

      {/* 4. Sole Bottom Bar: Dynamic Pagination */}
      <DynamicPagination
        currentPage={currentPage}
        totalPages={paginationMeta.totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* 5. Sleek Slide-Over Detail Drawer */}
      <UserDetailDrawer
        isOpen={isDetailModalOpen}
        user={selectedUser}
        onClose={() => setIsDetailModalOpen(false)}
        onNavigateToKyc={onNavigateToKyc}
        onUserUpdated={handleUserUpdated}
        onDeactivateUser={(u: UserDto) => setDeactivateModalUser(u)}
      />

      {/* 6. Create User Modal */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleUserCreated}
      />

      {/* 7. Deactivate / Reactivate User Modal with Process Simulator */}
      <DeactivateUserModal
        isOpen={Boolean(deactivateModalUser)}
        user={deactivateModalUser}
        onClose={() => setDeactivateModalUser(null)}
        onSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
};
