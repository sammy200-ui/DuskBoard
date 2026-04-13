import AppError from './AppError';

class UnauthorizedError extends AppError {
  constructor() {
    super('Unauthorized', 401);
  }
}

export default UnauthorizedError;