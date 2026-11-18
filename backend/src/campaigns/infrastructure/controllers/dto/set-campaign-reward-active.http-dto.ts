import { IsBoolean } from 'class-validator';

export class SetCampaignRewardActiveHttpDto {
  @IsBoolean({ message: 'isActive debe ser verdadero o falso.' })
  isActive!: boolean;
}
