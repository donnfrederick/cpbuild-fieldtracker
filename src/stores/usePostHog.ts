import posthog from 'posthog-js';
import axios from 'axios';

const key = import.meta.env.VITE_POSTHOG_KEY;
const host = import.meta.env.VITE_POSTHOG_HOST;
const projectId = import.meta.env.VITE_POSTHOG_PROJECT_ID;
const personalKey = import.meta.env.VITE_POSTHOG_PERSONAL_KEY;

const ph = axios.create({
  baseURL: `${host}/api/projects/${projectId}`,
  headers: {
    Authorization: `Bearer ${personalKey}`,
    'Content-Type': 'application/json',
  },
});

export function usePostHog() {
  if (key && host) {
    return posthog.init(key, {
      api_host: host,
      defaults: '2025-05-24',
    });
  } else return null;
}

export async function createFeatureFlag(key: string, name = key, rollout = 100) {
  const { data } = await ph.post('/feature_flags', {
    key,
    name,
    active: true,
    filters: { groups: [{ rollout_percentage: rollout }] },
  });
  return data;
}
