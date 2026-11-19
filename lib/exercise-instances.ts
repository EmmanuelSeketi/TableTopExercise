import {
  EXERCISE_META,
  INJECTS as MERIDIAN_INJECTS,
  ROLES as MERIDIAN_ROLES,
  SCENARIO as MERIDIAN_SCENARIO,
  TIMELINE as MERIDIAN_TIMELINE,
  type Inject,
  type Role,
  type TimelineEvent,
} from './exercise-data'

export interface ExerciseDefinition {
  id: string
  title: string
  organization: string
  durationMinutes: number
  audience: string
  scenario: {
    title: string
    initialSituation: string
  }
  injects: Inject[]
  roles: Role[]
  timeline: TimelineEvent[]
  sessionFlow?: SessionFlowStep[]
  closingQuestions?: string[]
  exerciseBoundary?: string
}

export interface SessionFlowStep {
  time: string
  activity: string
}

export const EXERCISE_IDS = {
  meridian: 'meridian',
  mimosaTechnical: 'mimosa-technical',
  mimosaManagement: 'mimosa-management',
} as const

const mimosaRoles: Role[] = [
  {
    id: 'ict-manager',
    title: 'ICT Manager',
    summary: 'Coordinates technical response and advises authorised continuity decision-makers.',
    responsibilities: ['Assess impact and urgency.', 'Coordinate technical and operational workstreams.', 'Escalate risks and recovery options.'],
    decisionAuthority: 'Recommends technical actions and escalates continuity decisions to authorised leaders.',
    expectedActions: ['Set incident priorities.', 'Provide decision-ready status updates.', 'Track the recovery target and unresolved risks.'],
  },
  {
    id: 'ict-officer',
    title: 'ICT Officer',
    summary: 'Supports incident logging, evidence gathering and coordinated ICT checks.',
    responsibilities: ['Record reports and technical observations.', 'Gather approved monitoring and service information.', 'Keep the incident record and status updates current.'],
    decisionAuthority: 'Performs checks and actions within assigned responsibilities and approved procedures.',
    expectedActions: ['Correlate user reports.', 'Preserve relevant incident details.', 'Escalate verified findings and changes in impact.'],
  },
  {
    id: 'network-telecommunications',
    title: 'Network & Telecommunications',
    summary: 'Investigates connectivity and voice services while protecting live safety-dependent channels.',
    responsibilities: ['Assess affected paths and services.', 'Preserve relevant evidence.', 'Test recovery options before live changes.'],
    decisionAuthority: 'Technical changes follow approved change and safety controls.',
    expectedActions: ['Correlate network alarms.', 'Verify alternative routes.', 'Perform end-to-end restoration checks.'],
  },
  {
    id: 'engineering-electrical',
    title: 'Engineering / Electrical',
    summary: 'Assesses power quality and equipment conditions alongside ICT.',
    responsibilities: ['Investigate power-quality alarms.', 'Coordinate safe technical tests.', 'Confirm equipment conditions.'],
    decisionAuthority: 'Approves engineering work within established operational controls.',
    expectedActions: ['Share verified readings.', 'Assess risks of equipment changes.', 'Confirm corrective work.'],
  },
  {
    id: 'mine-control',
    title: 'Mine Control / Mining Operations',
    summary: 'Assesses operating impact and communications needed for safe work.',
    responsibilities: ['Identify affected work areas.', 'Confirm operational communication needs.', 'Coordinate any work restrictions.'],
    decisionAuthority: 'Operational decisions remain with authorised Mining and Safety personnel.',
    expectedActions: ['Report service availability.', 'Validate communications where work occurs.', 'Confirm safe resumption.'],
  },
  {
    id: 'safety-hse',
    title: 'Safety / HSE',
    summary: 'Advises on safety-dependent communications and operational restrictions.',
    responsibilities: ['Assess exposure from unreliable communications.', 'Verify fallback arrangements.', 'Advise on safe resumption.'],
    decisionAuthority: 'Safety advice and approvals follow site procedures.',
    expectedActions: ['Identify required safety controls.', 'Validate fallback coverage.', 'Confirm residual risks are communicated.'],
  },
  {
    id: 'security',
    title: 'Security',
    summary: 'Advises on security implications and protects relevant information during the incident.',
    responsibilities: ['Assess security concerns related to affected systems.', 'Preserve relevant security observations and records.', 'Coordinate security advice with ICT and site teams.'],
    decisionAuthority: 'Provides security advice and acts within approved site procedures.',
    expectedActions: ['Report relevant security indicators.', 'Help protect incident records.', 'Escalate security risks and unresolved concerns.'],
  },
  {
    id: 'bcms',
    title: 'BCMS Representative',
    summary: 'Supports continuity escalation and records decisions against recovery objectives.',
    responsibilities: ['Track business continuity implications.', 'Support escalation to authorised decision-makers.', 'Capture lessons and follow-up actions.'],
    decisionAuthority: 'Supports continuity decisions made by authorised management.',
    expectedActions: ['Track the four-hour recovery target.', 'Record options and assumptions.', 'Support after-action review.'],
  },
]

const mimosaInjects: Inject[] = [
  {
    id: 'mimosa-tech-1', order: 1, time: '08:15', phase: 'Identification, logging and prioritisation',
    nist: 'Detection & Prioritisation', title: 'A communication failure is reported',
    description: 'The opening incident has been escalated to ICT. Several underground IP telephone extensions are failing, and connectivity to one working section is intermittent. Other parts of the mine still have service; the cause is unknown.',
    evidence: 'Multiple related Helpdesk reports. A shift supervisor confirms unreliable contact with the control room. No injury or confirmed loss of gas detection or ventilation control has been reported.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Begin troubleshooting the suspected network device immediately, and open an incident ticket after the root cause is confirmed.' },
      { id: 'b', type: 'correct', label: 'Log and assess the incident across affected voice and safety-dependent processes; classify its impact and urgency, notify the ICT Manager and control room, and start targeted checks.' },
      { id: 'c', type: 'wrong', label: 'Declare a disaster immediately because the BIA classifies telephony as a critical service.' },
      { id: 'd', type: 'wrong', label: 'Ask supervisors to use handheld radios while ICT treats the incident as a minor IP-telephone fault until more users complain.' },
    ],
    facilitatorNotes: 'Look for a coordinated incident record, impact assessment and parallel technical checks.',
    hint: 'Establish what is affected and what remains available before classifying the response.',
    discussionPoints: [
      { role: 'ICT Manager', prompt: 'How will you classify the incident, coordinate the initial checks and communicate the confirmed impact?' },
      { role: 'Mine Control / Mining Operations', prompt: 'Which work areas and safety-dependent activities could be affected, and what information do supervisors need now?' },
      { role: 'Safety / HSE', prompt: 'What immediate risks or operating restrictions should be considered while communications remain unreliable?' },
    ],
  },
  {
    id: 'mimosa-tech-2', order: 2, time: '08:45', phase: 'Assessment and safe containment',
    nist: 'Assessment & Safe Operations', title: 'The safety-critical question',
    description: 'The issue continues. Handheld radio contact has worked intermittently, but reliable two-way coverage has not been confirmed throughout the affected section. Engineering reports a power-quality alarm near a communications distribution point; its relationship to the outage is unknown. The control room asks whether scheduled work should continue.',
    evidence: 'Radio coverage is unverified in parts of the affected area. An associated power-quality alarm is under investigation.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Proceed using the available radios, because at least some voice traffic is getting through.' },
      { id: 'b', type: 'wrong', label: 'Ask the mine to suspend all activities at every site until the underground communication issue is resolved.' },
      { id: 'c', type: 'correct', label: 'Work with Mining and Safety to verify reliable alternative communications and monitoring, recommend restrictions for activities that cannot be safely supported, and continue controlled technical checks.' },
      { id: 'd', type: 'wrong', label: 'Disconnect the affected network and radio channels immediately so that the fault cannot spread.' },
    ],
    facilitatorNotes: 'Discuss fallback coverage, operational restrictions and non-disruptive investigation.',
    hint: 'An alternative is only a fallback after the relevant coverage and safety needs are verified.',
    discussionPoints: [
      { role: 'Safety / HSE', prompt: 'What must be verified before handheld radios can be treated as a safe alternative throughout the affected section?' },
      { role: 'Mine Control / Mining Operations', prompt: 'Which activities should be restricted until communication and monitoring needs are reliably supported?' },
      { role: 'Network & Telecommunications', prompt: 'How can the team test coverage and continue diagnosis without disrupting remaining services?' },
    ],
  },
  {
    id: 'mimosa-tech-3', order: 3, time: '09:50', phase: 'Investigation and root-cause control',
    nist: 'Investigation & Controlled Recovery', title: 'Power alarms, intermittent links',
    description: 'Monitoring shows repeated link instability on the affected communications path. Engineering confirms that the power-quality alarm needs further investigation, but no root cause is verified. A technician proposes restarting equipment; another suggests a possible alternative route whose capacity and suitability have not been checked. Other mine voice services remain available.',
    evidence: 'Repeated link instability on the affected path; power-quality alarm under investigation; proposed restart and alternate route are unvalidated.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Restart the affected communications equipment immediately; a quick reboot is the fastest way to restore service.' },
      { id: 'b', type: 'wrong', label: 'Assume the power alarm is the root cause and replace power equipment before reviewing the network evidence.' },
      { id: 'c', type: 'correct', label: 'Correlate network and power alarms, capture incident evidence, test affected paths safely with Engineering, and assess any alternative route before changing the live network.' },
      { id: 'd', type: 'wrong', label: 'Restore the telephony servers from backup at the disaster recovery site, regardless of whether server failure is indicated.' },
    ],
    facilitatorNotes: 'Explore evidence-led diagnosis, safe testing and the risk of unvalidated live changes.',
    hint: 'A coincident alarm is not proof of cause; distinguish path instability from server failure.',
    discussionPoints: [
      { role: 'Network & Telecommunications', prompt: 'What evidence would help distinguish power-related faults from instability on the communications path?' },
      { role: 'Engineering / Electrical', prompt: 'Which power-quality checks can be performed safely, and what would confirm whether the alarm is related?' },
      { role: 'ICT Manager', prompt: 'What approvals, rollback plans and service checks are needed before testing a restart or alternate route?' },
    ],
  },
  {
    id: 'mimosa-tech-4', order: 4, time: '11:35', phase: 'Escalation and recovery decision',
    nist: 'Escalation & Recovery Decision', title: 'The recovery deadline is approaching',
    description: 'Communication remains unreliable in the affected section almost four hours after the first failure. A limited workaround has been identified, but its ability to support safety-dependent communications has not been validated. The BIA records a recovery target of four hours or less for telephone services supporting critical activities. ICT cannot confidently promise recovery before the target.',
    evidence: 'Recovery target: four hours or less. Full recovery before the target is uncertain; a workaround remains unvalidated.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Implement the untested workaround immediately to meet the four-hour target and explain the risks to management afterwards.' },
      { id: 'b', type: 'correct', label: 'Provide the ICT Manager and authorised continuity decision-makers with verified impact, time-to-target, safe options and unresolved risks; continue only approved measures and restrictions.' },
      { id: 'c', type: 'wrong', label: 'Continue troubleshooting until the target has been missed, because escalation is necessary only after four hours have elapsed.' },
      { id: 'd', type: 'wrong', label: 'Activate the entire disaster recovery site as soon as a critical telephony RTO is threatened.' },
    ],
    facilitatorNotes: 'Escalate before a likely target breach with verified information and feasible, approved options.',
    hint: 'A recovery target is not a reason to deploy an unvalidated workaround.',
    discussionPoints: [
      { role: 'ICT Manager', prompt: 'What verified impact, time-to-target, recovery options and unresolved risks should be escalated now?' },
      { role: 'BCMS Representative', prompt: 'Which authorised decision-makers need to be involved before the recovery target is missed?' },
      { role: 'Safety / HSE', prompt: 'What safety restrictions must remain in place while the proposed workaround is unvalidated?' },
    ],
  },
  {
    id: 'mimosa-tech-5', order: 5, time: '12:20', phase: 'Verification, restoration and review',
    nist: 'Verification & Restoration', title: 'Service returns — is the mine ready?',
    description: 'Engineering and ICT have corrected a simulated power-supply fault affecting communications distribution equipment. Dashboards show connectivity and several test calls succeed. One underground extension remains unverified, a supervisor reports an intermittent call, and the control-room team has not signed off. The four-hour target has been exceeded.',
    evidence: 'Connectivity dashboard green; several successful test calls; one extension unverified; intermittent call reported; operational sign-off pending.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Close the ticket now because the network dashboard is green and the equipment has been repaired.' },
      { id: 'b', type: 'wrong', label: 'Resume all affected work once one successful underground-to-surface test call has been made, then monitor for recurrence.' },
      { id: 'c', type: 'correct', label: 'Complete end-to-end service and business-user checks with the control room and affected teams; confirm safe resumption, communicate residual issues, record the missed recovery target and conduct the incident review.' },
      { id: 'd', type: 'wrong', label: 'Wait for a supplier’s written incident report before testing or communicating restoration.' },
    ],
    facilitatorNotes: 'Verify at the user locations, coordinate safe resumption, record the recovery-target breach and capture actions.',
    hint: 'A green dashboard and a successful test call do not confirm service across all affected locations.',
    discussionPoints: [
      { role: 'Network & Telecommunications', prompt: 'Which end-to-end tests are needed to verify every affected extension and communications path?' },
      { role: 'Mine Control / Mining Operations', prompt: 'What confirmation is needed from supervisors before affected work can safely resume?' },
      { role: 'BCMS Representative', prompt: 'How should the team record the missed recovery target, residual issues and improvement actions?' },
    ],
  },
]

const mimosaTimeline: TimelineEvent[] = mimosaInjects.map((inject, index) => ({
  id: `mimosa-t${index + 1}`,
  time: ['05:00', '15:00', '26:00', '37:00', '49:00'][index],
  minute: [5, 15, 26, 37, 49][index],
  phase: inject.phase,
  title: inject.title,
  detail: inject.description,
  injectId: inject.id,
}))

const mimosaManagementRoles: Role[] = [
  {
    id: 'general-manager', title: 'General Manager / Managing Director',
    summary: 'Makes authorised business continuity and resource decisions.',
    responsibilities: ['Set continuity priorities.', 'Authorise business continuity measures.', 'Approve controlled resource commitments.'],
    decisionAuthority: 'Authorised leader for strategic continuity decisions.',
    expectedActions: ['Set a timely decision checkpoint.', 'Balance operational, safety and control risks.', 'Approve resumption and stand-down decisions.'],
  },
  {
    id: 'bcms-lead', title: 'BCMS Lead',
    summary: 'Advises management on continuity plans, recovery targets and decision records.',
    responsibilities: ['Track BIA recovery objectives.', 'Advise on continuity activation.', 'Record decisions and follow-up actions.'],
    decisionAuthority: 'Advisory role; continuity activation rests with authorised management.',
    expectedActions: ['Identify the relevant RTO and MTD.', 'Present options and assumptions.', 'Capture lessons and improvement owners.'],
  },
  {
    id: 'management-ict', title: 'ICT Manager',
    summary: 'Reports technical status, supplier information and feasible recovery options.',
    responsibilities: ['Confirm technical scope and local checks.', 'Escalate with Microsoft.', 'Explain uncertainties and limits of local recovery.'],
    decisionAuthority: 'Recommends technical actions; management authorises business continuity decisions.',
    expectedActions: ['Provide verified updates.', 'Clarify what is within Mimosa’s control.', 'Validate service restoration with ICT checks.'],
  },
  {
    id: 'supply-chain', title: 'Supply Chain',
    summary: 'Explains procurement impact and proposes controlled purchasing alternatives.',
    responsibilities: ['Identify critical procurements.', 'Propose safe and authorised workarounds.', 'Maintain procurement records for reconciliation.'],
    decisionAuthority: 'Operates within delegated procurement authority and approved controls.',
    expectedActions: ['Identify urgent requirements.', 'Document workaround approvals.', 'Reconcile transactions after restoration.'],
  },
  {
    id: 'finance', title: 'Finance',
    summary: 'Assesses payment processing impact, financial controls and reconciliation needs.',
    responsibilities: ['Identify affected finance processes.', 'Protect payment and approval controls.', 'Reconcile outstanding or duplicate transactions.'],
    decisionAuthority: 'Approves financial processes within delegated authority.',
    expectedActions: ['Assess payment delays.', 'Specify control requirements.', 'Validate the finance transaction backlog.'],
  },
  {
    id: 'maintenance-mining', title: 'Maintenance / Mining Operations',
    summary: 'Identifies operational decisions affected by missing maintenance and procurement records.',
    responsibilities: ['Identify critical maintenance dependencies.', 'Assess operational consequences of delays.', 'Validate readiness to resume affected workflows.'],
    decisionAuthority: 'Operational decisions follow site safety and approval procedures.',
    expectedActions: ['Prioritise equipment needs.', 'Identify work that can continue safely.', 'Reconcile maintenance records after restoration.'],
  },
]

const mimosaManagementInjects: Inject[] = [
  {
    id: 'mimosa-management-1', order: 1, time: '08:30', phase: 'Identification, logging and prioritisation',
    nist: 'Identification & Prioritisation', title: 'Initial incident and escalation',
    description: 'It is Friday morning at Mimosa Mine. Since 08:00, departments have reported difficulty accessing Microsoft Dynamics 365. Procurement transactions, maintenance records and some payment processing are affected. Mimosa’s internal network appears to be working normally, and Microsoft has reported a wider service disruption without an estimated restoration time. At 08:30, the ICT Manager escalates the issue to management.',
    evidence: 'Supply Chain cannot process procurement transactions; Plant and Maintenance cannot update records or process some equipment transactions; Finance reports payment-processing difficulties. Microsoft has no restoration estimate.',
    choices: [
      { id: 'a', type: 'neutral', label: 'Direct ICT to continue supplier escalation and provide hourly status updates; reconsider business impact when a restoration estimate is available.' },
      { id: 'b', type: 'correct', label: 'Request ICT’s verified impact, urgency, classification and supplier status; ask process owners to identify critical activities and recovery targets, and set a prompt management decision checkpoint.' },
      { id: 'c', type: 'wrong', label: 'Allow all affected departments to begin temporary manual processing immediately, with records to be reconciled when Dynamics 365 is restored.' },
      { id: 'd', type: 'wrong', label: 'Ask the General Manager to activate the full Business Continuity Plan immediately because Dynamics 365 is classified as P1 — Critical.' },
    ],
    facilitatorNotes: 'Confirm impact and urgency with ICT and process owners, then set a timely management decision point.',
    hint: 'Establish impact, process dependencies and recovery targets before deciding on continuity measures.',
    discussionPoints: [
      { role: 'ICT', prompt: 'What is known about the outage, how widespread does it appear, and what remains to be established?' },
      { role: 'Supply Chain, Maintenance and Finance', prompt: 'Where is the disruption affecting work, and how long can you manage before important decisions are delayed?' },
      { role: 'Management', prompt: 'What should happen in the next 30 minutes, and who needs to be kept informed?' },
    ],
  },
  {
    id: 'mimosa-management-2', order: 2, time: '10:15', phase: 'Investigation and operational exposure',
    nist: 'Investigation & Context-Specific Containment', title: 'Investigation and operational exposure',
    description: 'The Dynamics 365 disruption continues, with no reliable restoration estimate from Microsoft. A critical maintenance activity is awaiting spare-parts availability and an urgent procurement approval. ICT reports no evidence of a local network failure. The exact duration of the supplier-side problem is unknown.',
    evidence: 'Supplier-side disruption is reported; local network checks show no failure; time to restore is unknown. A maintenance activity and urgent procurement approval are affected.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Prepare the local disaster recovery infrastructure to restore Dynamics 365 from the latest backups while Microsoft continues its investigation.' },
      { id: 'b', type: 'correct', label: 'Have ICT and process owners establish what is affected, confirm the supplier-side evidence, identify safety and business consequences, and verify whether any approved fallback can actually operate.' },
      { id: 'c', type: 'neutral', label: 'Ask each affected department to use its usual downtime arrangements and report the outcome to management at the next shift handover.' },
      { id: 'd', type: 'wrong', label: 'Treat the outage primarily as a supplier SLA matter and delay decisions on internal continuity until Microsoft confirms its restoration timetable.' },
    ],
    facilitatorNotes: 'Assess cause, operational exposure and whether any existing fallback is approved and workable.',
    hint: 'Confirm the supplier evidence and process-level consequences before authorising interim action.',
    discussionPoints: [
      { role: 'ICT', prompt: 'What has been ruled out locally, what has Microsoft confirmed, and what uncertainties could change the response?' },
      { role: 'Maintenance and Supply Chain', prompt: 'If Dynamics 365 remains unavailable for the rest of the morning, how could priority work continue without compromising safety or controls?' },
      { role: 'Management', prompt: 'How would you decide what can continue, what needs a controlled workaround, and what may need to pause?' },
    ],
  },
  {
    id: 'mimosa-management-3', order: 3, time: '11:30', phase: 'Incident escalation and BCP decision',
    nist: 'Continuity Escalation', title: 'Recovery objectives under threat',
    description: 'The disruption has lasted three and a half hours. Microsoft says the issue remains under investigation and cannot provide a reliable recovery time. ICT has no local corrective action for the supplier-side functions. Department heads warn that delays could affect critical maintenance and procurement decisions. The 2025 BIA identifies a consolidated minimum RTO of four hours and a minimum MTD of eight hours for the most time-sensitive Dynamics 365-dependent processes.',
    evidence: 'Elapsed time: 3.5 hours. Consolidated minimum RTO: 4 hours. Minimum MTD: 8 hours. No reliable supplier restoration estimate or local corrective action.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Continue under normal incident response until the four-hour recovery threshold has actually been exceeded, then escalate for a continuity decision.' },
      { id: 'b', type: 'wrong', label: 'Activate the local ICT disaster recovery site immediately as the primary means of restoring Microsoft-hosted Dynamics 365 services.' },
      { id: 'c', type: 'correct', label: 'Bring the likely RTO breach, affected processes and available options to the MD/GM or appropriate authorised leader now for a BCP decision, recovery priorities and controlled resource commitments, while ICT continues supplier escalation.' },
      { id: 'd', type: 'neutral', label: 'Permit each department to implement its own temporary operating arrangement and seek formal management endorsement once Microsoft confirms an expected recovery time.' },
    ],
    facilitatorNotes: 'Put the likely RTO breach and decision-ready options before the authorised leader before the target is exceeded.',
    hint: 'The RTO is approaching; escalate with verified impact, options and remaining uncertainty.',
    discussionPoints: [
      { role: 'GM and BCMS lead', prompt: 'With recovery increasingly uncertain, what would prompt you to authorise formal business continuity measures?' },
      { role: 'ICT', prompt: 'What can Mimosa realistically do while Microsoft works on the service, and what remains outside our direct control?' },
      { role: 'Mining, Maintenance and Supply Chain', prompt: 'Which delays are becoming unacceptable, and what decisions or resources do you need from management now?' },
    ],
  },
  {
    id: 'mimosa-management-4', order: 4, time: '14:00', phase: 'Continuity action and management authorisation',
    nist: 'Controlled Workaround & Authorisation', title: 'Continuity workaround under pressure',
    description: 'Six hours after the initial reports, affected Dynamics 365 functions remain unavailable. Maintenance is concerned that a required spare part for an important equipment repair cannot be processed through the usual approval workflow. Supply Chain proposes temporary offline approval and manual inventory recording. Finance needs assurance that procurement controls and later reconciliation will not be bypassed.',
    evidence: 'Proposed offline approval and manual inventory recording; financial controls, authorisation and reconciliation arrangements need confirmation.',
    choices: [
      { id: 'a', type: 'correct', label: 'Consider a time-limited manual process only if the appropriate owners and approvers confirm safety, delegated authority, required financial controls, an audit trail and reconciliation; otherwise restrict the affected activity.' },
      { id: 'b', type: 'wrong', label: 'Permit emergency procurement and inventory recording now, relying on each department to reconstruct supporting records after Dynamics 365 is restored.' },
      { id: 'c', type: 'neutral', label: 'Suspend every procurement and maintenance decision involving Dynamics 365 until the normal system is restored, even if a verified and appropriately authorised alternative exists.' },
      { id: 'd', type: 'wrong', label: 'Keep procurement procedures unchanged and rely solely on the vendor’s contractual restoration commitments until the service returns.' },
    ],
    facilitatorNotes: 'Allow only a controlled, authorised workaround with safeguards and a clear reconciliation process.',
    hint: 'Balance urgent operational needs against delegated authority, safety, financial controls and auditability.',
    discussionPoints: [
      { role: 'Supply Chain and Finance', prompt: 'How could an urgent purchase be authorised, recorded and later reconciled while Dynamics 365 is unavailable?' },
      { role: 'Maintenance and Mining', prompt: 'Which activities would you continue, postpone or stop if you could not rely on the usual approvals or records?' },
      { role: 'Management', prompt: 'Under what conditions would you accept a temporary workaround, and who would be accountable for overseeing it?' },
    ],
  },
  {
    id: 'mimosa-management-5', order: 5, time: 'Next day, 10:00', phase: 'Recovery, closure and lessons learned',
    nist: 'Verified Restoration & Review', title: 'Verified restoration and incident review',
    description: 'Microsoft reports that the affected service has been restored. ICT can sign in and begin technical checks, but several departments have transactions accumulated during the outage. Finance is concerned about duplicate or incomplete payments. Mobile Equipment Maintenance must reconcile manual records before fully returning to the normal workflow. Management must decide when affected activities can safely resume and how to close the incident.',
    evidence: 'Microsoft reports service restoration; ICT can sign in; transaction backlog remains; Finance is concerned about duplicates; Maintenance must reconcile manual records.',
    choices: [
      { id: 'a', type: 'wrong', label: 'Resume all normal workflows once Microsoft announces restoration; ask ICT to check system performance during the next shift.' },
      { id: 'b', type: 'neutral', label: 'Resume operations as soon as ICT can sign in and complete a sample transaction, leaving each department to address outstanding records at its discretion.' },
      { id: 'c', type: 'correct', label: 'Require ICT technical assurance and affected business-owner validation, control outstanding transactions, and then resume under the appropriate recovery authority; confirm service restoration before closure and initiate an incident review.' },
      { id: 'd', type: 'wrong', label: 'Keep every affected activity suspended until the full transaction backlog is reconciled and Microsoft has published a final root-cause report.' },
    ],
    facilitatorNotes: 'Validate technical and business restoration, resume under appropriate authority, and complete incident closure and review.',
    hint: 'Verify the service and transaction backlog with the affected business owners before resuming normal work.',
    discussionPoints: [
      { role: 'ICT and business teams', prompt: 'What would give confidence that service is reliable and critical transactions have not been lost or duplicated?' },
      { role: 'GM and BCMS lead', prompt: 'How would you decide affected activities can safely return to normal and continuity measures can be stood down?' },
      { role: 'Management', prompt: 'What should be learned from this disruption, and which improvements should be prioritised?' },
    ],
  },
]

const mimosaManagementTimeline: TimelineEvent[] = mimosaManagementInjects.map((inject, index) => ({
  id: `mimosa-management-t${index + 1}`,
  time: ['05:00', '15:00', '25:00', '35:00', '45:00'][index],
  minute: [5, 15, 25, 35, 45][index],
  phase: inject.phase,
  title: inject.title,
  detail: inject.description,
  injectId: inject.id,
}))

export const EXERCISE_CHOICES = [
  { id: EXERCISE_IDS.meridian, organization: EXERCISE_META.defaultOrg, audience: 'Management & technical', available: true },
  { id: EXERCISE_IDS.mimosaTechnical, organization: 'Mimosa Mine', audience: 'Technical team', available: true },
  { id: EXERCISE_IDS.mimosaManagement, organization: 'Mimosa Mine', audience: 'Management team', available: true },
] as const

export function getExerciseDefinition(id: string): ExerciseDefinition {
  if (id === EXERCISE_IDS.mimosaTechnical) {
    return {
      id,
      title: 'Mimosa Mine — Underground Communications Disruption',
      organization: 'Mimosa Mine',
      durationMinutes: 60,
      audience: 'Technical Team',
      scenario: {
        title: 'Underground communications go silent',
        initialSituation: `It is a busy Tuesday morning at Mimosa Mine. The underground shift is underway, the surface control room is coordinating with teams below ground, and planned mining activities depend on reliable communications between working sections and their supervisors.
At approximately 08:00 AM, Tawanda Sibanda in the mine control room reports that calls to several underground IP telephone extensions are failing. The first report is treated as a possible handset issue, but within minutes Rumbidzai Ncube, an underground shift supervisor, confirms that her team also cannot reliably contact the control room using the usual voice channels.
Nyasha Moyo, a Telecommunications Technician, checks the available monitoring information and notices intermittent connectivity affecting communications to one underground working section. Other parts of the mine still have network and telephone service, and the cause of the disruption has not been established.
The control room asks whether scheduled work in the affected area can proceed. There is no report of injury or a confirmed loss of gas detection or ventilation control, but ICT has not yet verified that all safety-dependent communications and monitoring arrangements remain available.
By 08:15 AM, the ICT Helpdesk has received multiple related reports. The ICT Manager asks the Network and Telecommunications teams to determine the scope and urgency of the incident and coordinate with Mining and Safety representatives.`,
      },
      injects: mimosaInjects,
      roles: mimosaRoles,
      timeline: mimosaTimeline,
      sessionFlow: [
        { time: '00 to 05 min', activity: 'Introduction, scope and safety rules' },
        { time: '05 to 15 min', activity: 'Stage 1: Detection and prioritisation' },
        { time: '15 to 26 min', activity: 'Stage 2: Safe operational response' },
        { time: '26 to 37 min', activity: 'Stage 3: Diagnosis and controlled recovery' },
        { time: '37 to 49 min', activity: 'Stage 4: Escalation against the recovery target' },
        { time: '49 to 57 min', activity: 'Stage 5: Verification and service restoration' },
        { time: '57 to 60 min', activity: 'Close-out, strengths and improvement actions' },
      ],
      closingQuestions: [
        'Which decision required the greatest coordination between ICT, Engineering, Mining and Safety?',
        'Which alternative communication or recovery arrangement could the team rely on confidently today, and which still needs to be demonstrated?',
        'What practical improvement should be prioritised to reduce the chance of an extended communications interruption?',
      ],
      exerciseBoundary: 'This tabletop examines decisions and stated readiness. It does not demonstrate the actual recovery capability of communications systems, backup routes or radio coverage. Those capabilities require supporting evidence and appropriate technical testing.',
    }
  }

  if (id === EXERCISE_IDS.mimosaManagement) {
    return {
      id,
      title: 'Mimosa Mine — Critical Third-Party Service Disruption',
      organization: 'Mimosa Mine',
      durationMinutes: 60,
      audience: 'Management Team',
      scenario: {
        title: 'Microsoft Dynamics 365 disruption',
        initialSituation: `It is a busy Friday morning at Mimosa Mine. Mining and processing activities are underway, maintenance teams are coordinating equipment availability, and the Supply Chain and Finance departments are processing routine operational requirements.
At approximately 08:00 AM, the ICT Helpdesk begins receiving multiple calls from different departments reporting difficulties accessing Microsoft Dynamics 365.
Within minutes, the situation becomes increasingly concerning.
Tendai Moyo from the Supply Chain department reports that procurement transactions cannot be processed, while Rudo Ndlovu from the Plant and Maintenance team reports that they are unable to update maintenance records and process certain equipment-related transactions. Sydney Chikore from Finance also reports difficulties completing payment processing activities.
The ICT team begins investigating. Initial checks suggest that Mimosa’s internal network is functioning normally, but the affected Dynamics 365 services remain unavailable.
Shortly afterwards, Microsoft issues a service notification indicating a wider service disruption. However, no estimated restoration time has been provided.
By 08:30 AM, the disruption has persisted for 30 minutes. Departmental managers are demanding answers, and ICT cannot confirm whether the system will be restored within the next hour or remain unavailable for much longer.
The ICT Manager escalates the situation to management.`,
      },
      injects: mimosaManagementInjects,
      roles: mimosaManagementRoles,
      timeline: mimosaManagementTimeline,
      sessionFlow: [
        { time: '00 to 05 min', activity: 'Briefing and exercise rules' },
        { time: '05 to 15 min', activity: 'Stage 1: Initial incident' },
        { time: '15 to 25 min', activity: 'Stage 2: Investigation' },
        { time: '25 to 35 min', activity: 'Stage 3: Continuity decision' },
        { time: '35 to 45 min', activity: 'Stage 4: Interim workaround' },
        { time: '45 to 55 min', activity: 'Stage 5: Restoration and review' },
        { time: '55 to 60 min', activity: 'Final debrief' },
      ],
      closingQuestions: [
        'Looking back, which decision was most difficult to make? What would help Mimosa respond more confidently next time, and who should lead that improvement?',
      ],
    }
  }

  return {
    id: EXERCISE_IDS.meridian,
    title: EXERCISE_META.defaultTitle,
    organization: EXERCISE_META.defaultOrg,
    durationMinutes: EXERCISE_META.defaultDurationMinutes,
    audience: 'Management & technical',
    scenario: MERIDIAN_SCENARIO,
    injects: MERIDIAN_INJECTS,
    roles: MERIDIAN_ROLES,
    timeline: MERIDIAN_TIMELINE,
  }
}

export function getExerciseIdFromUrl(url: string) {
  const id = new URL(url).searchParams.get('exercise')
  if (!id) return EXERCISE_IDS.meridian
  return EXERCISE_CHOICES.some((choice) => choice.id === id && choice.available) ? id : null
}
