import { Role } from './role.enums';
describe('Valid Roles enum', () => {
  it('should have correct values', () => {
    expect(Role.ADMIN).toBe('ADMIN');
    expect(Role.CLIENT).toBe('CLIENT');
    expect(Role.EDITOR).toBe('EDITOR');
  });
  it('Should all contain all expected key', () => {
    const keyToHave = ['ADMIN', 'CLIENT', 'EDITOR'];
    expect(Object.values(Role)).toEqual(expect.arrayContaining(keyToHave));
  });
});
