import { IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  tenantId!: string;

  @IsString()
  phone!: string;

  @IsString()
  applianceType!: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsString()
  @MinLength(2)
  symptom!: string;

  @IsIn(['low', 'medium', 'high', 'emergency', 'unknown'])
  urgency!: 'low' | 'medium' | 'high' | 'emergency' | 'unknown';

  @IsIn(['ru', 'en', 'unknown'])
  language!: 'ru' | 'en' | 'unknown';

  @IsOptional()
  @IsString()
  address?: string;
}
