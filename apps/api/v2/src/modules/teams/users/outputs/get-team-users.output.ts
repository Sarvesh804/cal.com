import { GetUserOutput } from "@/modules/users/outputs/get-users.output";
import { ApiProperty } from "@nestjs/swagger";
import { Expose, Type } from "class-transformer";
import { IsEnum, IsInt, IsString, ValidateNested, IsArray, IsBoolean } from "class-validator";

import { ERROR_STATUS } from "@calcom/platform-constants";
import { SUCCESS_STATUS } from "@calcom/platform-constants";

export class TeamProfileOutput {
  @IsInt()
  @Expose()
  @ApiProperty({ type: Number, required: true, description: "The ID of the membership", example: 1 })
  id!: number;

  @IsInt()
  @Expose()
  @ApiProperty({
    type: Number,
    required: true,
    description: "The ID of the team of user",
    example: 1,
  })
  teamId!: number;

  @IsInt()
  @Expose()
  @ApiProperty({ type: Number, required: true, description: "The ID of the user", example: 1 })
  userId!: number;

  @IsString()
  @Expose()
  @ApiProperty({
    type: String,
    nullable: false,
    required: true,
    description: "The role of the user within the team",
    example: "MEMBER",
  })
  role!: string;

  @Expose()
  @IsBoolean()
  @ApiProperty({
    type: Boolean,
    required: true,
    description: "Whether the membership has been accepted",
    example: true,
  })
  accepted!: boolean;
}

export class GetTeamUsersWithProfileOutput extends GetUserOutput {
  @ApiProperty({
    description: "team user membership, contains user data within the team context",
  })
  @Expose()
  @ValidateNested()
  @Type(() => TeamProfileOutput)
  profile!: TeamProfileOutput;
}

export class GetTeamUsersResponseDTO {
  @ApiProperty({ example: SUCCESS_STATUS, enum: [SUCCESS_STATUS, ERROR_STATUS] })
  @IsEnum([SUCCESS_STATUS, ERROR_STATUS])
  status!: typeof SUCCESS_STATUS | typeof ERROR_STATUS;
  data!: GetTeamUsersWithProfileOutput[];
}

export class GetTeamUserOutput {
  @ApiProperty({ example: SUCCESS_STATUS, enum: [SUCCESS_STATUS, ERROR_STATUS] })
  @IsEnum([SUCCESS_STATUS, ERROR_STATUS])
  status!: typeof SUCCESS_STATUS | typeof ERROR_STATUS;
  data!: GetTeamUsersWithProfileOutput;
}