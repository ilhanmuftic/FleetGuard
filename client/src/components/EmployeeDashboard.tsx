import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Car, Plus, Users, Fuel, Calendar } from "lucide-react";
import Layout from "./Layout";
import VehicleRequestModal from "./VehicleRequestModal";
import { useState } from "react";
import type { VehicleRequestWithDetails, Vehicle } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import supabase from "@/lib/supabase";

export default function EmployeeDashboard() {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>();
  const { user } = useAuth();

  const { data: userRequests = [] } = useQuery({
    queryKey: ['vehicle_requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return []
      const { data, error } = await supabase
        .from('vehicle_requests')
        .select('*')
        .eq('user_id', user.id)

      if (error) throw error
      return data
    }
  })

  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')

      if (error) throw error
      return data
    }
  })


  const activeBooking = userRequests.find((req: VehicleRequestWithDetails) =>
    req.status === "approved" &&
    new Date(req.startDate) <= new Date() &&
    new Date(req.endDate) >= new Date()
  );

  const availableVehicles = (vehicles as Vehicle[]).filter((vehicle: Vehicle) => vehicle.status === "available");

  return (
    <Layout
      title="My Dashboard"
      actions={
        <Button onClick={() => {
          setSelectedVehicleId(undefined);
          setIsRequestModalOpen(true);
        }}>
          <Plus className="h-4 w-4 mr-2" />
          Request Vehicle
        </Button>
      }
    >
      {/* Current Bookings */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Bookings</h3>

        {activeBooking ? (
          <Card className="mb-4">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Car className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {activeBooking.vehicle.model}
                    </h4>
                    <p className="text-sm text-gray-600">
                      License: {activeBooking.vehicle.plateNumber}
                    </p>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Active</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium text-gray-600">Start Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(activeBooking.startDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">End Date</p>
                  <p className="text-sm text-gray-900">
                    {new Date(activeBooking.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="sm:col-span-2 lg:col-span-1">
                  <p className="text-sm font-medium text-gray-600">Access Code</p>
                  <p className="text-2xl font-bold text-primary font-mono">
                    {activeBooking.accessCode}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600">Status</p>
                  <p className="text-sm text-green-600 font-medium">Code Active</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <i className="fas fa-info-circle text-blue-600 mt-0.5 mr-3"></i>
                  <div>
                    <p className="text-sm font-medium text-blue-900">Access Code Instructions</p>
                    <p className="text-sm text-blue-700 mt-1">
                      Use the 4-digit code <strong>{activeBooking.accessCode}</strong> to unlock and start the vehicle.
                      This code is valid only for your booking period and will expire automatically.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-4">
            <CardContent className="p-6 text-center">
              <Car className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No active bookings</p>
              <Button
                className="mt-4"
                onClick={() => {
                  setSelectedVehicleId(undefined);
                  setIsRequestModalOpen(true);
                }}
              >
                Request a Vehicle
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Available Vehicles */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Available Vehicles</h3>
          <div className="flex items-center space-x-2">
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
              <option>All Types</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Hatchback</option>
            </select>
            <Button variant="outline" size="sm">
              <i className="fas fa-sync-alt mr-1"></i>
              Refresh
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {availableVehicles.map((vehicle: Vehicle) => (
            <Card key={vehicle.id} className="overflow-hidden">
              <div className="aspect-video">
                <img
                  src={vehicle.imageUrl || "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200"}
                  alt={vehicle.model}
                  className="w-full h-full object-cover"
                />
              </div>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-gray-900">{vehicle.model}</h4>
                  <Badge className="bg-green-100 text-green-800">Available</Badge>
                </div>
                <p className="text-sm text-gray-600 mb-3">License: {vehicle.plateNumber}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <Users className="h-4 w-4 mr-2" />
                    <span>{vehicle.capacity} passengers</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Fuel className="h-4 w-4 mr-2" />
                    <span>{vehicle.fuelType}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span>
                      Last serviced: {vehicle.lastMaintenance
                        ? new Date(vehicle.lastMaintenance).toLocaleDateString()
                        : "N/A"
                      }
                    </span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedVehicleId(vehicle.id);
                    setIsRequestModalOpen(true);
                  }}
                >
                  Request This Vehicle
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recent Requests */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Requests</h3>
        <div className="hidden md:block">
          <Card>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehicle
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Access Code
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {userRequests.map((request: VehicleRequestWithDetails) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.vehicle.model}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.vehicle.plateNumber}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.purpose}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          className={
                            request.status === "approved"
                              ? "bg-green-100 text-green-800"
                              : request.status === "rejected"
                                ? "bg-red-100 text-red-800"
                                : "bg-yellow-100 text-yellow-800"
                          }
                        >
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.accessCode ? (
                          <div className="text-sm font-mono font-bold text-primary">
                            {request.accessCode}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">-</div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {userRequests.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        No requests found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Mobile view */}
        <div className="md:hidden space-y-4">
          {userRequests.map((request: VehicleRequestWithDetails) => (
            <Card key={request.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{request.vehicle.model}</h4>
                    <p className="text-sm text-gray-600">{request.vehicle.plateNumber}</p>
                  </div>
                  <Badge
                    className={
                      request.status === "approved"
                        ? "bg-green-100 text-green-800"
                        : request.status === "rejected"
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                    }
                  >
                    {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    <strong>Period:</strong> {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Purpose:</strong> {request.purpose}
                  </p>
                  {request.accessCode && (
                    <p className="text-sm text-gray-600">
                      <strong>Access Code:</strong> <span className="font-mono font-bold text-primary">{request.accessCode}</span>
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
          {userRequests.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center text-gray-500">
                No requests found
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <VehicleRequestModal
        isOpen={isRequestModalOpen}
        onClose={() => {
          setIsRequestModalOpen(false);
          setSelectedVehicleId(undefined);
        }}
        preSelectedVehicleId={selectedVehicleId}
      />
    </Layout>
  );
}
