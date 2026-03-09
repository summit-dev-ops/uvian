import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';

export function AccountsPageBreadcrumb() {
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
      <span className="text-foreground font-medium">Accounts</span>
    </nav>
  );
}
