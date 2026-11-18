import type { FC } from 'react';
import { useState } from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown, Filter, Search } from 'lucide-react';
import { useKycVerification } from '../hooks/useKycVerification.ts';
import type { KycRowItem } from '../types/admin.types.ts';
import { DynamicPagination } from './DynamicPagination.tsx';
import { KycDetailModal } from './KycDetailModal.tsx';
import { KycStatusBadge } from './KycStatusBadge.tsx';

type VerificationSortField = 'name' | 'ciDocument' | 'submissionDate' | 'status';

/** Se monta solo en la sección de verificación: sus consultas KYC no corren en el resto del panel. */
export const AdminKycVerificationSection: FC = () => {
  const {
    activeQueue,
    setActiveQueue,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    paginationMeta,
    items,
    counts,
    isLoading,
    loadError,
    selectedItem,
    isModalOpen,
    setIsModalOpen,
    handleOpenDetail,
    handleUpdateStatus,
    isLoadingDetail,
    detailError,
    retryDetail,
    updateError,
    refresh,
  } = useKycVerification();

  const [showFilterDropdown, setShowFilterDropdown] = useState<boolean>(false);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [verificationSortField, setVerificationSortField] =
    useState<VerificationSortField>('submissionDate');
  const [verificationSortDir, setVerificationSortDir] = useState<'asc' | 'desc'>('desc');

  const handleVerificationSort = (field: VerificationSortField) => {
    if (verificationSortField === field) {
      setVerificationSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setVerificationSortField(field);
      setVerificationSortDir('asc');
    }
  };

  const filteredItems = [...items]
    .filter((item) => {
      if (selectedStatusFilter === 'all') return true;
      return item.status === selectedStatusFilter;
    })
    .sort((a, b) => {
      let cmp: number;
      switch (verificationSortField) {
        case 'name':
          cmp = a.name.localeCompare(b.name);
          break;
        case 'ciDocument':
          cmp = (a.ciDocument ?? '').localeCompare(b.ciDocument ?? '');
          break;
        case 'status':
          cmp = a.status.localeCompare(b.status);
          break;
        case 'submissionDate':
        default:
          cmp =
            (a.submittedAtIso ? new Date(a.submittedAtIso).getTime() : 0) -
            (b.submittedAtIso ? new Date(b.submittedAtIso).getTime() : 0);
          break;
      }
      return verificationSortDir === 'asc' ? cmp : -cmp;
    });

  const renderKycSortIndicator = (field: VerificationSortField) => {
    if (verificationSortField !== field) {
      return <ArrowUpDown size={14} className="sort-icon-idle" />;
    }
    return verificationSortDir === 'asc' ? (
      <ArrowUp size={14} className="sort-icon-active" />
    ) : (
      <ArrowDown size={14} className="sort-icon-active" />
    );
  };

  return (
    <>
      {/* 1. Header & Intro (OUTSIDE table card) */}
      <div className="admin-section-header">
        <div className="section-title-wrap">
          <h1 className="admin-page-title">Verificación de Identidad</h1>
          <p className="admin-page-subtitle">
            Revisa documentos y confirma la identidad antes de habilitar campañas
          </p>
        </div>
      </div>

      {/* 2. Unified Toolbar: Search + Status Filter + Queue Pills (OUTSIDE table card) */}
      <div className="admin-outside-toolbar">
        {/* Search Input & Status Filter */}
        <div className="search-filter-cluster">
          <div className="search-input-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Buscar por nombre, CI o entidad..."
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
              className={`filter-btn ${showFilterDropdown ? 'active' : ''}`}
              onClick={() => setShowFilterDropdown(!showFilterDropdown)}
              title="Filtrar por estado"
            >
              <Filter size={18} />
              {selectedStatusFilter !== 'all' && <span className="filter-active-indicator" />}
            </button>

            {showFilterDropdown && (
              <div className="filter-menu dropdown-portal-fixed">
                <button
                  type="button"
                  className={`filter-option ${selectedStatusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStatusFilter('all');
                    setShowFilterDropdown(false);
                  }}
                >
                  Todos los estados
                </button>
                <button
                  type="button"
                  className={`filter-option ${selectedStatusFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStatusFilter('pending');
                    setShowFilterDropdown(false);
                  }}
                >
                  Pendientes
                </button>
                <button
                  type="button"
                  className={`filter-option ${selectedStatusFilter === 'requires_documentation' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStatusFilter('requires_documentation');
                    setShowFilterDropdown(false);
                  }}
                >
                  Requiere Documentación
                </button>
                <button
                  type="button"
                  className={`filter-option ${selectedStatusFilter === 'verified' ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedStatusFilter('verified');
                    setShowFilterDropdown(false);
                  }}
                >
                  Verificados
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Queue Pills */}
        <div className="queue-pill-group role-pills-row">
          <button
            type="button"
            className={`queue-pill ${activeQueue === 'sponsor' ? 'active' : ''}`}
            onClick={() => {
              setActiveQueue('sponsor');
              setCurrentPage(1);
            }}
          >
            Cola KYC (Personas naturales)
            {counts.kycCount !== null ? ` (${counts.kycCount})` : ''}
          </button>
          <button
            type="button"
            className={`queue-pill ${activeQueue === 'creator' ? 'active' : ''}`}
            onClick={() => {
              setActiveQueue('creator');
              setCurrentPage(1);
            }}
          >
            Cola KYB (Organizaciones/ONGs)
            {counts.kybCount !== null ? ` (${counts.kybCount})` : ''}
          </button>
        </div>
      </div>

      {/* 3. Table Card (Contains ONLY the Table) */}
      <div className="admin-table-card">
        <div className="verification-table-container">
          <table className="verification-table">
            <thead>
              <tr>
                <th
                  style={{ width: '32%', cursor: 'pointer' }}
                  onClick={() => handleVerificationSort('name')}
                  className="th-sortable"
                  title="Ordenar por Nombre / Organización"
                >
                  <div className="th-content">
                    <span>Nombre / Organizacion</span>
                    {renderKycSortIndicator('name')}
                  </div>
                </th>
                <th
                  style={{ width: '22%', cursor: 'pointer' }}
                  onClick={() => handleVerificationSort('ciDocument')}
                  className="th-sortable"
                  title="Ordenar por CI / Documento"
                >
                  <div className="th-content">
                    <span>Nro de CI</span>
                    {renderKycSortIndicator('ciDocument')}
                  </div>
                </th>
                <th
                  style={{ width: '24%', cursor: 'pointer' }}
                  onClick={() => handleVerificationSort('submissionDate')}
                  className="th-sortable"
                  title="Ordenar por Fecha de envío"
                >
                  <div className="th-content">
                    <span>Fecha de envio</span>
                    {renderKycSortIndicator('submissionDate')}
                  </div>
                </th>
                <th
                  style={{ width: '22%', cursor: 'pointer' }}
                  onClick={() => handleVerificationSort('status')}
                  className="th-sortable"
                  title="Ordenar por Estado"
                >
                  <div className="th-content">
                    <span>Estado</span>
                    {renderKycSortIndicator('status')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    <div className="loading-spinner-row">
                      <span className="spinner-dot"></span> Cargando solicitudes de verificación...
                    </div>
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={4} className="empty-state" role="alert">
                    {loadError}{' '}
                    <button type="button" className="queue-pill" onClick={refresh}>
                      Reintentar
                    </button>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={4} className="empty-state">
                    No se encontraron registros en esta cola.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item: KycRowItem) => (
                  <tr
                    key={item.id}
                    className="verification-row"
                    onClick={() => handleOpenDetail(item)}
                    title="Haz clic para auditar la documentación y cambiar estado"
                  >
                    <td className="td-name">
                      <strong>{item.name}</strong>
                    </td>
                    <td className="td-ci">{item.ciDocument ?? 'Sin registrar'}</td>
                    <td className="td-date">{item.submissionDate ?? 'Sin envío'}</td>
                    <td className="td-status">
                      <KycStatusBadge status={item.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="table-card-accent-footer"></div>
        </div>
      </div>

      {/* Sole Bottom Pagination Bar */}
      <DynamicPagination
        currentPage={currentPage}
        totalPages={paginationMeta.totalPages}
        onPageChange={(page) => setCurrentPage(page)}
      />

      {/* KYC / KYB Document Review Modal */}
      <KycDetailModal
        isOpen={isModalOpen}
        item={selectedItem}
        onClose={() => setIsModalOpen(false)}
        onUpdateStatus={handleUpdateStatus}
        isLoadingDocuments={isLoadingDetail}
        documentsError={detailError}
        onRetryDocuments={retryDetail}
        updateError={updateError}
      />
    </>
  );
};
