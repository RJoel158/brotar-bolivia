import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class PaginationHttpDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class ListPaymentsHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsIn(['pending', 'confirmed', 'expired', 'failed', 'refunded', 'cancelled'])
  status?: string;
}

export class ListDiscrepanciesHttpDto {
  @IsOptional()
  @IsIn(['pending', 'resolved', 'ignored'])
  status?: string;
}

export class ResolveDiscrepancyHttpDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class ListDisbursementsHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsIn(['pending', 'approved', 'processing', 'completed', 'failed', 'rejected'])
  status?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;
}

export class ReviewDisbursementHttpDto {
  @IsIn(['approved', 'rejected', 'completed'])
  decision!: 'approved' | 'rejected' | 'completed';

  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}

export class ListDisputesHttpDto extends PaginationHttpDto {
  @IsOptional()
  @IsIn(['open', 'in_review', 'resolved', 'rejected'])
  status?: string;
}

export class ReplyDisputeHttpDto {
  @IsString()
  @MaxLength(2000)
  body!: string;
}

export class ResolveDisputeHttpDto {
  @IsIn(['resolved', 'in_review'])
  decision!: 'resolved' | 'in_review';

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  resolution?: string;
}
