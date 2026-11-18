import { IsObject, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class CampaignReviewSectionNotesHttpDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  generalInfo?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  storyImpact?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  planBudget?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  funding?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  cover?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  rewards?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  other?: string;
}

export class ReviewCampaignHttpDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'Las observaciones deben ser texto.' })
  @MaxLength(1000, { message: 'Las observaciones no pueden exceder 1000 caracteres.' })
  notes?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsOptional()
  @IsString({ message: 'El motivo de rechazo debe ser texto.' })
  @MaxLength(1000, { message: 'El motivo de rechazo no puede exceder 1000 caracteres.' })
  rejectionReason?: string;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => CampaignReviewSectionNotesHttpDto)
  sectionNotes?: CampaignReviewSectionNotesHttpDto;
}
