import AppError from './AppError';

class WorkflowViolationError extends AppError {
  constructor(from: string, to: string, role: string) {
    super(`Role '${role}' cannot transition task from '${from}' to '${to}'`, 403);
  }
}

export default WorkflowViolationError;