"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";

interface ChannelInfo {
  status: string;
  last_error?: string;
  [key: string]: any;
}

interface ChannelStatusResponse {
  service_running: boolean;
  channels: Record<string, ChannelInfo>;
}

export default function ChannelsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading, refetch } = useQuery<ChannelStatusResponse>({
    queryKey: ["channels"],
    queryFn: async () => {
      const response = await axios.get("/api/channels/");
      return response.data;
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const restartMutation = useMutation({
    mutationFn: async (name: string) => {
      return axios.post(`/api/channels/${name}/restart`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels"] });
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Channels Management</h1>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 border rounded-md hover:bg-gray-50"
        >
          Refresh
        </button>
      </div>

      {/* Service Status */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Service Status</h2>
        <div className="flex items-center">
          <span
            className={`px-3 py-1 rounded-full text-sm ${
              data?.service_running
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {data?.service_running ? "Running" : "Not Running"}
          </span>
          <span className="ml-3 text-gray-600">
            {data?.service_running
              ? "Channel service is active"
              : "Channel service is not available"}
          </span>
        </div>
      </div>

      {/* Channels List */}
      {data && Object.keys(data.channels).length > 0 && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Channel
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Error
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Object.entries(data.channels).map(([name, info]) => (
                <tr key={name}>
                  <td className="px-6 py-4 whitespace-nowrap font-medium">{name}</td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        info.status === "running"
                          ? "bg-green-100 text-green-800"
                          : info.status === "stopped"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {info.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600 max-w-md truncate">
                    {info.last_error || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => restartMutation.mutate(name)}
                      disabled={restartMutation.isPending || !data.service_running}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Restart
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {data && Object.keys(data.channels).length === 0 && (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No channels configured. Configure channels in your environment variables.
        </div>
      )}
    </div>
  );
}
