import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import RegisterUserDto from '@shared/dtos/auth/registerUser.dto';
import { UpdateUserDto } from '@shared/dtos/users/updateUser.dto';
import ResendProvider, { emailType } from '@shared/providers/resend.provider';
import { AccountStatus, User, UserDocument } from '@shared/schemas/user.schema';
import { generateOTP } from '@shared/utils/generateOTP';
import { hashPassword } from '@shared/utils/hashPassword';
import { DateTime } from 'luxon';
import { Model } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly resendProvider: ResendProvider,
  ) {}

  async create(registerUser: RegisterUserDto, tenantId: string, sendEmail = true): Promise<User> {
    try {
      const otpCode = generateOTP();
      const newUser = new this.userModel({
        email: registerUser.email,
        firstName: registerUser.firstName,
        tenantId,
        otpCode,
        otpExpire: DateTime.now().plus({ minutes: 5 }).toUTC().toJSDate(),
        accountStatus: AccountStatus.PENDING_VERIFICATION,
      });

      if (sendEmail) {
        await this.resendProvider.sendTemplateEmail({
          type: emailType.CODE_VERIFICATION,
          email: registerUser.email,
          subject: 'Código de verificación de tu cuenta Lumina',
          param: {
            code: otpCode,
          },
        });
      }

      return await newUser.save();
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async getUserByEmail(email: string, tenantId?: string): Promise<UserDocument> {
    try {
      const query: any = { email, deletedAt: null };

      if (tenantId) {
        query.tenantId = tenantId;
      }

      const user = await this.userModel.findOne(query);

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async getUserByEmailWithoutValidation(
    email: string,
    tenantId?: string,
  ): Promise<UserDocument | null> {
    try {
      const query: any = { email, deletedAt: null };

      if (tenantId) {
        query.tenantId = tenantId;
      }

      return await this.userModel.findOne(query);
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async getUserById(userId: string, tenantId: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({
        _id: userId,
        tenantId,
        deletedAt: null,
      });

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async update(userId: string, tenantId: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      let password: string;

      if (updateUserDto?.password) {
        password = await hashPassword(updateUserDto.password);
      }

      const updateUser = await this.userModel.findOneAndUpdate(
        {
          _id: userId,
          tenantId,
          deletedAt: null,
        },
        {
          ...updateUserDto,
          password,
        },
        {
          new: true,
        },
      );

      if (!updateUser) {
        throw new HttpException('USER NOT FOUND OR UNAUTHORIZED', HttpStatus.FORBIDDEN);
      }

      return updateUser;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(userId: string, tenantId: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({
        _id: userId,
        tenantId,
      });

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return await this.userModel.findOneAndUpdate(
        {
          _id: userId,
          tenantId,
        },
        {
          firstName: `anonymous${userId}`,
          email: `anonymous-${user._id.toString()}@anonymous.com`,
          deletedAt: DateTime.now().toJSDate().toISOString(),
        },
        {
          new: true,
        },
      );
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async searchUser(name: string, tenantId: string): Promise<User[]> {
    try {
      const users = await this.userModel.find({
        tenantId,
        firstName: {
          $regex: name,
          $options: 'i',
        },
        deletedAt: null,
      });

      if (users.length === 0) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return users;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
}
