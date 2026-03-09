import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

interface AccountPageBreadcrumbProps {
  accountId: string;
}

export function AccountPageBreadcrumb({
  accountId,
}: AccountPageBreadcrumbProps) {
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
      <span className="text-foreground font-medium">{accountId}</span>
    </nav>
  );
}
