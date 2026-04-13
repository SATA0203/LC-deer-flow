"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ContextSection {
  summary: string;
  updatedAt: string;
}

interface UserContext {
  workContext: ContextSection;
  personalContext: ContextSection;
  topOfMind: ContextSection;
}

interface HistoryContext {
  recentMonths: ContextSection;
  earlierContext: ContextSection;
  longTermBackground: ContextSection;
}

interface Fact {
  id: string;
  content: string;
  category: string;
  confidence: number;
  createdAt: string;
  source: string;
  sourceError?: string | null;
}

interface MemoryResponse {
  version: string;
  lastUpdated: string;
  user: UserContext;
  history: HistoryContext;
  facts: Fact[];
}

export default function MemoryPage() {
  const [editingFact, setEditingFact] = useState<Fact | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<MemoryResponse>({
    queryKey: ["memory"],
    queryFn: async () => {
      const response = await axios.get("/api/memory");
      return response.data;
    },
  });

  const updateFactMutation = useMutation({
    mutationFn: async (fact: Fact) => {
      return axios.put(`/api/memory/facts/${fact.id}`, fact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
      setEditingFact(null);
    },
  });

  const deleteFactMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`/api/memory/facts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });

  const createFactMutation = useMutation({
    mutationFn: async (fact: Omit<Fact, "id" | "createdAt">) => {
      return axios.post("/api/memory/facts", fact);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["memory"] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  if (!data) {
    return <div className="text-center py-8 text-red-600">No memory data found</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Memory Management</h1>

      {/* Memory Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">User Context</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Work Context</h3>
              <p className="text-gray-600 text-sm mt-1">{data.user.workContext.summary}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Personal Context</h3>
              <p className="text-gray-600 text-sm mt-1">{data.user.personalContext.summary}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Top of Mind</h3>
              <p className="text-gray-600 text-sm mt-1">{data.user.topOfMind.summary}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">History Context</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700">Recent Months</h3>
              <p className="text-gray-600 text-sm mt-1">{data.history.recentMonths.summary}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Earlier Context</h3>
              <p className="text-gray-600 text-sm mt-1">{data.history.earlierContext.summary}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Long-term Background</h3>
              <p className="text-gray-600 text-sm mt-1">{data.history.longTermBackground.summary}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Facts Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Memory Facts ({data.facts.length})</h2>
          <button
            onClick={() =>
              setEditingFact({
                id: "",
                content: "",
                category: "context",
                confidence: 0.5,
                createdAt: "",
                source: "",
              })
            }
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Add Fact
          </button>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Content
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Confidence
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Source
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.facts.map((fact) => (
              <tr key={fact.id}>
                <td className="px-6 py-4 text-gray-600 max-w-md truncate">{fact.content}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {fact.category}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <div className="w-24 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${fact.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{(fact.confidence * 100).toFixed(0)}%</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600 text-sm">{fact.source}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <button
                    onClick={() => setEditingFact(fact)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete fact?`)) {
                        deleteFactMutation.mutate(fact.id);
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

      {/* Edit/Create Modal */}
      {editingFact && (
        <FactForm
          initialData={editingFact.id ? editingFact : null}
          onSubmit={(factData) => {
            if (editingFact.id) {
              updateFactMutation.mutate({ ...editingFact, ...factData });
            } else {
              createFactMutation.mutate(factData);
            }
          }}
          onCancel={() => setEditingFact(null)}
        />
      )}
    </div>
  );
}

interface FactFormProps {
  initialData: Fact | null;
  onSubmit: (data: Omit<Fact, "id" | "createdAt">) => void;
  onCancel: () => void;
}

function FactForm({ initialData, onSubmit, onCancel }: FactFormProps) {
  const [formData, setFormData] = useState({
    content: initialData?.content || "",
    category: initialData?.category || "context",
    confidence: initialData?.confidence || 0.5,
    source: initialData?.source || "",
    sourceError: initialData?.sourceError || "",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold mb-4">
          {initialData?.id ? "Edit Fact" : "Add Fact"}
        </h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit(formData as any);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Content</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
              rows={4}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <input
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confidence: {(formData.confidence * 100).toFixed(0)}%
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseFloat(e.target.value) })}
              className="mt-1 block w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Source Thread ID</label>
            <input
              type="text"
              value={formData.source}
              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 border p-2"
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
              {initialData?.id ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
