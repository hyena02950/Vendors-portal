
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Building } from "lucide-react";

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
    
    if (!user || !session) {
      console.error('No authenticated user or session found');
      toast({
        title: "Authentication Error",
        description: "You must be logged in to register a vendor. Please log in and try again.",
        variant: "destructive",
      });
      return;
    }

    console.log('Current user for vendor registration:', { 
      id: user.id, 
      email: user.email, 
      sessionExists: !!session 
    });

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
      // First ensure the user profile exists
      console.log('Ensuring user profile exists for vendor registration');
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single();

      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking user profile:', profileCheckError);
        throw new Error('Failed to verify user profile');
      }

      if (!existingProfile) {
        console.log('Creating user profile for vendor registration');
        const { error: profileError } = await supabase
          .from('profiles')
          .insert([{
            id: user.id,
            company_name: formData.name,
            contact_person: formData.contact_person,
            phone: formData.phone,
            address: formData.address,
            email: formData.email
          }]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          throw new Error('Failed to create user profile');
        }
      }

      // Create vendor with correct data structure
      const vendorInsertData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone?.trim() || null,
        address: formData.address?.trim() || null,
        contact_person: formData.contact_person.trim(),
        status: 'pending' as const,
        created_by: user.id
      };
      
      console.log('Creating vendor with data:', vendorInsertData);

      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .insert([vendorInsertData])
        .select()
        .single();

      if (vendorError) {
        console.error('Vendor creation error details:', {
          error: vendorError,
          message: vendorError.message,
          details: vendorError.details,
          hint: vendorError.hint,
          code: vendorError.code
        });
        
        if (vendorError.code === '42501') {
          throw new Error('Permission denied. Please ensure you are logged in and try again.');
        } else if (vendorError.code === '23505') {
          throw new Error('A vendor with this email already exists.');
        } else {
          throw new Error(vendorError.message || 'Failed to create vendor profile');
        }
      }

      console.log('Vendor created successfully:', vendor);

      // Create vendor_admin role for the user
      const roleData = {
        user_id: user.id,
        role: 'vendor_admin' as const,
        vendor_id: vendor.id
      };

      console.log('Creating vendor admin role with data:', roleData);

      const { error: roleError } = await supabase
        .from('user_roles')
        .insert([roleData]);

      if (roleError) {
        console.error('Role creation error:', roleError);
        toast({
          title: "Vendor Created",
          description: "Vendor profile created but role assignment failed. Please contact an administrator.",
          variant: "destructive",
        });
      } else {
        console.log('Vendor admin role created successfully');
        toast({
          title: "Vendor Registered",
          description: "Your vendor profile has been created successfully and is pending approval.",
        });
      }

      // Reset form
      setFormData({
        name: "",
        email: user?.email || "",
        phone: "",
        address: "",
        contact_person: "",
      });

      onVendorCreated(vendor.id);
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
