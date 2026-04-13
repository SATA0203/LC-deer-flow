"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface Skill {
  name: string;
  description: string;
  license: string | null;
  category: string;
  enabled: boolean;
}

interface SkillsListResponse {
  skills: Skill[];
}

export default function SkillsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<SkillsListResponse>({
    queryKey: ["skills"],
    queryFn: async () => {
      const response = await axios.get("/api/skills");
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ name, enabled }: { name: string; enabled: boolean }) => {
      return axios.put(`/api/skills/${name}/toggle`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skills"] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Skills Management</h1>
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
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                License
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
            {data?.skills.map((skill) => (
              <tr key={skill.name}>
                <td className="px-6 py-4 whitespace-nowrap font-medium">{skill.name}</td>
                <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                  {skill.description}
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      skill.category === "custom"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {skill.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{skill.license || "-"}</td>
                <td className="px-6 py-4">
                  <span
                    className={`px-2 py-1 text-xs rounded-full ${
                      skill.enabled
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {skill.enabled ? "Enabled" : "Disabled"}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <button
                    onClick={() =>
                      updateMutation.mutate({ name: skill.name, enabled: !skill.enabled })
                    }
                    disabled={updateMutation.isPending}
                    className={`px-3 py-1 rounded-md text-sm ${
                      skill.enabled
                        ? "bg-red-100 text-red-700 hover:bg-red-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {skill.enabled ? "Disable" : "Enable"}
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
