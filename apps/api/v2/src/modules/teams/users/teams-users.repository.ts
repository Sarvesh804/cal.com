import { PrismaReadService } from "@/modules/prisma/prisma-read.service";
import { PrismaWriteService } from "@/modules/prisma/prisma-write.service";
import { Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";

@Injectable()
export class TeamsUsersRepository {
  constructor(private readonly dbRead: PrismaReadService, private readonly dbWrite: PrismaWriteService) {}

  private filterOnTeamMembership(teamId: number) {
    return {
      memberships: {
        some: {
          teamId: teamId,
          accepted: true,
        },
      },
    };
  }

  async getTeamUsersByEmailsAndAttributeFilters(
    teamId: number,
    filters: {
      assignedOptionIds: string[];
      attributeQueryOperator?: "AND" | "OR" | "NONE";
    },
    emailArray?: string[],
    skip?: number,
    take?: number
  ) {
    const { assignedOptionIds, attributeQueryOperator } = filters ?? {};
    const attributeToUsersWithMembership = await this.dbRead.prisma.attributeToUser.findMany({
      include: {
        member: { 
          include: { 
            user: { 
              include: { 
                memberships: { 
                  where: { 
                    teamId: teamId,
                    accepted: true 
                  } 
                } 
              } 
            } 
          } 
        },
      },
      distinct: ["memberId"],
      where: {
        member: {
          teamId: teamId,
          accepted: true,
          // Filter to only get users which have ALL of the assigned attribute options
          ...(attributeQueryOperator === "AND" && {
            AND: assignedOptionIds.map((optionId) => ({
              AttributeToUser: { some: { attributeOptionId: optionId } },
            })),
          }),
          ...(emailArray && emailArray.length && {
            user: { email: { in: emailArray } }
          }),
        },
        // Filter to get users which have AT LEAST ONE of the assigned attribute options
        ...(attributeQueryOperator === "OR" && {
          attributeOption: { id: { in: assignedOptionIds } },
        }),
        // Filter to get users that have NONE of the assigned attribute options
        ...(attributeQueryOperator === "NONE" && {
          NOT: {
            attributeOption: { id: { in: assignedOptionIds } },
          },
        }),
      },
      skip,
      take,
    });
    return attributeToUsersWithMembership.map((attributeToUser) => attributeToUser.member.user);
  }

  async getTeamUsersByEmails(
    teamId: number,
    emailArray?: string[],
    skip?: number,
    take?: number
  ) {
    return await this.dbRead.prisma.user.findMany({
      where: {
        ...this.filterOnTeamMembership(teamId),
        ...(emailArray && emailArray.length ? { email: { in: emailArray } } : {}),
      },
      include: {
        memberships: {
          where: {
            teamId: teamId,
            accepted: true,
          },
        },
      },
      skip,
      take,
    });
  }

  async getTeamUsersByIds(teamId: number, userIds: number[]) {
    return await this.dbRead.prisma.user.findMany({
      where: {
        memberships: {
          some: {
            teamId: teamId,
            userId: { in: userIds },
            accepted: true,
          },
        },
      },
      include: {
        memberships: {
          where: {
            teamId: teamId,
            accepted: true,
          },
        },
      },
    });
  }

  async getTeamUserByEmail(teamId: number, email: string) {
    return await this.dbRead.prisma.user.findFirst({
      where: {
        email,
        ...this.filterOnTeamMembership(teamId),
      },
      include: {
        memberships: {
          where: {
            teamId: teamId,
            accepted: true,
          },
        },
      },
    });
  }
}