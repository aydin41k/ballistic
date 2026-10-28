import { useCallback, useEffect, useState } from 'react';

import {
  getPushState,
  registerCurrentDevicePush,
  type PushState,
  unregisterCurrentDevicePush,
} from '@/lib/push';

export function usePushNotifications() {
  const [state, setState] = useState<PushState>('prompt');
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setState(await getPushState());
  }, []);

  useEffect(() => {
    let active = true;
    getPushState()
      .then((nextState) => {
        if (active) setState(nextState);
      })
      .catch(() => {
        if (active) setState('unsupported');
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const enable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await registerCurrentDevicePush();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not enable notifications.');
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await unregisterCurrentDevicePush();
      await refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not disable notifications.');
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  return { state, busy, error, enable, disable, refresh };
}
