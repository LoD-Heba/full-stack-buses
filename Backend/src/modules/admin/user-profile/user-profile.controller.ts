import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserProfileService } from './user-profile.service';
import { CreateUserProfileDto } from './dto/create-user-profile.dto';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { JwtAuthGuard } from 'src/common/guard/auth.guard';
import { PermissionsGuard } from 'src/common/guard/permission.guard';
import { RolesGuard } from 'src/common/guard/role.guard';
import { Permissions } from 'src/common/decorators/permission.decorator';

@Controller('clients')
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Post()
  create(@Body() createUserProfileDto: CreateUserProfileDto) {
    return this.userProfileService.create(createUserProfileDto);
  }

  @Get()
  findAll(@Query() paginationDto: PaginationDto) {
    return this.userProfileService.findAll(paginationDto);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.userProfileService.findOne(id);
  }

  @Get(':id/with-tickets')
  findOneWithTickets(@Param('id', ParseUUIDPipe) id: string) {
    return this.userProfileService.findOneWithTickets(id);
  }

  @Get(':id/can-purchase')
  canPurchaseTickets(@Param('id', ParseUUIDPipe) id: string) {
    return this.userProfileService.canPurchaseTickets(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserProfileDto: UpdateUserProfileDto,
  ) {
    return this.userProfileService.update(id, updateUserProfileDto);
  }

  @Patch(':id/toggle-active')
  toggleActive(@Param('id', ParseUUIDPipe) id: string) {
    return this.userProfileService.toggleActive(id);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.userProfileService.remove(id);
  }
}