/**
 * Component Test Example using Testing Library
 * 
 * This demonstrates how to test React components with MSW mocks
 * and React Query.
 */

import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { beforeAll, afterEach, afterAll, test, expect } from 'vitest';
import { server } from '../../mocks/handlers';

// Mock component for testing (replace with actual component)
function ThreadList() {
  return (
    <div data-testid="thread-list">
      <h1>Threads</h1>
      <p>Loading threads...</p>
    </div>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  queryClient.clear();
});
afterAll(() => server.close());

function renderWithProviders(component: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
}

test('displays thread list from API', async () => {
  renderWithProviders(<ThreadList />);
  
  // Wait for threads to load
  await waitFor(() => {
    expect(screen.getByTestId('thread-list')).toBeInTheDocument();
  });
  
  // Verify content
  expect(screen.getByText('Threads')).toBeInTheDocument();
});

test('handles API errors gracefully', async () => {
  // Override handler to return error
  server.use(
    // Note: This is a placeholder - actual implementation depends on your API hook
  );
  
  renderWithProviders(<ThreadList />);
  
  // Should show error state
  await waitFor(() => {
    // Expect some error message or fallback UI
    expect(screen.getByTestId('thread-list')).toBeInTheDocument();
  });
});
