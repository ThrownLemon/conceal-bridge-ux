# SearXNG MCP Integration Guide

## Overview

The SearXNG MCP server provides tools to perform web searches and extract content from URLs. This enables your AI agent to access real-time information from the internet.

## Available Tools

### Web Search

#### `searxng_web_search`

Performs a web search using the SearXNG meta-search engine.

**Parameters:**

- `query`: The search terms.
- `category`: (Optional) Filter by category (e.g., 'general', 'news', 'science').
- `time_range`: (Optional) Restrict results to a time range ('day', 'week', 'month', 'year').
- `language`: (Optional) Search language code (e.g., 'en-US').

**Use Cases:**

- finding recent news or events
- researching a topic
- finding documentation that isn't available locally

### Content Extraction

#### `web_url_read`

Reads and extracts the main content from a given URL.

**Parameters:**

- `url`: The URL to read.

**Use Cases:**

- reading an article found via search
- analyzing a specific web page
- extracting text for summarization

## Best Practices

1. **Refine Queries**: Use specific keywords in your `searxng_web_search` to get the most relevant results.
2. **Read Responsibly**: Use `web_url_read` to fetch the actual content of promising search results to get full details.
3. **Combine Tools**: Search for a topic, identify relevant URLs, and then read the content of those URLs to synthesize a comprehensive answer.
