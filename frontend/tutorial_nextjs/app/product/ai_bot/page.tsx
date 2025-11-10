export default function AIBotTestPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-green-600">🎉 AI Bot Test Page</h1>
      <p className="text-lg mt-4">
        If you can see this page, it means:
      </p>
      <ul className="list-disc list-inside mt-4 space-y-2">
        <li>✅ You are authenticated</li>
        <li>✅ You have AI Bot feature access</li>
        <li>✅ The layout protection is working!</li>
      </ul>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          <strong>URL:</strong> /product/ai_bot/test
        </p>
        <p className="text-sm text-blue-800">
          <strong>Protected by:</strong> /product/ai_bot/layout.tsx
        </p>
      </div>
    </div>
  );
}