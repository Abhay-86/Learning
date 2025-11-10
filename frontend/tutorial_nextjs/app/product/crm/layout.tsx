import { CRMRouteGuard } from "@/components/ProductRouteGuard";

export default function CRMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CRMRouteGuard redirectOnNoAccess={true}>
      {children}
    </CRMRouteGuard>
  );
}