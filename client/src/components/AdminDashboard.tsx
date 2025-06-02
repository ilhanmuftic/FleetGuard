import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, CheckCircle, Clock, Wrench, Check, X } from "lucide-react";
import Layout from "./Layout";
import ApprovalModal from "./ApprovalModal";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import type { VehicleRequestWithDetails } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import TestSupabaseConnection from "./TestSupabase";

export default function AdminDashboard() {
  const [selectedApproval, setSelectedApproval] = useState<VehicleRequestWithDetails | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ["/api/stats/vehicles"],
  });

  const { data: pendingRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ["/api/requests", "pending"],
    queryFn: () => fetch("/api/requests?status=pending").then(res => res.json()),
  });

  const { data: allRequests = [] } = useQuery({
    queryKey: ["/api/requests"],
  });

  const updateRequestMutation = useMutation({
    mutationFn: async ({ requestId, status }: { requestId: number; status: string }) => {
      const response = await apiRequest("PATCH", `/api/requests/${requestId}/status`, { status });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats/vehicles"] });

      if (variables.status === "approved") {
        setSelectedApproval(data);
        toast({
          title: "Request Approved",
          description: `Access code ${data.accessCode} generated successfully`,
        });
      } else {
        toast({
          title: "Request Rejected",
          description: "The vehicle request has been rejected",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update request status",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (requestId: number) => {
    updateRequestMutation.mutate({ requestId, status: "approved" });
  };

  const handleReject = (requestId: number) => {
    updateRequestMutation.mutate({ requestId, status: "rejected" });
  };

  const recentActivity = allRequests
    .filter((req: VehicleRequestWithDetails) => req.status !== "pending")
    .slice(0, 5);

  return (
    <Layout title="Dashboard">
      <TestSupabaseConnection />

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vehicles</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.totalVehicles || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.available || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Requests</p>
                <p className="text-2xl font-bold text-gray-900">{pendingRequests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <Wrench className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Use</p>
                <p className="text-2xl font-bold text-gray-900">{stats?.inUse || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Pending Requests */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Pending Requests</CardTitle>
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                {pendingRequests.length} Pending
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {requestsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse border border-gray-200 rounded-lg p-4">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded mb-1"></div>
                    <div className="h-3 bg-gray-200 rounded"></div>
                  </div>
                ))}
              </div>
            ) : pendingRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending requests</p>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map((request: VehicleRequestWithDetails) => (
                  <div key={request.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium text-gray-900">{request.employee?.name || "Unknown Employee"}</h4>
                        <p className="text-sm text-gray-600">{request.employee?.department || "Unknown Department"}</p>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Pending
                      </Badge>
                    </div>
                    <div className="mb-3 space-y-1">
                      <p className="text-sm text-gray-600">
                        <Car className="inline h-4 w-4 mr-2" />
                        {request.vehicle.model} - {request.vehicle.plateNumber}
                      </p>
                      <p className="text-sm text-gray-600">
                        <i className="fas fa-calendar mr-2"></i>
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <i className="fas fa-map-marker-alt mr-2"></i>
                        {request.purpose}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700"
                        onClick={() => handleApprove(request.id)}
                        disabled={updateRequestMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleReject(request.id)}
                        disabled={updateRequestMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No recent activity</p>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity: VehicleRequestWithDetails) => (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0 ${activity.status === "approved"
                      ? "bg-green-100"
                      : "bg-red-100"
                      }`}>
                      {activity.status === "approved" ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <X className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{activity.employee?.name || "Unknown Employee"}</span> request {activity.status}
                      </p>
                      <p className="text-sm text-gray-600">
                        {activity.vehicle?.model || "Unknown Vehicle"} - {activity.vehicle?.plateNumber || "N/A"}
                      </p>
                      <p className="text-xs text-gray-500">
                        {activity.approvedAt
                          ? new Date(activity.approvedAt).toLocaleString()
                          : new Date(activity.createdAt).toLocaleString()
                        }
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {selectedApproval && (
        <ApprovalModal
          request={selectedApproval}
          onClose={() => setSelectedApproval(null)}
        />
      )}
    </Layout>
  );
}
