import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { useStreamChat } from "../context/StreamChatContext";
import IncomingCallPopup from "./IncomingCallPopup";

const STORAGE_KEY = "aerosonix_incoming_call";

const extractCallUrl = (text) => {
  if (!text || typeof text !== "string") return null;
  const match = text.match(/https?:\/\/[^\s]+\/call\/[^\s]+/i);
  if (match?.[0]) return match[0];
  const rel = text.match(/\/call\/[^\s]+/i);
  return rel?.[0] || null;
};

const CallPopupManager = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { authUser } = useAuthUser();
  const { chatClient, onlineMap, ensureUsersPresence } = useStreamChat();

  const [call, setCall] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setCall(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const persist = (next) => {
    setCall(next);
    try {
      if (!next) localStorage.removeItem(STORAGE_KEY);
      else localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const isCallerOnline = useMemo(() => {
    if (!call?.fromUser?.id) return null;
    if (typeof onlineMap[call.fromUser.id] === "undefined") return null;
    return Boolean(onlineMap[call.fromUser.id]);
  }, [call?.fromUser?.id, onlineMap]);

  useEffect(() => {
    const callerId = call?.fromUser?.id;
    if (!callerId) return;
    ensureUsersPresence([callerId]);
  }, [call?.fromUser?.id, ensureUsersPresence]);

  useEffect(() => {
    if (!call?.createdAt) return;
    const ms = Math.max(0, call.createdAt + 15_000 - Date.now());
    const t = setTimeout(() => persist(null), ms);
    return () => clearTimeout(t);
  }, [call?.createdAt]);

  useEffect(() => {
    if (!call) return;
    if (isCallerOnline === false) persist(null);
  }, [isCallerOnline, call]);

  useEffect(() => {
    if (!chatClient || !authUser) return;

    const maybeTrigger = async (e) => {
      const text = e?.message?.text;
      const callUrl = extractCallUrl(text);
      if (!callUrl) return;

      const fromUser = e?.user || e?.message?.user;
      if (!fromUser?.id || fromUser.id === authUser._id) return;

      // only trigger popup if caller is online at send time (best-effort)
      try {
        await ensureUsersPresence([fromUser.id]);
      } catch {
        // ignore
      }
      if (onlineMap?.[fromUser.id] === false) return;

      const next = {
        callUrl,
        fromUser: {
          id: fromUser.id,
          name: fromUser.name || "Unknown",
          image: fromUser.image || "",
        },
        createdAt: Date.now(),
      };

      persist(next);
    };

    chatClient.on("message.new", maybeTrigger);
    chatClient.on("notification.message_new", maybeTrigger);

    return () => {
      chatClient.off("message.new", maybeTrigger);
      chatClient.off("notification.message_new", maybeTrigger);
    };
  }, [chatClient, authUser?._id, ensureUsersPresence, onlineMap]);

  const accept = () => {
    const url = call?.callUrl;
    if (!url) return;

    try {
      const pathname = url.startsWith("http") ? new URL(url).pathname : url;

      try {
        const callerId = call?.fromUser?.id;
        if (chatClient && authUser?._id && callerId) {
          const channelId = [authUser._id, callerId].sort().join("-");
          const ch = chatClient.channel("messaging", channelId, { members: [authUser._id, callerId] });
          ch.watch();
          ch.sendMessage({ text: `CALL_ACCEPTED: ${url}` });
        }
      } catch {
        // ignore
      }

      persist(null);
      if (location.pathname !== pathname) {
        navigate(pathname);
      }
    } catch {
      persist(null);
    }
  };

  const decline = () => {
    persist(null);
  };

  if (!call) return null;

  return (
    <IncomingCallPopup
      call={{ ...call, isCallerOnline }}
      onAccept={accept}
      onDecline={decline}
    />
  );
};

export default CallPopupManager;
