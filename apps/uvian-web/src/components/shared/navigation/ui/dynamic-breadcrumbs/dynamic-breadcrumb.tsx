import * as React from 'react';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
  BreadcrumbEllipsis,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  Button,
} from '@org/ui';

import {
  BreadcrumbItem as BreadcrumbItemType,
  BreadcrumbConfig,
} from './types';

export interface DynamicBreadcrumbProps {
  items: BreadcrumbItemType[];
  config?: BreadcrumbConfig;
  className?: string;
}

export function DynamicBreadcrumb({
  items,
  config,
  className,
}: DynamicBreadcrumbProps) {
  // Simple className utility function (replacing external cn import)
  const cn = (...inputs: (string | undefined | null | false)[]) => {
    return inputs.filter(Boolean).join(' ');
  };
  const maxVisible = config?.maxVisibleItems ?? 4;

  if (!items || items.length === 0) {
    return null;
  }

  // If only one item, render it as current page
  if (items.length === 1) {
    return (
      <Breadcrumb className={cn(className)}>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{items[0].label}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // No collapsing needed - render all items normally
  if (items.length <= maxVisible) {
    return (
      <Breadcrumb className={cn(className)}>
        <BreadcrumbList>
          {items.map((item, index) => {
            const isLastItem = index === items.length - 1;
            return (
              <React.Fragment key={item.id || index}>
                <BreadcrumbItem>
                  {isLastItem ? (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  ) : item.href ? (
                    <BreadcrumbLink asChild>
                      <Link href={item.href}>{item.label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{item.label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
                {!isLastItem && <BreadcrumbSeparator />}
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  // Collapsing logic: Root → Ellipsis → Parent → Current
  const root = items[0]; // Always visible
  const current = items[items.length - 1]; // Always visible
  const parent = items[items.length - 2]; // Always visible as clickable parent
  const collapsedItems = items.slice(1, -2); // Items 1 to n-2 go in dropdown

  return (
    <Breadcrumb className={cn(className)}>
      <BreadcrumbList>
        {/* Root item (always visible) */}
        <BreadcrumbItem>
          {root.href ? (
            <BreadcrumbLink asChild>
              <Link href={root.href}>{root.label}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{root.label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Ellipsis dropdown with collapsed items */}
        <BreadcrumbItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost">
                <BreadcrumbEllipsis />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuGroup>
                {collapsedItems.map((item, index) => (
                  <DropdownMenuItem key={item.id || index}>
                    <BreadcrumbLink asChild>
                      <Link href={item.href || '#'}>{item.label}</Link>
                    </BreadcrumbLink>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Parent item (always visible) */}
        <BreadcrumbItem>
          {parent.href ? (
            <BreadcrumbLink asChild>
              <Link href={parent.href}>{parent.label}</Link>
            </BreadcrumbLink>
          ) : (
            <BreadcrumbPage>{parent.label}</BreadcrumbPage>
          )}
        </BreadcrumbItem>
        <BreadcrumbSeparator />

        {/* Current page (always visible, non-clickable) */}
        <BreadcrumbItem>
          <BreadcrumbPage>{current.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
