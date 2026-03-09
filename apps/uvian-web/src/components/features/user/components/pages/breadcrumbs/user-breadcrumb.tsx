'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Home, User, Pencil } from 'lucide-react';
import {
  useIsMobile,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@org/ui';

interface UserPageBreadcrumbProps {
  userId: string;
}

export function UserPageBreadcrumb({ userId }: UserPageBreadcrumbProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/home">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/users">Users</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Profile</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-medium hover:text-muted-foreground transition-colors min-h-[44px] px-2 -ml-2 rounded"
        aria-label="View navigation"
      >
        <User className="h-4 w-4" />
        <span>Profile</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Profile</SheetTitle>
            <SheetDescription>Navigation</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 mt-4">
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>Home</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <span className="text-muted-foreground">/</span>
            </div>

            <Link
              href="/users"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <User className="h-5 w-5 text-muted-foreground" />
              <span>Users</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <span className="text-muted-foreground">/</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <User className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}

interface UserEditPageBreadcrumbProps {
  userId: string;
}

export function UserEditPageBreadcrumb({
  userId,
}: UserEditPageBreadcrumbProps) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  if (!isMobile) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/home">Home</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/users">Users</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/users/${userId}`}>Profile</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Edit</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-sm font-medium hover:text-muted-foreground transition-colors min-h-[44px] px-2 -ml-2 rounded"
        aria-label="View navigation"
      >
        <Pencil className="h-4 w-4" />
        <span>Edit</span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-xl">
          <SheetHeader>
            <SheetTitle>Edit Profile</SheetTitle>
            <SheetDescription>Navigation</SheetDescription>
          </SheetHeader>

          <nav className="flex flex-col gap-1 mt-4">
            <Link
              href="/home"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <Home className="h-5 w-5 text-muted-foreground" />
              <span>Home</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <span className="text-muted-foreground">/</span>
            </div>

            <Link
              href="/users"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <User className="h-5 w-5 text-muted-foreground" />
              <span>Users</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <span className="text-muted-foreground">/</span>
            </div>

            <Link
              href={`/users/${userId}`}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors"
            >
              <User className="h-5 w-5 text-muted-foreground" />
              <span>Profile</span>
            </Link>

            <div className="flex items-center justify-center py-1">
              <span className="text-muted-foreground">/</span>
            </div>

            <div className="flex items-center gap-3 p-3 bg-accent rounded-lg">
              <Pencil className="h-5 w-5" />
              <span className="font-medium">Edit</span>
            </div>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
