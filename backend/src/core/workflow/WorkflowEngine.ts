import { ProjectRole, TaskStatus } from '@prisma/client';

type TransitionRule = {
  from: TaskStatus;
  to: TaskStatus;
  allowedRoles: ProjectRole[];
};

class WorkflowEngine {
  private transitions: TransitionRule[];

  constructor() {
    this.transitions = [
      { from: TaskStatus.OPEN, to: TaskStatus.IN_PROGRESS, allowedRoles: [ProjectRole.DEVELOPER, ProjectRole.PM, ProjectRole.ADMIN] },
      { from: TaskStatus.IN_PROGRESS, to: TaskStatus.CODE_REVIEW, allowedRoles: [ProjectRole.DEVELOPER, ProjectRole.PM, ProjectRole.ADMIN] },
      { from: TaskStatus.CODE_REVIEW, to: TaskStatus.QA, allowedRoles: [ProjectRole.PM, ProjectRole.ADMIN] },
      { from: TaskStatus.CODE_REVIEW, to: TaskStatus.IN_PROGRESS, allowedRoles: [ProjectRole.DEVELOPER, ProjectRole.PM, ProjectRole.ADMIN] },
      { from: TaskStatus.QA, to: TaskStatus.DONE, allowedRoles: [ProjectRole.QA, ProjectRole.ADMIN] },
      { from: TaskStatus.QA, to: TaskStatus.IN_PROGRESS, allowedRoles: [ProjectRole.QA, ProjectRole.ADMIN] },
      { from: TaskStatus.IN_PROGRESS, to: TaskStatus.BLOCKED, allowedRoles: [ProjectRole.DEVELOPER, ProjectRole.PM, ProjectRole.ADMIN] },
      { from: TaskStatus.BLOCKED, to: TaskStatus.IN_PROGRESS, allowedRoles: [ProjectRole.PM, ProjectRole.ADMIN] },
    ];
  }

  canTransition(from: TaskStatus, to: TaskStatus, role: ProjectRole): boolean {
    const rule = this.transitions.find((transition) => transition.from === from && transition.to === to);
    if (!rule) {
      return false;
    }

    return rule.allowedRoles.includes(role);
  }

  getValidTransitions(from: TaskStatus, role: ProjectRole): TaskStatus[] {
    return this.transitions
      .filter((transition) => transition.from === from && transition.allowedRoles.includes(role))
      .map((transition) => transition.to);
  }
}

const workflowEngine = new WorkflowEngine();

export { TransitionRule, WorkflowEngine };
export default workflowEngine;