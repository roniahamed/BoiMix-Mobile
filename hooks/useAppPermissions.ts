import { useState, useCallback } from "react";
import {
  requestLocationPermission,
  requestCameraPermission,
  requestMediaLibraryPermission,
  requestNotificationPermission,
  openAppSettings,
  PermissionResult,
} from "@/lib/permissions";

export function useAppPermissions() {
  const [loading, setLoading] = useState(false);

  const askLocation = useCallback(async (showAlert = true): Promise<PermissionResult> => {
    setLoading(true);
    try {
      return await requestLocationPermission({ showAlertOnDenial: showAlert });
    } finally {
      setLoading(false);
    }
  }, []);

  const askCamera = useCallback(async (showAlert = true): Promise<PermissionResult> => {
    setLoading(true);
    try {
      return await requestCameraPermission({ showAlertOnDenial: showAlert });
    } finally {
      setLoading(false);
    }
  }, []);

  const askMediaLibrary = useCallback(async (showAlert = true): Promise<PermissionResult> => {
    setLoading(true);
    try {
      return await requestMediaLibraryPermission({ showAlertOnDenial: showAlert });
    } finally {
      setLoading(false);
    }
  }, []);

  const askNotifications = useCallback(async (showAlert = false): Promise<PermissionResult> => {
    setLoading(true);
    try {
      return await requestNotificationPermission({ showAlertOnDenial: showAlert });
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    askLocation,
    askCamera,
    askMediaLibrary,
    askNotifications,
    openSettings: openAppSettings,
  };
}
