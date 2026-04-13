import Link from "next/link";

export default function AdminPage() {
  const modules = [
    {
      href: "/admin/agents",
      title: "Agents",
      description: "Manage custom agents with per-agent config and prompts",
    },
    {
      href: "/admin/skills",
      title: "Skills",
      description: "Manage skills and their enabled status",
    },
    {
      href: "/admin/mcp",
      title: "MCP Servers",
      description: "Configure Model Context Protocol servers",
    },
    {
      href: "/admin/memory",
      title: "Memory",
      description: "Access and manage global memory data",
    },
    {
      href: "/admin/channels",
      title: "Channels",
      description: "Manage IM channel integrations (Feishu, Slack, Telegram)",
    },
    {
      href: "/admin/models",
      title: "Models",
      description: "Query and configure available AI models",
    },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <Link
            key={module.href}
            href={module.href}
            className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
          >
            <h2 className="text-xl font-semibold mb-2">{module.title}</h2>
            <p className="text-gray-600">{module.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
