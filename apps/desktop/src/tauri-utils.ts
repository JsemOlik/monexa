import { listen, emit } from "@tauri-apps/api/event";
import { type as getOsType, hostname as getHostname } from "@tauri-apps/plugin-os";

export const tauriListen = listen;
export const tauriEmit = emit;
export { getOsType, getHostname };
