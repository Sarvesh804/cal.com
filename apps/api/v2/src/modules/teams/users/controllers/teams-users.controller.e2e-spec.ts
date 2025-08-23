import { bootstrap } from "@/app";
import { AppModule } from "@/app.module";
import { GetTeamUsersResponseDTO } from "@/modules/teams/users/outputs/get-team-users.output";
import { INestApplication } from "@nestjs/common";
import { NestExpressApplication } from "@nestjs/platform-express";
import { Test } from "@nestjs/testing";
import { User } from "@prisma/client";
import * as request from "supertest";
import { MembershipRepositoryFixture } from "test/fixtures/repository/membership.repository.fixture";
import { TeamRepositoryFixture } from "test/fixtures/repository/team.repository.fixture";
import { UserRepositoryFixture } from "test/fixtures/repository/users.repository.fixture";
import { withApiAuth } from "test/utils/withApiAuth";

import { SUCCESS_STATUS } from "@calcom/platform-constants";
import { Membership, Team } from "@calcom/prisma/client";

describe("Teams Users Endpoints", () => {
  describe("User Authentication - User is Team Member", () => {
    let app: INestApplication;

    let userRepositoryFixture: UserRepositoryFixture;
    let teamsRepositoryFixture: TeamRepositoryFixture;
    let membershipsRepositoryFixture: MembershipRepositoryFixture;

    let team: Team;
    let teamAdminUser: User;
    let teamMemberUser: User;
    let teamAdminMembership: Membership;
    let teamMemberMembership: Membership;

    beforeAll(async () => {
      const moduleRef = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      userRepositoryFixture = new UserRepositoryFixture(moduleRef);
      teamsRepositoryFixture = new TeamRepositoryFixture(moduleRef);
      membershipsRepositoryFixture = new MembershipRepositoryFixture(moduleRef);

      teamAdminUser = await userRepositoryFixture.create({
        email: "team-admin@acme.com",
        username: "team-admin",
      });

      teamMemberUser = await userRepositoryFixture.create({
        email: "team-member@acme.com", 
        username: "team-member",
      });

      team = await teamsRepositoryFixture.create({
        name: "Test Team",
        slug: "test-team",
      });

      teamAdminMembership = await membershipsRepositoryFixture.create({
        role: "ADMIN",
        user: { connect: { id: teamAdminUser.id } },
        team: { connect: { id: team.id } },
        accepted: true,
      });

      teamMemberMembership = await membershipsRepositoryFixture.create({
        role: "MEMBER",
        user: { connect: { id: teamMemberUser.id } },
        team: { connect: { id: team.id } },
        accepted: true,
      });

      app = moduleRef.createNestApplication();
      bootstrap(app as NestExpressApplication);

      await app.init();
    });

    it("should get team users", async () => {
      return request(app.getHttpServer())
        .get(`/v2/teams/${team.id}/users`)
        .set(withApiAuth(teamMemberUser.id))
        .expect(200)
        .then((response) => {
          const responseBody: GetTeamUsersResponseDTO = response.body;
          expect(responseBody.status).toEqual(SUCCESS_STATUS);
          expect(responseBody.data).toBeDefined();
          expect(Array.isArray(responseBody.data)).toBe(true);
          expect(responseBody.data.length).toBeGreaterThan(0);
          
          // Check that we get team users
          const firstUser = responseBody.data[0];
          expect(firstUser.email).toBeDefined();
          expect(firstUser.profile).toBeDefined();
          expect(firstUser.profile.teamId).toEqual(team.id);
        });
    });

    afterAll(async () => {
      await userRepositoryFixture.deleteByEmail(teamAdminUser.email);
      await userRepositoryFixture.deleteByEmail(teamMemberUser.email);
      await teamsRepositoryFixture.delete(team.id);
      await app.close();
    });
  });
});