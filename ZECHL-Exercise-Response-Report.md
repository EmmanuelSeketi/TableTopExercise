# ZECHL Cybersecurity Incident Response Tabletop Exercise
## Response and Participation Report

**Exercise date:** 20 November 2026  
**Registered participants:** 20  
**Scenarios:** 4

## Executive summary

Across the four scenarios, the extract records **52 responses**: **33 correct (63.5%)** and **19 wrong (36.5%)**.

- **Best result by count and rate:** Scenario 4, with 11 correct responses out of 13 (84.6%).
- **Most challenging scenario:** Scenario 2, with 9 wrong responses out of 15 (60.0%) and the lowest correct rate (40.0%).
- **Closest to an even split:** Scenario 1, with 7 correct and 6 wrong responses. This is described as “mixed” here; no formal performance-band thresholds were supplied.
- **Repeated wrong-response entries:** Mary Chileshe appears twice with different wrong choices in Scenario 2. Both entries are retained in the response totals, but individual scenario-level failure comparisons count a participant no more than once per scenario.

The extract has incomplete named response detail for Scenario 3: its aggregate reports 9 correct and 2 wrong, but only 3 of the 9 correct respondents are named. It also repeats the Scenario 3 description before Scenario 4 with figures matching Scenario 4. This report uses the clearly labeled Scenario 3 totals (11 responses, 9 correct, 2 wrong) and the Scenario 4 response list and totals (13 responses, 11 correct, 2 wrong).

## Participation and results by scenario

| Scenario | Responses recorded | Correct | Wrong | Correct rate | Wrong rate |
|---|---:|---:|---:|---:|---:|
| 1. The login that looks like maintenance | 13 | 7 | 6 | 53.8% | 46.2% |
| 2. A confirmed compromise with no easy containment choice | 15 | 6 | 9 | 40.0% | 60.0% |
| 3. Bank pressure becomes a management decision | 11 | 9 | 2 | 81.8% | 18.2% |
| 4. The service looks healthy; the decision does not | 13 | 11 | 2 | 84.6% | 15.4% |
| **Total** | **52** | **33** | **19** | **63.5%** | **36.5%** |

There were 20 registered participants. Response totals are submissions, not necessarily unique people: the Scenario 2 list includes a repeated response from one participant, and Scenario 3 does not provide a complete named list. The response totals therefore should not be read as exact unique-participant attendance rates.

## Scenario results

### 1. The login that looks like maintenance

**Participation:** 13 responses — 7 correct, 6 wrong.  
**Correct answer:** C — “Notify Information Security immediately, preserve logs, verify the maintenance ticket and have Information Security direct a targeted restriction on the active privileged session.”

#### Wrong responses

- **Option A — 3 responses:** “Notify Information Security immediately, preserve logs, verify the maintenance ticket and keep the active session under close monitoring until the administrator confirms it was authorised.”
  - Mwema Nakawala Tembo — Payment Operations
  - Ingrid — Finance / Risk
  - Mary Chileshe — ICT / IRT Leadership
- **Option B — 3 responses:** “Have ICT verify the maintenance ticket and contact the administrator before reporting to Information Security, to avoid escalating an event that may be authorised.”
  - Kayongo Fwoloshi — ICT / IRT Leadership
  - Arpachshad kombe — Payment Operations
  - Taizya Mwanza — Information Security
- **Option D — 0 responses:** “Notify Information Security and immediately disconnect the entire switching component to eliminate any possible risk before establishing which asset is affected.”

#### Correct responses

Seven participants selected option C: PRINCE BANDA (ICT / IRT Leadership), Lyford Banda (ICT / IRT Leadership), Mazuba (ICT / IRT Leadership), Masowe Thandiwe (ICT / IRT Leadership), Kayula (Risk, Audit and Compliance), Kabwita (Payment Operations), and Karen Lizabete (IRT Team Leader).

**What the result suggests:** Responses were nearly evenly split between the correct targeted restriction and two alternatives. Three participants would have left an active privileged session under monitoring, while three would have delayed Information Security reporting until further checks.

### 2. A confirmed compromise with no easy containment choice

**Participation:** 15 responses — 6 correct, 9 wrong.  
**Correct answer:** B — “Declare Level 3, preserve evidence, contain the known session and assess other access paths under Information Security oversight, with IRT-led coordination of any payment restriction.”

#### Wrong responses

- **Option A — 3 responses:** “Declare Level 3, disconnect every National Financial Switch component immediately and notify banks of a complete outage before determining the actual extent of compromise.”
  - Masowe Thandiwe — ICT / IRT Leadership
  - Ingrid — Finance / Risk
  - Kabwita — Payment Operations
- **Option C — 1 response:** “Keep the incident under investigation until the attacker’s entry method is confirmed; then declare the severity and decide on containment with Information Security.”
  - Mary Chileshe — ICT / IRT Leadership
- **Option D — 5 responses:** “Declare Level 3, preserve evidence, disable the known compromised account and reverse the unauthorised setting, then continue processing under enhanced monitoring.”
  - Kayula — Risk, Audit and Compliance
  - Mwema Nakawala Tembo — Payment Operations
  - Mazuba — ICT / IRT Leadership
  - Arpachshad kombe — Payment Operations
  - Mary Chileshe — ICT / IRT Leadership

#### Correct responses

Six participants selected option B: Lukonde (Information Security), Karen Lizabete (IRT Team Leader), PRINCE BANDA (ICT / IRT Leadership), Kayongo Fwoloshi (ICT / IRT Leadership), Lyford Banda (ICT / IRT Leadership), and Taizya Mwanza (Information Security).

**What the result suggests:** This was the most challenging scenario. The most common error (option D) was to remove the known compromised account and reverse the setting, then resume processing without resolving the possibility of another access path. Three responses instead proposed immediate disconnection of every NFS component; one delayed classification until the entry method was known.

### 3. Bank pressure becomes a management decision

**Participation:** 11 responses — 9 correct, 2 wrong.  
**Correct answer:** D — “Restrict affected payment flows, hold retries until end-to-end status is verified under an approved process, reconcile exceptions, and issue authorised updates with a timed management review.”

#### Wrong responses

- **Option B — 1 response:** “Restrict affected payment flows, pause unverified retries, reconcile exceptions and issue factual updates; allow retries once each bank confirms its own failed status.”
  - Masowe Thandiwe — ICT / IRT Leadership
- **Option C — 1 response:** “Continue unaffected switching traffic and let each bank manage its own retry and reversal decisions while ZECHL investigates the configuration change.”
  - Karen — ICT / IRT Leadership
- **Option A — 0 responses:** “Suspend all switching activity until complete root-cause and financial-impact findings are available; communicate only after those findings are approved.”

#### Correct responses

Nine participants selected option D. The extract names three: Mazuba (ICT / IRT Leadership), Ingrid (Finance / Risk), and Arpachshad kombe (Payment Operations). **The other six correct respondents are not named in the supplied extract.**

**What the result suggests:** The aggregate result was strong. The two recorded errors concern either relying on an individual bank’s failed-status report to authorize retries or delegating retry and reversal decisions to each bank despite mismatched records.

### 4. The service looks healthy; the decision does not

**Participation:** 13 responses — 11 correct, 2 wrong.  
**Correct answer:** C — “Authorise a defined pilot only after the second-account risk is contained or demonstrably mitigated; verify transaction controls, sign-off and rollback, then assess IRT stand-down separately.”

#### Wrong responses

- **Option A — 2 responses:** “Authorise a narrow pilot using the tested configuration, hold disputed transactions, assign a sign-off owner and rollback trigger; investigate the uncleared second privileged account during the pilot.”
  - Mwema Nakawala Tembo — Payment Operations
  - Masowe Thandiwe — ICT / IRT Leadership
- **Option B — 0 responses:** “Keep all processing suspended until the final forensic report is signed and every disputed transaction has been settled, even if a safe restricted pilot is feasible.”
- **Option D — 0 responses:** “Let ICT start a narrow pilot under continuous monitoring and ask the CEO to stand down the IRT when the first participating bank confirms successful processing.”

#### Correct responses

Eleven participants selected option C: Mary Chileshe (ICT / IRT Leadership), Kayongo Fwoloshi (ICT / IRT Leadership), Karen (ICT / IRT Leadership), Lyford Banda (ICT / IRT Leadership), Taizya Mwanza (Information Security), Kabwita (Payment Operations), Arpachshad kombe (Payment Operations), PRINCE BANDA (ICT / IRT Leadership), Ingrid (Finance / Risk), Lukonde (Information Security), and Mazuba (ICT / IRT Leadership).

**What the result suggests:** Most respondents separated restricted service restoration from formal incident closure and recognized that the unresolved second account must be contained or mitigated before a pilot. The two wrong responses accepted that risk during the pilot.

## Overall findings

### Highest and lowest results

- **Most correct responses:** Scenario 4, with 11 correct.
- **Highest correct rate:** Scenario 4, at 84.6%.
- **Most wrong responses:** Scenario 2, with 9 wrong.
- **Lowest correct rate:** Scenario 2, at 40.0%.
- **Closest to an even split (“fair/mixed” descriptively):** Scenario 1, with 53.8% correct and 46.2% wrong. This is not a formal grade because no “Fair” threshold was provided.

### Individual and role-level wrong-response patterns

Counts below are based on the named wrong-response entries in the extract. For the participant-by-scenario comparison, a person is counted at most once per scenario.

- **Most scenario-level failures:** Mwema Nakawala Tembo (Payment Operations) and Masowe Thandiwe (ICT / IRT Leadership), with wrong responses in three scenarios each.
- **Next highest:** Arpachshad kombe (Payment Operations), Ingrid (Finance / Risk), and Mary Chileshe (ICT / IRT Leadership), with wrong responses in two scenarios each.
- **Role with the most wrong-response entries:** ICT / IRT Leadership, with 9 entries as exported, followed by Payment Operations with 6. Finance / Risk had 2; Information Security and Risk, Audit and Compliance had 1 each.
- **Duplicate-response caveat:** ICT / IRT Leadership’s raw count includes Mary Chileshe’s two different wrong responses in Scenario 2. If counting each participant no more than once per scenario, the role count is 8 rather than 9. The aggregate wrong total still counts both exported response entries.

## Recommendations

1. **Reinforce containment under uncertainty.** Scenario 2 had the weakest result. Practice declaring severity and containing the known session promptly while investigating other access paths, rather than either waiting for a confirmed entry method or resuming normal processing after disabling one account.
2. **Clarify payment-service isolation authority.** Use the Scenario 2 split to confirm who can authorize targeted restrictions or wider isolation, how operational impacts are weighed, and how the decision is recorded.
3. **Maintain end-to-end transaction controls.** Scenario 3 was strong, but retain the control that retries and reversals wait for approved end-to-end transaction verification, not only a bank’s local status.
4. **Formalize pilot and stand-down gates.** Preserve Scenario 4’s strong result by documenting security assurance, transaction checks, approver, monitoring, rollback conditions, and separate IRT stand-down authority.
5. **Improve response export quality.** Provide a complete named response list for Scenario 3 and remove or clearly label duplicate response records so future individual and role analyses are reliable.

## Data limitations

- The report is based on the supplied export, not a direct database audit.
- Scenario 3 has only 5 of 11 named response records in the extract; 6 of its correct responses are unnamed.
- Scenario 3’s description and a second set of aggregate figures are repeated before Scenario 4. The repeated figures (13 total, 11 correct, 2 wrong) match Scenario 4, so the report associates them with Scenario 4.
- Mary Chileshe appears twice with different wrong responses in Scenario 2. The report retains both in response totals and discloses the duplicate when comparing individuals and roles.
- The export gives response totals for each inject, but the duplicate and incomplete names prevent reliable unique-participant attendance rates for every scenario.
