
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AnalyticsData } from "@/hooks/useAnalytics";
import { exportReport, ExportOptions } from "@/utils/exportService";

interface ExportControlsProps {
  data: AnalyticsData | null;
  timeRange: string;
}

export const ExportControls = ({ data, timeRange }: ExportControlsProps) => {
  const { toast } = useToast();
  const [exportFormat, setExportFormat] = useState<'pdf' | 'excel'>('excel');
  const [reportType, setReportType] = useState<'overview' | 'vendors' | 'documents' | 'candidates'>('overview');
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    if (!data) {
      toast({
        title: "Error",
        description: "No data available for export",
        variant: "destructive",
      });
      return;
    }

    setExporting(true);
    
    try {
      const options: ExportOptions = {
        format: exportFormat,
        reportType,
        timeRange,
      };

      await exportReport(data, options);
      
      toast({
        title: "Export Successful",
        description: `${reportType} report exported as ${exportFormat.toUpperCase()}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  const getExportIcon = () => {
    return exportFormat === 'pdf' ? (
      <FileText className="mr-2 h-4 w-4" />
    ) : (
      <FileSpreadsheet className="mr-2 h-4 w-4" />
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Download className="mr-2 h-5 w-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Report Type</label>
            <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="overview">Overview Report</SelectItem>
                <SelectItem value="vendors">Vendor Performance</SelectItem>
                <SelectItem value="documents">Document Analytics</SelectItem>
                <SelectItem value="candidates">Candidate Metrics</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Format</label>
            <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="excel">Excel/CSV</SelectItem>
                <SelectItem value="pdf">PDF Report</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Action</label>
            <Button 
              onClick={handleExport} 
              disabled={!data || exporting}
              className="w-full"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exporting...
                </>
              ) : (
                <>
                  {getExportIcon()}
                  Export {exportFormat.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          <p className="mb-2">Export includes:</p>
          <ul className="list-disc list-inside space-y-1">
            {reportType === 'overview' && (
              <>
                <li>Vendor, document, and candidate metrics</li>
                <li>Performance trends and KPIs</li>
                <li>Time range: {timeRange}</li>
              </>
            )}
            {reportType === 'vendors' && (
              <>
                <li>Vendor performance rankings</li>
                <li>Submission and hire statistics</li>
                <li>Success rate analysis</li>
              </>
            )}
            {reportType === 'documents' && (
              <>
                <li>Document processing trends</li>
                <li>Approval/rejection rates by day</li>
                <li>Processing time analytics</li>
              </>
            )}
            {reportType === 'candidates' && (
              <>
                <li>Monthly submission trends</li>
                <li>Interview and placement rates</li>
                <li>Candidate pipeline analysis</li>
              </>
            )}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
