## Core Engineering Principles

### SOLID Principles (Object-Oriented Design)

- **Single Responsibility Principle (SRP)**: Each class, module, or function should have one reason to change
  - Backend: Services handle one domain concern; controllers route requests only
  - Frontend: Components render one UI concern; hooks manage one piece of state
- **Open/Closed Principle (OCP)**: Extend functionality without modifying existing code
  - Use composition and dependency injection over modification
  - Prefer configuration and strategy patterns for variations
- **Liskov Substitution Principle (LSP)**: Subtypes must be substitutable for their base types
  - Ensure derived classes honor base class contracts
  - Interface implementations should never violate expectations
- **Interface Segregation Principle (ISP)**: Many specific interfaces beat one general interface
  - Create focused interfaces for specific use cases
  - Avoid forcing implementations to depend on unused methods
- **Dependency Inversion Principle (DIP)**: Depend on abstractions, not concretions
  - Inject dependencies rather than instantiating them
  - Define interfaces for external dependencies

### DRY (Don't Repeat Yourself)

- **Single Source of Truth**: Every piece of knowledge has one unambiguous representation
  - Extract repeated logic into shared functions or modules
  - Use shared types (bizass-shared) between frontend and backend
  - Centralize configuration and constants

### KISS (Keep It Simple, Stupid)

- **Simplicity First**: Choose the simplest solution that solves the problem
  - Avoid premature optimization and over-engineering
  - Prefer readable code over clever tricks
  - Question complexity: if it's hard to explain, it's probably too complex

### YAGNI (You Aren't Gonna Need It)

- **Build for Today**: Implement only what's needed for current requirements
  - Resist speculative generality and "future-proofing"
  - Add abstractions when you have 2-3 concrete use cases, not before
  - Delete unused code aggressively
