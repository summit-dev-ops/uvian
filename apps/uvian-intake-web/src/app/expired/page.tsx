export default function ExpiredPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-md mx-auto px-4">
        <div className="flex justify-center mb-6">
          <svg
            className="w-16 h-16 text-amber-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Link Expired</h1>
        <p className="text-lg text-gray-600">
          This secure link has either expired or has already been used. Please
          return to your conversation to request a new link if needed.
        </p>
      </div>
    </main>
  );
}
