import { IsOptional, IsString } from 'class-validator';

/**
 * Public list query. Status and ownerUserId are not accepted:
 * the controller always forces status=published.
 */
export class FilterCampaignsHttpDto {
  @IsOptional()
  @IsString()
  category?: string;
}
