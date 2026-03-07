export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col h-dvh min-h-0 w-dvw min-w-0">{children}</div>
  );
}
