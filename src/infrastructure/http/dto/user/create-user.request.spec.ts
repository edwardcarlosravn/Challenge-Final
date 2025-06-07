import { CreateUserRequest } from './create-user.request';
import { validate } from 'class-validator';

describe('CreateUserRequest', () => {
  it('Should have the correct properties', async () => {
    const dto = new CreateUserRequest();
    dto.email = 'edwardhc1997@gmail.com';
    dto.password = 'Absdc123+';

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('Should throw errors if password is not valid', async () => {
    const dto = new CreateUserRequest();
    dto.email = 'edwardhc1997@gmail.com';
    dto.password = 'abc123+';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const passwordError = errors.find((error) => error.property === 'password');

    expect(passwordError).toBeDefined();

    if (passwordError) {
      expect(passwordError.constraints).toBeDefined();
      if (passwordError.constraints) {
        expect(passwordError.constraints.isStrongPassword).toBe(
          'password is not strong enough',
        );
      }
    }
  });

  it('Should validate different invalid password formats', async () => {
    const testCases = [
      {
        password: 'abc123+',
        description: 'password without uppercase letter',
      },
      {
        password: 'ABC123+',
        description: 'password without lowercase letter',
      },
      {
        password: 'Abcdef+',
        description: 'password without number',
      },
      {
        password: 'Abc123',
        description: 'password without special character',
      },
    ];

    for (const testCase of testCases) {
      const dto = new CreateUserRequest();
      dto.email = 'test@example.com';
      dto.password = testCase.password;

      const errors = await validate(dto);
      const passwordError = errors.find(
        (error) => error.property === 'password',
      );
      expect(passwordError).toBeDefined();

      if (passwordError) {
        expect(passwordError.constraints).toBeDefined();

        if (passwordError.constraints) {
          expect(passwordError.constraints.isStrongPassword).toBe(
            'password is not strong enough',
          );
        }
      }
    }
  });

  it('Should validate email format', async () => {
    const dto = new CreateUserRequest();
    dto.email = 'invalid-email';
    dto.password = 'Absdc123+';

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);

    const emailError = errors.find((error) => error.property === 'email');

    expect(emailError).toBeDefined();

    if (emailError) {
      expect(emailError.constraints).toBeDefined();
    }
  });
});
