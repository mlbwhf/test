// Reference tables of the Advanced SPC class (lessons 4 and 6): how SAFe outcomes lead to business
// results, example key results, and the aspects of SAFe a customization can touch.
//
// © Scaled Agile, Inc. Used under the Scaled Agile partner agreement; not covered by this
// repository's Apache License 2.0. See NOTICE.md in this folder.

/** Leading and lagging indicators, and example key results: a title, three column heads, rows. */
export const ASPC_INDICATORS: { title: string; cols: string[]; rows: string[][] }[] = [
 {
  "title": "Leading indicators of higher revenue",
  "cols": [
   "SAFe Outcome\n(Leading Indicator)",
   "Example Revenue Goals\n(Lagging Indicators)",
   "Example Business Metrics"
  ],
  "rows": [
   [
    "Faster time-to-market\n(Shorter lead time from trigger to value)",
    "Revenue captured sooner\nIncreased market share",
    "Units sold\nTime-to-revenue"
   ],
   [
    "Higher quality\n(Solutions function as desired and required)",
    "Increased recurring and referral revenue\nIncreased prices",
    "Repeat sales\nReferred sales"
   ],
   [
    "Higher productivity\n(More work done in less time)",
    "Increased capacity for innovation\nIncreased number of differentiating products/SKUs",
    "Profit as a percentage of new products\nProfit per employee"
   ],
   [
    "Higher workforce engagement\n(Positive, creative, collaborative culture)",
    "Increased rate of innovation\nCommitment to revenue goals",
    "Revenue per employee"
   ]
  ]
 },
 {
  "title": "Leading indicators of lower costs",
  "cols": [
   "SAFe Outcome\n(Leading Indicator)",
   "Example Cost Savings Goals\n(Lagging Indicators)",
   "Example Business Metrics"
  ],
  "rows": [
   [
    "Faster time-to-market\n(Shorter lead time from trigger to value)",
    "Reduced opportunity costs of delayed delivery\nReduced inventory holding costs",
    "Cost of goods sold\nVariable costs"
   ],
   [
    "Higher quality\n(Solutions function as desired and required)",
    "Reduced cost of rework \nLower support costs",
    "Cost per defect, scrap costs\nRecall costs, warranty costs"
   ],
   [
    "Higher productivity\n(More work done in less time)",
    "Reduced labor cost per unit of output \nReduced materials and equipment costs",
    "Labor cost per unit shipped\nResource utilization"
   ],
   [
    "Higher workforce engagement\n(Positive, creative, collaborative culture)",
    "Reduced hiring and training costs\nReduced defect remediation costs",
    "Turnover rate\nRecruiting costs"
   ]
  ]
 },
 {
  "title": "Leading indicators of lower risk",
  "cols": [
   "SAFe Outcome\n(Leading indicator)",
   "Example Risk Reduction Goals\n(Lagging Indicators)",
   "Example Business Metrics"
  ],
  "rows": [
   [
    "Faster time-to-market\n(Shorter lead time from trigger to value)",
    "Reduced threat of competition\nReduced operational/delivery risk",
    "Customer activation/acquisition \nDelivery predictability"
   ],
   [
    "Higher quality\n(Solutions function as desired and required)",
    "Fewer/shorter service outages\nFewer security breaches",
    "Service availability/uptime\nMean Time to Restore (MTTR)"
   ],
   [
    "Higher productivity\n(More work done in less time)",
    "Better estimating \nLess spoiled inventory",
    "Forecast accuracy (planned/actual)\nInventory turns"
   ],
   [
    "Higher workforce engagement\n(Positive, creative, collaborative culture)",
    "Improved compliance\nFewer defects and vulnerabilities",
    "Number of health/safety incidents\nNumber of compliance/audit findings"
   ]
  ]
 },
 {
  "title": "Leading indicators of happier customers",
  "cols": [
   "SAFe Outcome\n(Leading Indicator)",
   "Example Customer Happiness Goals\n(Lagging Indicators)",
   "Example Business Metrics"
  ],
  "rows": [
   [
    "Faster time-to-market\n(Shorter lead time from trigger to value)",
    "Customer needs are met more quickly\nHigher Customer loyalty",
    "On time, in-full delivery rate\nRecurring revenue"
   ],
   [
    "Higher quality\n(Solutions function as desired and required)",
    "Increased product adoption\nIncreased testimonials and referrals",
    "Customer acquisition\nNet Promoter Score"
   ],
   [
    "Higher productivity\n(More work done in less time)",
    "Faster issue resolution\nMore value delivered in less time",
    "Time-to-resolution\nSupport call volume"
   ],
   [
    "Higher workforce engagement\n(Positive, creative, collaborative culture)",
    "Better customer service \nImproved end-to-end Customer experience",
    "Defective unit percentage\nFall-off rate, churn rate"
   ]
  ]
 },
 {
  "title": "Examples of time-to-market key results",
  "cols": [
   "Metric",
   "Description",
   "Related Results from SAFe Customers"
  ],
  "rows": [
   [
    "Flow Time",
    "Measures the total time elapsed from start to completion of a given \nwork item",
    "Feature lead time reduced 70% (PepsiCo) \nTime-to-market reduced from 700 to 30 days \n(Standard Bank)\nFinished 18 months sooner than predicted (Northwestern Mutual)"
   ],
   [
    "Flow Predictability",
    "Indicates how consistently the organization can meet delivery commitments",
    "50% improved service delivery predictability (SK Hynix)\n34% improvement in on-time delivery (TV Globo)\n100% delivery on commitments (Johnson Controls)"
   ],
   [
    "Release Frequency",
    "Measures how often the organization delivers value (by making functionality deployed to production available to customers/end users)",
    "Major releases come out three times more often \n(Dutch Tax Agency) \n19 times faster time to release (Murex)\nShipped more than 350 production releases in 2 years \n(Sony Interactive Entertainment)"
   ]
  ]
 },
 {
  "title": "Examples of quality key results",
  "cols": [
   "Metric",
   "Description",
   "Related Results from SAFe Customers"
  ],
  "rows": [
   [
    "Defect Rate",
    "Measures the number of defects per work item that cause rework anywhere in the delivery cycle",
    "Help desk tickets decreased by 55% (CMS) \n95% decrease in production defects (Telstra) \n40% decrease in critical and major defects (Cisco)"
   ],
   [
    "Mean Time to Restore (MTTR)",
    "Measures the amount of time a product or service is unavailable to customers",
    "Release downtime decreased from 3.5 hours to \n0.5 hour (Cerno)"
   ],
   [
    "Award/ Recognition",
    "Special recognition obtained for product or service excellence",
    "Product won industry award for 'best multi-screen experience' (Swisscom)\nFirst mission to archive a climate-monitoring satellite’s data in the cloud (NASA)"
   ]
  ]
 },
 {
  "title": "Examples of productivity key results",
  "cols": [
   "Metric",
   "Description",
   "Related Results from SAFe Customers"
  ],
  "rows": [
   [
    "Flow Velocity",
    "Measures the number of work items completed in a given time period",
    "Migrated applications to the cloud 66% – 80% sooner (Chevron)\n400% increase in ART productivity over 18 months \n(Australia Post)\nOrder processing time improved by 800% (ZKH Industrial Supply)"
   ],
   [
    "Flow Efficiency",
    "Measures how much of the overall Flow Time is spent in value-added activities versus waiting between steps",
    "SAFe teams release 20% more effectively (Air France-KLM)  \n27.5% decrease in cost per Epic (Kantar Retail) \n65% more products with the same capacity (Intel)"
   ],
   [
    "Deployment Frequency",
    "Measures how often teams successfully deploy new functionality to a production environment (Does not imply released to end-users)",
    "Deployment frequency increased from four per year to 30 per month (Allianz Global)\nDeployments increased from 1 – 2 per year to monthly \n(Standard Bank)\nHundredfold increase in yearly production deployments \n(Australia Post)"
   ]
  ]
 },
 {
  "title": "Examples of workforce engagement key results",
  "cols": [
   "Metric",
   "Description",
   "Related Results from SAFe Customers"
  ],
  "rows": [
   [
    "Employee Satisfaction",
    "Feedback that indicates the degree to which employees are happy in their roles",
    "30% happier, more motivated employees (MetLife)\n89% improvement in trust and communication \n(EdgeVerve Systems)\n95% would not want to return to the old way of working (Murex)"
   ],
   [
    "eNPS",
    "Surveys that measure the likelihood of employees recommending the company to other workers",
    "30% increase in eNPS (NTT Data)\n8.3 out of 10 participants recommend PI Planning (Swisscom)"
   ],
   [
    "Contractor/ Supplier Satisfaction",
    "Feedback that indicates the degree to which contingent workers and other external collaborators are happy in their working relationships",
    "(No specific SAFe customer examples)"
   ]
  ]
 }
];

/** What a customization can touch: aspect, kind, and the SAFe elements of that kind. */
export const ASPC_ASPECTS: Record<string, Record<string, string[]>> = {
 "People": {
  "Role": [
   "Product Owner (PO)",
   "Scrum Master/Team Coach (SM/TC)",
   "Release Train Engineer (RTE)",
   "Solution Architect",
   "Solution Train Engineer",
   "System Architect",
   "Epic Owner",
   "Enterprise Architect",
   "Business Owner"
  ],
  "Group": [
   "Portfolio Leadership",
   "Product Management",
   "Solution Management",
   "Agile Team",
   "LACE",
   "Customer"
  ]
 },
 "Work": {
  "Work Item": [
   "Stories",
   "Features",
   "Epics",
   "Capabilities",
   "Enabler"
  ],
  "Workflow": [
   "Continuous Delivery Pipeline",
   "Value Streams",
   "Portfolio Flow"
  ],
  "Work Artifact": [
   "Solution Intent",
   "Portfolio Canvas",
   "Lean Business Case",
   "Kanban Board",
   "Architectural Runway",
   "Roadmaps"
  ]
 },
 "Activities": {
  "Event": [
   "PI Planning",
   "System Demo",
   "Inspect & Adapt"
  ],
  "Practice": [
   "Design Thinking",
   "Weighted Shortest Job First (WSJF)",
   "Participatory Budgeting (PB)"
  ]
 }
};
