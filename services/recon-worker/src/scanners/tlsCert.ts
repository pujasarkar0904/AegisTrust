import tls from "node:tls";
import { isIP } from "node:net";
import type { ReconResult } from "@aegistrust/core";
const commonName = (value: string | string[] | undefined): string | undefined => Array.isArray(value) ? value.join(", ") : value;
export function readTlsCertificate(connectAddress: string, servername: string, port: number): Promise<ReconResult["tls"]> {
  return new Promise(resolve => {
    const socket = tls.connect({ host: connectAddress, port, ...(isIP(servername) ? {} : { servername }), timeout: 3500, rejectUnauthorized: false }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve(cert?.serialNumber ? { subject: commonName(cert.subject?.CN), issuer: commonName(cert.issuer?.CN), serialNumber: cert.serialNumber, validTo: cert.valid_to } : undefined);
    });
    socket.once("error", () => resolve(undefined));
    socket.once("timeout", () => { socket.destroy(); resolve(undefined); });
  });
}
