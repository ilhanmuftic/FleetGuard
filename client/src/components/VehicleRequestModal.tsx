import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertVehicleRequestSchema } from "@shared/schema";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Vehicle } from "@shared/schema";
import { z } from "zod";

interface VehicleRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedVehicleId?: number;
}

const formSchema = insertVehicleRequestSchema.extend({
  vehicleId: z.number(),
});

type FormData = z.infer<typeof formSchema>;

export default function VehicleRequestModal({
  isOpen,
  onClose,
  preSelectedVehicleId,
}: VehicleRequestModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      employeeId: user?.id || 2,
      vehicleId: preSelectedVehicleId,
    },
  });

  // Set pre-selected vehicle when modal opens
  useEffect(() => {
    if (preSelectedVehicleId && isOpen) {
      setValue("vehicleId", preSelectedVehicleId);
    }
  }, [preSelectedVehicleId, isOpen, setValue]);

  const startDate = watch("startDate");
  const endDate = watch("endDate");

  const { data: vehicles = [] } = useQuery({
    queryKey: ["/api/vehicles"],
  });

  const { data: availableVehicles = [] } = useQuery({
    queryKey: ["/api/vehicles/available", startDate, endDate],
    queryFn: () =>
      startDate && endDate
        ? fetch(`/api/vehicles/available?startDate=${startDate}&endDate=${endDate}`).then(res => res.json())
        : Promise.resolve([]),
    enabled: !!(startDate && endDate),
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await apiRequest("POST", "/api/requests", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/requests", "pending"] });
      toast({
        title: "Success",
        description: "Vehicle request submitted successfully! You will be notified once approved.",
      });
      reset();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    const requestData = {
      ...data,
      employeeId: user?.id || 2,
    };
    createRequestMutation.mutate(requestData);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Request Vehicle</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="vehicle-select">Select Vehicle</Label>
            <Select
              value={watch("vehicleId")?.toString() || ""}
              onValueChange={(value) => setValue("vehicleId", parseInt(value))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Choose a vehicle..." />
              </SelectTrigger>
              <SelectContent>
                {(startDate && endDate ? availableVehicles : vehicles).map((vehicle: Vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id.toString()}>
                    {vehicle.model} - {vehicle.plateNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.vehicleId && (
              <p className="text-sm text-red-600 mt-1">Please select a vehicle</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                className="mt-1"
                min={new Date().toISOString().split('T')[0]}
                {...register("startDate", { required: true })}
              />
              {errors.startDate && (
                <p className="text-sm text-red-600 mt-1">Start date is required</p>
              )}
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                className="mt-1"
                min={startDate || new Date().toISOString().split('T')[0]}
                {...register("endDate", { required: true })}
              />
              {errors.endDate && (
                <p className="text-sm text-red-600 mt-1">End date is required</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="purpose">Purpose</Label>
            <Textarea
              id="purpose"
              className="mt-1"
              rows={3}
              placeholder="Describe the purpose of your trip..."
              {...register("purpose", { required: true })}
            />
            {errors.purpose && (
              <p className="text-sm text-red-600 mt-1">Purpose is required</p>
            )}
          </div>

          <div>
            <Label htmlFor="destination">Destination</Label>
            <Input
              id="destination"
              className="mt-1"
              placeholder="Enter destination address"
              {...register("destination", { required: true })}
            />
            {errors.destination && (
              <p className="text-sm text-red-600 mt-1">Destination is required</p>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={createRequestMutation.isPending}
            >
              {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
