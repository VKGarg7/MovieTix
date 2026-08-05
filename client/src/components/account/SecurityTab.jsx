import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useUser, useClerk, useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  LockIcon,
  ShieldCheckIcon,
  ShieldIcon,
  MonitorIcon,
  SmartphoneIcon,
  LinkIcon,
  XIcon,
  CheckIcon,
  AlertTriangleIcon,
  Trash2Icon,
} from "lucide-react";

const SecurityTab = () => {
  const { user } = useUser();
  const { sessionId: currentSessionId } = useAuth();
  const { openUserProfile, signOut } = useClerk();
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [revokingId, setRevokingId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    user
      ?.getSessions()
      .then((list) => {
        if (!cancelled) setSessions(list);
      })
      .catch((error) => console.error("Failed to load sessions:", error))
      .finally(() => {
        if (!cancelled) setLoadingSessions(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleRevoke = async (session) => {
    setRevokingId(session.id);
    try {
      await session.revoke();
      setSessions((prev) => prev.filter((s) => s.id !== session.id));
      toast.success("Session revoked");
    } catch (error) {
      toast.error(error?.errors?.[0]?.message || "Failed to revoke session");
    }
    setRevokingId(null);
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await user.delete();
      toast.success("Account deleted");
      await signOut();
    } catch (error) {
      toast.error(error?.errors?.[0]?.message || "Failed to delete account");
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <LockIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Password</p>
              <p className={`text-xs flex items-center gap-1 mt-0.5 ${user?.passwordEnabled ? "text-nebula-cyan" : "text-gray-400"}`}>
                {user?.passwordEnabled ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                {user?.passwordEnabled ? "Enabled" : "Not set"}
              </p>
            </div>
          </div>
          <button
            onClick={() => openUserProfile()}
            className="w-full text-center px-4 py-2 rounded-full text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {user?.passwordEnabled ? "Change Password" : "Set Password"}
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
              <ShieldCheckIcon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-medium">Two-Factor Auth</p>
              <p className={`text-xs flex items-center gap-1 mt-0.5 ${user?.twoFactorEnabled ? "text-nebula-cyan" : "text-gray-400"}`}>
                {user?.twoFactorEnabled ? <CheckIcon className="w-3 h-3" /> : <XIcon className="w-3 h-3" />}
                {user?.twoFactorEnabled ? "Enabled" : "Disabled"}
              </p>
            </div>
          </div>
          <button
            onClick={() => openUserProfile()}
            className="w-full text-center px-4 py-2 rounded-full text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
          >
            {user?.twoFactorEnabled ? "Manage 2FA" : "Enable 2FA"}
          </button>
        </motion.div>
      </div>

      <div>
        <p className="section-eyebrow mb-3 flex items-center gap-2">
          <LinkIcon className="w-3.5 h-3.5" /> Connected Accounts
        </p>
        {user?.externalAccounts?.length > 0 ? (
          <div className="space-y-2">
            {user.externalAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between glass-panel px-4 py-3">
                <div>
                  <p className="text-sm capitalize">{acc.provider}</p>
                  <p className="text-xs text-gray-500">{acc.emailAddress}</p>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full border border-nebula-cyan/30 bg-nebula-cyan/10 text-nebula-cyan">
                  Connected
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-panel p-6 text-center">
            <p className="text-sm text-gray-400 mb-3">No external accounts linked.</p>
            <button
              onClick={() => openUserProfile()}
              className="px-4 py-2 rounded-full text-xs font-medium border border-white/15 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Connect an Account
            </button>
          </div>
        )}
      </div>

      <div>
        <p className="section-eyebrow mb-3 flex items-center gap-2">
          <MonitorIcon className="w-3.5 h-3.5" /> Active Sessions
        </p>
        {loadingSessions ? (
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => {
              const activity = session.latestActivity;
              const isCurrent = session.id === currentSessionId;
              return (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-3 glass-panel px-4 py-3"
                >
                  <div className="w-9 h-9 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                    {activity?.isMobile ? <SmartphoneIcon className="w-4 h-4" /> : <MonitorIcon className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">
                      {activity?.browserName || "Unknown browser"} {activity?.deviceType ? `· ${activity.deviceType}` : ""}
                      {isCurrent && <span className="ml-2 text-[10px] text-nebula-cyan">This device</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {[activity?.city, activity?.country].filter(Boolean).join(", ") || "Unknown location"} · Last active{" "}
                      {new Date(session.lastActiveAt).toLocaleDateString()}
                    </p>
                  </div>
                  {!isCurrent && (
                    <button
                      onClick={() => handleRevoke(session)}
                      disabled={revokingId === session.id}
                      className="shrink-0 px-3 py-1.5 rounded-full text-[11px] font-medium border border-primary/40 text-primary hover:bg-primary/10 transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {revokingId === session.id ? "Revoking…" : "Revoke"}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="rounded-[28px] border border-red-500/25 bg-red-500/[0.04] backdrop-blur-xl p-5 relative overflow-hidden"
      >
        <div
          className="absolute inset-0 opacity-40 pointer-events-none"
          style={{ background: "radial-gradient(circle at 90% 0%, rgba(248,69,101,0.25), transparent 60%)" }}
        />
        <div className="relative flex items-start gap-3 mb-4">
          <AlertTriangleIcon className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-300">Danger Zone</p>
            <p className="text-xs text-gray-400 mt-1 leading-relaxed">
              Deleting your account permanently removes your profile, wishlist, and points balance. Existing bookings
              are not cancelled automatically — cancel any upcoming shows first. This cannot be undone.
            </p>
          </div>
        </div>

        {!confirmDelete ? (
          <button
            onClick={() => setConfirmDelete(true)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-medium border border-red-500/40 text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
          >
            <Trash2Icon className="w-3.5 h-3.5" /> Delete Account
          </button>
        ) : (
          <div className="relative flex flex-wrap items-center gap-2.5">
            <p className="text-xs text-red-300 mr-1">Are you sure?</p>
            <button
              onClick={handleDeleteAccount}
              disabled={deleting}
              className="px-4 py-2 rounded-full text-xs font-medium bg-red-500/90 hover:bg-red-500 text-white transition-colors cursor-pointer disabled:opacity-50"
            >
              {deleting ? "Deleting…" : "Yes, delete my account"}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
              className="px-4 py-2 rounded-full text-xs font-medium border border-white/15 hover:bg-white/10 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default SecurityTab;
