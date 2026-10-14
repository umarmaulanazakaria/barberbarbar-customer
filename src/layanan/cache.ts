import { QueryClient } from '@tanstack/react-query';
export const cache = new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 15000 }, mutations: { retry: false } } });
