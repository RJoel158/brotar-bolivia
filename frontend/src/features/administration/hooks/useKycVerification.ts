import { useState, useEffect, useCallback } from 'react';
import { usersApi, type KycStatusType, type UserDto, type PaginationMeta } from '../../../shared/api/index.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';
import { kycSubmittedAtWithEvidence } from '../../kyc/kycEvidence.ts';
import type { KycQueueType, KycRowItem } from '../types/admin.types.ts';

const EMPTY_META: PaginationMeta = { total: 0, page: 1, limit: 10, totalPages: 1 };

/** Listing rows never keep document images; the detail fetches them on demand. */
function toKycRow(user: UserDto): KycRowItem {
  const submittedAtIso = kycSubmittedAtWithEvidence(user);
  const { documentFrontUrl, documentBackUrl, ...rest } = user;
  return {
    id: user.id,
    name: user.organizationName || user.fullName,
    ciDocument: user.documentId || null,
    submissionDate: submittedAtIso
      ? new Date(submittedAtIso).toLocaleDateString('es-ES', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      : null,
    submittedAtIso,
    status: user.kycStatus,
    role: user.role === 'creator' ? 'creator' : 'sponsor',
    email: user.email,
    phone: user.phone,
    rawUser: {
      ...rest,
      hasDocumentFront: user.hasDocumentFront ?? Boolean(documentFrontUrl),
      hasDocumentBack: user.hasDocumentBack ?? Boolean(documentBackUrl),
    },
  };
}

interface QueueResult {
  key: string;
  items: KycRowItem[];
  meta: PaginationMeta;
  error: string | null;
}

interface DetailState {
  id: string;
  isLoading: boolean;
  error: string | null;
}

export function useKycVerification() {
  const [activeQueue, setActiveQueue] = useState<KycQueueType>('sponsor');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [reloadToken, setReloadToken] = useState(0);
  const [queueResult, setQueueResult] = useState<QueueResult | null>(null);
  const [counts, setCounts] = useState<{ kycCount: number | null; kybCount: number | null }>({
    kycCount: null,
    kybCount: null,
  });
  const [selectedItem, setSelectedItem] = useState<KycRowItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [detail, setDetail] = useState<DetailState | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);

  const requestKey = `${activeQueue}|${searchQuery}|${currentPage}|${pageSize}|${reloadToken}`;
  const isLoading = queueResult?.key !== requestKey;

  useEffect(() => {
    let cancelled = false;
    const key = `${activeQueue}|${searchQuery}|${currentPage}|${pageSize}|${reloadToken}`;

    void (async () => {
      try {
        const response = await usersApi.getUsers({
          role: activeQueue,
          search: searchQuery || undefined,
          page: currentPage,
          limit: pageSize,
        });
        if (!cancelled) {
          setQueueResult({ key, items: response.data.map(toKycRow), meta: response.meta, error: null });
        }
      } catch (error) {
        if (!cancelled) {
          setQueueResult({
            key,
            items: [],
            meta: EMPTY_META,
            error: getApiErrorMessage(error, 'No se pudieron cargar las solicitudes de verificación.'),
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeQueue, searchQuery, currentPage, pageSize, reloadToken]);

  useEffect(() => {
    let cancelled = false;
    const countRole = async (role: KycQueueType): Promise<number | null> => {
      try {
        return (await usersApi.getUsers({ role, page: 1, limit: 1 })).meta.total;
      } catch {
        return null;
      }
    };

    void (async () => {
      const [kycCount, kybCount] = await Promise.all([countRole('sponsor'), countRole('creator')]);
      if (!cancelled) {
        setCounts({ kycCount, kybCount });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refresh = useCallback(() => setReloadToken((token) => token + 1), []);

  const loadDetail = useCallback(async (item: KycRowItem) => {
    if (!item.rawUser.hasDocumentFront && !item.rawUser.hasDocumentBack) {
      setDetail({ id: item.id, isLoading: false, error: null });
      return;
    }
    setDetail({ id: item.id, isLoading: true, error: null });
    try {
      const fullUser = await usersApi.getUserById(item.id);
      setSelectedItem((current) =>
        current?.id === item.id ? { ...current, rawUser: { ...current.rawUser, ...fullUser } } : current,
      );
      setDetail((current) =>
        current?.id === item.id ? { id: item.id, isLoading: false, error: null } : current,
      );
    } catch (error) {
      setDetail((current) =>
        current?.id === item.id
          ? {
              id: item.id,
              isLoading: false,
              error: getApiErrorMessage(error, 'No se pudieron cargar los documentos del expediente.'),
            }
          : current,
      );
    }
  }, []);

  const handleOpenDetail = (item: KycRowItem) => {
    setSelectedItem(item);
    setUpdateError(null);
    setIsModalOpen(true);
    void loadDetail(item);
  };

  const retryDetail = () => {
    if (selectedItem) {
      void loadDetail(selectedItem);
    }
  };

  /** Resolves to `true` only when the backend accepted the change. */
  const handleUpdateStatus = async (
    id: string,
    newStatus: KycStatusType,
    notes?: string,
    reason?: string,
  ): Promise<boolean> => {
    setUpdateError(null);
    try {
      const updated = await usersApi.updateKycStatus(id, newStatus, notes, reason);
      const updatedRow = toKycRow(updated);
      setQueueResult((current) =>
        current
          ? { ...current, items: current.items.map((item) => (item.id === id ? updatedRow : item)) }
          : current,
      );
      setIsModalOpen(false);
      return true;
    } catch (error) {
      setUpdateError(getApiErrorMessage(error, 'No se pudo actualizar el estado de verificación.'));
      return false;
    }
  };

  const isSelectedDetail = detail !== null && detail.id === selectedItem?.id;

  return {
    activeQueue,
    setActiveQueue,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    paginationMeta: isLoading ? EMPTY_META : (queueResult?.meta ?? EMPTY_META),
    items: isLoading ? [] : (queueResult?.items ?? []),
    loadError: isLoading ? null : (queueResult?.error ?? null),
    counts,
    isLoading,
    selectedItem,
    isModalOpen,
    setIsModalOpen,
    handleOpenDetail,
    handleUpdateStatus,
    isLoadingDetail: isSelectedDetail ? detail.isLoading : false,
    detailError: isSelectedDetail ? detail.error : null,
    retryDetail,
    updateError,
    refresh,
  };
}
