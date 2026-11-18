import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './shared/persistence/prisma.module';
import { CampaignsModule } from './campaigns/campaigns.module';
import { UsersModule } from './users/users.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FinanceModule } from './finance/finance.module';
import { ContributionsModule } from './contributions/contributions.module';

@Module({
  imports: [
    PrismaModule,
    CampaignsModule,
    UsersModule,
    NotificationsModule,
    FinanceModule,
    ContributionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}