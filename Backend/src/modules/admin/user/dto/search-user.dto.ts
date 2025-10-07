import { IsOptional, IsString, IsUUID, IsBoolean } from 'class-validator';

export class SearchUserDto {
  @IsOptional()
  @IsString()
  searchTerm?: string; // Buscar en name, email, phone

  @IsOptional()
  @IsUUID('4')
  roleId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  @IsOptional()
  @IsBoolean()
  hasProfile?: boolean;
}