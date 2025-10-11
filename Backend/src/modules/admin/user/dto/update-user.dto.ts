// Backend/src/modules/admin/user/dto/update-user.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsBoolean, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ProfileDataDto } from 'src/modules/auth/dto/register.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  roleId?: string; // Puede ser UUID o nombre de rol
  
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isEmailVerified?: boolean;

  // Datos del perfil opcionales
  @IsOptional()
  @ValidateNested()
  @Type(() => ProfileDataDto)
  profile?: ProfileDataDto;
}