#!/bin/bash

# Helper script to add Confluence credentials to ~/.zshrc

set -e

echo "🔐 Confluence Upload CLI - Configuration"
echo "========================================"
echo ""
echo "This script will add your Confluence credentials to ~/.zshrc"
echo "so they're available from any directory."
echo ""
echo "You can get an API token from your Confluence instance (e.g., https://your-company.atlassian.net/wiki)"
echo ""
echo "Note: Space Key and Parent Page ID are auto-detected from the"
echo "Confluence reference URL in your Markdown files. Only email, API token, and base URL are required."
echo ""

# Check if ~/.zshrc exists
if [ ! -f ~/.zshrc ]; then
  echo "⚠️  ~/.zshrc not found. Creating one..."
  touch ~/.zshrc
  echo "✅ Created ~/.zshrc"
  echo ""
fi

# Check if credentials already exist
if grep -q "CONFLUENCE_EMAIL" ~/.zshrc 2>/dev/null || grep -q "CONFLUENCE_API_TOKEN" ~/.zshrc 2>/dev/null || grep -q "CONFLUENCE_BASE_URL" ~/.zshrc 2>/dev/null; then
  echo "⚠️  Confluence credentials already exist in ~/.zshrc"
  echo ""
  read -p "Do you want to update them? (y/n) " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelled."
    exit 0
  fi
  
  # Remove existing entries
  echo "🗑️  Removing existing Confluence configuration..."
  sed -i.bak '/^export CONFLUENCE_/d' ~/.zshrc
  rm -f ~/.zshrc.bak
  echo "✅ Removed existing entries"
  echo ""
fi

# Prompt for credentials
echo "📝 Enter your Confluence credentials:"
echo ""

read -p "Confluence Base URL (e.g., https://your-company.atlassian.net/wiki): " CONFLUENCE_BASE_URL
if [[ -z "$CONFLUENCE_BASE_URL" ]]; then
  echo "❌ Base URL is required"
  exit 1
fi

read -p "Confluence Email: " CONFLUENCE_EMAIL
if [[ -z "$CONFLUENCE_EMAIL" ]]; then
  echo "❌ Email is required"
  exit 1
fi

read -sp "Confluence API Token: " CONFLUENCE_API_TOKEN
echo ""
if [[ -z "$CONFLUENCE_API_TOKEN" ]]; then
  echo "❌ API Token is required"
  exit 1
fi

# Add to ~/.zshrc
echo ""
echo "📝 Adding configuration to ~/.zshrc..."
echo "" >> ~/.zshrc
echo "# Confluence Upload CLI Configuration" >> ~/.zshrc
echo "export CONFLUENCE_BASE_URL=\"$CONFLUENCE_BASE_URL\"" >> ~/.zshrc
echo "export CONFLUENCE_EMAIL=\"$CONFLUENCE_EMAIL\"" >> ~/.zshrc
echo "export CONFLUENCE_API_TOKEN=\"$CONFLUENCE_API_TOKEN\"" >> ~/.zshrc

echo "✅ Configuration added to ~/.zshrc"
echo ""
echo "⚠️  IMPORTANT: Reload your shell or run the following to apply changes:"
echo ""
echo "   source ~/.zshrc"
echo ""
echo "Or start a new terminal session."
echo ""
echo "🔒 Security Notes:"
echo "   - Your credentials are stored in ~/.zshrc (not in the project directory)"
echo "   - Never commit ~/.zshrc to version control"
echo "   - Keep your API token secure and rotate it periodically"
echo ""
echo "Next steps:"
echo "   1. Run: source ~/.zshrc"
echo "   2. Upload a file: mdc upload README.md -u"
echo ""
echo "💡 Tip: Add a Confluence reference URL to your Markdown file's frontmatter:"
echo "   confluence:"
echo "     baseUrl: https://your-company.atlassian.net/wiki/spaces/SPACE/pages/123/Page+Title"
echo ""
echo "✅ Done! Your configuration has been saved."
