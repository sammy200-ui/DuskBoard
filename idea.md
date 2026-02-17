

## Project Idea & Scope
Nexus is a project management tool designed for software teams that enforces strict Agile workflows. Unlike simple to-do lists, Nexus uses a backend "State Engine" to ensure tasks follow a valid lifecycle (e.g., `Open` → `In Progress` → `Code Review` → `QA` → `Done`).

It is designed to solve the chaos of unmanaged tickets by enforcing **Role-Based Access Control (RBAC)**—only QA engineers can approve a "Bug Fix," and only Product Managers can close a "Feature Request."

## Key Features
1.  **Workflow State Engine:** A strict transition system that prevents invalid status changes (Backend Logic).
    *   Transition rules based on current state and user role.
    *   Example: A developer cannot move a ticket from `In Progress` directly to `Done` without `Code Review`.
2.  **Sprint Management:** Grouping tasks into time-boxed iterations with auto-rollover for unfinished tasks.
    *   Create, start, and complete sprints.
    *   Velocity tracking (future scope).
3.  **Role-Based Permissions:** Inheritance-based user roles.
    *   **Admin:** Full access, manages users and project settings.
    *   **Project Manager:** Manages sprints, tasks, and workflows.
    *   **Developer:** Can view and update assigned tasks, move tasks through development stages.
    *   **QA:** Verifies fixes, moves tasks from `QA` to `Done` or returns to `In Progress`.
    *   **Viewer:** Read-only access.
4.  **Audit Logging:** An immutable history of *who* changed *what* and *when* (Observer Pattern).
    *   Tracks all state changes, assignments, and updates.

## Tech Stack
*   **Backend:** Node.js / TypeScript (Focusing on OOP and Design Patterns).
*   **Database:** PostgreSQL (Relational integrity is critical for complex relationships).
*   **Frontend:** React.js
