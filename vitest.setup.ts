/* eslint-disable vue/one-component-per-file */
/* eslint-disable @typescript-eslint/no-empty-function */

import { vi } from 'vitest';
import { defineComponent } from 'vue';
import { config } from '@vue/test-utils';

/**
 * ------------------------------------------------------------
 * Env vars available during module evaluation
 * ------------------------------------------------------------
 */
vi.stubEnv('VITE_APP_ENV', 'test');
vi.stubEnv('VITE_API_BASE_URL_V2', 'http://localhost:4200');
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:7071/api');
vi.stubEnv('VITE_API_KEY', 'test-key');
vi.stubEnv('BASE_URL', '/');

/**
 * -----------------------------
 * Bootstrap & Popper mocks
 * -----------------------------
 */
class FakeModal {
  private _visible = false;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_el?: unknown, _opts?: unknown) {}
  show() {
    this._visible = true;
  }
  hide() {
    this._visible = false;
  }
  dispose() {
    this._visible = false;
  }
  toggle() {
    this._visible = !this._visible;
  }
  static getInstance() {
    return null as unknown as FakeModal | null;
  }
}
const bootstrapMock = { Modal: FakeModal };
vi.stubGlobal('bootstrap', bootstrapMock);

vi.mock('bootstrap', () => ({ default: bootstrapMock, ...bootstrapMock }));
vi.mock('bootstrap/dist/js/bootstrap.js', () => ({ default: bootstrapMock, ...bootstrapMock }));
vi.mock('bootstrap/dist/js/bootstrap.min.js', () => ({ default: bootstrapMock, ...bootstrapMock }));
vi.mock('bootstrap/dist/js/bootstrap.bundle.js', () => ({
  default: bootstrapMock,
  ...bootstrapMock,
}));
vi.mock('bootstrap/dist/js/bootstrap.bundle.min.js', () => ({
  default: bootstrapMock,
  ...bootstrapMock,
}));

vi.mock('bootstrap/js/dist/modal', () => ({ default: FakeModal, Modal: FakeModal }));
vi.mock('bootstrap/js/dist/alert', () => ({ default: {}, Alert: {} }));
vi.mock('bootstrap/js/dist/tooltip', () => ({ default: {}, Tooltip: {} }));

// Popper is a peer dep; keep it quiet.
vi.mock('@popperjs/core', () => ({}));

/**
 * ------------------------------------
 * Fancybox
 * ------------------------------------
 */
vi.mock('@fancyapps/ui', () => ({
  Fancybox: { bind: vi.fn(), destroy: vi.fn() },
}));

/**
 * ------------------------------------
 * Axios (no network)
 * ------------------------------------
 */
function dataFor(url: string) {
  if (/users/i.test(url)) return [{ id: 1, name: 'Alice' }];
  if (/roles?/i.test(url)) return [{ id: 1, name: 'Manager' }];
  if (/phases?/i.test(url)) return [{ id: 10, name: 'Assembly' }];
  if (/projects?/i.test(url)) return [{ id: 100, name: 'Demo Project' }];
  return [];
}
vi.mock('axios', () => {
  const get = vi.fn((url: string) => Promise.resolve({ data: dataFor(url) }));
  const post = vi.fn((_url: string, _body?: any) => Promise.resolve({ data: {} }));
  const put = vi.fn((_url: string, _body?: any) => Promise.resolve({ data: {} }));
  const del = vi.fn((_url: string) => Promise.resolve({ data: {} }));
  const instance = {
    get,
    post,
    put,
    delete: del,
    interceptors: { request: { use: vi.fn() }, response: { use: vi.fn() } },
  };
  return { default: { ...instance, create: () => instance }, ...instance };
});

/**
 * ------------------------------------
 * FilePond + Plugins
 * ------------------------------------
 */
vi.mock('vue-filepond', () => {
  const componentFactory = (..._plugins: any[]) =>
    defineComponent({
      name: 'FilePond',
      props: {
        id: { type: String, default: '' },
        name: { type: String, default: '' },
        files: { type: Array, default: () => [] },
        allowMultiple: Boolean,
        server: { type: [String, Object], default: '' },
        labelIdle: { type: String, default: '' },
      },
      methods: {
        getFiles() {
          return [];
        },
        removeFiles() {
          return undefined;
        },
      },
      template: '<div data-testid="filepond"><slot /></div>',
    });
  return { default: componentFactory };
});
vi.mock('filepond-plugin-image-preview', () => ({ default: () => ({}) }));
vi.mock('filepond-plugin-file-validate-type', () => ({ default: () => ({}) }));

vi.mock('vue-select', () => ({
  default: defineComponent({ name: 'VSelect', template: '<div />' }),
}));

/**
 * -----------------------------------------------------
 * vue-router partial mock (keep real createRouter/etc.)
 * -----------------------------------------------------
 */
vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router');
  return {
    ...actual,
    useRoute: () => ({ params: { id: '123' } }),
    useRouter: () => ({
      push: vi.fn(),
      replace: vi.fn(),
      currentRoute: { value: { path: '/' } },
    }),
    RouterLink: defineComponent({
      name: 'RouterLink',
      props: { to: { type: [String, Object], default: '/' } },
      template: '<a><slot /></a>',
    }),
    RouterView: defineComponent({ name: 'RouterView', template: '<div />' }),
  };
});

/**
 * -----------------------------------------------------
 * SessionStorageService (global mock)
 * - Export shape matches real module (named class)
 * - Tests control behavior via getSessionApi()
 * -----------------------------------------------------
 */
vi.mock('@/util/sessionStorageService', () => {
  const sharedStore = new Map<string, any>();

  const api = {
    getItem: vi.fn((key: string) => (sharedStore.has(key) ? sharedStore.get(key) : null)),
    setItem: vi.fn((key: string, value: any) => {
      sharedStore.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      sharedStore.delete(key);
    }),
    clear: vi.fn(() => {
      sharedStore.clear();
    }),
  };

  // Every `new SessionStorageService()` returns the same spy-able API
  const SessionStorageService = vi.fn(() => api);

  // 👈 Export a getter so tests can access the same API object
  const getSessionApi = () => api;

  // Shared store is handy if you want to preseed values in a test
  return { SessionStorageService, getSessionApi, __sessionStore: sharedStore };
});

/**
 * -----------------------------------------------------
 * Base URL helper used by generated service proxies
 * -----------------------------------------------------
 */
vi.mock('@/shared/service-proxies/base-service-proxy', () => {
  class BaseServiceProxy {
    baseUrl: string;
    http: any;
    constructor(baseUrl?: string, http?: any) {
      this.baseUrl = baseUrl ?? 'http://localhost:4200';
      this.http = http ?? { fetch: vi.fn() };
    }
    getBaseUrl(path = '', override?: string) {
      return (override ?? this.baseUrl) + path;
    }
    transformOptions<T extends RequestInit>(opts: T): T {
      return opts;
    }
    async transformResult(url: string, res: Response) {
      return { url, res };
    }
  }
  const getBaseUrl = () => 'http://localhost:4200';
  return { BaseServiceProxy, getBaseUrl };
});

/**
 * -----------------------------------------------------
 * SFC stubs to avoid "Invalid vnode type: undefined"
 * -----------------------------------------------------
 */
vi.mock('@/components/ProjectScopeFilters.vue', () => ({
  default: defineComponent({ name: 'ProjectScopeFilters', template: '<div />' }),
}));
vi.mock('@/components/StatusLegend.vue', () => ({
  default: defineComponent({ name: 'StatusLegend', template: '<div />' }),
}));
vi.mock('@/components/UnitInfo.vue', () => ({
  default: defineComponent({ name: 'UnitInfo', template: '<div />' }),
}));
vi.mock('@/components/TaskInfo.vue', () => ({
  default: defineComponent({ name: 'TaskInfo', template: '<div />' }),
}));

/**
 * -----------------------------
 * Global stubs to keep DOM quiet
 * -----------------------------
 */
config.global.stubs = {
  ...(config.global.stubs || {}),
  UnitInfo: true,
  TaskInfo: true,
  TopNavWithOverlay: true,
  TopNavBar: true,
  SubTaskQueue: true,
  MainTasksQueue: true,
  BlockedUnitsQueue: true,
  ProjectScopeFilters: true,
  StatusLegend: true,
  RouterLink: true,
  RouterView: true,
};

// Custom element used in templates
config.global.components = {
  ...(config.global.components || {}),
  H7: defineComponent({ name: 'H7', template: '<span><slot /></span>' }),
};

/**
 * ----------------------------------------
 * Browser APIs some libs expect in JSDOM
 * ----------------------------------------
 */
declare global {
  interface Window {
    matchMedia: (query: string) => MediaQueryList;
  }
}

if (!('matchMedia' in window)) {
  (window as Window).matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

if (!('scrollTo' in window)) {
  (window as any).scrollTo = vi.fn();
}

if (!('ResizeObserver' in window)) {
  (window as any).ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
}
if (!('IntersectionObserver' in window)) {
  (window as any).IntersectionObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return [];
    }
    root = null;
    rootMargin = '';
    thresholds = [];
  };
}
