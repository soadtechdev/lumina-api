import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import RegisterUserDto from '@shared/dtos/auth/registerUser.dto';
import { UpdateUserDto } from '@shared/dtos/users/updateUser.dto';
import ResendProvider, { emailType } from '@shared/providers/resend.provider';
import { RegisterStep, User, UserDocument } from '@shared/schemas/user.schema';
import { generateOTP } from '@shared/utils/generateOTP';
import { hashPassword } from '@shared/utils/hashPassword';
import { DateTime } from 'luxon';
import { Model, Types } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    private readonly resendProvider: ResendProvider,
  ) {}

  async create(registerUser: RegisterUserDto, sendEmail = true): Promise<User> {
    try {
      const otpCode = generateOTP();
      const newUser = new this.userModel({
        email: registerUser.email,
        otpCode,
        otpExpire: DateTime.now().plus({ minutes: 5 }).toUTC().toJSDate(),
      });

      if (sendEmail) {
        await this.resendProvider.sendTemplateEmail({
          type: emailType.CODE_VERIFICATION,
          email: registerUser.email,
          subject: 'Código de verificación de tu cuenta Splittier',
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

  async getUserByEmail(email: string): Promise<UserDocument> {
    try {
      const user = await this.userModel.findOne({ email, deletedAt: null });

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }
  async getUserByEmailWithoutValidation(email: string): Promise<UserDocument> {
    try {
      return await this.userModel.findOne({ email, deletedAt: null });
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async getUserById(userId: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ _id: userId, deletedAt: null });

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (e) {
      throw new HttpException(e, HttpStatus.NOT_FOUND);
    }
  }

  async update(userId: string, updateUserDto: UpdateUserDto): Promise<User> {
    try {
      let password: string;

      if (updateUserDto?.password) {
        password = await hashPassword(updateUserDto?.password);
      }

      const updateUser = await this.userModel.findOneAndUpdate(
        { _id: userId, deletedAt: null },
        {
          ...updateUserDto,
          password,
        },
        {
          new: true,
        },
      );

      if (!updateUser) {
        throw new HttpException("DON'T UPDATE USER", HttpStatus.BAD_REQUEST);
      }

      if (updateUserDto?.step === RegisterStep.COMPLETED) {
        await this.resendProvider.sendTemplateEmail({
          email: updateUser?.email,
          subject: `Bienvenido a Splittier ${updateUser?.firstName ?? ''}`,
          param: {
            name: `${updateUser?.firstName}`,
          },
          type: emailType.REGISTER_SUCCESS,
        });
      }

      return updateUser;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }

  async delete(userId: string): Promise<User> {
    try {
      const user = await this.userModel.findOne({ _id: userId });

      if (!user) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return await this.userModel.findOneAndUpdate(
        {
          _id: userId,
        },
        {
          firstName: `anonymous${userId}`,
          email: `anonymous-${user?._id.toString()}@anonymous.com`,
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

  async searchUser(name: string): Promise<User[]> {
    try {
      const user = await this.userModel.aggregate([
        {
          $match: {
            firstName: {
              $regex: name,
              $options: 'i',
            },
            deletedAt: null,
          },
        },
      ]);

      if (user.length === 0) {
        throw new HttpException('USER NOT FOUND', HttpStatus.NOT_FOUND);
      }

      return user;
    } catch (e) {
      throw new HttpException(e, HttpStatus.BAD_REQUEST);
    }
  }
}
