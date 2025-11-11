"use client";

import { useSearchParams } from "next/navigation";

export default function Payment() {
  const searchParams = useSearchParams();

  // Get query params
  const feature = searchParams.get("feature");
  const product = searchParams.get("product");

  return (
    <div className="flex min-h-screen items-center justify-center bg-white text-black dark:bg-black dark:text-white flex-col space-y-4">
      <h1 className="text-4xl font-bold">Payment Page</h1>

      <div className="text-lg">
        {feature && (
          <p>
            <span className="font-semibold">Feature:</span> {feature}
          </p>
        )}
        {product && (
          <p>
            <span className="font-semibold">Product:</span> {product}
          </p>
        )}
      </div>
    </div>
  );
}
