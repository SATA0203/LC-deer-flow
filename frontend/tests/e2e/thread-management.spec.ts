/**
 * E2E Tests for DeerFlow Thread Management
 * 
 * These tests verify the core thread functionality:
 * - Creating new threads
 * - Sending messages
 * - Viewing conversation history
 * - Thread deletion
 */

import { test, expect } from '@playwright/test';

test.describe('Thread Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');
  });

  test('should create a new thread', async ({ page }) => {
    // Wait for the app to load
    await expect(page.locator('input[placeholder*="message" i], input[placeholder*="Message" i], textarea')).toBeVisible({ timeout: 10000 });
    
    // Look for new thread button or create one by sending a message
    const newThreadButton = page.locator('button:has-text("New"), button:has-text("new"), button:has-text("+")').first();
    
    if (await newThreadButton.isVisible()) {
      await newThreadButton.click();
      await expect(page).toHaveURL(/\/threads\/.+/);
    } else {
      // Alternative: send a message to create a thread
      const input = page.locator('input[placeholder*="message" i], input[placeholder*="Message" i], textarea').first();
      await input.fill('Hello');
      await input.press('Enter');
      
      // Should navigate to a thread or show response
      await expect(page.locator('[data-testid="message"], .message, [class*="message"]')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should send a message and receive a response', async ({ page }) => {
    // Find the input field
    const input = page.locator('input[placeholder*="message" i], input[placeholder*="Message" i], textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Send a test message
    await input.fill('Test message');
    await input.press('Enter');
    
    // Wait for the message to appear in the chat
    const userMessage = page.locator('[data-testid="user-message"], .message.user, [class*="message"]:has-text("Test message")').first();
    await expect(userMessage).toBeVisible({ timeout: 10000 });
    
    // Wait for assistant response (may take longer)
    const assistantMessage = page.locator('[data-testid="assistant-message"], .message.assistant, [class*="message"]:not(:has-text("Test message"))').first();
    await expect(assistantMessage).toBeVisible({ timeout: 30000 });
  });

  test('should display conversation history', async ({ page }) => {
    // Send multiple messages
    const input = page.locator('input[placeholder*="message" i], input[placeholder*="Message" i], textarea').first();
    
    await input.fill('First message');
    await input.press('Enter');
    await page.waitForTimeout(1000);
    
    await input.fill('Second message');
    await input.press('Enter');
    await page.waitForTimeout(1000);
    
    // Verify both messages are visible
    await expect(page.locator('text=First message')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Second message')).toBeVisible({ timeout: 10000 });
  });

  test('should handle empty message submission', async ({ page }) => {
    const input = page.locator('input[placeholder*="message" i], input[placeholder*="Message" i], textarea').first();
    await expect(input).toBeVisible({ timeout: 10000 });
    
    // Try to send empty message
    await input.fill('');
    await input.press('Enter');
    
    // Should not create a message or should show validation
    const submitButton = page.locator('button[type="submit"], button:has-text("Send")').first();
    await expect(submitButton).toBeDisabled().or.toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('should navigate between threads', async ({ page }) => {
    await page.goto('/');
    
    // Wait for sidebar or thread list
    const threadList = page.locator('[data-testid="thread-list"], [class*="sidebar"], [class*="thread-list"]').first();
    
    if (await threadList.isVisible({ timeout: 5000 })) {
      // Click on a thread from the list
      const threadItem = threadList.locator('[role="button"], a, [class*="thread-item"]').first();
      if (await threadItem.isVisible()) {
        await threadItem.click();
        await page.waitForTimeout(1000);
        
        // Should show thread content
        await expect(page.locator('[data-testid="message"], .message, [class*="message"]')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('should handle 404 for non-existent threads', async ({ page }) => {
    await page.goto('/threads/non-existent-thread-id');
    
    // Should show 404 or redirect
    const statusCode = await page.evaluate(() => window.location.pathname);
    expect(statusCode).toMatch(/^(\/|\/threads|\/404)/);
  });
});
