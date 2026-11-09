(() => {
  const host = location.hostname.toLowerCase();
  chrome.storage.local.get("aegisBlockedDomains", result => {
    const domains = Array.isArray(result.aegisBlockedDomains) ? result.aegisBlockedDomains as string[] : [];
    if (!domains.some(domain => host === domain || host.endsWith(`.${domain}`))) return;
    const banner = document.createElement("div");
    banner.textContent = "AegisTrust: this domain is on your confirmed-threat blocklist.";
    Object.assign(banner.style, { position: "fixed", inset: "0 0 auto", zIndex: "2147483647", padding: "14px", background: "#7b1e2b", color: "white", font: "bold 14px system-ui", textAlign: "center", boxShadow: "0 3px 18px #0008" });
    (document.documentElement || document).appendChild(banner);
  });
})();
