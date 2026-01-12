# AI Assistant Guidelines for Self.so

## Development Workflow

### ✅ What AI Assistants SHOULD Do
- **Run builds**: Use `npm run build` or `pnpm build` to verify code changes
- **Run tests**: Execute test suites when available
- **Run linters**: Use `npm run lint` or `pnpm lint` to check code quality
- **Run type checking**: Use TypeScript compiler to verify types
- **Make code changes**: Edit files, refactor code, implement features
- **Update dependencies**: Update package.json and run install commands
- **Create documentation**: Update README, code comments, etc.

### ❌ What AI Assistants SHOULD NOT Do
- **Never run development server**: Do NOT use `npm run dev`, `pnpm dev`, or any development server commands
- **Never start production server**: Do NOT use `npm start`, `pnpm start`, or production server commands
- **Never access external services**: Do NOT make HTTP requests to external APIs or services
- **Never modify environment files**: Do NOT edit `.env` files or other configuration files
- **Never commit changes**: Do NOT use git commands to commit or push changes

## Reasoning

AI assistants should focus on code changes and verification, not on running servers or accessing external services. The development server should be managed by the human developer to maintain control over the development environment and avoid potential security issues.

## Build Commands to Use

```bash
# Build the application
npm run build

# Run linting
npm run lint

# Run type checking
npx tsc --noEmit
```

## Testing Changes

When making changes, always verify with:
1. Build the application successfully
2. Check for TypeScript errors
3. Run linting if available
4. Test functionality if test suite exists