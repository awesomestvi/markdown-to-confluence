# mdc - Markdown to Confluence CLI

> **Upload Markdown files to Confluence in seconds. Write in Markdown, publish to Confluence.**

A powerful CLI tool that converts Markdown to Confluence format and uploads it directly from your terminal. Perfect for teams who love writing in Markdown but need to publish to Confluence.

![npm](https://img.shields.io/npm/v/@navet-tools/mdc-cli)
![Node.js](https://img.shields.io/badge/node-%3E%3D18-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

- **🚀 One-Command Uploads** - Convert and upload Markdown to Confluence instantly
- **📝 Smart Markdown Conversion** - Code blocks, tables, blockquotes, and more
- **🔗 Auto-Detection** - Automatically extracts Confluence settings from your Markdown frontmatter
- **🔄 Update Support** - Create new pages or update existing ones
- **🎯 Flexible Configuration** - Override any setting via CLI flags or environment variables
- **🔒 Secure** - Credentials stored locally, never in your project
- **⚙️ CI/CD Ready** - Integrate with GitHub Actions, GitLab CI, Azure Pipelines, and more

---

## 📦 Installation

**Requirements:** Node.js 18 or later

```bash
npm install -g @navet-tools/mdc-cli
```

Verify installation:
```bash
mdc --help
```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Set Up Credentials

Run the init command:
```bash
mdc init
```

You'll need:
- **Confluence Email**: Your Atlassian account email
- **API Token**: [Get one here](https://id.atlassian.com/manage-profile/security/api-tokens)

Then reload your shell:
```bash
source ~/.zshrc
```

### Step 2: Add Confluence Reference to Your Markdown

Add this frontmatter to the top of your `.md` file:

```markdown
---
confluence: https://your-company.atlassian.net/wiki/spaces/SPACE/pages/123456789/Page+Title
---

# Your Documentation Content

Start writing here...
```

The tool auto-detects:
- ✅ Base URL
- ✅ Space key
- ✅ Parent page ID
- ✅ Page title

### Step 3: Upload!

```bash
# Create a new page
mdc upload your-file.md

# Update an existing page
mdc upload your-file.md -u
```

**That's it!** Your Markdown is now live in Confluence.

---

## 📖 Usage Guide

### Basic Commands

| Command | Description |
|---------|-------------|
| `mdc init` | Initialize Confluence credentials |
| `mdc upload file.md` | Create a new page |
| `mdc upload file.md -u` | Update existing page |
| `mdc upload file.md -t "Custom Title"` | Override page title |
| `mdc upload file.md -k SPACE -p 123456` | Specify space and parent |
| `mdc fetch <pageId>` | Fetch a Confluence page content |
| `mdc fetch <pageId> -o file.md` | Fetch and save to file |
| `mdc fetch <pageId> -m` | Fetch and convert to Markdown |
| `mdc fetch <pageId> -k SPACE` | Fetch from specific space |

### All Available Options

```bash
mdc upload <file> [options]

Options:
  -s, --service <url>   Confluence base URL (overrides auto-detection)
  -k, --space <key>     Confluence space key (overrides auto-detection)
  -p, --parent <id>     Parent page ID (overrides auto-detection)
  -i, --page-id <id>    Page ID to update directly
  -t, --title <title>   Page title (overrides auto-detection)
  -u, --update          Update page if it already exists
  -h, --help            Show help
```

---

## 💡 Real-World Examples

### Update API Documentation
```bash
cd my-api-project
mdc upload docs/api-reference.md -u
```

### Sync Team Runbook
```bash
mdc upload ops/incident-response.md \
  -t "Incident Response Runbook" \
  -u
```

### Upload to Specific Space
```bash
mdc upload onboarding.md \
  -k ENG \
  -p 987654321 \
  -t "Engineering Onboarding"
```

### Fetch Page Content
```bash
# Fetch and display to stdout (Confluence storage format)
mdc fetch 123456789

# Fetch and save to file
mdc fetch 123456789 -o downloaded-page.md

# Fetch and convert to Markdown
mdc fetch 123456789 -m

# Fetch as Markdown and save to file
mdc fetch 123456789 -m -o page.md

# Fetch from specific space
mdc fetch 123456789 -k SPACE
```

### Upload Multiple Files
```bash
for file in docs/*.md; do
  mdc upload "$file" -u
done
```

---

## 🎨 Markdown Features

The CLI converts standard Markdown to Confluence storage format:

### Code Blocks → Code Macros

**Input:**
````markdown
```javascript
const greeting = "Hello, Confluence!";
console.log(greeting);
```
````

**Output:** Confluence code macro with syntax highlighting

### Blockquotes → Info Macros

**Input:**
```markdown
> ⚠️ Important: Always test in staging first
```

**Output:** Confluence Info/Warning macro

### Tables → Styled Tables

**Input:**
```markdown
| Feature | Status | Priority |
|---------|--------|----------|
| Upload  | ✅ Done | High     |
| Update  | 🚧 WIP  | Medium   |
```

**Output:** Styled Confluence table with formatting

### Headers, Lists, and More

- Headers (`#`, `##`, `###`) → Confluence headings
- Bullet/numbered lists → Confluence lists
- Bold, italic, inline code → Confluence formatting
- Links and images → Confluence links/images

---

## 🔧 Configuration

### Environment Variables

**Required** (set via `setup-zshrc.sh`):
```bash
export CONFLUENCE_EMAIL="your-email@company.com"
export CONFLUENCE_API_TOKEN="your-api-token"
```

**Optional** (auto-detected from frontmatter):
```bash
export CONFLUENCE_BASE_URL="https://your-company.atlassian.net/wiki"
export CONFLUENCE_SPACE_KEY="YOURSPACE"
export CONFLUENCE_PARENT_PAGE_ID="123456789"
```

### Frontmatter Format

```yaml
---
confluence: https://your-company.atlassian.net/wiki/spaces/SPACE/pages/123456789/Page+Title
---
```

**URL Breakdown:**
- `https://your-company.atlassian.net/wiki` → Base URL
- `SPACE` → Space key
- `123456789` → Parent page ID
- `Page+Title` → Page title

---

## 🔄 Workflow Integration

### Git-Based Documentation Workflow

1. **Write** documentation in Markdown (VS Code, GitHub, etc.)
2. **Commit** to your Git repository
3. **Review** via pull request
4. **Upload** to Confluence after merge

```bash
# After merging to main
git checkout main
git pull
mdc upload docs/*.md -u
```

### CI/CD Integration

#### GitHub Actions
```yaml
name: Sync Documentation
on:
  push:
    branches: [main]
    paths: ['docs/**']

jobs:
  sync-docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm install -g @navet-tools/mdc-cli
      - run: mdc upload docs/*.md -u
        env:
          CONFLUENCE_EMAIL: ${{ secrets.CONFLUENCE_EMAIL }}
          CONFLUENCE_API_TOKEN: ${{ secrets.CONFLUENCE_API_TOKEN }}
```

#### GitLab CI
```yaml
sync-docs:
  stage: deploy
  script:
    - npm install -g @navet-tools/mdc-cli
    - mdc upload docs/*.md -u
  variables:
    CONFLUENCE_EMAIL: $CONFLUENCE_EMAIL
    CONFLUENCE_API_TOKEN: $CONFLUENCE_API_TOKEN
  only:
    - main
```

#### Azure Pipelines
```yaml
trigger:
  branches:
    include: [main]
  paths:
    include: [docs/*]

pool:
  vmImage: 'ubuntu-latest'

steps:
- task: NodeTool@0
  inputs:
    versionSpec: '18.x'

- script: npm install -g @navet-tools/mdc-cli
  displayName: 'Install CLI'

- script: mdc upload docs/*.md -u
  env:
    CONFLUENCE_EMAIL: $(CONFLUENCE_EMAIL)
    CONFLUENCE_API_TOKEN: $(CONFLUENCE_API_TOKEN)
  displayName: 'Upload to Confluence'
```

---

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| `❌ Missing required Confluence credentials` | Run `mdc init` then `source ~/.zshrc` |
| `❌ A page with this title already exists` | Use `-u` flag: `mdc upload file.md -u` |
| `❌ Auto-detection failing` | Specify manually: `-s <url> -k <space> -p <id>` |
| `zsh: permission denied: mdc` | Run `npm run build && npm link` |
| `❌ Network error` | Check your internet connection and Confluence URL |
| `❌ 401 Unauthorized` | Verify your API token is valid |

### Getting Help

```bash
# Show all commands
mdc --help

# Show help for specific command
mdc upload --help

# Show version
mdc --version
```

---

## 🔒 Security Best Practices

### Credential Management

✅ **Do:**
- Store credentials in environment variables
- Use secrets management in CI/CD (GitHub Secrets, Vault, etc.)
- Rotate API tokens every 90 days
- Use separate tokens for different environments

❌ **Don't:**
- Commit credentials to version control
- Share API tokens in chat or email
- Use admin-level tokens for documentation uploads

### Token Permissions

Create a dedicated API token with **minimal permissions**:
- ✅ Confluence: Read & Write
- ❌ Admin access (not needed)
- ❌ Jira access (not needed)

---

## 🛠️ Development

### Local Development

```bash
# Clone the repository
git clone https://github.com/awesomestvi/markdown-to-confluence.git
cd markdown-to-confluence

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Test locally
./dist/standalone.js upload test.md
```

### Project Structure

```
markdown-to-confluence/
├── src/                  # TypeScript source code
│   └── standalone.ts     # Main CLI entry point
├── dist/                 # Compiled JavaScript (after build)
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── setup-zshrc.sh        # Credential setup script
└── README.md             # This file
```

---

## 📚 Additional Resources

- [Confluence Storage Format](https://confluence.atlassian.com/doc/confluence-storage-format-790796544.html)
- [Atlassian API Documentation](https://developer.atlassian.com/cloud/confluence/rest/)
- [Generate API Token](https://id.atlassian.com/manage-profile/security/api-tokens)

---

## 🤝 Contributing

Contributions are welcome! Here's how to help:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Areas We'd Love Help With:
- 🐛 Bug fixes
- ✨ New Markdown features
- 📝 Documentation improvements
- 🧪 Test coverage
- 🎨 UI/UX enhancements

---

## 📄 License

MIT License - feel free to use in personal and commercial projects.

---

## 🙋 Support

**Having issues?** 
- Check the [Troubleshooting](#-troubleshooting) section
- Review [example files](./example.md)
- Open an issue on GitHub

**Built with ❤️ for teams who love Markdown but need Confluence**

---

## 🎯 Quick Reference Card

```bash
# ⚡ Quick Upload
mdc upload file.md

# 🔄 Update Existing
mdc upload file.md -u

# 🎯 Custom Title
mdc upload file.md -t "My Title"

# 📍 Specific Location
mdc upload file.md -k SPACE -p 123456

# ❓ Get Help
mdc --help
```
