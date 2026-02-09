import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  Version,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UpdateUserDto } from '@shared/dtos/users/updateUser.dto';
import { JwtGuard } from '@shared/guards/jwt.guard';
import { JoiValidationPipe } from '@shared/pipes/joiValidationPipe';
import CreateUserContactDto from '@shared/dtos/users/createUserContact.dto';
import AuthenticatedRequest from '@shared/interfaces/authenticatedRequest.interface';
import { User } from '@shared/schemas/user.schema';
import { GetUserStatsDto } from '@shared/dtos/users/statsUser.dto';

import { UsersService } from './users.service';
import { createContactUserValidationSchema } from './joiSchema';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Version('1')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'The user register succesfully', type: UpdateUserDto })
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'The user register failed' })
  @ApiOkResponse({ type: User })
  @Get('/by-id/:id')
  async getUserById(@Param('id') userId: string) {
    return await this.usersService.getUserById(userId);
  }

  @Version('1')
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'The user register failed' })
  @ApiOkResponse({ type: User })
  @Get('/by-email/:email')
  async getUserByEmail(@Param('email') email: string) {
    return await this.usersService.getUserByEmail(email);
  }

  @Version('1')
  @UseGuards(JwtGuard)
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'The user register failed' })
  @ApiOkResponse({ type: User })
  @Get('/search-user/:name')
  async searchUser(@Param('name') name: string) {
    return await this.usersService.searchUser(name);
  }


  @Version('1')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'The user updated succesfully', type: UpdateUserDto })
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiBadRequestResponse({ description: 'The user register failed' })
  @ApiOkResponse({ type: User })
  @Patch(':id')
  async updateUser(@Param('id') userId: string, @Body() updateUserDto: UpdateUserDto) {
    return await this.usersService.update(userId, updateUserDto);
  }
}
