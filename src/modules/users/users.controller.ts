import { Body, Controller, Delete, Get, Param, Patch, UseGuards, Version } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateUserDto } from '@shared/dtos/users/updateUser.dto';
import { JwtGuard } from '@shared/guards/jwt.guard';
import { User } from '@shared/schemas/user.schema';
import { TenantId } from '@shared/decorators/tenant.decorator';
import { AccountActiveGuard } from '@shared/guards/account-active.guard';
import { TenantGuard } from '@shared/guards/tenant.guard';

import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtGuard, TenantGuard, AccountActiveGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Version('1')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'The user found successfully', type: User })
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ type: User })
  @Get('/by-id/:id')
  async getUserById(@Param('id') userId: string, @TenantId() tenantId: string) {
    return await this.usersService.getUserById(userId, tenantId);
  }

  @Version('1')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ type: User })
  @Get('/by-email/:email')
  async getUserByEmail(@Param('email') email: string, @TenantId() tenantId: string) {
    return await this.usersService.getUserByEmail(email, tenantId);
  }

  @Version('1')
  @ApiBearerAuth()
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @ApiOkResponse({ type: [User] })
  @Get('/search-user/:name')
  async searchUser(@Param('name') name: string, @TenantId() tenantId: string) {
    return await this.usersService.searchUser(name, tenantId);
  }

  @Version('1')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'The user updated successfully', type: User })
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiBadRequestResponse({ description: 'The user update failed' })
  @Patch(':id')
  async updateUser(
    @Param('id') userId: string,
    @TenantId() tenantId: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.usersService.update(userId, tenantId, updateUserDto);
  }

  @Version('1')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User deleted successfully', type: User })
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'User not found' })
  @Delete(':id')
  async deleteUser(@Param('id') userId: string, @TenantId() tenantId: string) {
    return await this.usersService.delete(userId, tenantId);
  }
}
