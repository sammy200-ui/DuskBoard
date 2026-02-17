

```mermaid
useCaseDiagram
    actor Admin
    actor ProjectManager as PM
    actor Developer
    actor QA
    actor Viewer

    package Authentication {
        usecase "Login" as UC1
        usecase "Logout" as UC2
        usecase "Register" as UC0
    }

    package Project_Management {
        usecase "Create Project" as UC3
        usecase "Manage Users" as UC4
        usecase "View Reports" as UC5
    }

    package Sprint_Management {
        usecase "Create Sprint" as UC6
        usecase "Start/End Sprint" as UC7
        usecase "Move Tasks to Sprint" as UC8
    }

    package Task_Management {
        usecase "Create Task" as UC9
        usecase "Edit Task" as UC10
        usecase "Change Task Status" as UC11
        usecase "Comment on Task" as UC12
        usecase "View Task" as UC13
    }

    Admin --> UC0
    Admin --> UC1
    Admin --> UC3
    Admin --> UC4
    Admin --> UC5

    PM --> UC1
    PM --> UC6
    PM --> UC7
    PM --> UC8
    PM --> UC9
    PM --> UC10
    PM --> UC11
    PM --> UC5

    Developer --> UC1
    Developer --> UC11
    Developer --> UC12
    Developer --> UC13

    QA --> UC1
    QA --> UC11
    QA --> UC12
    QA --> UC13

    Viewer --> UC1
    Viewer --> UC13

    note right of UC11
        Status changes are restricted
        by the State Engine based on Role
    end note
```
