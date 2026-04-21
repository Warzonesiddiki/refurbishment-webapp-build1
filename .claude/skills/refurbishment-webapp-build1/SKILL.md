```markdown
# refurbishment-webapp-build1 Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches the core development patterns, coding conventions, and workflows used in the `refurbishment-webapp-build1` repository. The project is a TypeScript web application built with the Vite framework. You'll learn how to structure files, write imports/exports, and follow commit and testing practices to contribute effectively.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `userProfile.ts`, `orderSummary.test.ts`

### Import Style
- Use **alias imports** for modules.
  - Example:
    ```typescript
    import { fetchData } from '@/utils/api';
    ```

### Export Style
- Use a **mixed** export style (both named and default exports).
  - Example:
    ```typescript
    // Named export
    export function calculateTotal() { ... }

    // Default export
    export default App;
    ```

### Commit Patterns
- Commit messages are **freeform** with no strict prefixes.
- Average commit message length: **47 characters**.
  - Example: `Add user authentication modal and validation logic`

## Workflows

### Code Contribution
**Trigger:** When adding new features or fixing bugs  
**Command:** `/contribute`

1. Create a new branch for your changes.
2. Follow camelCase file naming and alias import conventions.
3. Write or update tests in files matching `*.test.*`.
4. Commit changes with a clear, concise message.
5. Open a pull request for review.

### Testing
**Trigger:** Before pushing or merging changes  
**Command:** `/test`

1. Locate or create test files using the `*.test.*` pattern.
2. Run the test suite (framework is currently unknown; check project docs or scripts).
3. Ensure all tests pass before committing.

### Code Review
**Trigger:** When reviewing a pull request  
**Command:** `/review`

1. Check for adherence to file naming and import/export conventions.
2. Verify tests are present and passing.
3. Ensure commit messages are clear and descriptive.

## Testing Patterns

- Test files follow the `*.test.*` naming convention (e.g., `userActions.test.ts`).
- The testing framework is **unknown**; refer to project documentation or scripts for details.
- Place tests alongside the code they cover or in a dedicated `tests` directory.

  ```typescript
  // Example test file: userActions.test.ts
  import { getUserName } from '@/utils/user';

  test('returns correct user name', () => {
    expect(getUserName({ name: 'Alice' })).toBe('Alice');
  });
  ```

## Commands
| Command      | Purpose                                      |
|--------------|----------------------------------------------|
| /contribute  | Start the code contribution workflow         |
| /test        | Run the test workflow                        |
| /review      | Begin code review for a pull request         |
```