import React, { useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { CheckIcon, XIcon, RotateCcwIcon, ClapperboardIcon } from 'lucide-react';
import SuperAdminGate from '../../components/admin/SuperAdminGate';
import EmptyState from '../../components/admin/EmptyState';
import Loading from '../../components/Loading';
import { useAppContext } from '../../context/useAppContext';
import useFetchOnUser from '../../hooks/useFetchOnUser';

const StatusPill = ({ host }) => {
  if (!host.verified) return <span className="text-yellow-500 text-xs font-medium">Pending verification</span>;
  if (!host.eligible) return <span className="text-red-400 text-xs font-medium">Eligibility revoked</span>;
  return <span className="text-primary text-xs font-medium">Verified &amp; eligible</span>;
};

const CommunityHostsInner = () => {
  const { axios, getToken, user } = useAppContext();

  const [hosts, setHosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState(null);

  const authHeaders = async () => ({ headers: { Authorization: `Bearer ${await getToken()}` } });

  const loadHosts = async () => {
    try {
      const { data } = await axios.get('/api/community-host/all', await authHeaders());
      if (data.success) setHosts(data.hosts);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to load community hosts');
    }
    setLoading(false);
  };

  useFetchOnUser(user, loadHosts);

  const verify = async (hostId) => {
    setActingId(hostId);
    try {
      const { data } = await axios.post(`/api/community-host/${hostId}/verify`, {}, await authHeaders());
      if (data.success) {
        toast.success('Host verified — they can now submit screening requests');
        loadHosts();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to verify host');
    }
    setActingId(null);
  };

  const revoke = async (hostId) => {
    const reason = window.prompt('Reason for revoking eligibility (optional):') || '';
    setActingId(hostId);
    try {
      const { data } = await axios.post(`/api/community-host/${hostId}/revoke`, { reason }, await authHeaders());
      if (data.success) {
        toast.success('Eligibility revoked');
        loadHosts();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to revoke eligibility');
    }
    setActingId(null);
  };

  const reinstate = async (hostId) => {
    setActingId(hostId);
    try {
      const { data } = await axios.post(`/api/community-host/${hostId}/reinstate`, {}, await authHeaders());
      if (data.success) {
        toast.success('Eligibility reinstated');
        loadHosts();
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to reinstate eligibility');
    }
    setActingId(null);
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6 pb-10">
      <div>
        <p className="section-eyebrow mb-1">Open Screen</p>
        <p className="text-lg font-display font-medium">Community Host Applications</p>
        <p className="text-sm text-gray-400 mt-1">
          Verification is platform-wide — once verified, a host can submit screening requests to any theater's open slots.
        </p>
      </div>

      {hosts.length === 0 ? (
        <EmptyState
          icon={ClapperboardIcon}
          title="No applications yet"
          description="Community host applications will appear here for review."
        />
      ) : (
        <div className="space-y-3">
          {hosts.map((host, i) => (
            <motion.div
              key={host._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="glass-panel p-4 flex flex-col md:flex-row md:items-center justify-between gap-3"
            >
              <div>
                <p className="font-medium">{host.organizationName}</p>
                {host.description && <p className="text-xs text-gray-400 mt-1 max-w-md">{host.description}</p>}
                <div className="mt-1.5"><StatusPill host={host} /></div>
                {host.revokedReason && (
                  <p className="text-xs text-red-400 mt-1">Revoked reason: {host.revokedReason}</p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!host.verified && (
                  <button
                    onClick={() => verify(host._id)}
                    disabled={actingId === host._id}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs bg-primary rounded-full font-medium cursor-pointer disabled:opacity-50"
                  >
                    <CheckIcon className="w-3.5 h-3.5" /> Verify
                  </button>
                )}
                {host.verified && host.eligible && (
                  <button
                    onClick={() => revoke(host._id)}
                    disabled={actingId === host._id}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs border border-red-500 text-red-500 rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-red-500/10"
                  >
                    <XIcon className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
                {host.verified && !host.eligible && (
                  <button
                    onClick={() => reinstate(host._id)}
                    disabled={actingId === host._id}
                    className="flex items-center gap-1 px-4 py-1.5 text-xs border border-primary text-primary rounded-full font-medium cursor-pointer disabled:opacity-50 hover:bg-primary/10"
                  >
                    <RotateCcwIcon className="w-3.5 h-3.5" /> Reinstate
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

const CommunityHosts = () => {
  const { adminRole } = useAppContext();
  return (
    <SuperAdminGate
      adminRole={adminRole}
      text1="Community"
      text2="Hosts"
      message="Only super-admins can verify or revoke community host eligibility."
    >
      <CommunityHostsInner />
    </SuperAdminGate>
  );
};

export default CommunityHosts;
