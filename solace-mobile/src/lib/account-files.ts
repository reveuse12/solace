import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import type { ApiClient } from "./api-client";
import { validateBackup } from "./backup";
export async function exportAccount(api: ApiClient) {
  const payload = await api<unknown>("/api/account/export");
  const file = new File(Paths.cache, `solace-data-${new Date().toISOString().slice(0, 10)}.json`);
  await file.create({ overwrite: true }); await file.write(JSON.stringify(payload, null, 2));
  if (!await Sharing.isAvailableAsync()) throw new Error("Sharing isn't available on this device.");
  // Android recipients may read the granted URI after the chooser resolves.
  // Leave the export in the app cache until the OS prunes it or the next export overwrites it.
  await Sharing.shareAsync(file.uri, { mimeType: "application/json", dialogTitle: "Save your Solace backup", UTI: "public.json" });
}
export async function chooseBackup() {
  const result = await DocumentPicker.getDocumentAsync({ type: ["application/json", "text/plain"], copyToCacheDirectory: true, multiple: false });
  if (result.canceled) return null;
  const asset = result.assets[0]; const file = new File(asset.uri);
  try {
    if ((asset.size ?? file.size) > 5 * 1024 * 1024) throw new Error("Choose a backup smaller than 5 MB.");
    let payload: unknown;
    try { payload = JSON.parse(await file.text()); } catch { throw new Error("The selected file isn't valid JSON."); }
    return validateBackup(payload);
  } finally { if (file.uri.startsWith(`${Paths.cache.uri.replace(/\/$/, "")}/`) && file.exists) await file.delete(); }
}
