'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDown,
  ChevronRight,
  MessagesSquare,
  BarChart,
  Briefcase,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SidebarHistory } from './sidebar-history';

interface NavSection {
  title: string;
  icon: React.ReactNode;
  href?: string;
  isCollapsible?: boolean;
  content?: React.ReactNode;
}

export function SidebarNav() {
  const pathname = usePathname();
  const [expandedSection, setExpandedSection] = useState<string | null>('Chats');

  const sections: NavSection[] = [
    {
      title: 'Chats',
      icon: <MessagesSquare className="h-4 w-4" />,
      isCollapsible: true,
      content: <SidebarHistory />
    },
    {
      title: 'Allocator',
      icon: <BarChart className="h-4 w-4" />,
      href: '/allocator'
    },
    {
      title: 'Portfolio',
      icon: <Briefcase className="h-4 w-4" />,
      href: '/portfolio'
    }
  ];

  return (
    <div className="flex flex-col gap-1 px-2">
      {sections.map((section) => {
        const isExpanded = expandedSection === section.title;
        const isActive = section.href ? pathname === section.href : false;

        return (
          <div key={section.title}>
            {section.isCollapsible ? (
              <div>
                <Button
                  variant="ghost"
                  className={cn(
                    'w-full justify-between px-4',
                    isExpanded && 'bg-accent'
                  )}
                  onClick={() => setExpandedSection(isExpanded ? null : section.title)}
                >
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                {isExpanded && (
                  <div className="mt-1 space-y-1 overflow-hidden">{section.content}</div>
                )}
              </div>
            ) : (
              <Button
                variant="ghost"
                className={cn(
                  'w-full justify-start px-4',
                  isActive && 'bg-accent'
                )}
                asChild
              >
                <Link href={section.href!}>
                  <div className="flex items-center gap-2">
                    {section.icon}
                    <span>{section.title}</span>
                  </div>
                </Link>
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}