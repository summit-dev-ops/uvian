"use client"

import React from 'react';
import { Button, cn, ScrollArea, Separator } from "@org/ui";
import { PlusCircle, MessageSquare, Settings, LogOut } from "lucide-react";


interface ChatSidebarProps {
  className?: string;
}

export function ChatSidebar({ className }: ChatSidebarProps) {
  // Mock history for now
  const history = [
    { id: '1', title: 'Socket.IO Implementation', date: 'Today' },
    { id: '2', title: 'React Hooks Deep Dive', date: 'Today' },
    { id: '3', title: 'Project Structure ideas', date: 'Yesterday' },
  ];

  return (
    <div className={cn("flex flex-col h-full bg-secondary/10 border-r", className)}>
      <div className="p-4">
        <Button className="w-full justify-start gap-2 h-10 shadow-sm" variant="default">
          <PlusCircle className="h-4 w-4" />
          New Chat
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-4 py-2">
          {['Today', 'Yesterday'].map((group) => (
            <div key={group} className="space-y-1">
              <h3 className="px-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {group}
              </h3>
              {history
                .filter((item) => item.date === group)
                .map((chat) => (
                  <Button
                    key={chat.id}
                    variant="ghost"
                    className="w-full justify-start gap-2 h-9 text-xs font-normal px-2 truncate"
                  >
                    <MessageSquare className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </Button>
                ))}
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="p-2 space-y-1">
        <Separator className="mb-2" />
        <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-xs px-2">
          <Settings className="h-3.5 w-3.5" />
          Settings
        </Button>
        <Button variant="ghost" className="w-full justify-start gap-2 h-9 text-xs px-2 text-destructive hover:text-destructive hover:bg-destructive/10">
          <LogOut className="h-3.5 w-3.5" />
          Logout
        </Button>
      </div>
    </div>
  );
}
