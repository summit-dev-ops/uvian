import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface AccountEditPageBreadcrumbProps {
  accountId: string;
}

export function AccountEditPageBreadcrumb({
  accountId,
}: AccountEditPageBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      <Link
        href="/home"
        className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
      >
        <Home className="h-4 w-4" />
        <span>Home</span>
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <Link
        href="/accounts"
        className="text-muted-foreground hover:text-foreground"
      >
        Accounts
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <Link
        href={`/accounts/${accountId}`}
        className="text-muted-foreground hover:text-foreground"
      >
        {accountId}
      </Link>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
      <span className="text-foreground font-medium">Edit</span>
    </nav>
  );
}
