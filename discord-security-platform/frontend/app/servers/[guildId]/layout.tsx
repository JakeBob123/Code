import { Sidebar } from '@/components/shell/Sidebar';

export default function ServerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { guildId: string };
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar guildId={params.guildId} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
