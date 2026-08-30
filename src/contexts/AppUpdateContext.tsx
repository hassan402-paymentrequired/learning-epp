import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';
import { ForceUpdateScreen } from '@/components/ForceUpdateScreen';
import { CustomSplashScreen } from '@/components/CustomSplashScreen';
import {
  checkForceUpdateRequired,
  getNativeAppPlatform,
  getNativeAppVersion,
} from '@/services/app-version';
import { setForceUpdateCallback } from '@/services/api';
import { getStoreUrlForPlatform, IOS_STORE_URL } from '@/constants/store-urls';

import type { ForceUpdatePayload } from '@/types/app-version';

type AppUpdateContextValue = {
  requireUpdate: (payload: ForceUpdatePayload) => void;
  recheckUpdate: () => Promise<void>;
};

const AppUpdateContext = createContext<AppUpdateContextValue | undefined>(
  undefined
);

export function AppUpdateProvider({ children }: { children: ReactNode }) {
  const [checking, setChecking] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [updateRequired, setUpdateRequired] = useState<ForceUpdatePayload | null>(
    null
  );
  const updateRequiredRef = useRef(updateRequired);
  updateRequiredRef.current = updateRequired;

  const requireUpdate = useCallback((payload: ForceUpdatePayload) => {
    setUpdateRequired(payload);
    setChecking(false); // Ensure we are not showing splashscreen any longer
  }, []);

  const recheckUpdate = useCallback(async () => {
    if (updateRequiredRef.current) {
      setRetrying(true);
    }

    try {
      const result = await checkForceUpdateRequired();
      setUpdateRequired(result);
    } catch {
      // Fail open on network errors unless already blocked.
    } finally {
      setRetrying(false);
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    setForceUpdateCallback(requireUpdate);

    void recheckUpdate();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        void recheckUpdate();
      }
    });

    return () => {
      subscription.remove();
      setForceUpdateCallback(() => {});
    };
  }, [requireUpdate, recheckUpdate]);

  const value = useMemo(
    () => ({ requireUpdate, recheckUpdate }),
    [requireUpdate, recheckUpdate]
  );

  // Do NOT show CustomSplashScreen if a force update is required.
  if (checking && !updateRequired) {
    return <CustomSplashScreen />;
  }

  if (updateRequired) {
    const platform = getNativeAppPlatform();
    const storeUrl =
      updateRequired.storeUrl || getStoreUrlForPlatform(platform) || IOS_STORE_URL;

    return (
      <ForceUpdateScreen
        message={updateRequired.message}
        minVersion={updateRequired.minVersion}
        currentVersion={getNativeAppVersion()}
        storeUrl={storeUrl}
        onRetry={recheckUpdate}
        retrying={retrying}
      />
    );
  }

  return (
    <AppUpdateContext.Provider value={value}>{children}</AppUpdateContext.Provider>
  );
}

export function useAppUpdate() {
  const context = useContext(AppUpdateContext);
  if (context === undefined) {
    throw new Error('useAppUpdate must be used within an AppUpdateProvider');
  }
  return context;
}
