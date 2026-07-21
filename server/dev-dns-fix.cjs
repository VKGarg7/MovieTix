// Local-dev-only workaround: on this machine, Node's DNS resolver is stuck
// pointed at 127.0.0.1 (some local proxy/VPN leftover) which fails
// mongodb+srv:// SRV lookups even though the OS resolver works fine.
// Not used in production - only loaded via `npm run server:localdns`.
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
