"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface Model {
  name: string;
  model: string;
  display_name: string | null;
  description: string | null;
  supports_thinking: boolean;
  supports_reasoning_effort: boolean;
}

interface ModelsListResponse {
  models: Model[];
}

export default function ModelsPage() {
  const { data, isLoading } = useQuery<ModelsListResponse>({
    queryKey: ["models"],
    queryFn: async () => {
      const response = await axios.get("/api/models");
      return response.data;
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Models Configuration</h1>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Model ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Display Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Description
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Capabilities
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data?.models.map((model) => (
              <tr key={model.name}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{model.name}</td>
                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{model.model}</td>
                <td className="px-6 py-4 text-gray-600">{model.display_name || "-"}</td>
                <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                  {model.description || "-"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex space-x-2">
                    {model.supports_thinking && (
                      <span className="px-2 py-1 text-xs rounded-full bg-purple-100 text-purple-800">
                        Thinking
                      </span>
                    )}
                    {model.supports_reasoning_effort && (
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Reasoning
                      </span>
                    )}
                    {!model.supports_thinking && !model.supports_reasoning_effort && (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
