"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Agent {
  name: string;
  description: string;
  model: string | null;
  tool_groups: string[] | null;
  soul: string | null;
}

interface AgentsListResponse {
  agents: Agent[];
}

export default function AgentsPage() {
  const [isCreating, setIsCreating] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<AgentsListResponse>({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await axios.get("/api/agents");
      return response.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (agent: Agent) => {
      return axios.post("/api/agents", agent);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setIsCreating(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ name, ...data }: { name: string; data: Partial<Agent> }) => {
      return axios.put(`/api/agents/${name}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
      setEditingAgent(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (name: string) => {
      return axios.delete(`/api/agents/${name}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agents"] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Agents Management</h1>
        <button
          onClick={() => setIsCreating(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Create Agent
        </button>
      </div>

      {/* Create Modal */}
      {isCreating && (
        <AgentForm
          onSubmit={(agent) => createMutation.mutate(agent)}
          onCancel={() => setIsCreating(false)}
          isEditing={false}
        />
      )}

      {/* Edit Modal */}
      {editingAgent && (
        <AgentForm
          initialData={editingAgent}
          onSubmit={(data) =>
            updateMutation.mutate({ name: editingAgent.name, data })
          }
          onCancel={() => setEditingAgent(null)}
          isEditing={true}
        />
      )}

      {/* Agents List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tools
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.agents.map((agent) => (
              <tr key={agent.name}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{agent.name}</td>
                <td className="px-6 py-4 text-gray-600">{agent.description}</td>
                <td className="px-6 py-4 text-gray-600">{agent.model || "-"}</td>
                <td className="px-6 py-4 text-gray-600">
                  {agent.tool_groups?.join(", ") || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    onClick={() => setEditingAgent(agent)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete agent ${agent.name}?`)) {
                        deleteMutation.mutate(agent.name);
                      }
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface AgentFormProps {
  initialData?: Agent;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isEditing: boolean;
}

function AgentForm({ initialData, onSubmit, onCancel, isEditing }: AgentFormProps) {
  const [formData, setFormData] = useState<Partial<Agent>>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    model: initialData?.model || "",
    tool_groups: initialData?.tool_groups || [],
    soul: initialData?.soul || "",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? "Edit Agent" : "Create Agent"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData);
          }}
          className="space-y-4"
        >
          {!isEditing && (
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
                required
                pattern="[A-Za-z0-9-]+"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <input
              type="text"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Model</label>
            <input
              type="text"
              value={formData.model || ""}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="Optional model override"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tool Groups</label>
            <input
              type="text"
              value={formData.tool_groups?.join(", ") || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  tool_groups: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                })
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              placeholder="Comma-separated tool groups"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">SOUL.md</label>
            <textarea
              value={formData.soul || ""}
              onChange={(e) => setFormData({ ...formData, soul: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2 h-32"
              placeholder="Agent personality and behavioral guardrails"
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
              {isEditing ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
