import { IsNotEmpty, IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateSeatStackDto {
  @IsString()
  @IsNotEmpty()
  @Length(2,100)
  @Matches(/\S/, {
    message: 'Las comodidades no pueden contener solo espacios',
  })
  name: string;

  @IsOptional()
  @IsString()
  @Length(2,100)
  @Matches(/\S/, {
    message: 'Las comodidades no pueden contener solo espacios',
  })
  description?: string;
  
}
