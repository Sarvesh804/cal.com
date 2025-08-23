import { TeamsUsersRepository } from "@/modules/teams/users/teams-users.repository";
import { Injectable, ForbiddenException } from "@nestjs/common";

@Injectable()
export class TeamsUsersService {
  constructor(private readonly teamsUsersRepository: TeamsUsersRepository) {}

  async getUsers(
    teamId: number,
    emailInput?: string[],
    filters?: {
      assignedOptionIds?: string[];
      attributeQueryOperator?: "AND" | "OR" | "NONE";
    },
    skip?: number,
    take?: number
  ) {
    const emailArray = !emailInput ? [] : emailInput;

    if (filters?.assignedOptionIds && filters?.assignedOptionIds?.length) {
      return await this.teamsUsersRepository.getTeamUsersByEmailsAndAttributeFilters(
        teamId,
        {
          assignedOptionIds: filters.assignedOptionIds,
          attributeQueryOperator: filters?.attributeQueryOperator ?? "AND",
        },
        emailArray,
        skip,
        take
      );
    }

    const users = await this.teamsUsersRepository.getTeamUsersByEmails(
      teamId,
      emailArray,
      skip,
      take
    );

    return users;
  }

  async getUsersByIds(teamId: number, userIds: number[]) {
    const teamUsers = await this.teamsUsersRepository.getTeamUsersByIds(teamId, userIds);

    if (!teamUsers?.length) {
      throw new ForbiddenException("Provided user ids do not belong to the team.");
    }

    return teamUsers;
  }
}