import { vi } from 'vitest';

const mockAxios = {
  post: vi.fn().mockImplementation((url: string) => {
    if (url.includes('/users/list')) {
      return Promise.resolve({ data: [{ id: 1, name: 'Mock User' }] });
    }
    if (url.includes('/states/list')) {
      return Promise.resolve({ data: [{ id: 2, name: 'Mock State' }] });
    }
    return Promise.resolve({ data: {} });
  }),

  get: vi.fn(),

  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
};

export default mockAxios;
export const Axios = mockAxios; // for potential named import compatibility
