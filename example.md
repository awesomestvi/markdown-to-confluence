---
confluence: https://your-company.atlassian.net/wiki/spaces/SPACE/pages/123456789/Page+Title
---

# Example Documentation Page

This is an example Markdown file demonstrating the Confluence Upload CLI features.

## Overview

This document showcases how various Markdown elements are converted to Confluence format when uploaded.

## Code Blocks

Code blocks are converted to Confluence code macros with syntax highlighting:

```javascript
// JavaScript example
function greet(name) {
  console.log(`Hello, ${name}!`);
}

greet('World');
```

```python
# Python example
def greet(name):
    print(f"Hello, {name}!")

greet("World")
```

```bash
# Shell script example
#!/bin/bash
echo "Hello from bash!"
```

## Blockquotes

Blockquotes are converted to Info macros:

> This is an important note that will appear as an Info macro in Confluence.
> 
> You can have multiple paragraphs within a blockquote.

## Tables

Tables are automatically styled for Confluence:

| Feature | Supported | Notes |
|---------|-----------|-------|
| Code blocks | ✅ | With syntax highlighting |
| Tables | ✅ | Auto-styled |
| Blockquotes | ✅ | Converted to Info macros |
| Images | ⚠️ | Coming soon |
| Attachments | ⚠️ | Coming soon |

## Lists

### Unordered List

- Item 1
- Item 2
  - Nested item 2.1
  - Nested item 2.2
- Item 3

### Ordered List

1. First step
2. Second step
3. Third step

## Inline Formatting

You can use **bold**, *italic*, `inline code`, and [links](https://example.com).

## Headers

### Level 3 Header

Content under level 3 header.

#### Level 4 Header

Content under level 4 header.

##### Level 5 Header

Content under level 5 header.

## Usage Instructions

To upload this page to Confluence:

```bash
# Upload as a new page
confluence-upload upload example.md

# Update existing page
confluence-upload upload example.md -u

# Override title
confluence-upload upload example.md -t "My Custom Title"
```

## Notes

- The `confluence:` URL in the frontmatter is used to auto-detect the base URL, space key, parent page ID, and title
- Use the `-u` flag to update an existing page
- All standard Markdown features are supported

---

**Last updated:** 2026-05-25
