import type { FC } from 'react';
import { useState } from 'react';
import {
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { usersApi, type UserDto } from '../../../shared/api/usersApi.ts';
import { getApiErrorMessage } from '../../auth/utils/getApiErrorMessage.ts';

export interface DeactivateUserModalProps {
  isOpen: boolean;
  user: UserDto | null;
  onClose: () => void;
  onSuccess: (updatedUser: UserDto) => void;
}

interface DeactivateUserModalContentProps {
  user: UserDto;
  onClose: () => void;
  onSuccess: (updatedUser: UserDto) => void;
}

const DeactivateUserModalContent: FC<DeactivateUserModalContentProps> = ({
  user,
  onClose,
  onSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleConfirm = async () => {
    setIsProcessing(true);
    setErrorMessage(null);
    setProgress(15);
    setStatusMessage('Validando permisos y revocando accesos...');

    try {
      await new Promise((res) => setTimeout(res, 400));
      setProgress(55);
      setStatusMessage('Actualizando estado en base de datos...');

      const updatedUser = await usersApi.updateUserStatus(user.id, 'inactive');

      setProgress(100);
      setIsSuccess(true);
      setStatusMessage('¡Usuario eliminado exitosamente!');

      setTimeout(() => {
        onSuccess(updatedUser);
        onClose();
      }, 700);
    } catch (err: unknown) {
      setIsProcessing(false);
      setErrorMessage(getApiErrorMessage(err, 'Error al procesar la solicitud.'));
    }
  };

  return (
    <div className="kyc-modal-overlay" onClick={() => !isProcessing && onClose()}>
      <div className="deactivate-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="deactivate-modal-header header-danger">
          <div className="deactivate-header-icon-box">
            <Trash2 size={22} />
          </div>
          <div className="deactivate-header-title-wrap">
            <h3 className="deactivate-modal-title">Eliminar Usuario</h3>
            <span className="deactivate-modal-sub">Confirmación de borrado</span>
          </div>
          {!isProcessing && (
            <button
              type="button"
              className="kyc-modal-close-btn"
              onClick={onClose}
              title="Cerrar"
            >
              <X size={18} />
            </button>
          )}
        </div>

        <div className="deactivate-modal-body">
          <div className="deactivate-user-capsule">
            <div className="capsule-avatar-circle">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.fullName} className="capsule-avatar-img" />
              ) : (
                <span>{user.fullName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <div className="capsule-user-details">
              <span className="capsule-name">{user.fullName}</span>
              <span className="capsule-meta">{user.email} • Rol: {user.role}</span>
            </div>
          </div>

          {errorMessage && (
            <div className="form-error-banner">
              <AlertTriangle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {!isProcessing ? (
            <div className="deactivate-warning-box">
              <div className="warning-icon-col">
                <ShieldAlert size={20} className="text-rose" />
              </div>
              <div className="warning-text-col">
                <span className="warning-title">
                  ¿Confirmas que deseas eliminar a {user.fullName}?
                </span>
              </div>
            </div>
          ) : (
            <div className="process-simulator-container">
              <div className="simulator-header-row">
                <span className="simulator-status-text">
                  {isSuccess ? (
                    <span className="status-success-inline">
                      <CheckCircle2 size={16} />
                      {statusMessage}
                    </span>
                  ) : (
                    <span className="status-loading-inline">
                      <Loader2 size={16} className="spin-icon" />
                      {statusMessage}
                    </span>
                  )}
                </span>
                <span className="simulator-percent-badge">{progress}%</span>
              </div>

              <div className="simulator-progress-track">
                <div
                  className={`simulator-progress-bar bar-rose ${isSuccess ? 'bar-done' : ''}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="simulator-steps-indicator">
                <div className={`step-dot ${progress >= 15 ? 'active' : ''}`}>1. Validar</div>
                <div className={`step-dot ${progress >= 55 ? 'active' : ''}`}>2. Base de Datos</div>
                <div className={`step-dot ${progress >= 100 ? 'active' : ''}`}>3. Finalizar</div>
              </div>
            </div>
          )}
        </div>

        {!isProcessing && (
          <div className="deactivate-modal-footer">
            <button
              type="button"
              className="action-btn secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="action-btn btn-danger-confirm"
              onClick={handleConfirm}
            >
              <Trash2 size={16} />
              <span>Eliminar Usuario</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const DeactivateUserModal: FC<DeactivateUserModalProps> = ({
  isOpen,
  user,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !user) return null;
  return (
    <DeactivateUserModalContent
      key={user.id}
      user={user}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
