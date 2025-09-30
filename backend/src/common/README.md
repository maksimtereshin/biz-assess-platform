# ESM/CommonJS Import Compatibility Solution

This directory contains a clean, SOLID-principles-based solution for importing ES modules in a CommonJS environment.

## Architecture Overview

Our solution follows these key principles:

### 🏗️ **SOLID Design Patterns**

1. **Single Responsibility**: Each class has one job
   - `SharedTypesService`: Only handles shared type imports
   - `DynamicImportAdapter`: Only handles dynamic imports
   - `SharedModuleFactory`: Only creates import adapters

2. **Open/Closed**: Extensible without modification
   - New import adapters can be created without changing existing code
   - Custom validators can be added without modifying core logic

3. **Liskov Substitution**: Interchangeable implementations
   - Any `ISharedImportAdapter` implementation works
   - Test adapters can replace production adapters

4. **Interface Segregation**: Focused interfaces
   - `ISharedImportAdapter` has minimal, focused contract
   - No clients depend on methods they don't use

5. **Dependency Inversion**: Depends on abstractions
   - Services depend on `ISharedImportAdapter`, not concrete implementations
   - Factory pattern enables dependency injection

### 🔧 **Clean Code Principles**

- **DRY**: No duplication - single import mechanism reused everywhere
- **Self-Documenting**: Code reads like prose with clear naming
- **Error Handling**: Comprehensive error handling with meaningful messages
- **Type Safety**: Full TypeScript support maintained
- **Separation of Concerns**: Clear boundaries between modules

## Usage Examples

### Service-Based Import (Recommended for Controllers/Services)

```typescript
import { Injectable } from '@nestjs/common';
import { SharedTypesService } from '../common/services/shared-types.service';

@Injectable()
export class YourService {
  constructor(private sharedTypes: SharedTypesService) {}

  async someMethod() {
    // Load specific types
    const { SurveyType, AuthToken } = await this.sharedTypes.getSharedTypes([
      'SurveyType',
      'AuthToken'
    ]);

    // Use types normally
    const token: AuthToken = { /* ... */ };
  }
}
```

### Utility-Based Import (For Utilities/Helpers)

```typescript
import { importShared } from '../common/utils/shared-import.util';

export async function processAuth() {
  const { AuthToken, SurveyType } = await importShared(['AuthToken', 'SurveyType']);

  // Use types normally
  return { /* ... */ };
}
```

### Lazy Loading Pattern (For Performance-Critical Code)

```typescript
import { LazySharedImport } from '../common/utils/shared-import.util';

@LazySharedImport(['SurveyType', 'AuthToken'])
export class OptimizedService {
  async processData() {
    const sharedTypes = await this.getSharedTypes();
    // Types loaded only when needed
  }
}
```

## Migration Guide

### Step 1: Replace Direct Imports

**Before:**
```typescript
import { AuthToken, SurveySession, SurveyType } from 'bizass-shared';
```

**After:**
```typescript
import { importShared } from '../common/utils/shared-import.util';

// At the top of your method:
const { AuthToken, SurveySession, SurveyType } = await importShared([
  'AuthToken',
  'SurveySession',
  'SurveyType'
]);
```

### Step 2: Update Method Signatures

**Before:**
```typescript
generateAuthToken(telegramId: number): AuthToken {
```

**After:**
```typescript
async generateAuthToken(telegramId: number): Promise<AuthToken> {
```

### Step 3: Register Common Module

Add to your `app.module.ts`:
```typescript
import { CommonModule } from './common/common.module';

@Module({
  imports: [CommonModule, /* other modules */],
})
export class AppModule {}
```

## Testing Strategy

### Unit Tests
```typescript
import { Test } from '@nestjs/testing';
import { SharedTypesService } from './shared-types.service';

// Mock adapter for testing
class MockImportAdapter implements ISharedImportAdapter {
  async importShared() {
    return { SurveyType: 'mock', AuthToken: 'mock' };
  }
}

// In beforeEach:
SharedModuleFactory.setAdapter(new MockImportAdapter());
```

### Integration Tests
```typescript
it('should load actual shared types', async () => {
  const types = await importShared(['SurveyType']);
  expect(types.SurveyType).toBeDefined();
});
```

## Performance Considerations

1. **Lazy Loading**: Types loaded only when needed
2. **Caching**: Import results cached to avoid repeated loads
3. **Batch Loading**: Multiple types loaded in single import
4. **Memory Efficient**: No duplicate imports in memory

## Error Handling

The system provides comprehensive error handling:

- **Import Failures**: Clear error messages with module names
- **Missing Types**: Specific errors for undefined types
- **Validation Errors**: Runtime type validation support

## Future Extensions

The architecture supports easy extensions:

1. **Custom Adapters**: Create specialized import adapters
2. **Type Validators**: Add runtime type checking
3. **Caching Strategies**: Implement different caching approaches
4. **Monitoring**: Add import performance monitoring

## Troubleshooting

### Common Issues

1. **"Module not found"**: Ensure shared package is built
2. **"Import failed"**: Check shared package exports
3. **Type errors**: Verify TypeScript configuration

### Debug Mode

Enable debug logging:
```typescript
// In your environment
DEBUG=SharedTypesService,DynamicImportAdapter
```

## Migration Checklist

- [ ] Build shared package with dual outputs
- [ ] Register CommonModule in AppModule
- [ ] Replace direct imports with dynamic imports
- [ ] Update method signatures to async
- [ ] Add error handling for import failures
- [ ] Write tests for imported functionality
- [ ] Update documentation for new patterns