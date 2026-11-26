
const dashboardData = [
  {
    id: 1,
    category: "CSPM Executive Dashboard",
    shortName: "CSPM Dashboard",
    widgets: [
      {
        id: 101,
        name: "Cloud Accounts",
        text: "2 Total Accounts",
        type: "pie",
        chartData: [
          { name: "Connected", value: 2 },
          { name: "Not Connected", value: 1 },
        ],
      },
      {
        id: 102,
        name: "Cloud Account Risk Assessment",
        text: "9,659 Total Assessments",
        type: "pie",
        chartData: [
          { name: "Healthy", value: 7200 },
          { name: "At Risk", value: 1800 },
          { name: "Critical", value: 659 },
        ],
      },
      {
        id: 103,
        name: "Security Posture Score",
        text: "Overall security posture is 87%",
        type: "bar",
        chartData: [
          { name: "AWS", value: 92 },
          { name: "Azure", value: 81 },
          { name: "GCP", value: 88 },
        ],
      },
    ],
  },
  {
    id: 2,
    category: "CWPP Dashboard",
    shortName: "CWPP Dashboard",
    widgets: [
      {
        id: 201,
        name: "Top 5 Namespace Specific Alerts",
        text: "No graph data available yet. Connect a data source to see namespace alerts.",
        type: "text",
      },
      {
        id: 202,
        name: "Workload Alerts",
        text: "No critical workload alerts are currently configured.",
        type: "text",
      },
      {
        id: 203,
        name: "Runtime Protection",
        text: "Runtime protection is enabled for 18 workloads.",
        type: "metric",
        value: "18",
        caption: "Protected workloads",
      },
    ],
  },
  {
    id: 3,
    category: "Registry Scan",
    shortName: "Registry Scan",
    widgets: [
      {
        id: 301,
        name: "Image Risk Assessment",
        text: "1,470 Total Vulnerabilities",
        type: "pie",
        chartData: [
          { name: "Low", value: 890 },
          { name: "Medium", value: 420 },
          { name: "High", value: 160 },
        ],
      },
      {
        id: 302,
        name: "Image Security Issues",
        text: "2 Total Images",
        type: "bar",
        chartData: [
          { name: "Secure", value: 1 },
          { name: "At Risk", value: 1 },
        ],
      },
      {
        id: 303,
        name: "Recent Image Scans",
        text: "12 container images scanned in the last 24 hours.",
        type: "metric",
        value: "12",
        caption: "Images scanned today",
      },
    ],
  },
];

export default dashboardData;
