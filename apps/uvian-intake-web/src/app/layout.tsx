
import './styles.css';
import { Providers } from '@/components/providers';

export const metadata = {
  title: 'Uvian Secure Intake',
  description: 'Secure data collection powered by Uvian',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
