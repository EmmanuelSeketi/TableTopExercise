// Static content for the Incident Response Tabletop Exercise.
// All narrative, roles, timeline, injects and scoring rubric live here.

export type RoleId =
  | 'incident-commander'
  | 'soc-analyst'
  | 'it-operations'
  | 'sys-admin'
  | 'network-engineer'
  | 'comms-officer'
  | 'hr-rep'
  | 'legal-counsel'
  | 'executive'
  | 'observer'

export interface Role {
  id: RoleId
  title: string
  summary: string
  responsibilities: string[]
  decisionAuthority: string
  expectedActions: string[]
}

export interface TimelineEvent {
  id: string
  time: string // mm:ss offset label
  minute: number
  phase: string
  title: string
  detail: string
  injectId?: string
}

export interface Inject {
  id: string
  order: number
  time: string
  title: string
  phase: string
  description: string
  evidence: string
  choices: {
    id: string
    label: string
    type: 'correct' | 'neutral' | 'wrong'
  }[]
  facilitatorNotes: string
  hint: string
  mitre?: string
  nist: string
}

export interface ScoreCategory {
  id: string
  label: string
  description: string
}

export interface DiscussionQuestion {
  id: string
  question: string
}

export const EXERCISE_META = {
  defaultTitle: 'Operation Ledger Lock — Ransomware Tabletop',
  defaultOrg: 'Meridian Financial Group',
  defaultFacilitator: 'A. Rivera, CISM',
  defaultDurationMinutes: 60,
}

export const OBJECTIVES: string[] = [
  'Validate the organization’s incident response plan against a realistic ransomware scenario.',
  'Exercise cross-functional coordination between technical, executive, legal and communications teams.',
  'Assess detection, containment, eradication and recovery decision-making under time pressure.',
  'Identify gaps in playbooks, tooling, escalation paths and regulatory notification procedures.',
  'Strengthen muscle memory for evidence preservation and stakeholder communication.',
]

export const SCOPE = {
  inScope: [
    'Corporate IT environment (Windows domain, file servers, endpoints)',
    'Incident response, escalation and internal communications processes',
    'Executive decision-making and legal/regulatory obligations',
    'Business continuity and recovery prioritization',
  ],
  outOfScope: [
    'Live changes to production systems',
    'Actual notification to regulators, customers or media',
    'Penetration testing or technical exploitation',
    'Personnel performance evaluations',
  ],
}

export const RULES_OF_ENGAGEMENT: string[] = [
  'This is a no-fault learning environment — focus on process, not blame.',
  'Decisions are made based only on information available at each inject.',
  '“Play the plan”: reference real playbooks and contacts where possible.',
  'The facilitator controls pacing and may inject additional complications.',
  'All discussion is confidential and for training purposes only.',
  'When unsure, state your assumption and proceed — document it in the decision log.',
]

export const SUCCESS_CRITERIA: string[] = [
  'Incident is detected and formally declared within the first 15 minutes.',
  'A clear Incident Commander is established and coordinating response.',
  'Containment actions are proposed before lateral movement completes.',
  'Legal, regulatory and communications workstreams activate in parallel.',
  'Recovery is prioritized by business impact with executive sign-off.',
  'Decisions and rationale are captured for the After Action Report.',
]

export const EXPECTED_OUTCOMES: string[] = [
  'A documented decision log covering the full incident lifecycle.',
  'A scored assessment across ten response competencies.',
  'A prioritized list of remediation actions with owners and due dates.',
  'Shared understanding of roles and escalation among participants.',
]

export const PARTICIPANTS = [
  { name: 'Incident Commander', count: 1 },
  { name: 'SOC / Security Analysts', count: 2 },
  { name: 'IT Operations & SysAdmin', count: 2 },
  { name: 'Network Engineering', count: 1 },
  { name: 'Communications / PR', count: 1 },
  { name: 'HR Representative', count: 1 },
  { name: 'Legal Counsel', count: 1 },
  { name: 'Executive Leadership', count: 1 },
  { name: 'Observers / Evaluators', count: 2 },
]

export const SCENARIO = {
  title: 'Operation Ledger Lock',
  classification: 'Simulated — Training Use Only',
  initialSituation: `It is 09:14 on a Tuesday. Dana Whitfield, a senior accountant in the Finance department at Meridian Financial Group, receives an email that appears to come from a known vendor. The subject line reads "Updated Q3 Invoice — Action Required" and includes an Excel attachment, "Invoice_Q3_Reconciliation.xlsm".

Dana opens the attachment and enables macros when prompted by a convincing document that claims to require them to "display protected content". The macro silently downloads and executes a loader. Within minutes, a foothold is established on Dana's workstation, and the attacker begins reconnaissance of the internal network.

Over the next hour, the intrusion escalates from a single compromised endpoint into an enterprise-wide ransomware event affecting the finance file server and disrupting business operations.`,

  threatIntelligence: `The tradecraft is consistent with a financially-motivated ransomware affiliate group tracked internally as "GhostLedger". Known characteristics:

• Initial access via phishing with macro-enabled Office documents.
• Use of living-off-the-land binaries (LOLBins) such as PowerShell and rundll32 to evade detection.
• Credential harvesting with tooling similar to Mimikatz, followed by lateral movement over SMB and RDP.
• Data exfiltration to attacker-controlled cloud storage prior to encryption ("double extortion").
• Deployment of ransomware via scheduled tasks and Group Policy where domain admin is obtained.
• Typical dwell time before encryption: 45–90 minutes in fast operations.`,

  businessImpact: `Meridian Financial Group processes payroll and client reconciliations for over 400 corporate clients. A prolonged outage of the finance file server halts month-end close, delays client reporting, and risks breach of contractual SLAs. Regulatory exposure includes potential notification obligations under GDPR (EU client data), GLBA, and state breach notification laws. Reputational damage and client churn are significant secondary risks. Estimated cost of downtime: $85,000 per hour.`,
}

export const DISCUSSION_QUESTIONS: DiscussionQuestion[] = [
  { id: 'dq1', question: 'At what point should this be formally declared a security incident, and who makes that call?' },
  { id: 'dq2', question: 'What immediate containment actions can be taken without destroying forensic evidence?' },
  { id: 'dq3', question: 'How do we balance isolating systems against maintaining critical business operations?' },
  { id: 'dq4', question: 'When and how do we engage legal counsel, cyber insurance, and law enforcement?' },
  { id: 'dq5', question: 'What are our regulatory notification obligations and their timelines?' },
  { id: 'dq6', question: 'Do we have viable, tested backups? How do we verify they are not also encrypted?' },
  { id: 'dq7', question: 'What is our position on paying the ransom, and who has authority to decide?' },
  { id: 'dq8', question: 'How and when do we communicate to employees, clients, and the media?' },
]

export const ROLES: Role[] = [
  {
    id: 'incident-commander',
    title: 'Incident Commander',
    summary: 'Owns the overall response, coordinates all workstreams, and is the single point of decision authority during the incident.',
    responsibilities: [
      'Declare the incident and establish command structure.',
      'Coordinate technical, communications, legal and executive workstreams.',
      'Maintain the master incident timeline and status.',
      'Approve major containment, eradication and recovery actions.',
    ],
    decisionAuthority: 'Full tactical authority to direct response actions; escalates strategic/financial decisions to Executive Leadership.',
    expectedActions: [
      'Convene the response team and assign roles.',
      'Set response objectives and cadence for status updates.',
      'Track and prioritize open decisions and action items.',
    ],
  },
  {
    id: 'soc-analyst',
    title: 'SOC Analyst',
    summary: 'Front-line detection and analysis. Triages alerts, investigates indicators, and scopes the intrusion.',
    responsibilities: [
      'Triage EDR/SIEM alerts and confirm true positives.',
      'Scope affected hosts, accounts and indicators of compromise.',
      'Preserve logs and forensic artifacts.',
      'Recommend detection-based containment (isolate hosts, disable accounts).',
    ],
    decisionAuthority: 'Authority to isolate endpoints and flag accounts per playbook; escalates domain-wide actions to IC.',
    expectedActions: [
      'Build and maintain the IOC list.',
      'Correlate alerts to reconstruct the attack chain.',
      'Advise IC on blast radius and confidence levels.',
    ],
  },
  {
    id: 'it-operations',
    title: 'IT Operations',
    summary: 'Keeps business services running and executes operational response actions across infrastructure.',
    responsibilities: [
      'Assess impact to business-critical services.',
      'Execute containment (network segmentation, service isolation).',
      'Coordinate restoration of services with recovery priorities.',
    ],
    decisionAuthority: 'Authority over operational infrastructure changes within change-management guardrails; major outages require IC approval.',
    expectedActions: [
      'Map affected services to business functions.',
      'Prepare and validate recovery runbooks.',
      'Communicate service status to the response team.',
    ],
  },
  {
    id: 'sys-admin',
    title: 'System Administrator',
    summary: 'Manages servers, identities and backups; central to containment and recovery of encrypted systems.',
    responsibilities: [
      'Assess Active Directory and privileged account exposure.',
      'Verify integrity and availability of backups.',
      'Rebuild and restore compromised systems.',
    ],
    decisionAuthority: 'Authority to reset credentials and rotate secrets; backup restore decisions coordinated with IC and IT Ops.',
    expectedActions: [
      'Force-reset potentially compromised privileged accounts.',
      'Confirm backups are offline/immutable and uninfected.',
      'Prepare clean rebuild images.',
    ],
  },
  {
    id: 'network-engineer',
    title: 'Network Engineer',
    summary: 'Controls the network fabric used for containment, monitoring and blocking attacker infrastructure.',
    responsibilities: [
      'Implement network segmentation and isolation.',
      'Block malicious IPs/domains at the firewall and proxy.',
      'Capture and analyze network traffic for exfiltration.',
    ],
    decisionAuthority: 'Authority to apply firewall/ACL changes for containment; wide blocks affecting business coordinated with IT Ops.',
    expectedActions: [
      'Isolate affected VLANs / segments.',
      'Block C2 and exfiltration destinations.',
      'Provide netflow evidence of data movement.',
    ],
  },
  {
    id: 'comms-officer',
    title: 'Communications Officer',
    summary: 'Owns internal and external messaging, media relations and stakeholder communication.',
    responsibilities: [
      'Draft holding statements and stakeholder updates.',
      'Manage media inquiries and public messaging.',
      'Coordinate messaging with Legal and Executives.',
    ],
    decisionAuthority: 'Authority to issue approved internal communications; external/media statements require Executive and Legal sign-off.',
    expectedActions: [
      'Prepare an approved holding statement early.',
      'Establish a single source of truth for updates.',
      'Log all external inquiries.',
    ],
  },
  {
    id: 'hr-rep',
    title: 'HR Representative',
    summary: 'Manages employee-facing impacts, including the affected employee and workforce communications.',
    responsibilities: [
      'Support affected employees (e.g., the phishing victim) without blame.',
      'Advise on workforce communications and policy.',
      'Coordinate any personnel or access changes.',
    ],
    decisionAuthority: 'Advisory on personnel matters; enacts HR policy in coordination with Legal and Leadership.',
    expectedActions: [
      'Ensure the phishing victim is supported, not punished.',
      'Prepare employee guidance and awareness reminders.',
    ],
  },
  {
    id: 'legal-counsel',
    title: 'Legal Counsel',
    summary: 'Advises on legal risk, regulatory obligations, privilege, insurance and law enforcement engagement.',
    responsibilities: [
      'Determine regulatory notification obligations and deadlines.',
      'Establish legal privilege over investigation materials.',
      'Engage cyber insurance and, if appropriate, law enforcement.',
      'Advise on ransom payment legality and sanctions risk.',
    ],
    decisionAuthority: 'Authority over legal strategy and privilege; notification decisions made jointly with Executives.',
    expectedActions: [
      'Open a privileged workstream for the investigation.',
      'Track notification clocks (GDPR 72h, state laws).',
      'Contact cyber insurer per policy requirements.',
    ],
  },
  {
    id: 'executive',
    title: 'Executive Leadership',
    summary: 'Provides strategic direction, approves major financial and risk decisions, and owns organizational risk.',
    responsibilities: [
      'Approve budget and resources for response and recovery.',
      'Make strategic decisions (ransom, business continuity trade-offs).',
      'Serve as ultimate accountable owner to the board and clients.',
    ],
    decisionAuthority: 'Final authority on strategic, financial and reputational decisions.',
    expectedActions: [
      'Receive concise, decision-oriented briefings.',
      'Set risk tolerance and approve major actions.',
      'Champion business continuity priorities.',
    ],
  },
  {
    id: 'observer',
    title: 'Observer / Evaluator',
    summary: 'Neutral evaluator who records observations, decisions and timing without participating in the response.',
    responsibilities: [
      'Document decisions, timing and communication quality.',
      'Note gaps, strengths and areas for improvement.',
      'Contribute findings to the After Action Report.',
    ],
    decisionAuthority: 'None — strictly observational.',
    expectedActions: [
      'Capture the decision log objectively.',
      'Score competencies against the rubric.',
    ],
  },
].filter((r) => r.summary !== '') as Role[]

export const TIMELINE: TimelineEvent[] = [
  { id: 't00', time: '00:00', minute: 0, phase: 'Preparation', title: 'Exercise begins', detail: 'Facilitator briefs participants, confirms roles, and establishes ground rules. The clock starts.' },
  { id: 't05', time: '05:00', minute: 5, phase: 'Detection', title: 'Suspicious login detected', detail: 'A SIEM correlation rule fires on an anomalous authentication from a finance workstation to a domain controller.', injectId: 'inj1' },
  { id: 't10', time: '10:00', minute: 10, phase: 'Detection', title: 'EDR alert raised', detail: 'Endpoint Detection & Response flags PowerShell spawning from Excel with encoded commands.', injectId: 'inj2' },
  { id: 't15', time: '15:00', minute: 15, phase: 'Analysis', title: 'Malware execution confirmed', detail: 'Analysts confirm a malicious loader executed via a macro-enabled attachment. Incident is candidate for declaration.', injectId: 'inj3' },
  { id: 't20', time: '20:00', minute: 20, phase: 'Containment', title: 'File server unavailable', detail: 'The finance file server stops responding. Users report files becoming inaccessible.', injectId: 'inj4' },
  { id: 't25', time: '25:00', minute: 25, phase: 'Containment', title: 'Customer complaints begin', detail: 'The service desk receives calls from clients unable to access scheduled reports.', injectId: 'inj5' },
  { id: 't30', time: '30:00', minute: 30, phase: 'Analysis', title: 'Ransom note discovered', detail: 'A ransom note appears on multiple systems demanding payment in cryptocurrency within 72 hours.', injectId: 'inj6' },
  { id: 't35', time: '35:00', minute: 35, phase: 'Communication', title: 'Media inquiry received', detail: 'A journalist emails asking to confirm reports of an outage affecting client services.', injectId: 'inj7' },
  { id: 't40', time: '40:00', minute: 40, phase: 'Communication', title: 'Regulatory notification discussion', detail: 'Legal raises potential GDPR/GLBA notification obligations given evidence of data exfiltration.', injectId: 'inj8' },
  { id: 't45', time: '45:00', minute: 45, phase: 'Communication', title: 'Executive briefing', detail: 'Leadership convenes for a decision on ransom, recovery strategy and public messaging.', injectId: 'inj9' },
  { id: 't50', time: '50:00', minute: 50, phase: 'Recovery', title: 'Recovery planning', detail: 'Team validates backups and prioritizes restoration of business-critical services.', injectId: 'inj10' },
  { id: 't55', time: '55:00', minute: 55, phase: 'Post-Incident', title: 'Lessons learned discussion', detail: 'Facilitator leads a hotwash to capture immediate observations and improvements.', injectId: 'inj11' },
  { id: 't60', time: '60:00', minute: 60, phase: 'Post-Incident', title: 'Exercise ends', detail: 'Exercise concludes. Participants complete scoring and the After Action Report is generated.', injectId: 'inj12' },
]

export const INJECTS: Inject[] = (await import('@/data/injects.json')).default

export const SCORE_CATEGORIES: ScoreCategory[] = [
  { id: 'detection', label: 'Incident Detection', description: 'Speed and accuracy of identifying the intrusion.' },
  { id: 'escalation', label: 'Escalation', description: 'Timeliness and appropriateness of escalation and declaration.' },
  { id: 'communication', label: 'Communication', description: 'Clarity and discipline of internal and external messaging.' },
  { id: 'technical', label: 'Technical Response', description: 'Effectiveness of containment, eradication and forensics.' },
  { id: 'leadership', label: 'Leadership', description: 'Command structure, coordination and decision-making.' },
  { id: 'documentation', label: 'Documentation', description: 'Quality and completeness of the decision log and evidence.' },
  { id: 'risk', label: 'Risk Management', description: 'Sound, risk-based trade-offs under uncertainty.' },
  { id: 'regulatory', label: 'Regulatory Compliance', description: 'Awareness and handling of legal/notification obligations.' },
  { id: 'continuity', label: 'Business Continuity', description: 'Protection and prioritization of critical business functions.' },
  { id: 'recovery', label: 'Recovery Planning', description: 'Backup verification and safe, prioritized restoration.' },
]

export interface FrameworkRef {
  framework: string
  mapping: { label: string; detail: string }[]
}

export const FRAMEWORK_MAPPINGS: FrameworkRef[] = [
  {
    framework: 'NIST SP 800-61 Incident Response Lifecycle',
    mapping: [
      { label: 'Preparation', detail: 'Roles, playbooks, ground rules established at 00:00.' },
      { label: 'Detection & Analysis', detail: 'Injects 1–3: SIEM/EDR alerts, malware confirmation.' },
      { label: 'Containment, Eradication & Recovery', detail: 'Injects 4–6, 9–10: isolation, ransom, backups.' },
      { label: 'Post-Incident Activity', detail: 'Injects 7–8, 11–12: comms, regulatory, hotwash.' },
    ],
  },
  {
    framework: 'MITRE ATT&CK',
    mapping: [
      { label: 'Initial Access (T1566.001)', detail: 'Spearphishing attachment with macro.' },
      { label: 'Execution (T1059.001)', detail: 'PowerShell spawned from Excel.' },
      { label: 'Valid Accounts (T1078)', detail: 'Compromised service account.' },
      { label: 'Scheduled Task (T1053.005)', detail: 'Persistence / ransomware staging.' },
      { label: 'Impact (T1486)', detail: 'Data encrypted for impact.' },
    ],
  },
  {
    framework: 'ISO/IEC 27035',
    mapping: [
      { label: 'Plan & Prepare', detail: 'IR policy and readiness (exercise premise).' },
      { label: 'Detection & Reporting', detail: 'Alert triage and incident declaration.' },
      { label: 'Assessment & Decision', detail: 'Scoping, severity and response decisions.' },
      { label: 'Responses', detail: 'Containment through recovery activities.' },
      { label: 'Lessons Learned', detail: 'Hotwash and After Action Report.' },
    ],
  },
]

export interface ScoreBand {
  min: number
  label: string
  tone: 'success' | 'primary' | 'accent' | 'warning' | 'destructive'
  summary: string
}

// Percentage-based performance bands
export const SCORE_BANDS: ScoreBand[] = [
  { min: 90, label: 'Excellent', tone: 'success', summary: 'Mature, well-coordinated response with strong decision-making across all workstreams.' },
  { min: 75, label: 'Good', tone: 'primary', summary: 'Effective response with solid fundamentals and minor gaps to refine.' },
  { min: 60, label: 'Satisfactory', tone: 'accent', summary: 'Adequate response; several processes need strengthening and practice.' },
  { min: 40, label: 'Needs Improvement', tone: 'warning', summary: 'Notable gaps in coordination, process or decision-making require attention.' },
  { min: 0, label: 'Poor', tone: 'destructive', summary: 'Significant weaknesses across the response; prioritize plan, training and tooling.' },
]

export function getScoreBand(percentage: number): ScoreBand {
  return SCORE_BANDS.find((b) => percentage >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
}

export const NAV_PHASES = ['Preparation', 'Detection', 'Analysis', 'Containment', 'Communication', 'Recovery', 'Post-Incident'] as const
