import { MiddlewareConsumer, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { LoggerMiddleware } from '@shared/middlewares/logger.middleware';
import { CacheModule } from '@nestjs/cache-manager';
import constants from 'src/contants';

import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.env'],
    }),
    MongooseModule.forRoot(constants.MONGO_STRING_CONNECTION, {
      dbName: constants.MONGO_DB_NAME,
    }),
    CacheModule.register({
      isGlobal: true,
      store: 'splittier',
    }),
    UsersModule,
    AuthModule,
    InstitutionsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
