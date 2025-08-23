import { API_VERSIONS_VALUES } from "@/lib/api-versions";
import { API_KEY_HEADER } from "@/lib/docs/headers";
import { GetTeam } from "@/modules/auth/decorators/get-team/get-team.decorator";
import { Roles } from "@/modules/auth/decorators/roles/roles.decorator";
import { ApiAuthGuard } from "@/modules/auth/guards/api-auth/api-auth.guard";
import { RolesGuard } from "@/modules/auth/guards/roles/roles.guard";
import { GetTeamUsersInput } from "@/modules/teams/users/inputs/get-team-users.input";
import { GetTeamUsersResponseDTO, GetTeamUsersWithProfileOutput } from "@/modules/teams/users/outputs/get-team-users.output";
import { TeamsUsersService } from "@/modules/teams/users/services/teams-users.service";
import {
  Controller,
  UseGuards,
  Get,
  Param,
  ParseIntPipe,
  Query,
  UseInterceptors,
} from "@nestjs/common";
import { ClassSerializerInterceptor } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags as DocsTags } from "@nestjs/swagger";
import { plainToInstance } from "class-transformer";

import { SUCCESS_STATUS } from "@calcom/platform-constants";
import { Team } from "@calcom/prisma/client";

@Controller({
  path: "/v2/teams/:teamId/users",
  version: API_VERSIONS_VALUES,
})
@UseInterceptors(ClassSerializerInterceptor)
@UseGuards(ApiAuthGuard, RolesGuard)
@DocsTags("Teams / Users")
@ApiHeader(API_KEY_HEADER)
export class TeamsUsersController {
  constructor(private readonly teamsUsersService: TeamsUsersService) {}

  @Get()
  @Roles("TEAM_MEMBER")
  @ApiOperation({ summary: "Get all team users" })
  async getTeamUsers(
    @Param("teamId", ParseIntPipe) teamId: number,
    @Query() query: GetTeamUsersInput
  ): Promise<GetTeamUsersResponseDTO> {
    const { emails, assignedOptionIds, attributeQueryOperator } = query ?? {};
    const users = await this.teamsUsersService.getUsers(
      teamId,
      emails,
      { assignedOptionIds, attributeQueryOperator },
      query.skip ?? 0,
      query.take ?? 250
    );

    return {
      status: SUCCESS_STATUS,
      data: users.map((user) =>
        plainToInstance(
          GetTeamUsersWithProfileOutput,
          { ...user, profile: user?.memberships?.[0] ?? {} },
          { strategy: "excludeAll" }
        )
      ),
    };
  }
}