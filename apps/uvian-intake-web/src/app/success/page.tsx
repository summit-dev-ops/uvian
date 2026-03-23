export default function SuccessPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 max-w-md mx-auto px-4">
        <div className="flex justify-center mb-6">
          <svg
            className="w-16 h-16 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">
          Submission Successful
        </h1>
        <p className="text-lg text-gray-600">
          Your information has been securely submitted. You may close this tab
          and return to your conversation.
        </p>
      </div>
    </main>
  );
}
