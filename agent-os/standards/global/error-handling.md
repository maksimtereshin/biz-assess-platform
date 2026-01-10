## Error handling best practices

- **User-Friendly Messages**: Provide clear, actionable error messages to users without exposing technical details or security information
- **Fail Fast and Explicitly**: Validate input and check preconditions early; fail with clear error messages rather than allowing invalid state (KISS: simple error paths)
- **Specific Exception Types**: Use specific exception/error types rather than generic ones to enable targeted handling (ISP: focused error interfaces)
- **Centralized Error Handling**: Handle errors at appropriate boundaries (controllers, API layers) rather than scattering try-catch blocks everywhere (SRP: single error handling responsibility)
- **Graceful Degradation**: Design systems to degrade gracefully when non-critical services fail rather than breaking entirely
- **Retry Strategies**: Implement exponential backoff for transient failures in external service calls
- **Clean Up Resources**: Always clean up resources (file handles, connections) in finally blocks or equivalent mechanisms

**Related:** See [Core Engineering Principles](./principles.md) for foundational design guidance
