## General development conventions

- **Consistent Project Structure**: Organize files and directories in a predictable, logical structure that team members can navigate easily (SRP for modules)
- **Clear Documentation**: Maintain up-to-date README files with setup instructions, architecture overview, and contribution guidelines
- **Version Control Best Practices**: Use clear commit messages, feature branches, and meaningful pull/merge requests with descriptions
- **Environment Configuration**: Use environment variables for configuration; never commit secrets or API keys to version control
- **Dependency Management**: Keep dependencies up-to-date and minimal; document why major dependencies are used (DIP: depend on stable abstractions)
- **Modular Architecture**: Design systems with clear boundaries; extend functionality through composition not modification (OCP principle)
- **Code Review Process**: Establish a consistent code review process with clear expectations for reviewers and authors
- **Testing Requirements**: Define what level of testing is required before merging (unit tests, integration tests, etc.)
- **Feature Flags**: Use feature flags for incomplete features rather than long-lived feature branches
- **Changelog Maintenance**: Keep a changelog or release notes to track significant changes and improvements

**Related:** See [Core Engineering Principles](./principles.md) for foundational design guidance
