"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

interface InboxProps {
    shopId: string;
}

export default function Inbox({ shopId }: InboxProps) {
    const [loading, setLoading] = useState(true);
    const [conversations, setConversations] = useState<any[]>([]);
    const [pageInfo, setPageInfo] = useState<any | null>(null);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        if (!shopId) return;
        async function fetchConv() {
            setLoading(true);
            try {
                const res = await fetch(`/api/messages/conversations?shopId=${shopId}`);
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || "fetch_error");
                setConversations(json.conversations);
                setPageInfo(json.pageInfo);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchConv();
    }, [shopId]);

    if (loading) {
        return <p className="text-muted-foreground mt-6">Loading conversations...</p>;
    }

    if (error) {
        return <p className="text-red-500 mt-6">Error: {error}</p>;
    }

    return (
        <div className="space-y-6 mt-6">
            {pageInfo && !pageInfo.error && (
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-card p-4 rounded border-l-4 border-l-red-600 border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pageInfo.picture?.data?.url} alt={pageInfo.name} className="w-12 h-12 rounded-full" />
                    <div className="flex-1">
                        <div className="text-lg font-semibold leading-tight text-foreground">{pageInfo.name}</div>
                        {(() => {
                            const count = (pageInfo.followers_count as number | undefined) ?? (pageInfo.fan_count as number | undefined) ?? null;
                            return count !== null ? (
                                <div className="text-sm text-muted-foreground">Followers: {count.toLocaleString()}</div>
                            ) : null;
                        })()}
                    </div>
                    <div className="flex items-center gap-2">
                        {pageInfo.link && (
                            <a href={pageInfo.link} target="_blank" className="text-blue-400 text-sm underline">View Page</a>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/api/auth/meta/start?shopId=${shopId}`)}
                            className="border-red-300 text-muted-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-600 dark:hover:bg-red-950/20"
                        >
                            Reconnect
                        </Button>
                    </div>
                </div>
            )}

            {pageInfo && pageInfo.error && (
                <p className="text-red-500">{pageInfo.error.message}</p>
            )}

            {(!pageInfo || pageInfo.error) && (
                <div className="flex items-center justify-between bg-slate-50 dark:bg-card p-4 rounded border border-border">
                    <p className="text-muted-foreground text-sm">Reconnect your Facebook Page to load profile info.</p>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/api/auth/meta/start?shopId=${shopId}`)}
                    >
                        Reconnect
                    </Button>
                </div>
            )}

            {conversations.length === 0 ? (
                <p className="text-muted-foreground">No conversations yet.</p>
            ) : (
                <div className="space-y-4">
                    {conversations.map(conv => {
                        const sender = conv.senders?.data?.[0];
                        const avatarUrl = sender ? `https://graph.facebook.com/${sender.id}/picture?type=normal` : undefined;
                        const lastMsg = conv.messages?.[0];
                        return (
                            <div key={conv.id} className="bg-slate-50 dark:bg-card p-4 rounded border border-border hover:border-red-500 hover:border-l-4 transition-colors">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        {avatarUrl && (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={avatarUrl} alt={sender?.name} className="w-9 h-9 rounded-full" />
                                        )}
                                        <div>
                                            <div className="font-semibold leading-none text-foreground">{sender?.name ?? "Unknown"}</div>
                                            {lastMsg && (
                                                <div className="text-sm text-muted-foreground truncate max-w-[200px]">
                                                    {lastMsg.from?.name === sender?.name ? "" : `${lastMsg.from?.name}: `}
                                                    {lastMsg.message}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {conv.unread_count > 0 && (
                                            <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-red-600 text-white rounded-full">
                                                {conv.unread_count}
                                            </span>
                                        )}
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(conv.updated_time).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                {/* Recent messages */}
                                {conv.messages?.length > 0 && (
                                    <div className="space-y-1 max-h-40 overflow-y-auto pr-2">
                                        {conv.messages.slice(0, 5).map((m: any) => (
                                            <div key={m.id} className="text-sm leading-snug text-foreground">
                                                <span className="font-semibold">{m.from?.name}: </span>
                                                {m.message}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
} 