import { notFound } from 'next/navigation';
import { getIntakeSchema } from '@/lib/api/intake';
import { DynamicForm } from '@/components/dynamic-form';

interface PageProps {
  params: Promise<{ tokenId: string }>;
}

export default async function IntakePage({ params }: PageProps) {
  const { tokenId } = await params;

  if (!tokenId || !tokenId.startsWith('int_')) {
    notFound();
  }

  let schema;
  try {
    schema = await getIntakeSchema(tokenId);
  } catch {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg p-8">
          <div className="mb-8 text-center">
            <div className="flex justify-center mb-4">
              <svg
                className="w-12 h-12 text-emerald-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {schema.title}
            </h1>
            {schema.description && (
              <p className="text-gray-600">{schema.description}</p>
            )}
          </div>

          <DynamicForm tokenId={tokenId} schema={schema} />
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          This form is secured with end-to-end encryption. Your data is
          transmitted securely.
        </p>
      </div>
    </main>
  );
}
