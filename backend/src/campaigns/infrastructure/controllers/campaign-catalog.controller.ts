import { GetCampaignHomeUseCase } from '../../application/use-cases/get-campaign-home.use-case';
import { Controller, Get, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { Type, Transform } from 'class-transformer';
import { IsIn, IsUUID, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { GetCampaignCatalogUseCase } from '../../application/use-cases/get-campaign-catalog.use-case';
import { CAMPAIGN_CATEGORIES } from '../../domain/value-objects/campaign-category.vo';

export class CatalogQuery {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(48) limit?: number;
  @IsOptional() @IsIn(CAMPAIGN_CATEGORIES) category?: string;
  @IsOptional() @IsString() @MaxLength(120) @Transform(({ value }) => typeof value === 'string' ? value.trim() : value) query?: string;
  @IsOptional() @IsUUID() cursor?: string;
}

@Controller('campaigns')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class CampaignCatalogController {
  constructor(private readonly catalog: GetCampaignCatalogUseCase, private readonly home: GetCampaignHomeUseCase) {}
  @Get('home')
  summary() { return this.home.execute(); }
  @Get('catalog')
  list(@Query() query: CatalogQuery) { return this.catalog.execute(query); }
}
