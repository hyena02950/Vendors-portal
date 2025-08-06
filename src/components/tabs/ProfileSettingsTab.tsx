
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { User, Building, Mail, Phone, MapPin, Bell } from "lucide-react";

export const ProfileSettingsTab = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    // Personal Information
    name: "John Smith",
    email: "john.smith@vendor.com",
    phone: "+91-9876543210",
    position: "Senior Recruiter",
    
    // Company Information
    companyName: "TechRecruit Solutions",
    companyAddress: "123 Business Park, Bangalore, Karnataka 560001",
    companyPhone: "+91-80-12345678",
    companyEmail: "info@techrecruit.com",
    
    // Notification Preferences
    emailNotifications: true,
    smsNotifications: false,
    candidateUpdates: true,
    interviewReminders: true,
    invoiceUpdates: true,
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/profile/update", {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Unable to update profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = () => {
    toast({
      title: "Change Password",
      description: "Password change form would open here",
    });
  };

  const handleResetNotifications = () => {
    setProfileData(prev => ({
      ...prev,
      emailNotifications: true,
      smsNotifications: false,
      candidateUpdates: true,
      interviewReminders: true,
      invoiceUpdates: true,
    }));
    toast({
      title: "Notifications Reset",
      description: "Notification preferences reset to default",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Personal Information */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <User className="mr-2 h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="position">Position</Label>
              <Input
                id="position"
                value={profileData.position}
                onChange={(e) => handleInputChange('position', e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="phone"
                  value={profileData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Company Information */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Building className="mr-2 h-5 w-5" />
            Company Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              value={profileData.companyName}
              onChange={(e) => handleInputChange('companyName', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="companyAddress">Company Address</Label>
            <Textarea
              id="companyAddress"
              value={profileData.companyAddress}
              onChange={(e) => handleInputChange('companyAddress', e.target.value)}
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyEmail">Company Email</Label>
              <Input
                id="companyEmail"
                type="email"
                value={profileData.companyEmail}
                onChange={(e) => handleInputChange('companyEmail', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Company Phone</Label>
              <Input
                id="companyPhone"
                value={profileData.companyPhone}
                onChange={(e) => handleInputChange('companyPhone', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="bg-gradient-card">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="mr-2 h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via email</p>
            </div>
            <Switch
              checked={profileData.emailNotifications}
              onCheckedChange={(checked) => handleInputChange('emailNotifications', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">Receive notifications via SMS</p>
            </div>
            <Switch
              checked={profileData.smsNotifications}
              onCheckedChange={(checked) => handleInputChange('smsNotifications', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Candidate Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about candidate status changes</p>
            </div>
            <Switch
              checked={profileData.candidateUpdates}
              onCheckedChange={(checked) => handleInputChange('candidateUpdates', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Interview Reminders</Label>
              <p className="text-sm text-muted-foreground">Receive reminders for scheduled interviews</p>
            </div>
            <Switch
              checked={profileData.interviewReminders}
              onCheckedChange={(checked) => handleInputChange('interviewReminders', checked)}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Invoice Updates</Label>
              <p className="text-sm text-muted-foreground">Get notified about invoice status changes</p>
            </div>
            <Switch
              checked={profileData.invoiceUpdates}
              onCheckedChange={(checked) => handleInputChange('invoiceUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <Button onClick={handleSaveProfile} disabled={loading} className="flex-1">
          {loading ? "Saving..." : "Save Changes"}
        </Button>
        <Button variant="outline" onClick={handleChangePassword}>
          Change Password
        </Button>
        <Button variant="outline" onClick={handleResetNotifications}>
          Reset Notifications
        </Button>
      </div>
    </div>
  );
};
