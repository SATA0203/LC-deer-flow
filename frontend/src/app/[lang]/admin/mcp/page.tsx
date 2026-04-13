"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface McpServerConfig {
  enabled: boolean;
  type: "stdio" | "sse" | "http";
  command: string | null;
  args: string[];
  env: Record<string, string>;
  url: string | null;
  headers: Record<string, string>;
  description: string;
}

interface McpConfigResponse {
  mcp_servers: Record<string, McpServerConfig>;
}

export default function McpPage() {
  const [editingServer, setEditingServer] = useState<{ name: string; config: McpServerConfig } | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<McpConfigResponse>({
    queryKey: ["mcp-config"],
    queryFn: async () => {
      const response = await axios.get("/api/mcp/config");
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (config: McpConfigResponse) => {
      return axios.put("/api/mcp/config", config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mcp-config"] });
      setEditingServer(null);
    },
  });

  const toggleServer = (name: string, currentEnabled: boolean) => {
    if (!data) return;
    const newConfig = {
      mcp_servers: {
        ...data.mcp_servers,
        [name]: { ...data.mcp_servers[name], enabled: !currentEnabled },
      },
    };
    updateMutation.mutate(newConfig);
  };

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  const servers = data ? Object.entries(data.mcp_servers) : [];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">MCP Servers Management</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {servers.map(([name, config]) => (
              <tr key={name}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{name}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {config.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                  {config.description || "-"}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      config.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {config.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    onClick={() => setEditingServer({ name, config })}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => toggleServer(name, config.enabled)}
                    disabled={updateMutation.isPending}
                    className={`px-3 py-1 rounded-md text-sm ${
                      config.enabled
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {config.enabled ? "Disable" : "Enable"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingServer && (
        <McpServerForm
          initialData={editingServer}
          onSubmit={(updatedConfig) => {
            if (!data) return;
            const newConfig = {
              mcp_servers: {
                ...data.mcp_servers,
                [editingServer.name]: updatedConfig,
              },
            };
            updateMutation.mutate(newConfig);
          }}
          onCancel={() => setEditingServer(null)}
        />
      )}
    </div>
  );
}

interface McpServerFormProps {
  initialData: { name: string; config: McpServerConfig };
  onSubmit: (config: McpServerConfig) => void;
  onCancel: () => void;
}

function McpServerForm({ initialData, onSubmit, onCancel }: McpServerFormProps) {
  const [formData, setFormData] = useState<McpServerConfig>(initialData.config);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl my-8">
        <h2 className="text-xl font-bold mb-4">Edit MCP Server: {initialData.name}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="space-y-4 max-h-[70vh] overflow-y-auto"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={formData.type}
              onChange={(e) =>
                setFormData({ ...formData, type: e.target.value as "stdio" | "sse" | "http" })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            >
              <option value="stdio">stdio</option>
              <option value="sse">sse</option>
              <option value="http">http</option>
            </select>
          </div>
          {formData.type === "stdio" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">Command</label>
                <input
                  type="text"
                  value={formData.command || ""}
                  onChange={(e) => setFormData({ ...formData, command: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Arguments</label>
                <input
                  type="text"
                  value={formData.args.join(" ")}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      args: e.target.value.split(" ").filter(Boolean),
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                  placeholder="Space-separated arguments"
                />
              </div>
            </>
          )}
          {(formData.type === "sse" || formData.type === "http") && formData.url && (
            <div>
              <label className="block text-sm font-medium text-gray-700">URL</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              rows={3}
            />
          </div>
          <div className="flex justify-end space-x-2 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
