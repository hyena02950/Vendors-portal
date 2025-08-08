
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Bell, Clock, Send, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getToken } from "@/utils/auth";

interface ReminderSettings {
  enabled: boolean;
  reminderInterval: number; // hours
  maxReminders: number;
  escalationEnabled: boolean;
  escalationAfter: number; // hours
}

interface PendingReminder {
  id: string;
  document_type: string;
  vendor_name: string;
  days_pending: number;
  last_reminder?: string;
  reminder_count: number;
}

export const AutomatedReminders = () => {
  const { toast } = useToast();
  const [pendingReminders, setPendingReminders] = useState<PendingReminder[]>([]);
  const [settings, setSettings] = useState<ReminderSettings>({
    enabled: true,
    reminderInterval: 24,
    maxReminders: 3,
    escalationEnabled: true,
    escalationAfter: 72,
  });
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetchPendingReminders = async () => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch('/api/vendors/documents/pending-reminders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch pending reminders');
      }

      const data = await response.json();

      const reminders: PendingReminder[] = data.documents?.map(doc => {
        const daysPending = Math.floor(
          (Date.now() - new Date(doc.uploaded_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        
        return {
          id: doc.id,
          document_type: doc.document_type,
          vendor_name: doc.vendor_name,
          days_pending: daysPending,
          reminder_count: 0, // This would come from a reminders tracking table
        };
      }) || [];

      // Filter documents that need reminders (pending for > 1 day)
      const needsReminders = reminders.filter(r => r.days_pending >= 1);
      setPendingReminders(needsReminders);
    } catch (error: any) {
      console.error('Error fetching pending reminders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch pending reminders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async (reminderId: string) => {
    try {
      // In a real implementation, this would send an email or notification
      // For now, we'll just show a success message
      toast({
        title: "Reminder Sent",
        description: "Reminder notification has been sent",
      });
      
      // Update the reminder count and last sent time
      // This would typically be stored in a separate reminders table
      
    } catch (error: any) {
      console.error('Error sending reminder:', error);
      toast({
        title: "Error",
        description: "Failed to send reminder",
        variant: "destructive",
      });
    }
  };

  const sendBulkReminders = async () => {
    try {
      const eligibleReminders = pendingReminders.filter(
        r => r.reminder_count < settings.maxReminders
      );

      for (const reminder of eligibleReminders) {
        await sendReminder(reminder.id);
      }

      toast({
        title: "Bulk Reminders Sent",
        description: `${eligibleReminders.length} reminders have been sent`,
      });
      
      fetchPendingReminders();
    } catch (error: any) {
      console.error('Error sending bulk reminders:', error);
      toast({
        title: "Error",
        description: "Failed to send bulk reminders",
        variant: "destructive",
      });
    }
  };

  const saveSettings = () => {
    // In a real implementation, save settings to database
    localStorage.setItem('reminderSettings', JSON.stringify(settings));
    toast({
      title: "Settings Saved",
      description: "Reminder settings have been updated",
    });
    setShowSettings(false);
  };

  useEffect(() => {
    fetchPendingReminders();
    
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('reminderSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Set up periodic refresh
    const interval = setInterval(fetchPendingReminders, 300000); // 5 minutes
    return () => clearInterval(interval);
  }, []);

  const getUrgencyColor = (daysPending: number) => {
    if (daysPending >= 7) return 'bg-red-100 text-red-800';
    if (daysPending >= 3) return 'bg-orange-100 text-orange-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            Automated Reminders
          </CardTitle>
          <div className="flex space-x-2">
            {pendingReminders.length > 0 && (
              <Button onClick={sendBulkReminders} size="sm">
                <Send className="h-4 w-4 mr-2" />
                Send All Reminders
              </Button>
            )}
            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reminder Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Enable Automated Reminders</Label>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(enabled) => 
                        setSettings(prev => ({ ...prev, enabled }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Reminder Interval (hours)</Label>
                    <Input
                      type="number"
                      value={settings.reminderInterval}
                      onChange={(e) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          reminderInterval: Number(e.target.value) 
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Maximum Reminders per Document</Label>
                    <Input
                      type="number"
                      value={settings.maxReminders}
                      onChange={(e) => 
                        setSettings(prev => ({ 
                          ...prev, 
                          maxReminders: Number(e.target.value) 
                        }))
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Enable Escalation</Label>
                    <Switch
                      checked={settings.escalationEnabled}
                      onCheckedChange={(escalationEnabled) => 
                        setSettings(prev => ({ ...prev, escalationEnabled }))
                      }
                    />
                  </div>
                  {settings.escalationEnabled && (
                    <div>
                      <Label>Escalate After (hours)</Label>
                      <Input
                        type="number"
                        value={settings.escalationAfter}
                        onChange={(e) => 
                          setSettings(prev => ({ 
                            ...prev, 
                            escalationAfter: Number(e.target.value) 
                          }))
                        }
                      />
                    </div>
                  )}
                  <Button onClick={saveSettings} className="w-full">
                    Save Settings
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-4">Loading reminders...</div>
        ) : pendingReminders.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No pending reminders at this time
          </div>
        ) : (
          <div className="space-y-3">
            {pendingReminders.map((reminder) => (
              <div key={reminder.id} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center space-x-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{reminder.document_type}</div>
                    <div className="text-sm text-muted-foreground">
                      {reminder.vendor_name}
                    </div>
                  </div>
                  <Badge className={getUrgencyColor(reminder.days_pending)}>
                    {reminder.days_pending} days pending
                  </Badge>
                  <Badge variant="outline">
                    {reminder.reminder_count}/{settings.maxReminders} reminders
                  </Badge>
                </div>
                <Button
                  onClick={() => sendReminder(reminder.id)}
                  size="sm"
                  variant="outline"
                  disabled={reminder.reminder_count >= settings.maxReminders}
                >
                  Send Reminder
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
