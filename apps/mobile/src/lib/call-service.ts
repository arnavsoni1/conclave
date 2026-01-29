import { AppState, Platform } from "react-native";
import type { IOptions } from "react-native-callkeep";
import InCallManager from "react-native-incall-manager";

let callKeepReady = false;
let currentCallId: string | null = null;
let callKeepModule: typeof import("react-native-callkeep") | null = null;
let foregroundServiceModule: unknown | null = null;
let foregroundActionsCleanup: (() => void) | null = null;

const FOREGROUND_NOTIFICATION_ID = 4242;
const FOREGROUND_ACTION_LEAVE = "leave";
const FOREGROUND_ACTION_OPEN = "open";
const FOREGROUND_COLOR = "#F95F4A";

const getCallKeep = () => {
  if (Platform.OS !== "ios") return null;
  if (!callKeepModule) {
    callKeepModule = require("react-native-callkeep");
  }
  return callKeepModule;
};

const getForegroundService = (): any | null => {
  if (Platform.OS !== "android") return null;
  if (!foregroundServiceModule) {
    try {
      foregroundServiceModule = require("@supersami/rn-foreground-service");
    } catch (error) {
      console.warn("[ForegroundService] module not available", error);
      return null;
    }
  }
  return (foregroundServiceModule as any)?.default ?? foregroundServiceModule;
};

const CALLKEEP_OPTIONS: IOptions = {
  ios: {
    appName: "Conclave",
    supportsVideo: true,
  },
  android: {
    alertTitle: "Phone account required",
    alertDescription:
      "This app needs access to your phone accounts to manage calls.",
    cancelButton: "Cancel",
    okButton: "Ok",
    additionalPermissions: [],
  },
};

const createCallId = () => {
  const s4 = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).slice(1);
  return `${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
};

export async function ensureCallKeep() {
  const callKeep = getCallKeep();
  if (!callKeep) return;
  if (callKeepReady) return;
  try {
    await callKeep.default.setup(CALLKEEP_OPTIONS);
    callKeep.default.setAvailable(true);
    callKeepReady = true;
  } catch (error) {
    console.warn("[CallKeep] setup failed", error);
  }
}

export function startCallSession(handle: string, displayName: string) {
  const callKeep = getCallKeep();
  const callId = createCallId();
  currentCallId = callId;
  if (callKeep) {
    callKeep.default.startCall(callId, handle, displayName, "generic", true);
    callKeep.default.setCurrentCallActive(callId);
  }
  return callId;
}

export function endCallSession(callId?: string) {
  const callKeep = getCallKeep();
  const id = callId || currentCallId;
  if (!id) return;
  if (callKeep) {
    callKeep.default.endCall(id);
  }
  if (currentCallId === id) currentCallId = null;
}

export function startInCall() {
  InCallManager.start({ media: "video" });
  InCallManager.setForceSpeakerphoneOn?.(true);
}

export function stopInCall() {
  InCallManager.stop();
}

export async function startForegroundCallService(options?: { roomId?: string }) {
  const ForegroundService = getForegroundService();
  if (!ForegroundService) return;
  try {
    if (typeof ForegroundService.start !== "function") return;
    await ForegroundService.start(buildForegroundNotification(options));
  } catch (error) {
    console.warn("[ForegroundService] start failed", error);
  }
}

export async function updateForegroundCallService(options?: { roomId?: string }) {
  const ForegroundService = getForegroundService();
  if (!ForegroundService) return;
  try {
    if (typeof ForegroundService.update !== "function") return;
    await ForegroundService.update(buildForegroundNotification(options));
  } catch (error) {
    console.warn("[ForegroundService] update failed", error);
  }
}

export async function stopForegroundCallService() {
  const ForegroundService = getForegroundService();
  if (!ForegroundService) return;
  try {
    if (typeof ForegroundService.stop === "function") {
      await ForegroundService.stop();
      return;
    }
    if (typeof ForegroundService.stopAll === "function") {
      await ForegroundService.stopAll();
    }
  } catch (error) {
    console.warn("[ForegroundService] stop failed", error);
  }
}

export function registerForegroundCallServiceHandlers(handlers: {
  onLeave?: () => void;
  onOpen?: () => void;
}) {
  if (foregroundActionsCleanup) {
    foregroundActionsCleanup();
    foregroundActionsCleanup = null;
  }
  const ForegroundService = getForegroundService();
  if (!ForegroundService || typeof ForegroundService.eventListener !== "function") {
    return () => {};
  }

  foregroundActionsCleanup = ForegroundService.eventListener((event) => {
    if (!event) return;
    const action = event.button || event.main;
    if (!action) return;
    if (action === FOREGROUND_ACTION_LEAVE) {
      handlers.onLeave?.();
      return;
    }
    if (action === FOREGROUND_ACTION_OPEN) {
      handlers.onOpen?.();
    }
  });

  return () => {
    if (foregroundActionsCleanup) {
      foregroundActionsCleanup();
      foregroundActionsCleanup = null;
    }
  };
}

export function setAudioRoute(route: "speaker" | "earpiece") {
  if (route === "speaker") {
    InCallManager.setForceSpeakerphoneOn?.(true);
  } else {
    InCallManager.setForceSpeakerphoneOn?.(false);
  }
}

export function registerCallKeepHandlers(onHangup: () => void) {
  const callKeep = getCallKeep();
  if (!callKeep) {
    return () => {};
  }
  const handleEndCall = () => {
    onHangup();
  };
  const endCallSub = callKeep.default.addEventListener(
    "endCall",
    handleEndCall
  );

  const appStateSub = AppState.addEventListener("change", (state) => {
    if (state === "active") {
      callKeep.default.setAvailable(true);
    }
  });

  return () => {
    endCallSub.remove();
    appStateSub.remove();
  };
}

function buildForegroundNotification(options?: { roomId?: string }) {
  const roomId = options?.roomId?.trim();
  const message = roomId
    ? `Meeting code: ${roomId}`
    : "Meeting in progress";
  return {
    id: FOREGROUND_NOTIFICATION_ID,
    title: "Conclave",
    message,
    importance: "high",
    visibility: "public",
    vibration: false,
    color: FOREGROUND_COLOR,
    ServiceType: "camera|microphone",
    button: true,
    buttonText: "Leave",
    buttonOnPress: FOREGROUND_ACTION_LEAVE,
    mainOnPress: FOREGROUND_ACTION_OPEN,
  };
}
