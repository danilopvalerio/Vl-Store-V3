export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const isValidCpfCnpj = (value: string): boolean => {
  const digitsOnly = value.replace(/\D/g, '');
  return digitsOnly.length === 11 || digitsOnly.length === 14;
};

export const isValidPassword = (password: string): boolean => {
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const extractDigitsOnly = (value: string): string => {
  return value.replace(/\D/g, '');
};

export const convertToISODate = (date: string): string => {
  const [day, month, year] = date.split('/');
  if (!day || !month || !year) {
    throw new Error('Data inválida');
  }
  return `${year}-${month}-${day}`;
};