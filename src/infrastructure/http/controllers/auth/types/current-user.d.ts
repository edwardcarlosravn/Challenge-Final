import { Role } from 'generated/prisma';

export type CurrentUser = {
  id: number;
  role: Role;
};
