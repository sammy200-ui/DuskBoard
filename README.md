# DuskBoard - Workflow-Driven Project Management System

DuskBoard is a project management tool designed for software teams that enforces strict Agile workflows. It uses a backend "State Engine" to ensure tasks follow a valid lifecycle and incorporates Role-Based Access Control (RBAC) to manage permissions effectively.

## Project Overview

This repository contains the initial design and documentation for the Dusk  Board project (Milestone 1).

### Documentation & Diagrams

We have created detailed documentation and Mermaid diagrams to outline the project's architecture and design. You can view them directly on GitHub or by using a Markdown previewer with Mermaid support.

- **[Project Idea & Scope](./idea.md)**: Detailed breakdown of the project scope, key features, and technology stack.
- **[Use Case Diagram](./useCaseDiagram.md)**: functional requirements and actor interactions.
- **[Sequence Diagram](./sequenceDiagram.md)**: Critical path flow (Task Lifecycle).
- **[Class Diagram](./classDiagram.md)**: Object-Oriented structure and relationships.
- **[Entity-Relationship Diagram](./ErDiagram.md)**: Database schema design.

## Tech Stack

- **Backend:** Node.js / TypeScript (OOP & Design Patterns)
- **Database:** PostgreSQL
- **Frontend:** React.js

## Features

1.  **Workflow State Engine:** Strict transition system for tasks (e.g., Open → In Progress → Review → QA → Done).
2.  **Sprint Management:** Time-boxed iterations with task management.
3.  **Role-Based Permissions (RBAC):** Granular access control for Admin, PM, Developer, QA, and Viewer.
4.  **Audit Logging:** Immutable history of all changes.

---

