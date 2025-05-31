import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '../../enums/auth/role.enums';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(Role, {
    message: `newRole must be one of the following values: ${Object.values(Role).join(', ')}`,
  })
  newRole: Role;
}
