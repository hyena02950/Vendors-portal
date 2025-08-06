
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Check, X, Clock, AlertCircle } from "lucide-react";

type VendorStatus = "pending" | "active" | "inactive" | "rejected";

interface VendorStatusManagerProps {
  vendorId: string;
  currentStatus: VendorStatus;
  onStatusChanged: () => void;
}

const statusConfig: Record<VendorStatus, { icon: any; color: string; label: string }> = {
  pending: { icon: Clock, color: "bg-yellow-100 text-yellow-800", label: "Pending" },
  active: { icon: Check, color: "bg-green-100 text-green-800", label: "Active" },
  inactive: { icon: AlertCircle, color: "bg-gray-100 text-gray-800", label: "Inactive" },
  rejected: { icon: X, color: "bg-red-100 text-red-800", label: "Rejected" }
};

export const VendorStatusManager = ({ vendorId, currentStatus, onStatusChanged }: VendorStatusManagerProps) => {
  const [selectedStatus, setSelectedStatus] = useState<VendorStatus>(currentStatus);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  const handleStatusUpdate = async () => {
    if (selectedStatus === currentStatus) {
      toast({
        title: "No Change",
        description: "Status is already set to this value.",
        variant: "default",
      });
      return;
    }

    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('vendors')
        .update({ status: selectedStatus })
        .eq('id', vendorId);

      if (error) {
        throw error;
      }

      toast({
        title: "Status Updated",
        description: `Vendor status has been updated to ${statusConfig[selectedStatus].label}.`,
      });

      onStatusChanged();
    } catch (error: any) {
      console.error('Error updating vendor status:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update vendor status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value as VendorStatus);
  };

  const CurrentStatusIcon = statusConfig[currentStatus]?.icon || Clock;

  return (
    <div className="flex items-center gap-3">
      <Badge className={statusConfig[currentStatus]?.color || "bg-gray-100 text-gray-800"}>
        <CurrentStatusIcon className="w-3 h-3 mr-1" />
        {statusConfig[currentStatus]?.label || currentStatus}
      </Badge>
      
      <div className="flex items-center gap-2">
        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <Button 
          onClick={handleStatusUpdate}
          disabled={isUpdating || selectedStatus === currentStatus}
          size="sm"
        >
          {isUpdating ? "Updating..." : "Update"}
        </Button>
      </div>
    </div>
  );
};
