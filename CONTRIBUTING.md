# Contributing to StackForge

Thank you for your interest in contributing to StackForge! We welcome contributions from the community. This document outlines the process for contributing.

## Code of Conduct

By participating in this project, you agree to uphold our community standards:

- Be respectful and inclusive
- Focus on constructive feedback
- Assume good intent
- Report violations to the maintainers

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally
3. **Create a branch** for your work
4. **Make your changes** with clear commits
5. **Push** to your fork
6. **Open a Pull Request** with a detailed description

## Development Workflow

### Branching Strategy

```bash
# Create a feature branch
git checkout -b feature/your-feature-name

# Create a bug fix branch
git checkout -b fix/issue-description

# Create a docs branch
git checkout -b docs/what-you-are-documenting
```

Branch naming: `type/short-description` (lowercase, dashes)

### Code Standards

#### TypeScript

- No `any` types—use explicit types or generics
- Enable strict mode (configured in `tsconfig.json`)
- Use meaningful variable names
- Document complex logic with comments

```typescript
// ✅ Good
interface CardPayload {
  title: string;
  difficulty: number;
  tags: string[];
}

function createCard(payload: CardPayload): Promise<Card> {
  // implementation
}

// ❌ Avoid
function createCard(payload: any): Promise<any> {
  // implementation
}
```

#### React Components

- Use functional components with hooks
- Keep components focused and reusable
- Destructure props for clarity
- Use meaningful component names

```typescript
// ✅ Good
interface CardProps {
  card: Card;
  onEdit: (card: Card) => void;
  onDelete: (cardId: string) => void;
}

export function CardItem({ card, onEdit, onDelete }: CardProps) {
  return (
    <div>
      {/* component content */}
    </div>
  );
}

// ❌ Avoid
export function C(props: any) {
  return <div>{props.c}</div>;
}
```

#### Express Routes

- Keep middleware concerns separate (auth, validation)
- Use service layer for business logic
- Return consistent response formats
- Include proper error handling

```typescript
// ✅ Good
router.post("/tasks", authMiddleware, validateSchema(CreateTaskSchema), async (req, res) => {
  try {
    const task = await taskService.create(req.user.id, req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: "Failed to create task" });
  }
});
```

#### CSS/Tailwind

- Use Tailwind utility classes consistently
- Avoid inline styles
- Organize component styles logically
- Document custom classes in `tailwind.config.js`

### Commit Messages

Write clear, descriptive commit messages:

```
<type>: <subject>

<body>

<footer>
```

**Types**: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples**:

```
feat: add card drag-and-drop between columns

Implement full drag functionality using @dnd-kit/core with
PointerSensor constraints to maintain click-to-open reliability.

Fixes #42
```

```
fix: resolve jwt token validation errors

Ensure JWT_SECRET is consistent across all auth checks
and add fallback error messages for expired tokens.
```

```
docs: improve setup guide for local postgres

Add troubleshooting section and docker postgres example.
```

### Testing

- Write tests for new features
- Ensure existing tests pass
- Test both happy path and error cases

```bash
# Run tests (when configured)
npm test

# Run with coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

## Pull Request Process

### Before Opening a PR

1. **Update your branch**: `git pull origin main`
2. **Run tests**: Ensure all tests pass
3. **Build successfully**: 
   ```bash
   npm run build
   ```
4. **Format code** (if Prettier is configured):
   ```bash
   npx prettier --write .
   ```

### PR Description Template

```markdown
## Description
Brief summary of changes.

## Type of Change
- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change
- [ ] Documentation update

## Related Issues
Closes #123

## Testing
How to test the changes.

## Screenshots
If UI changes, include before/after.

## Checklist
- [ ] Code follows style guidelines
- [ ] Updated documentation
- [ ] No new warnings
- [ ] Added tests (if applicable)
- [ ] Tests pass locally
```

### PR Review Guidelines

Reviewers will check for:

- **Code quality** — Follows standards, no `any` types, clear logic
- **Functionality** — Solves the stated problem, no regressions
- **Tests** — Adequate coverage for new code
- **Documentation** — Updated comments, READMEs where needed
- **Performance** — No unnecessary re-renders or N+1 queries

Maintainers may request changes. Please:

- Respond to feedback constructively
- Push additional commits (don't force push unless asked)
- Request re-review once changes are addressed

## Types of Contributions

### Bug Reports

Found a bug? Open an issue with:

- **Description** — What went wrong?
- **Steps to reproduce** — How to trigger the bug
- **Expected behavior** — What should happen?
- **Actual behavior** — What actually happened?
- **Environment** — OS, Node version, browser

**Example**:

```
Title: Cards cannot be moved to "Victory" column

Steps:
1. Create a project
2. Create a card
3. Drag card to "Victory" column

Expected: Card moves to Victory
Actual: Card returns to previous column, console shows error

Error: TypeError: Cannot read property 'id' of undefined
```

### Feature Requests

Have an idea? Open an issue with:

- **Description** — What feature?
- **Use case** — Why is it needed?
- **Proposed API** — How would it work?
- **Alternatives** — Other solutions considered?

### Documentation

- Improve README clarity
- Add examples and tutorials
- Fix typos and formatting
- Add API documentation

### Code Improvements

- Refactor for readability
- Optimize performance
- Add error handling
- Improve type safety

## Setting Up Your Development Environment

### Tools We Recommend

- **VS Code** with extensions:
  - ESLint
  - Prettier
  - TypeScript Vue Plugin (if touching .vue)
- **Postman** or **Insomnia** for API testing
- **DBeaver** for database inspection

### Useful Commands

```bash
# Start development servers (concurrent)
npm run dev

# Build for production
npm run build

# Format code
npx prettier --write .

# Run type checking
npx tsc --noEmit

# Open Prisma Studio (inspect database)
cd server && npx prisma studio

# Generate Prisma client
cd server && npx prisma generate
```

## Documentation

Clear documentation is crucial:

- **Code comments** — Explain *why*, not *what*
- **Function/type docs** — Add JSDoc for exported items
- **README sections** — Update when adding features
- **SETUP.md** — Update if new dependencies added

**Example JSDoc**:

```typescript
/**
 * Create a new task card in a project.
 * 
 * @param projectId - The project containing this card
 * @param payload - Card details (title, difficulty, etc)
 * @returns The created card with server-assigned ID and timestamps
 * @throws TypeError if payload is invalid
 * @throws UnauthorizedError if user doesn't own the project
 */
export async function createCard(
  projectId: string,
  payload: CreateCardPayload
): Promise<Card> {
  // implementation
}
```

## Performance Considerations

- Minimize bundle size (code splitting, lazy loading)
- Prevent unnecessary re-renders (memoization, dependency arrays)
- Batch database queries
- Use pagination for large lists
- Cache API responses appropriately

## Security Guidelines

- Never commit secrets (`.env` files, API keys)
- Validate all user input
- Use HTTPS in production
- Hash passwords with bcrypt
- Prevent SQL injection via Prisma (parameterized queries)
- Implement rate limiting for auth endpoints
- Use CORS properly

## Release Process

Maintainers follow semantic versioning:

- **MAJOR** — Breaking changes (v1.0.0 → v2.0.0)
- **MINOR** — New features (v1.0.0 → v1.1.0)
- **PATCH** — Bug fixes (v1.0.0 → v1.0.1)

Changes are released on the `main` branch with git tags.

## Questions & Support

- **Questions** — Start a [Discussion](https://github.com/yourusername/stackforge/discussions)
- **Bugs** — Open an [Issue](https://github.com/yourusername/stackforge/issues)
- **Email** — Contact maintainers at your-email@example.com

## Recognition

Contributors will be recognized in:

- `CONTRIBUTORS.md` file
- Release notes
- GitHub contributors page

Thank you for improving StackForge! 🚀
