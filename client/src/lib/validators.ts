export const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

export const PASSWORD_HINT =
  'Min 8 characters with an uppercase, lowercase, number and a special character';

export function isStrongPassword(value: string): boolean {
  return PASSWORD_REGEX.test(value);
}
