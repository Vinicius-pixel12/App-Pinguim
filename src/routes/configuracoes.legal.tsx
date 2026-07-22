import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/configuracoes/legal")({
  component: () => <Outlet />,
});
