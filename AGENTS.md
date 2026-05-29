# Development Guidelines

## Commit Messages

Always use [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <description>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring (not a bug fix or feature)
- `perf`: Performance improvement
- `style`: Formatting, styling (no code logic change)
- `test`: Adding or updating tests
- `docs`: Documentation changes
- `chore`: Maintenance tasks, dependencies

### Examples

```
feat(confluence): add support for case-insensitive URL detection
fix(html): properly close br tags for Confluence XHTML
refactor(parser): simplify frontmatter parsing logic
docs(README): update installation instructions
chore(deps): update markdown-it to latest version
```

### Commit Message Rules

- First line: under 72 characters
- Use imperative mood ("add" not "added", "fix" not "fixed")
- Body explains "why", not "what"
- Reference ticket numbers when applicable: `Fixes #RPL-123`

## Code Style

- Use TypeScript with strict mode
- Follow existing code patterns and conventions
- No comments unless necessary for complex logic
- Use meaningful variable and function names

## Testing

- Test changes with real Confluence instances when possible
- Verify both cloud (atlassian.net) and on-premise Confluence URLs

## Release Workflow

- If the user asks to "prepare release" or "prepare npm package release", bump the package version first.
- After release prep changes are complete, create a Git commit using Conventional Commits.
- Create a Git tag that matches the package version, prefixed with `v` (for example `v1.5.3`).
- Push the commit and tag to GitHub unless the user explicitly says not to push.
- After the repo is ready, tell the user to run:

```bash
npm publish --access public
```
