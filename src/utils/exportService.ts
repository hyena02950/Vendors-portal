
import { AnalyticsData } from "@/hooks/useAnalytics";

export interface ExportOptions {
  format: 'pdf' | 'excel';
  reportType: 'overview' | 'vendors' | 'documents' | 'candidates';
  timeRange: string;
}

export const exportReport = async (data: AnalyticsData, options: ExportOptions) => {
  if (options.format === 'excel') {
    return exportToExcel(data, options);
  } else {
    return exportToPDF(data, options);
  }
};

const exportToExcel = async (data: AnalyticsData, options: ExportOptions) => {
  // Create CSV content based on report type
  let csvContent = '';
  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `${options.reportType}_report_${timestamp}.csv`;

  switch (options.reportType) {
    case 'overview':
      csvContent = generateOverviewCSV(data);
      break;
    case 'vendors':
      csvContent = generateVendorCSV(data);
      break;
    case 'documents':
      csvContent = generateDocumentCSV(data);
      break;
    case 'candidates':
      csvContent = generateCandidateCSV(data);
      break;
  }

  downloadFile(csvContent, filename, 'text/csv');
};

const exportToPDF = async (data: AnalyticsData, options: ExportOptions) => {
  // Generate HTML content for PDF
  const htmlContent = generatePDFHTML(data, options);
  
  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};

const generateOverviewCSV = (data: AnalyticsData): string => {
  const rows = [
    ['Recruitment Analytics Report'],
    ['Generated on:', new Date().toLocaleDateString()],
    [''],
    ['Vendor Metrics'],
    ['Total Vendors', data.vendorMetrics.totalVendors],
    ['Active Vendors', data.vendorMetrics.activeVendors],
    ['Pending Vendors', data.vendorMetrics.pendingVendors],
    ['Approval Rate', `${data.vendorMetrics.approvalRate.toFixed(1)}%`],
    ['Avg Onboarding Time', `${data.vendorMetrics.avgOnboardingTime.toFixed(1)} days`],
    [''],
    ['Document Metrics'],
    ['Total Documents', data.documentMetrics.totalDocuments],
    ['Approved Documents', data.documentMetrics.approvedDocuments],
    ['Rejected Documents', data.documentMetrics.rejectedDocuments],
    ['Pending Documents', data.documentMetrics.pendingDocuments],
    ['Approval Rate', `${data.documentMetrics.approvalRate.toFixed(1)}%`],
    ['Avg Processing Time', `${data.documentMetrics.avgProcessingTime.toFixed(1)} days`],
    [''],
    ['Candidate Metrics'],
    ['Total Candidates', data.candidateMetrics.totalCandidates],
    ['This Month Submissions', data.candidateMetrics.submittedThisMonth],
    ['Interviews Scheduled', data.candidateMetrics.interviewsScheduled],
    ['Hired Candidates', data.candidateMetrics.hiredCandidates],
    ['Placement Rate', `${data.candidateMetrics.placementRate.toFixed(1)}%`],
  ];

  return rows.map(row => row.join(',')).join('\n');
};

const generateVendorCSV = (data: AnalyticsData): string => {
  const rows = [
    ['Vendor Performance Report'],
    ['Vendor Name', 'Submissions', 'Hires', 'Success Rate'],
    ...data.performanceData.vendorPerformance.map(vendor => [
      vendor.vendorName,
      vendor.submissions,
      vendor.hires,
      `${vendor.rate.toFixed(1)}%`
    ])
  ];

  return rows.map(row => row.join(',')).join('\n');
};

const generateDocumentCSV = (data: AnalyticsData): string => {
  const rows = [
    ['Document Processing Trends'],
    ['Date', 'Approved', 'Rejected', 'Pending'],
    ...data.performanceData.documentProcessingTrends.map(trend => [
      trend.date,
      trend.approved,
      trend.rejected,
      trend.pending
    ])
  ];

  return rows.map(row => row.join(',')).join('\n');
};

const generateCandidateCSV = (data: AnalyticsData): string => {
  const rows = [
    ['Monthly Candidate Submissions'],
    ['Month', 'Submissions', 'Interviews', 'Hired'],
    ...data.performanceData.monthlySubmissions.map(month => [
      month.month,
      month.submissions,
      month.interviews,
      month.hired
    ])
  ];

  return rows.map(row => row.join(',')).join('\n');
};

const generatePDFHTML = (data: AnalyticsData, options: ExportOptions): string => {
  const timestamp = new Date().toLocaleDateString();
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${options.reportType.toUpperCase()} Report</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { text-align: center; margin-bottom: 40px; }
        .section { margin-bottom: 30px; }
        .metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; }
        .metric-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
        .metric-title { font-weight: bold; color: #666; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
        th { background-color: #f5f5f5; }
        @media print { body { margin: 0; } }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${options.reportType.toUpperCase()} Analytics Report</h1>
        <p>Generated on: ${timestamp}</p>
        <p>Time Range: ${options.timeRange}</p>
      </div>

      <div class="section">
        <h2>Key Metrics</h2>
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-title">Total Vendors</div>
            <div class="metric-value">${data.vendorMetrics.totalVendors}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Document Approval Rate</div>
            <div class="metric-value">${data.documentMetrics.approvalRate.toFixed(1)}%</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Total Candidates</div>
            <div class="metric-value">${data.candidateMetrics.totalCandidates}</div>
          </div>
          <div class="metric-card">
            <div class="metric-title">Placement Rate</div>
            <div class="metric-value">${data.candidateMetrics.placementRate.toFixed(1)}%</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Vendor Performance</h2>
        <table>
          <thead>
            <tr>
              <th>Vendor Name</th>
              <th>Submissions</th>
              <th>Hires</th>
              <th>Success Rate</th>
            </tr>
          </thead>
          <tbody>
            ${data.performanceData.vendorPerformance.map(vendor => `
              <tr>
                <td>${vendor.vendorName}</td>
                <td>${vendor.submissions}</td>
                <td>${vendor.hires}</td>
                <td>${vendor.rate.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </body>
    </html>
  `;
};

const downloadFile = (content: string, filename: string, mimeType: string) => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
