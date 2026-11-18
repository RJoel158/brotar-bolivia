import { useState, useEffect, useCallback } from 'react';
import { usersApi, type UserDto, type PaginationMeta } from '../../../shared/api/index.ts';

export type UserSortField = 'name' | 'role' | 'documentId' | 'kycStatus' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export function useUsersManagement() {
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedKycStatus, setSelectedKycStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [sortField, setSortField] = useState<UserSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [paginationMeta, setPaginationMeta] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);

  const requestUsers = useCallback(async () => {
    return usersApi.getUsers({
      role: selectedRole !== 'all' ? selectedRole : undefined,
      kycStatus: selectedKycStatus !== 'all' ? selectedKycStatus : undefined,
      search: searchQuery || undefined,
      page: currentPage,
      limit: pageSize,
    });
  }, [selectedRole, selectedKycStatus, searchQuery, currentPage, pageSize]);


  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await requestUsers();
      if (response.data) {
        setUsers(response.data);
        setPaginationMeta(response.meta);
      }
    } catch {
      // Graceful error state
    } finally {
      setIsLoading(false);
    }
  }, [requestUsers]);

  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        const response = await requestUsers();
        if (cancelled) {
          return;
        }
        if (response.data) {
          setUsers(response.data);
          setPaginationMeta(response.meta);
        }
      } catch {
        // Graceful error state
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadUsers();

    return () => {
      cancelled = true;
    };
  }, [requestUsers]);

  const handleSort = (field: UserSortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    let comparison: number;
    switch (sortField) {
      case 'name': {
        const nameA = (a.organizationName || a.fullName).toLowerCase();
        const nameB = (b.organizationName || b.fullName).toLowerCase();
        comparison = nameA.localeCompare(nameB);
        break;
      }
      case 'role':
        comparison = a.role.localeCompare(b.role);
        break;
      case 'documentId': {
        const docA = (a.documentId || a.phone || '').toLowerCase();
        const docB = (b.documentId || b.phone || '').toLowerCase();
        comparison = docA.localeCompare(docB);
        break;
      }
      case 'kycStatus':
        comparison = a.kycStatus.localeCompare(b.kycStatus);
        break;
      case 'createdAt':
      default:
        comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const handleOpenUserDetail = (user: UserDto) => {
    setSelectedUser(user);
    setIsDetailModalOpen(true);
  };

  return {
    selectedRole,
    setSelectedRole,
    selectedKycStatus,
    setSelectedKycStatus,
    searchQuery,
    setSearchQuery,
    currentPage,
    setCurrentPage,
    paginationMeta,
    users: sortedUsers,
    sortField,
    sortDirection,
    handleSort,
    isLoading,
    selectedUser,
    isDetailModalOpen,
    setIsDetailModalOpen,
    handleOpenUserDetail,
    refresh: fetchUsers,
  };
}
