import { PrismaModule } from "@/modules/prisma/prisma.module";
import { TeamsUsersController } from "@/modules/teams/users/controllers/teams-users.controller";
import { TeamsUsersService } from "@/modules/teams/users/services/teams-users.service";
import { TeamsUsersRepository } from "@/modules/teams/users/teams-users.repository";
import { Module } from "@nestjs/common";

@Module({
  imports: [PrismaModule],
  controllers: [TeamsUsersController],
  providers: [TeamsUsersService, TeamsUsersRepository],
  exports: [TeamsUsersService, TeamsUsersRepository],
})
export class TeamsUsersModule {}