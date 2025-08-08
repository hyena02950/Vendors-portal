
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Building } from "lucide-react";
import { getToken } from "@/utils/auth";

interface NewVendorRegistrationProps {
  onVendorCreated: (vendorId: string) => void;
}

export const NewVendorRegistration = ({ onVendorCreated }: NewVendorRegistrationProps) => {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: user?.email || "",
    phone: "",
    address: "",
    contact_person: "",
  });

  // Load company name from localStorage if available
  useEffect(() => {
    const pendingCompanyName = localStorage.getItem('pendingCompanyName');
    if (pendingCompanyName) {
      setFormData(prev => ({ ...prev, name: pendingCompanyName }));
      localStorage.removeItem('pendingCompanyName');
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const token = getToken();
    if (!user || !token) {
      console.error('No authenticated user or session found');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to register a vendor.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.name || !formData.email || !formData.contact_person) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/vendors', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          contactPerson: formData.contact_person,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create vendor');
      }

      const data = await response.json();
      console.log('Vendor created successfully:', data);

      toast({
        title: "Vendor Registered",
        description: "Your vendor profile has been created successfully and is pending approval.",
      });
      // Reset form
      setFormData({
        name: "",
        email: user?.email || "",
        phone: "",
        address: "",
        contact_person: "",
      });

      onVendorCreated(data.vendor.id);
    } catch (error: any) {
      console.error('Error in vendor registration process:', error);
      toast({
        title: "Registration Failed",
        description: error.message || 'Failed to register vendor. Please try again.',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Vendor Registration
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Welcome! Please create your vendor profile below. 
          Your submission will be reviewed by our administrators and your account will be activated once approved.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="company-name">Company Name *</Label>
              <Input
                id="company-name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter your company name"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="contact-person">Contact Person *</Label>
              <Input
                id="contact-person"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Enter your name"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="Enter your email address"
                required
                disabled={loading}
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="Enter your phone number"
                disabled={loading}
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="address">Company Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder="Enter your company address"
              rows={3}
              disabled={loading}
            />
          </div>
          
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Creating Vendor Profile..." : "Create Vendor Profile"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
