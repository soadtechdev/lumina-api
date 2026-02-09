import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Version,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { JwtGuard } from '@shared/guards/jwt.guard';
import { Institution } from '@shared/schemas/institution.schema';
import { CreateInstitutionDto } from '@shared/dtos/institutions/createInstitution.dto';
import { UpdateInstitutionDto } from '@shared/dtos/institutions/updateInstitution.dto';

import { InstitutionsService } from './institutions.service';

@ApiTags('institutions')
@Controller('institutions')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Version('1')
  @Post()
  @ApiCreatedResponse({
    description: 'Institution created successfully',
    type: Institution,
  })
  @ApiBadRequestResponse({ description: 'Invalid data' })
  async create(@Body() createInstitutionDto: CreateInstitutionDto) {
    return await this.institutionsService.create(createInstitutionDto);
  }

  @Version('1')
  @Get()
  @ApiOkResponse({
    description: 'List of all institutions',
    type: [Institution],
  })
  async findAll() {
    return await this.institutionsService.findAll();
  }

  @Version('1')
  @Get(':id')
  @ApiOkResponse({
    description: 'Institution found',
    type: Institution,
  })
  @ApiNotFoundResponse({ description: 'Institution not found' })
  async findOne(@Param('id') id: string) {
    return await this.institutionsService.findOne(id);
  }

  @Version('1')
  @Get('slug/:slug')
  @ApiOkResponse({
    description: 'Institution found by slug',
    type: Institution,
  })
  @ApiNotFoundResponse({ description: 'Institution not found' })
  async findBySlug(@Param('slug') slug: string) {
    return await this.institutionsService.findBySlug(slug);
  }

  @Version('1')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOkResponse({
    description: 'Institution updated successfully',
    type: Institution,
  })
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'Institution not found' })
  async update(@Param('id') id: string, @Body() updateInstitutionDto: UpdateInstitutionDto) {
    return await this.institutionsService.update(id, updateInstitutionDto);
  }

  @Version('1')
  @UseGuards(JwtGuard)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOkResponse({
    description: 'Institution deleted successfully',
    type: Institution,
  })
  @ApiUnauthorizedResponse({ description: 'Token invalid' })
  @ApiNotFoundResponse({ description: 'Institution not found' })
  async delete(@Param('id') id: string) {
    return await this.institutionsService.delete(id);
  }
}
