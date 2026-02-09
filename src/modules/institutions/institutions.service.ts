import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Institution, InstitutionDocument } from '@shared/schemas/institution.schema';
import { CreateInstitutionDto } from '@shared/dtos/institutions/createInstitution.dto';
import { UpdateInstitutionDto } from '@shared/dtos/institutions/updateInstitution.dto';
import { DateTime } from 'luxon';

@Injectable()
export class InstitutionsService {
  constructor(
    @InjectModel(Institution.name)
    private readonly institutionModel: Model<InstitutionDocument>,
  ) {}

  async create(createInstitutionDto: CreateInstitutionDto): Promise<Institution> {
    try {
      // Verificar si el slug ya existe
      const existingSlug = await this.institutionModel.findOne({
        slug: createInstitutionDto.slug,
        deletedAt: null,
      });

      if (existingSlug) {
        throw new HttpException('SLUG_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }

      // Verificar si el email ya existe
      const existingEmail = await this.institutionModel.findOne({
        email: createInstitutionDto.email,
        deletedAt: null,
      });

      if (existingEmail) {
        throw new HttpException('EMAIL_ALREADY_EXISTS', HttpStatus.CONFLICT);
      }

      const newInstitution = new this.institutionModel({
        ...createInstitutionDto,
        trialEndsAt: DateTime.now().plus({ days: 30 }).toJSDate(),
      });

      return await newInstitution.save();
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(): Promise<Institution[]> {
    try {
      return await this.institutionModel.find({ deletedAt: null }).exec();
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: string): Promise<Institution> {
    try {
      const institution = await this.institutionModel.findOne({
        _id: id,
        deletedAt: null,
      });

      if (!institution) {
        throw new HttpException('INSTITUTION_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      return institution;
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async findBySlug(slug: string): Promise<Institution> {
    try {
      const institution = await this.institutionModel.findOne({
        slug,
        deletedAt: null,
      });

      if (!institution) {
        throw new HttpException('INSTITUTION_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      return institution;
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async update(id: string, updateInstitutionDto: UpdateInstitutionDto): Promise<Institution> {
    try {
      const institution = await this.institutionModel.findOneAndUpdate(
        { _id: id, deletedAt: null },
        updateInstitutionDto,
        { new: true },
      );

      if (!institution) {
        throw new HttpException('INSTITUTION_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      return institution;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(id: string): Promise<Institution> {
    try {
      const institution = await this.institutionModel.findOne({
        _id: id,
      });

      if (!institution) {
        throw new HttpException('INSTITUTION_NOT_FOUND', HttpStatus.NOT_FOUND);
      }

      return await this.institutionModel.findOneAndUpdate(
        { _id: id },
        {
          deletedAt: DateTime.now().toJSDate(),
          isActive: false,
        },
        { new: true },
      );
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }
}
