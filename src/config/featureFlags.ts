import { usePostHog } from '@/stores/usePostHog';
import { localStorageHelper } from '@/util/localStorageHelper';
import { reactive } from 'vue';

const posthog = usePostHog();

type FeatureFlagValue = string | number | boolean | null;

type FeatureFlags = {
  offlineMode: FeatureFlagValue;
  newLabelGenerator: FeatureFlagValue;
  subcontractorLogin: FeatureFlagValue;
  environment: FeatureFlagValue;
  maskingMode: FeatureFlagValue;
  laborManagerReadyTaskSummary: FeatureFlagValue;
  laborManagerTaskSubmissionPassFail: FeatureFlagValue;
  installTrackerReadyTaskSummary: FeatureFlagValue;
  installTrackerWorkHourSubmission: FeatureFlagValue;
};

const defaultFlags: FeatureFlags = {
  offlineMode: true,
  newLabelGenerator: false,
  subcontractorLogin: false,
  environment: 'local',
  maskingMode: true,
  laborManagerReadyTaskSummary: true,
  laborManagerTaskSubmissionPassFail: true,
  installTrackerReadyTaskSummary: true,
  installTrackerWorkHourSubmission: true,
};

let resolveReady!: () => void;

const cachedFlags = localStorageHelper<FeatureFlags>('featureFlags').get();

export const featureFlagsReady = new Promise<void>((resolve) => {
  resolveReady = resolve;
});

export const featureFlags = reactive<FeatureFlags>({ ...defaultFlags, ...cachedFlags });

if (posthog) {
  posthog.onFeatureFlags(() => {
    featureFlags.offlineMode =
      (posthog.getFeatureFlagPayload('offlineMode') as FeatureFlagValue) ?? false;
    featureFlags.newLabelGenerator =
      (posthog.getFeatureFlagPayload('newLabelGenerator') as FeatureFlagValue) ?? false;
    featureFlags.subcontractorLogin =
      (posthog.getFeatureFlagPayload('subcontractorLogin') as FeatureFlagValue) ?? false;
    featureFlags.environment =
      (posthog.getFeatureFlagPayload('environment') as FeatureFlagValue) ?? 'local';
    featureFlags.maskingMode =
      (posthog.getFeatureFlagPayload('maskingMode') as FeatureFlagValue) ?? false;
    featureFlags.installTrackerReadyTaskSummary =
      (posthog.getFeatureFlagPayload('installTrackerReadyTaskSummary') as FeatureFlagValue) ??
      false;
    featureFlags.installTrackerWorkHourSubmission =
      (posthog.getFeatureFlagPayload('installTrackerWorkHourSubmission') as FeatureFlagValue) ??
      false;
    featureFlags.laborManagerReadyTaskSummary =
      (posthog.getFeatureFlagPayload('laborManagerReadyTaskSummary') as FeatureFlagValue) ?? false;
    featureFlags.laborManagerTaskSubmissionPassFail =
      (posthog.getFeatureFlagPayload('laborManagerTaskSubmissionPassFail') as FeatureFlagValue) ??
      false;

    localStorageHelper<FeatureFlags>('featureFlags').set(featureFlags);
    resolveReady?.();
  });
}
