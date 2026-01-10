## Coding style best practices

- **Consistent Naming Conventions**: Establish and follow naming conventions for variables, functions, classes, and files across the codebase
- **Automated Formatting**: Maintain consistent code style (indenting, line breaks, etc.)
- **Meaningful Names**: Choose descriptive names that reveal intent; avoid abbreviations and single-letter variables except in narrow contexts (KISS principle)
- **Small, Focused Functions**: Keep functions small and focused on a single task for better readability and testability (SRP principle)
- **Consistent Indentation**: Use consistent indentation (spaces or tabs) and configure your editor/linter to enforce it
- **Remove Dead Code**: Delete unused code, commented-out blocks, and imports rather than leaving them as clutter (YAGNI principle)
- **Backward compatibility only when required:** Unless specifically instructed otherwise, assume you do not need to write additional code logic to handle backward compatibility (YAGNI principle)
- **DRY Principle**: Avoid duplication by extracting common logic into reusable functions or modules (see principles.md for details)
- **Simple Over Clever**: Choose straightforward implementations over clever tricks; optimize for readability (KISS principle)
- **Minimal Abstraction**: Add abstractions only when you have multiple concrete cases; avoid premature generalization (YAGNI principle)

**Related:** See [Core Engineering Principles](./principles.md) for foundational design guidance
