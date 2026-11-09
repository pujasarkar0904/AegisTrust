import React from "react";
import { createRoot } from "react-dom/client";
import "./popup.css";
function Popup() {
  const [status, setStatus] = React.useState("Checking this tab…");
  const [blocked, setBlocked] = React.useState(false);
  React.useEffect(() => {
    chrome.tabs.query({ active: true, lastFocusedWindow: true }, async tabs => {
      const url = tabs[0]?.url;
      if (!url || !/^https?:/.test(url)) { setStatus("This page cannot be checked by the extension."); return; }
      const host = new URL(url).hostname.toLowerCase();
      const result = await chrome.storage.local.get("aegisBlockedDomains");
      const domains = Array.isArray(result.aegisBlockedDomains) ? result.aegisBlockedDomains as string[] : [];
      const match = domains.find(domain => host === domain || host.endsWith(`.${domain}`));
      setBlocked(Boolean(match));
      setStatus(match ? `${host} is in your threat blocklist.` : `${host} is not on your synced blocklist.`);
    });
  }, []);
  return <main className="popup"><header><span className="mark">A</span><div><strong>AegisTrust</strong><small>LINK GUARD / MV3</small></div></header><div className={`status ${blocked ? "danger" : "safe"}`}><i/>{blocked ? "THREAT LIST MATCH" : "NO LOCAL MATCH"}</div><p>{status}</p><div className="foot">Blocklist updates arrive from the local AegisTrust API feed.</div></main>;
}
createRoot(document.getElementById("root")!).render(<Popup/>);
