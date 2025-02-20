'use client';

import { isToday, isYesterday, subMonths, subWeeks } from 'date-fns';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import { memo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { MoreHorizontal, Trash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSidebar } from '@/components/ui/sidebar';
import type { Chat } from '@/lib/db/schema';
import { fetcher } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type GroupedChats = {
  today: Chat[];
  yesterday: Chat[];
  lastWeek: Chat[];
  lastMonth: Chat[];
  older: Chat[];
};

const PureChatItem = ({
  chat,
  isActive,
  onDelete,
  setOpenMobile,
}: {
  chat: Chat;
  isActive: boolean;
  onDelete: (chatId: string) => void;
  setOpenMobile: (open: boolean) => void;
}) => {
  return (
    <div className="px-2">
      <Button
        variant="ghost"
        className={cn(
          'w-full justify-between text-left font-normal overflow-hidden',
          isActive && 'bg-accent'
        )}
        asChild
      >
        <Link href={`/chat/${chat.id}`} onClick={() => setOpenMobile(false)}>
          <div className="flex items-center gap-2 min-w-0">
            <span className="truncate flex-1">{chat.title}</span>
          </div>
          <DropdownMenu modal={true}>
            <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
              <div className="ml-auto flex h-8 w-8 items-center justify-center shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                onClick={(e) => {
                  e.preventDefault();
                  onDelete(chat.id);
                }}
              >
                <Trash className="h-4 w-4" />
                <span className="ml-2">Delete chat</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </Link>
      </Button>
    </div>
  );
};

export const ChatItem = memo(PureChatItem, (prevProps, nextProps) => {
  if (prevProps.isActive !== nextProps.isActive) return false;
  return true;
});

export function SidebarHistory() {
  const { data: session } = useSession();
  const { setOpenMobile } = useSidebar();
  const { id } = useParams();
  const pathname = usePathname();
  const {
    data: history,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(session?.user ? '/api/history' : null, fetcher, {
    fallbackData: [],
  });

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleDelete = async () => {
    const deletePromise = fetch(`/api/chat?id=${deleteId}`, {
      method: 'DELETE',
    });

    toast.promise(deletePromise, {
      loading: 'Deleting chat...',
      success: () => {
        mutate((history) => {
          if (history) {
            return history.filter((h) => h.id !== id);
          }
        });
        return 'Chat deleted successfully';
      },
      error: 'Failed to delete chat',
    });

    setShowDeleteDialog(false);
  };

  if (!session?.user) {
    return (
      <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
        Login to save and revisit previous chats!
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col">
        {[44, 32, 28, 64, 52].map((item) => (
          <div
            key={item}
            className="rounded-md h-8 flex gap-2 px-2 items-center"
          >
            <div
              className="h-4 rounded-md flex-1 max-w-[--skeleton-width] bg-sidebar-accent-foreground/10"
              style={
                {
                  '--skeleton-width': `${item}%`,
                } as React.CSSProperties
              }
            />
          </div>
        ))}
      </div>
    );
  }

  if (history?.length === 0) {
    return (
      <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
        Your conversations will appear here once you start chatting!
      </div>
    );
  }

  const groupChatsByDate = (chats: Chat[]): GroupedChats => {
    const now = new Date();
    const oneWeekAgo = subWeeks(now, 1);
    const oneMonthAgo = subMonths(now, 1);

    return chats.reduce(
      (groups, chat) => {
        const chatDate = new Date(chat.createdAt);

        if (isToday(chatDate)) {
          groups.today.push(chat);
        } else if (isYesterday(chatDate)) {
          groups.yesterday.push(chat);
        } else if (chatDate > oneWeekAgo) {
          groups.lastWeek.push(chat);
        } else if (chatDate > oneMonthAgo) {
          groups.lastMonth.push(chat);
        } else {
          groups.older.push(chat);
        }

        return groups;
      },
      {
        today: [],
        yesterday: [],
        lastWeek: [],
        lastMonth: [],
        older: [],
      } as GroupedChats,
    );
  };

  return (
    <>
      <div className="flex flex-col">
        {history &&
          (() => {
            const groupedChats = groupChatsByDate(history);

            return (
              <>
                {groupedChats.today.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50">
                      Today
                    </div>
                    {groupedChats.today.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === id}
                        onDelete={(chatId) => {
                          setDeleteId(chatId);
                          setShowDeleteDialog(true);
                        }}
                        setOpenMobile={setOpenMobile}
                      />
                    ))}
                  </>
                )}

                {groupedChats.yesterday.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                      Yesterday
                    </div>
                    {groupedChats.yesterday.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === id}
                        onDelete={(chatId) => {
                          setDeleteId(chatId);
                          setShowDeleteDialog(true);
                        }}
                        setOpenMobile={setOpenMobile}
                      />
                    ))}
                  </>
                )}

                {groupedChats.lastWeek.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                      Last 7 days
                    </div>
                    {groupedChats.lastWeek.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === id}
                        onDelete={(chatId) => {
                          setDeleteId(chatId);
                          setShowDeleteDialog(true);
                        }}
                        setOpenMobile={setOpenMobile}
                      />
                    ))}
                  </>
                )}

                {groupedChats.lastMonth.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                      Last 30 days
                    </div>
                    {groupedChats.lastMonth.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === id}
                        onDelete={(chatId) => {
                          setDeleteId(chatId);
                          setShowDeleteDialog(true);
                        }}
                        setOpenMobile={setOpenMobile}
                      />
                    ))}
                  </>
                )}

                {groupedChats.older.length > 0 && (
                  <>
                    <div className="px-2 py-1 text-xs text-sidebar-foreground/50 mt-6">
                      Older
                    </div>
                    {groupedChats.older.map((chat) => (
                      <ChatItem
                        key={chat.id}
                        chat={chat}
                        isActive={chat.id === id}
                        onDelete={(chatId) => {
                          setDeleteId(chatId);
                          setShowDeleteDialog(true);
                        }}
                        setOpenMobile={setOpenMobile}
                      />
                    ))}
                  </>
                )}
              </>
            );
          })()}
      </div>
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              chat and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
