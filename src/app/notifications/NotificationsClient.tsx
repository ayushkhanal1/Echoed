"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface NotificationItem {
  id: string;
  cluster_id: string | null;
  type: string;
  title: string | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  thread_title?: string | null;
  preview_summary?: string | null;
  match_reasoning?: string | null;
  consent_status?: string | null;
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: NotificationItem[];
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [actingId, setActingId] = useState<string | null>(null);

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleConsentAction = async (clusterId: string, action: "accept" | "decline") => {
    setActingId(clusterId);
    try {
      const res = await fetch("/api/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clusterId, action }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.cluster_id === clusterId
              ? { ...n, consent_status: action === "accept" ? "accepted" : "declined" }
              : n
          )
        );
        router.refresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setActingId(null);
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main className="mx-auto max-w-4xl px-4 sm:px-8 py-10 sm:py-16 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200/60 text-xs font-semibold text-orange-700 mb-2 shadow-sm">
            <span>🔔</span> Activity Center
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-950 font-serif">
            Notifications & Connections
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Review match confirmations, manage visibility in shared groups, and track your experiences.
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-xs font-semibold text-gray-600 hover:text-gray-950 px-4 py-2 rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors shadow-sm self-start sm:self-center"
          >
            Mark all as read
          </button>
        )}
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-gray-300 bg-white/60 p-12 text-center space-y-3">
            <span className="text-3xl block">🔔</span>
            <h3 className="text-base font-bold text-gray-950 font-serif">
              No notifications yet
            </h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              When you submit experiences or when an AI similarity match is discovered with another user, you will be notified here.
            </p>
            <Link
              href="/submit"
              className="inline-block mt-2 px-5 py-2.5 rounded-full bg-gray-950 text-white text-xs font-semibold hover:bg-black shadow-sm"
            >
              Write an Experience
            </Link>
          </div>
        ) : (
          notifications.map((notif) => {
            const isMatchRequest = notif.type === "match_found" || !!notif.cluster_id;

            return (
              <div
                key={notif.id}
                className={`rounded-3xl border p-6 transition-all shadow-sm ${
                  !notif.is_read
                    ? "bg-white border-orange-200 shadow-orange-100/50"
                    : "bg-white/70 border-white/80"
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3.5 w-full">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-base shrink-0 ${
                        isMatchRequest
                          ? "bg-orange-50 text-orange-600 border border-orange-200"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {isMatchRequest ? "✨" : "✓"}
                    </div>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-base font-bold text-gray-950 font-serif">
                          {notif.title || (isMatchRequest ? "Parallel Experience Match Found!" : "Confirmation")}
                        </h4>
                        {!notif.is_read && (
                          <span className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                      </div>

                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                        {notif.message}
                      </p>

                      {/* Match Request Card & Flexible Visibility Toggle */}
                      {isMatchRequest && notif.cluster_id && (
                        <div className="mt-4 p-4 rounded-2xl bg-orange-50/70 border border-orange-200/60 space-y-3">
                          {notif.thread_title && (
                            <h5 className="font-bold text-xs uppercase tracking-wider text-orange-900">
                              Proposed Title: &ldquo;{notif.thread_title}&rdquo;
                            </h5>
                          )}
                          {notif.preview_summary && (
                            <p className="text-xs text-orange-950 italic">
                              &ldquo;{notif.preview_summary}&rdquo;
                            </p>
                          )}

                          {/* Independent Author Visibility Controls */}
                          {notif.consent_status === "accepted" ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-orange-200/40">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-semibold">
                                ✓ Opted-In to Public Thread
                              </span>
                              <button
                                onClick={() => handleConsentAction(notif.cluster_id!, "decline")}
                                disabled={actingId === notif.cluster_id}
                                className="text-xs text-gray-500 hover:text-rose-600 underline transition-colors"
                              >
                                Switch to Private (opt-out)
                              </button>
                            </div>
                          ) : notif.consent_status === "declined" ? (
                            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-orange-200/40">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-200 text-gray-700 text-xs font-semibold">
                                🔒 Kept Private to You Only
                              </span>
                              <button
                                onClick={() => handleConsentAction(notif.cluster_id!, "accept")}
                                disabled={actingId === notif.cluster_id}
                                className="text-xs text-orange-600 hover:text-orange-700 underline font-medium transition-colors"
                              >
                                Share in Public Thread (opt-in) →
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-orange-200/40">
                              <button
                                onClick={() => handleConsentAction(notif.cluster_id!, "accept")}
                                disabled={actingId === notif.cluster_id}
                                className="px-4 py-2 rounded-full bg-gray-950 hover:bg-black text-white text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
                              >
                                {actingId === notif.cluster_id ? "Saving..." : "Share in Public Thread (Opt-In) →"}
                              </button>
                              <button
                                onClick={() => handleConsentAction(notif.cluster_id!, "decline")}
                                disabled={actingId === notif.cluster_id}
                                className="px-4 py-2 rounded-full border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-all disabled:opacity-50"
                              >
                                Keep 100% Private
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <span className="text-[11px] text-gray-400 block pt-1 font-mono">
                        {new Date(notif.created_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
