const { exec } = require('child_process');

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress;
  if (!ip) return null;
  // Normalize IPv4-mapped IPv6 addresses (::ffff:192.168.1.5 -> 192.168.1.5)
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
};

const MAC_PATTERN = /([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}/;

// Best-effort only: resolving a MAC address from an IP requires reading the
// server host's local ARP cache, which only has an entry for a client when it
// shares a LAN/subnet with the server (e.g. this app running on a shop PC and
// staff on the same network). It cannot and will not resolve for clients
// reached over the internet (a cloud-hosted deployment, VPN, different
// subnet, etc) — this always returns null in that case, not a fake value.
const getClientMac = (ip) => new Promise((resolve) => {
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip === 'localhost') {
    resolve(null);
    return;
  }

  const cmd = process.platform === 'win32' ? `arp -a ${ip}` : `arp -n ${ip}`;
  exec(cmd, { timeout: 2000 }, (err, stdout) => {
    if (err || !stdout) {
      resolve(null);
      return;
    }
    const match = stdout.match(MAC_PATTERN);
    resolve(match ? match[0].toUpperCase().replace(/-/g, ':') : null);
  });
});

module.exports = { getClientIp, getClientMac };
