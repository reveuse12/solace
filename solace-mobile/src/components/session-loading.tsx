import { useEffect, useState } from "react";
import { reloadAppAsync } from "expo";
import { Action, Loading, Message } from "./ui";
/** Bound SDK initialization too, before any authenticated API request can begin. */
export function SessionLoading() {
  const [expired, setExpired] = useState(false);
  useEffect(() => { const timer = setTimeout(() => setExpired(true), 15000); return () => clearTimeout(timer); }, []);
  if (!expired) return <Loading />;
  return <Message title="Opening is taking longer than expected" detail="Check your connection, then retry. Your saved account and drafts have not been cleared."><Action label="Retry opening" action={() => reloadAppAsync()} /></Message>;
}
