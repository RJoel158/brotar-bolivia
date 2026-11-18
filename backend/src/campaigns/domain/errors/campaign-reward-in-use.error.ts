/** Raised by the repository when a reward has contributions and cannot change. */
export class CampaignRewardInUseError extends Error {
  constructor() {
    super('La recompensa tiene aportes asociados: no se puede editar ni eliminar.');
    this.name = 'CampaignRewardInUseError';
  }
}
