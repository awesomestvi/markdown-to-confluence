#!/usr/bin/env node

import * as fs from "node:fs";
import * as path from "node:path";
import chalk from "chalk";
import { Command } from "commander";
import MarkdownIt from "markdown-it";
import ora from "ora";

const program = new Command();

// Initialize markdown parser
const md = new MarkdownIt({
	html: true,
	linkify: true,
	typographer: true,
});

/**
 * Convert Markdown to Confluence Storage Format
 */
function convertMarkdownToConfluenceStorage(markdown: string): string {
	// Convert markdown to HTML
	let html = md.render(markdown);

	// Convert code blocks to Confluence macros
	html = html.replace(
		/<pre><code class="language-(.*?)">(.*?)<\/code><\/pre>/gs,
		(_match: string, lang: string, code: string) => {
			return `<ac:structured-macro ac:name="code"><ac:parameter ac:name="language">${lang}</ac:parameter><ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body></ac:structured-macro>`;
		},
	);

	html = html.replace(
		/<pre><code>(.*?)<\/code><\/pre>/gs,
		(_match: string, code: string) => {
			return `<ac:structured-macro ac:name="code"><ac:plain-text-body><![CDATA[${code}]]></ac:plain-text-body></ac:structured-macro>`;
		},
	);

	// Convert blockquotes to Info macros
	html = html.replace(
		/<blockquote>([\s\S]*?)<\/blockquote>/g,
		'<ac:structured-macro ac:name="info"><ac:rich-text-body>$1</ac:rich-text-body></ac:structured-macro>',
	);

	// Add table classes
	html = html.replace(/<table>/g, '<table class="wrapped">');

	// Fix self-closing tags for Confluence XHTML
	html = html.replace(/<hr>/g, "<hr />");
	html = html.replace(/<img([^>]*)>/g, "<img$1 />");
	html = html.replace(/<br>/g, "<br />");

	return html;
}

/**
 * Extract base URL from full Confluence URL
 * Examples:
 * - https://your-company.atlassian.net/wiki/spaces/DEV/pages/123 -> https://your-company.atlassian.net/wiki
 * - https://confluence.example.com/spaces/MRR/pages/123 -> https://confluence.example.com
 */
function extractBaseUrl(fullUrl: string): string | null {
	if (!fullUrl) return null;

	try {
		const urlObj = new URL(fullUrl);
		let baseUrl = `${urlObj.protocol}//${urlObj.host}`;

		// For Atlassian Cloud (atlassian.net), include /wiki
		const pathname = urlObj.pathname;
		if (urlObj.host.includes("atlassian.net") && pathname) {
			const firstSegment = pathname.split("/")[1];
			if (firstSegment && firstSegment !== "spaces") {
				baseUrl += `/${firstSegment}`;
			}
		}
		// For on-premise Confluence servers, do NOT add /wiki

		return baseUrl;
	} catch {
		return null;
	}
}

/**
 * Extract page title from Confluence URL
 * Examples:
 * - https://your-company.atlassian.net/wiki/spaces/DEV/pages/123/My+Page+Title -> My Page Title
 */
function extractTitleFromUrl(fullUrl: string): string | null {
	if (!fullUrl) return null;

	try {
		const urlObj = new URL(fullUrl);
		const pathSegments = urlObj.pathname.split("/");

		// Find the last segment (page title)
		const titleSegment = pathSegments[pathSegments.length - 1];

		if (titleSegment) {
			// Replace + with spaces and decode URI
			return decodeURIComponent(titleSegment.replace(/\+/g, " "));
		}
	} catch {
		return null;
	}

	return null;
}

/**
 * Extract parent page ID from Confluence URL
 * Examples:
 * - https://your-company.atlassian.net/wiki/spaces/DEV/pages/803397090/Title -> 803397090
 */
function extractParentPageIdFromUrl(fullUrl: string): string | null {
	if (!fullUrl) return null;

	try {
		const urlObj = new URL(fullUrl);
		const pathSegments = urlObj.pathname.split("/");

		// Look for /pages/{ID}/ pattern
		const pagesIndex = pathSegments.indexOf("pages");
		if (pagesIndex >= 0 && pagesIndex < pathSegments.length - 1) {
			const pageId = pathSegments[pagesIndex + 1];
			// Validate it's a number
			if (/^\d+$/.test(pageId)) {
				return pageId;
			}
		}
	} catch {
		return null;
	}

	return null;
}

/**
 * Extract space key from Confluence URL
 */
function extractSpaceKeyFromUrl(url: string): string | null {
	if (!url) return null;

	const spacesMatch = url.match(/\/spaces\/([^/]+)\//i);
	if (spacesMatch?.[1]) {
		return spacesMatch[1];
	}

	const displayMatch = url.match(/\/display\/([^/]+)\//i);
	if (displayMatch?.[1]) {
		return displayMatch[1];
	}

	return null;
}

/**
 * Find Confluence reference URL in content
 */
function findConfluenceUrlInContent(content: string): string | null {
	const pattern =
		/^(?:\*\*|\*)?Confluence(?:\s+reference)?(?:\*\*|\*)?\s*:\s*(https?:\/\/[^\s]+)/im;
	const match = content.match(pattern);

	if (match?.[1]) {
		return match[1].replace(/[.,)]+$/, "");
	}

	return null;
}

/**
 * Parse YAML frontmatter
 */
function parseFrontmatter(content: string) {
	const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
	const match = content.match(frontmatterRegex);

	if (!match) {
		return { frontmatter: {}, content };
	}

	const frontmatterStr = match[1];
	const markdownContent = content.slice(match[0].length);
	const frontmatter: Record<string, string> = {};
	const lines = frontmatterStr.split("\n");

	let currentKey: string | null = null;

	for (const line of lines) {
		if (!line.trim()) continue;

		const confluenceMatch = line.match(/^confluence:\s*(.+)$/i);
		if (confluenceMatch) {
			const urlValue = confluenceMatch[1].trim().replace(/['"]/g, "");
			if (urlValue.startsWith("http")) {
				frontmatter.baseUrl = urlValue;
			}
			continue;
		}

		if (line.match(/^confluence:\s*$/i)) {
			currentKey = "confluence";
			continue;
		}

		if (currentKey === "confluence" && line.match(/^\s+\w+:/)) {
			const [key, value] = line.split(":").map((s: string) => s.trim());

			if (key === "baseUrl") frontmatter.baseUrl = value.replace(/['"]/g, "");
			else if (key === "spaceKey")
				frontmatter.spaceKey = value.replace(/['"]/g, "");
			else if (key === "parentPageId")
				frontmatter.parentPageId = value.replace(/['"]/g, "");
			else if (key === "title") frontmatter.title = value.replace(/['"]/g, "");
			else if (key === "updateIfExists") frontmatter.updateIfExists = value;
		}
	}

	// Extract space key from baseUrl if not provided
	if (frontmatter.baseUrl && !frontmatter.spaceKey) {
		const extractedSpace = extractSpaceKeyFromUrl(frontmatter.baseUrl);
		if (extractedSpace) {
			frontmatter.spaceKey = extractedSpace;
		}
	}

	return { frontmatter, content: markdownContent };
}

/**
 * Confluence API Client
 */
class ConfluenceClient {
	private baseUrl: string;
	private spaceKey: string;
	private headers: Record<string, string>;

	constructor(config: {
		baseUrl: string;
		apiToken: string;
		email: string;
		spaceKey: string;
	}) {
		this.baseUrl = config.baseUrl;
		this.spaceKey = config.spaceKey;
		this.headers = {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: `Bearer ${config.apiToken}`,
			"X-Atlassian-Token": "nocheck",
		};
	}

	async request(
		endpoint: string,
		method: string,
		body?: Record<string, unknown>,
	): Promise<Record<string, unknown>> {
		const url = `${this.baseUrl}${endpoint}`;
		const options: RequestInit = {
			method,
			headers: this.headers,
		};

		if (body) {
			options.body = JSON.stringify(body);
		}

		const response = await fetch(url, options);

		if (!response.ok) {
			const errorData = await response.json().catch(() => ({}));
			if (errorData && Object.keys(errorData).length > 0) {
				console.error(
					chalk.red("Confluence API error:"),
					JSON.stringify(errorData, null, 2),
				);
			}
			throw new Error(`Request failed with status code ${response.status}`);
		}

		return response.json() as Promise<Record<string, unknown>>;
	}

	async findPageByTitle(
		title: string,
		parentPageId?: string,
	): Promise<Record<string, unknown> | null> {
		try {
			const response = await this.request(
				`/rest/api/content?spaceKey=${this.spaceKey}&title=${encodeURIComponent(title)}&expand=space,version,ancestors`,
				"GET",
			);
			const pages = response.results as Array<Record<string, unknown>>;

			if (pages.length === 0) return null;

			if (parentPageId) {
				const matchingPage = pages.find((page) => {
					if (page.id === parentPageId) return true;
					const ancestors =
						(page.ancestors as Array<Record<string, unknown>>) || [];
					return ancestors.some(
						(ancestor) =>
							(ancestor as Record<string, unknown>).id === parentPageId,
					);
				});
				return matchingPage || null;
			}

			return pages[0];
		} catch {
			// Return null on 404 or other errors instead of throwing
			return null;
		}
	}

	async createPage(
		title: string,
		body: string,
		parentPageId?: string,
	): Promise<Record<string, unknown>> {
		try {
			const requestBody: Record<string, unknown> = {
				type: "page",
				title,
				space: { key: this.spaceKey },
				body: {
					storage: {
						value: body,
						representation: "storage",
					},
				},
			};

			if (parentPageId) {
				requestBody.ancestors = [{ id: parentPageId }];
			}

			const page = await this.request("/rest/api/content", "POST", requestBody);

			return {
				id: page.id,
				title: page.title,
				space: page.space,
				_links: page._links,
			};
		} catch (error: unknown) {
			throw new Error(`Failed to create page: ${(error as Error).message}`);
		}
	}

	async updatePage(
		pageId: string,
		title: string,
		body: string,
		version: number,
	): Promise<Record<string, unknown>> {
		try {
			const page = await this.request(`/rest/api/content/${pageId}`, "PUT", {
				id: pageId,
				type: "page",
				title,
				body: {
					storage: {
						value: body,
						representation: "storage",
					},
				},
				version: {
					number: version + 1,
				},
			});

			return {
				id: page.id,
				title: page.title,
				space: page.space,
				_links: page._links,
			};
		} catch (error: unknown) {
			throw new Error(`Failed to update page: ${(error as Error).message}`);
		}
	}

	getPageUrl(page: Record<string, unknown>): string {
		const links = page._links as Record<string, unknown>;
		return `${this.baseUrl}${links.webui}`;
	}
}

program
	.name("mdc")
	.description("Upload Markdown files to Confluence - Standalone CLI")
	.version("2.0.0");

program
	.command("init")
	.description("Initialize Confluence credentials by running setup script")
	.action(() => {
		const { execSync } = require("node:child_process");
		const path = require("node:path");

		try {
			const scriptPath = path.join(__dirname, "../setup-zshrc.sh");
			execSync(`bash "${scriptPath}"`, { stdio: "inherit" });
		} catch (error: unknown) {
			console.error(
				chalk.red("Failed to run setup script:"),
				(error as Error).message,
			);
			process.exit(1);
		}
	});

program
	.command("fetch <pageId>")
	.description("Fetch a Confluence page content by ID")
	.option("-o, --output <file>", "Output file path (default: stdout)")
	.action(async (pageId: string, options: Record<string, unknown>) => {
		try {
			const email = process.env.CONFLUENCE_EMAIL;
			const apiToken = process.env.CONFLUENCE_API_TOKEN;
			const baseUrl = process.env.CONFLUENCE_BASE_URL;

			if (!email || !apiToken || !baseUrl) {
				console.error(
					chalk.red(
						"❌ Missing required Confluence credentials in environment:",
					),
				);
				if (!baseUrl) console.error(chalk.red("   - CONFLUENCE_BASE_URL"));
				if (!email) console.error(chalk.red("   - CONFLUENCE_EMAIL"));
				if (!apiToken) console.error(chalk.red("   - CONFLUENCE_API_TOKEN"));
				console.error(chalk.yellow("\n💡 Run: mdc init"));
				process.exit(1);
			}

			const spinner = ora("Fetching page from Confluence...").start();

			const headers = {
				"Content-Type": "application/json",
				Accept: "application/json",
				Authorization: `Bearer ${apiToken}`,
				"X-Atlassian-Token": "nocheck",
			};

			const url = `${baseUrl}/rest/api/content/${pageId}?expand=body.storage`;
			const response = await fetch(url, {
				method: "GET",
				headers,
			});

			if (!response.ok) {
				throw new Error(`Request failed with status code ${response.status}`);
			}

			const page = (await response.json()) as Record<string, unknown>;
			const content = (
				(page.body as Record<string, unknown>)?.storage as Record<
					string,
					unknown
				>
			)?.value as string;

			spinner.succeed(chalk.green(`Fetched page: ${page.title as string}`));

			if (options.output) {
				const outputPath = options.output as string;
				fs.writeFileSync(outputPath, content || "");
				console.log(chalk.blue(`\n📄 Content saved to: ${outputPath}`));
			} else {
				console.log("\n" + (content || ""));
			}

			const links = page._links as Record<string, unknown>;
			console.log(chalk.blue(`🔗 Page URL: ${baseUrl}${links.webui}`));
			console.log(chalk.green("✅ Fetch complete!\n"));
		} catch (error: unknown) {
			console.error(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
			process.exit(1);
		}
	});

program
	.command("upload <markdownFile>")
	.description("Upload a Markdown file to Confluence")
	.option(
		"-s, --service <url>",
		"Confluence base URL (overrides frontmatter and content)",
	)
	.option(
		"-k, --space <key>",
		"Confluence space key (overrides frontmatter and content)",
	)
	.option("-p, --parent <id>", "Parent page ID (overrides frontmatter)")
	.option(
		"-i, --page-id <id>",
		"Page ID to update directly (bypasses title search)",
	)
	.option(
		"-t, --title <title>",
		"Page title (overrides frontmatter, defaults to filename)",
	)
	.option(
		"-u, --update",
		"Update page if exists (overrides frontmatter)",
		false,
	)
	.action(async (markdownFile: string, options: Record<string, unknown>) => {
		try {
			// Validate required environment variables
			let baseUrl = process.env.CONFLUENCE_BASE_URL;
			const email = process.env.CONFLUENCE_EMAIL;
			const apiToken = process.env.CONFLUENCE_API_TOKEN;

			if (!email || !apiToken) {
				console.error(
					chalk.red(
						"❌ Missing required Confluence credentials in environment:",
					),
				);
				if (!baseUrl) console.error(chalk.red("   - CONFLUENCE_BASE_URL"));
				if (!email) console.error(chalk.red("   - CONFLUENCE_EMAIL"));
				if (!apiToken) console.error(chalk.red("   - CONFLUENCE_API_TOKEN"));
				console.error(chalk.yellow("\n💡 Run: mdc init"));
				process.exit(1);
			}

			// Read markdown file
			const absolutePath = path.resolve(markdownFile);
			if (!fs.existsSync(absolutePath)) {
				console.error(chalk.red(`Error: File not found: ${absolutePath}`));
				process.exit(1);
			}

			const markdownContent = fs.readFileSync(absolutePath, "utf-8");

			// Parse frontmatter
			const { frontmatter, content } = parseFrontmatter(markdownContent);

			// Get base URL from options, frontmatter, or content
			const rawBaseUrl = (options.service as string) || frontmatter.baseUrl;
			let spaceKey = (options.space as string) || frontmatter.spaceKey;
			let parentPageId = (options.parent as string) || frontmatter.parentPageId;
			let pageTitle = (options.title as string) || frontmatter.title;
			let updateIfExists =
				(options.update as boolean) || frontmatter.updateIfExists || false;
			let directPageId = options.pageId as string;

			// Extract base URL and other fields from frontmatter URL or content URL
			let urlToParse: string | null = rawBaseUrl;
			if (!urlToParse) {
				urlToParse = findConfluenceUrlInContent(content);
			}

			if (urlToParse) {
				if (!baseUrl) {
					const extractedBaseUrl = extractBaseUrl(urlToParse);
					if (extractedBaseUrl) {
						baseUrl = extractedBaseUrl;
						console.log(chalk.yellow("ℹ️  Auto-detected base URL from URL"));
					}
				}
				if (!spaceKey) {
					const extractedSpace = extractSpaceKeyFromUrl(urlToParse);
					if (extractedSpace) {
						spaceKey = extractedSpace;
						console.log(
							chalk.yellow(`ℹ️  Auto-detected space key "${spaceKey}" from URL`),
						);
					}
				}
				// Only extract parent if direct page ID not specified
				if (!directPageId && !parentPageId) {
					const extractedParentId = extractParentPageIdFromUrl(urlToParse);
					if (extractedParentId) {
						parentPageId = extractedParentId;
						console.log(
							chalk.yellow(
								`ℹ️  Auto-detected parent page ID "${parentPageId}" from URL`,
							),
						);
					}
				}
				// Extract page ID from URL if present (for direct update)
				if (!directPageId) {
					const extractedPageId = extractParentPageIdFromUrl(urlToParse);
					if (extractedPageId) {
						directPageId = extractedPageId;
						console.log(
							chalk.yellow(
								`ℹ️  Auto-detected page ID "${directPageId}" from URL`,
							),
						);
					}
				}
				if (!pageTitle) {
					const extractedTitle = extractTitleFromUrl(urlToParse);
					if (extractedTitle) {
						pageTitle = extractedTitle;
						console.log(
							chalk.yellow(`ℹ️  Auto-detected title "${pageTitle}" from URL`),
						);
					}
				}
			}

			// Default to true if parent page ID is specified (likely updating existing page)
			if (
				parentPageId &&
				!frontmatter.updateIfExists &&
				options.update === undefined
			) {
				updateIfExists = true;
			}

			// Remove trailing slash from base URL
			if (baseUrl) {
				baseUrl = baseUrl.replace(/\/$/, "");
			}

			// Validate required fields
			if (!baseUrl) {
				console.error(chalk.red("❌ Missing Confluence URL"));
				console.error(
					chalk.yellow(
						"\n💡 Add a Confluence reference URL to your Markdown frontmatter:",
					),
				);
				console.error(chalk.gray("   ---"));
				console.error(
					chalk.gray(
						"   confluence: https://your-company.atlassian.net/wiki/spaces/SPACE/pages/123456789/Page+Title",
					),
				);
				console.error(chalk.gray("   ---"));
				console.error(chalk.yellow("\nOr use command-line options:"));
				console.error(chalk.yellow("  --service <url>   Confluence base URL"));
				console.error(
					chalk.yellow("  --space <key>     Space key (e.g., DEV, ENG)"),
				);
				console.error(chalk.yellow("  --parent <id>     Parent page ID\n"));
				process.exit(1);
			}

			if (!spaceKey) {
				console.error(chalk.red("❌ Could not detect space key from URL"));
				console.error(chalk.yellow("\n💡 Provide the space key via:"));
				console.error(chalk.yellow("  --space <key>     (e.g., DEV, ENG, KB)"));
				console.error(chalk.yellow("\nOr add it to your frontmatter:"));
				console.error(chalk.gray("   ---"));
				console.error(
					chalk.gray(
						"   confluence: https://your-company.atlassian.net/wiki/spaces/SPACE/pages/123/Page+Title",
					),
				);
				console.error(chalk.gray("   ---\n"));
				process.exit(1);
			}

			// Default title to filename if still not set
			if (!pageTitle) {
				pageTitle = path.basename(markdownFile, ".md");
			}

			// Show upload info
			console.log(chalk.blue("\n📤 Uploading to Confluence:"));
			console.log(chalk.gray(`   Base URL: ${baseUrl}`));
			console.log(chalk.gray(`   Space: ${spaceKey}`));
			console.log(chalk.gray(`   Title: ${pageTitle}`));
			if (parentPageId) console.log(chalk.gray(`   Parent: ${parentPageId}`));
			console.log(chalk.gray(`   Update if exists: ${updateIfExists}`));
			console.log("");

			const spinner = ora(
				"Converting Markdown to Confluence format...",
			).start();

			// Convert markdown
			const htmlContent = convertMarkdownToConfluenceStorage(content);

			spinner.text = "Connecting to Confluence...";

			// Create client
			const client = new ConfluenceClient({
				baseUrl,
				apiToken,
				email,
				spaceKey,
			});

			spinner.text = "Uploading to Confluence...";

			// Upload
			let page: Record<string, unknown> | undefined;
			if (updateIfExists) {
				let existingPage: Record<string, unknown> | null = null;

				// If direct page ID is available, use it to fetch the page directly
				if (directPageId) {
					try {
						existingPage = await client.request(
							`/rest/api/content/${directPageId}?expand=space,version,ancestors`,
							"GET",
						);
						spinner.text = `Found existing page by ID: ${directPageId}`;
					} catch {
						// If direct fetch fails, fall back to title search
						existingPage = null;
					}
				}

				// Fall back to title search if no page ID or direct fetch failed
				if (!existingPage) {
					existingPage = await client.findPageByTitle(pageTitle);
				}

				if (existingPage) {
					const pageDetails = await client.request(
						`/rest/api/content/${existingPage.id}?expand=version`,
						"GET",
					);
					const version = (pageDetails.version as Record<string, number>)
						.number;

					page = await client.updatePage(
						existingPage.id as string,
						pageTitle,
						htmlContent,
						version,
					);
					spinner.succeed(chalk.green(`Updated existing page: ${page.id}`));
				} else {
					page = await client.createPage(pageTitle, htmlContent, parentPageId);
					spinner.succeed(chalk.green(`Created new page: ${page.id}`));
				}
			} else {
				page = await client.createPage(pageTitle, htmlContent, parentPageId);
				spinner.succeed(chalk.green(`Created new page: ${page.id}`));
			}

			const pageUrl = client.getPageUrl(page as Record<string, unknown>);
			console.log(chalk.blue(`\n🔗 Page URL: ${pageUrl}`));
			console.log(chalk.green("✅ Upload complete!\n"));
		} catch (error: unknown) {
			console.error(chalk.red(`\n❌ Error: ${(error as Error).message}\n`));
			process.exit(1);
		}
	});

program.parse();
