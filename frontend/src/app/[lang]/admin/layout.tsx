import { ReactNode } from "react";
import Link from "next/link";

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const navItems = [
    { href: "/admin/agents", label: "Agents" },
    { href: "/admin/skills", label: "Skills" },
    { href: "/admin/mcp", label: "MCP Servers" },
    { href: "/admin/memory", label: "Memory" },
    { href: "/admin/channels", label: "Channels" },
    { href: "/admin/models", label: "Models" },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-gray-800">Admin Panel</h1>
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="pt-4 border-t mt-4">
              <Link
                href="/workspace"
                className="block px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-md transition-colors"
              >
                ← Back to Workspace
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-8">{children}</main>
    </div>
  );
}
