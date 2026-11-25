'use client'

import { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useExerciseDefinition } from '@/lib/exercise-selection'
import { useExercise } from '@/lib/exercise-store'
import {
  buildExerciseReport,
  getReportRating,
  REPORT_RATING_BANDS,
  type ExerciseReport,
  type InjectReport,
  type ReportCounts,
} from '@/lib/exercise-report'

function percentage(value: number | null) {
  return value === null ? '—' : `${value.toFixed(1)}%`
}

function dateLabel(value: Date | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(value)
    : 'Not available'
}

function dateTimeLabel(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timestamp))
}

function ratingClass(value: string) {
  if (value === 'Pass') return 'bg-emerald-100 text-emerald-800'
  if (value === 'Fair') return 'bg-amber-100 text-amber-900'
  if (value === 'Fail') return 'bg-rose-100 text-rose-800'
  return 'bg-slate-100 text-slate-700'
}

function Rating({ rate }: { rate: number | null }) {
  const value = getReportRating(rate)
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${ratingClass(value)}`}>
      {value}
    </span>
  )
}

function ReportSection({
  number,
  title,
  children,
}: {
  number: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4 border-t border-slate-200 pt-6">
      <h2 className="flex items-baseline gap-3 text-xl font-bold tracking-tight text-slate-900">
        <span className="text-sm font-semibold text-blue-700">{number}</span>
        {title}
      </h2>
      {children}
    </section>
  )
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail?: string
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">{value}</p>
      {detail && <p className="mt-1 text-xs text-slate-600">{detail}</p>}
    </div>
  )
}

function Counts({ counts }: { counts: ReportCounts }) {
  return <>{counts.correct} / {counts.wrong}{counts.other > 0 ? ` / ${counts.other}` : ''}</>
}

function names(values: Array<{ name: string }>) {
  return values.length ? values.map((value) => value.name).join(', ') : 'None recorded'
}

function performanceSummary(report: ExerciseReport) {
  if (report.totalResponses === 0) return 'No participant responses have been recorded for this exercise yet.'
  const parts = [
    `${report.totalResponses} responses were recorded from ${report.uniqueParticipantsResponded} of ${report.registeredParticipants} registered participants across ${report.injectCount} scenarios.`,
    `${report.correct} responses were correct (${percentage(report.correctRate)}); ${report.wrong} were wrong${report.other ? ` and ${report.other} were unclassified` : ''}.`,
  ]
  const weakest = report.injects
    .filter((inject) => inject.correctRate !== null)
    .sort((left, right) => (left.correctRate ?? 0) - (right.correctRate ?? 0))[0]
  if (weakest) parts.push(`The lowest correct rate was in “${weakest.title}” at ${percentage(weakest.correctRate)}.`)
  return parts.join(' ')
}

function Recommendations({ report }: { report: ExerciseReport }) {
  const recommendations: Array<{ action: string; basis: string }> = []
  const ratedInjects = report.injects.filter((inject) => inject.responses > 0)
  const weakestInject = [...ratedInjects].sort(
    (left, right) => (left.correctRate ?? 0) - (right.correctRate ?? 0),
  )[0]
  const weakestRole = [...report.roles]
    .filter((role) => role.responses >= REPORT_RATING_BANDS.minimumRoleSample)
    .sort((left, right) => (left.correctRate ?? 0) - (right.correctRate ?? 0))[0]
  const lowestParticipationInject = [...report.injects]
    .filter((inject) => inject.participationRate !== null && inject.participatingCount > 0)
    .sort((left, right) => (left.participationRate ?? 0) - (right.participationRate ?? 0))[0]

  if (weakestInject) {
    const correctChoice = weakestInject.choices.find((choice) => choice.kind === 'correct')
    recommendations.push({
      action: `Run a focused facilitated review and repeat exercise for “${weakestInject.title}”.`,
      basis: `${weakestInject.wrong} of ${weakestInject.responses} responses were wrong (${percentage(weakestInject.correctRate)} correct). The correct decision is: ${correctChoice?.label ?? 'review the inject’s correct decision.'}`,
    })
  }
  if (weakestRole) {
    recommendations.push({
      action: `Schedule a cross-functional decision drill involving ${weakestRole.name}.`,
      basis: `This role had the lowest correct rate among groups with at least ${REPORT_RATING_BANDS.minimumRoleSample} responses (${percentage(weakestRole.correctRate)} across ${weakestRole.responses} responses).`,
    })
  }
  if (lowestParticipationInject && lowestParticipationInject.participationRate !== null && lowestParticipationInject.participationRate < 100) {
    recommendations.push({
      action: `Review the timing and participant access process for “${lowestParticipationInject.title}” and allow time for all roles to submit.`,
      basis: `It had the lowest scenario participation (${lowestParticipationInject.participatingCount} of ${report.registeredParticipants} enrolled participants).`,
    })
  }
  if (report.actionItems.length > 0) {
    for (const item of report.actionItems) {
      recommendations.push({
        action: item.action,
        basis: `Recorded action item · Owner: ${item.owner || 'Not assigned'} · Due: ${item.dueDate || 'Not set'} · Priority: ${item.priority}.`,
      })
    }
  }
  if (recommendations.length === 0) {
    recommendations.push({
      action: 'Continue exercising the response process and record targeted follow-up actions.',
      basis: 'There is not enough response data to generate a specific performance recommendation.',
    })
  }

  return (
    <ol className="space-y-3">
      {recommendations.map((item, index) => (
        <li key={`${item.action}-${index}`} className="grid gap-1 rounded-lg bg-slate-50 p-3 sm:grid-cols-[2rem_1fr]">
          <span className="font-bold text-blue-700">{index + 1}.</span>
          <div>
            <p className="font-semibold text-slate-900">{item.action}</p>
            <p className="mt-1 text-sm leading-relaxed text-slate-600">{item.basis}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}

function InjectDetails({ inject }: { inject: InjectReport }) {
  return (
    <section className="report-break space-y-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
            Scenario {inject.order} · {inject.phase}
          </p>
          <h3 className="mt-1 text-lg font-bold text-slate-900">{inject.title}</h3>
        </div>
        <Rating rate={inject.correctRate} />
      </div>
      <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{inject.description}</p>
      {inject.evidence && (
        <div className="rounded-lg bg-slate-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-600">Information available</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{inject.evidence}</p>
        </div>
      )}
      {inject.decisionPrompt && (
        <div className="rounded-lg bg-blue-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-800">Decision tested</p>
          <p className="mt-1 font-semibold text-slate-900">{inject.decisionPrompt}</p>
        </div>
      )}
      {(inject.facilitatorNotes || inject.hint) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-bold uppercase tracking-wide text-amber-900">Facilitator guidance</p>
          {inject.facilitatorNotes && <p className="mt-1 text-sm text-amber-950"><span className="font-semibold">Notes: </span>{inject.facilitatorNotes}</p>}
          {inject.hint && <p className="mt-1 text-sm text-amber-950"><span className="font-semibold">Hint: </span>{inject.hint}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric label="Responses" value={`${inject.responses}`} />
        <Metric label="Correct" value={`${inject.correct}`} />
        <Metric label="Wrong" value={`${inject.wrong}`} />
        <Metric
          label="Participation"
          value={percentage(inject.participationRate)}
          detail={`${inject.participatingCount} participants`}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="report-table w-full min-w-[42rem] text-left text-sm">
          <thead>
            <tr>
              <th>Answer option</th>
              <th>Result</th>
              <th>Count</th>
              <th>Respondents · role · submitted</th>
            </tr>
          </thead>
          <tbody>
            {inject.choices.map((choice, index) => (
              <tr key={choice.id}>
                <td className="min-w-[18rem]">
                  <span className="mr-2 font-bold">{String.fromCharCode(65 + index)}.</span>
                  {choice.label}
                </td>
                <td>
                  <span className={`font-semibold ${choice.kind === 'correct' ? 'text-emerald-700' : choice.kind === 'wrong' ? 'text-rose-700' : 'text-slate-600'}`}>
                    {choice.kind === 'correct' ? 'Correct' : choice.kind === 'wrong' ? 'Wrong' : 'Other'}
                  </span>
                </td>
                <td className="tabular-nums">{choice.responses.length}</td>
                <td className="min-w-[15rem]">
                  {choice.responses.length > 0 ? (
                    <ul className="space-y-1">
                      {choice.responses.map((entry) => (
                        <li key={entry.response.id}>
                          <span className="font-medium">{entry.participantName}</span>
                          <span className="text-slate-600"> · {entry.roleName} · {dateTimeLabel(entry.response.submittedAt)}</span>
                        </li>
                      ))}
                    </ul>
                  ) : <span className="text-slate-400">No responses</span>}
                </td>
              </tr>
            ))}
            {inject.unrecognizedResponses.map((entry) => (
              <tr key={entry.response.id}>
                <td>Unrecognized answer</td>
                <td>Other</td>
                <td>1</td>
                <td>{entry.participantName} · {entry.roleName} · {dateTimeLabel(entry.response.submittedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function injectCell(counts: ReportCounts | undefined) {
  if (!counts || counts.responses === 0) return '—'
  return `${counts.correct} / ${counts.wrong}${counts.other > 0 ? ` / ${counts.other}` : ''}`
}

function roleFindings(report: ExerciseReport) {
  const bestAdequate = report.roles
    .filter((role) => role.responses >= REPORT_RATING_BANDS.minimumRoleSample)
    .sort((left, right) => (right.correctRate ?? 0) - (left.correctRate ?? 0))[0]
  const best = bestAdequate ?? [...report.roles].sort(
    (left, right) => (right.correctRate ?? 0) - (left.correctRate ?? 0),
  )[0]
  const lowest = report.lowestRatedRoles[0]
  const worstVolume = report.mostWrongRoles[0]
  return { best, bestAdequate, lowest, worstVolume }
}

function multipleTitles<T extends { title: string }>(items: T[]) {
  return items.length ? items.map((item) => item.title).join('; ') : 'None'
}

function injectResultSummary(inject: InjectReport) {
  return `${inject.title}: ${inject.correct} correct, ${inject.wrong} wrong (${percentage(inject.correctRate)} correct).`
}

function reportFilename(title: string) {
  const normalized = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  return normalized || 'exercise-response-report'
}

function downloadWordDocument(element: HTMLElement, filename: string) {
  const documentCopy = element.cloneNode(true) as HTMLElement
  documentCopy.querySelector('.report-actions')?.remove()
  const html = `<!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${filename}</title>
        <style>
          body { font-family: Arial, sans-serif; color: #1e293b; font-size: 10pt; line-height: 1.4; }
          h1 { color: #0f172a; font-size: 24pt; }
          h2 { color: #0f172a; font-size: 16pt; border-bottom: 1px solid #cbd5e1; padding-bottom: 5px; }
          h3 { color: #0f172a; font-size: 12pt; }
          p { margin: 5px 0 10px; }
          section { margin: 18px 0; page-break-inside: avoid; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th, td { border: 1px solid #cbd5e1; padding: 5px; text-align: left; vertical-align: top; }
          th { background: #e2e8f0; font-weight: bold; }
          li { margin: 3px 0; }
          .report-break { page-break-before: always; }
          .report-container { box-shadow: none; }
        </style>
      </head>
      <body>${documentCopy.outerHTML}</body>
    </html>`
  const blob = new Blob([html], { type: 'application/msword;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `${filename}.doc`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function ExerciseReportPage() {
  const { state, hydrated } = useExercise()
  const definition = useExerciseDefinition()
  const reportElementRef = useRef<HTMLElement>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const report = useMemo(
    () => buildExerciseReport(definition, state),
    [definition, state],
  )
  const filename = reportFilename(`${report.organization}-${report.title}-response-report`)
  const roles = roleFindings(report)
  const participationInjects = report.registeredParticipants > 0 ? report.injects : []
  const maxParticipationCount = Math.max(0, ...participationInjects.map((inject) => inject.participatingCount))
  const minParticipationCount = participationInjects.length > 0
    ? Math.min(...participationInjects.map((inject) => inject.participatingCount))
    : 0
  const maxParticipationInjects = participationInjects.filter(
    (inject) => inject.participatingCount === maxParticipationCount,
  )
  const minParticipationInjects = participationInjects.filter(
    (inject) => inject.participatingCount === minParticipationCount,
  )
  const mostWrongParticipantCount = Math.max(0, ...report.participants.map((participant) => participant.wrong))
  const highestIndividualRate = Math.max(
    0,
    ...report.participants
      .filter((participant) => participant.responses >= 2)
      .map((participant) => participant.correctRate ?? 0),
  )

  async function downloadPdf() {
    const reportElement = reportElementRef.current
    if (exportingPdf) return
    if (!reportElement) {
      setExportError('The report is not ready to download')
      return
    }
    setExportingPdf(true)
    setExportError(null)
    try {
      const html2pdf = (await import('html2pdf.js')).default
      await html2pdf()
        .set({
          margin: 10,
          filename: `${filename}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, scrollY: 0 },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' },
        })
        .from(reportElement)
        .save()
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'PDF download failed')
    } finally {
      setExportingPdf(false)
    }
  }

  if (!hydrated) {
    return <main className="mx-auto max-w-5xl p-8 text-slate-600">Loading report data…</main>
  }

  return (
    <main ref={reportElementRef} className="report-container mx-auto my-6 max-w-6xl space-y-6 rounded-2xl bg-white p-5 text-slate-800 shadow-sm sm:p-8 print:my-0 print:max-w-none print:rounded-none print:p-0 print:shadow-none">
      <div className="report-actions no-print flex flex-wrap items-center justify-between gap-3" data-html2canvas-ignore>
        <Link
          href={`/facilitator?exercise=${encodeURIComponent(definition.id)}`}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-blue-700"
        >
          <ArrowLeft className="size-4" /> Back to facilitator
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={downloadPdf} disabled={exportingPdf} className="gap-2">
            <Download className="size-4" /> {exportingPdf ? 'Preparing PDF...' : 'Download PDF'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const element = reportElementRef.current
              if (!element) {
                setExportError('The report is not ready to download')
                return
              }
              setExportError(null)
              downloadWordDocument(element, filename)
            }}
            className="gap-2"
          >
            <FileText className="size-4" /> Download Word (.doc)
          </Button>
        </div>
        {exportError && <p role="alert" className="w-full text-sm text-red-700">{exportError}</p>}
      </div>

      <header className="space-y-4 border-b-2 border-blue-800 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-800">Confidential · Exercise report</p>
            <h1 className="max-w-4xl text-3xl font-bold leading-tight tracking-tight text-slate-950">
              {report.organization}
              <span className="mt-2 block text-xl font-semibold text-slate-700 sm:text-2xl">{report.title}</span>
            </h1>
          </div>
          <p className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-700">
            {report.injectCount} scenarios
          </p>
        </div>
        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <div><dt className="font-semibold text-slate-500">First response recorded</dt><dd>{dateLabel(report.exerciseDate)}</dd></div>
          <div><dt className="font-semibold text-slate-500">Report generated</dt><dd>{dateLabel(report.reportDate)}</dd></div>
          <div><dt className="font-semibold text-slate-500">Participants enrolled</dt><dd>{report.registeredParticipants}</dd></div>
          <div><dt className="font-semibold text-slate-500">Responses recorded</dt><dd>{report.totalResponses}</dd></div>
        </dl>
      </header>

      <ReportSection number="1" title="Executive summary">
        <p className="leading-relaxed text-slate-700">{performanceSummary(report)}</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Metric label="Recorded responses" value={`${report.totalResponses}`} detail={`of ${report.expectedResponseSlots} possible`} />
          <Metric label="Response coverage" value={percentage(report.participationRate)} />
          <Metric label="Correct responses" value={`${report.correct}`} detail={percentage(report.correctRate)} />
          <Metric label="Wrong responses" value={`${report.wrong}`} detail={percentage(report.totalResponses ? (report.wrong / report.totalResponses) * 100 : null)} />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900">Strongest scenario</h3>
            <p className="mt-1 text-sm text-slate-700">{multipleTitles(report.mostSuccessfulInjects)}</p>
            {report.mostSuccessfulInjects[0] && <p className="mt-1 text-sm text-slate-600">{injectResultSummary(report.mostSuccessfulInjects[0])}</p>}
          </div>
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="font-bold text-slate-900">Most challenging scenario</h3>
            <p className="mt-1 text-sm text-slate-700">{multipleTitles(report.mostFailedInjects)}</p>
            {report.mostFailedInjects[0] && <p className="mt-1 text-sm text-slate-600">{injectResultSummary(report.mostFailedInjects[0])}</p>}
          </div>
        </div>
      </ReportSection>

      <ReportSection number="2" title="Exercise overview and method">
        <p className="leading-relaxed text-slate-700">
          This report evaluates submitted choices against the correct-answer designation for each scenario.
          A response is counted as correct or wrong according to its answer option; other or unrecognized
          responses are shown separately. Participation is calculated from unique participant-by-scenario
          response slots divided by registered participants multiplied by the number of scenarios.
        </p>
        <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <h3 className="font-bold text-slate-900">{definition.scenario.title}</h3>
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{definition.scenario.initialSituation}</p>
          {definition.objectives && definition.objectives.length > 0 && (
            <div>
              <h4 className="font-semibold text-slate-900">Exercise objectives</h4>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                {definition.objectives.map((objective) => <li key={objective}>{objective}</li>)}
              </ul>
            </div>
          )}
          {definition.exerciseBoundary && (
            <p className="text-sm text-slate-700"><span className="font-semibold">Exercise boundaries: </span>{definition.exerciseBoundary}</p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="report-table w-full min-w-[40rem] text-left text-sm">
            <thead><tr><th>Scenario</th><th>Decision tested</th><th>Responses</th><th>Correct / wrong / other</th><th>Rating</th></tr></thead>
            <tbody>
              {report.injects.map((inject) => (
                <tr key={inject.id}>
                  <td>{inject.order}. {inject.title}</td>
                  <td>{inject.decisionPrompt ?? inject.phase}</td>
                  <td>{inject.responses}</td>
                  <td><Counts counts={inject} /></td>
                  <td><Rating rate={inject.correctRate} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-500">
          Rating bands: Pass ≥ {REPORT_RATING_BANDS.pass}%; Fair {REPORT_RATING_BANDS.fair}–{REPORT_RATING_BANDS.pass - 0.1}%;
          {' '}Fail &lt; {REPORT_RATING_BANDS.fair}%. Role ratings with fewer than {REPORT_RATING_BANDS.minimumRoleSample} responses are indicative only.
        </p>
      </ReportSection>

      <ReportSection number="3" title="Participation and overall results">
        <div className="overflow-x-auto">
          <table className="report-table w-full min-w-[42rem] text-left text-sm">
            <thead><tr><th>Scenario</th><th>Responses</th><th>Participants</th><th>Participation</th><th>Correct</th><th>Wrong</th><th>Correct rate / rating</th></tr></thead>
            <tbody>
              {report.injects.map((inject) => (
                <tr key={inject.id}>
                  <td>{inject.order}. {inject.title}</td>
                  <td>{inject.responses}</td>
                  <td>{inject.participatingCount} / {report.registeredParticipants}</td>
                  <td>{percentage(inject.participationRate)}</td>
                  <td>{inject.correct}</td>
                  <td>{inject.wrong}</td>
                  <td className="space-x-2">{percentage(inject.correctRate)} <Rating rate={inject.correctRate} /></td>
                </tr>
              ))}
              <tr className="font-bold">
                <td>Exercise total</td>
                <td>{report.totalResponses}</td>
                <td>{report.uniqueParticipantsResponded} / {report.registeredParticipants}</td>
                <td>{percentage(report.participationRate)}</td>
                <td>{report.correct}</td>
                <td>{report.wrong}</td>
                <td>{percentage(report.correctRate)} <Rating rate={report.correctRate} /></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <Metric label="Highest participation" value={participationInjects.length ? `${maxParticipationCount} participants` : '—'} detail={multipleTitles(maxParticipationInjects)} />
          <Metric label="Lowest participation" value={participationInjects.length ? `${minParticipationCount} participants` : '—'} detail={multipleTitles(minParticipationInjects)} />
          <Metric label="Scenarios passed" value={`${report.passedInjects.length} / ${report.injectCount}`} detail={`${report.fairInjects.length} Fair · ${report.failedInjects.length} Fail`} />
        </div>
        {report.registeredParticipants === 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">
            No participants are currently registered. Participation coverage cannot be calculated.
          </p>
        )}
      </ReportSection>

      <ReportSection number="4" title="Scenario results and response detail">
        <div className="space-y-5">
          {report.injects.map((inject) => <InjectDetails key={inject.id} inject={inject} />)}
        </div>
      </ReportSection>

      <ReportSection number="5" title="Role performance analysis">
        <p className="text-sm leading-relaxed text-slate-600">
          Role results are attributed using the participant role recorded at signup. Small samples are
          marked as indicative; raw counts and correct rates are both shown to avoid treating group size
          as performance.
        </p>
        {report.roles.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-4 text-sm text-slate-600">No role-attributed responses are available yet.</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="report-table w-full min-w-[48rem] text-left text-sm">
                <thead><tr><th>Role</th><th>Enrolled</th><th>Responses</th><th>Correct</th><th>Wrong</th><th>Other</th><th>Correct rate</th><th>Rating</th></tr></thead>
                <tbody>
                  {report.roles.map((role) => (
                    <tr key={role.name}>
                      <td className="font-semibold">{role.name}</td>
                      <td>{role.participants}</td>
                      <td>{role.responses}</td>
                      <td>{role.correct}</td>
                      <td>{role.wrong}</td>
                      <td>{role.other}</td>
                      <td>{percentage(role.correctRate)}</td>
                      <td><Rating rate={role.correctRate} />{role.responses < REPORT_RATING_BANDS.minimumRoleSample && <span className="ml-1 text-xs text-slate-500">Indicative</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="overflow-x-auto">
              <table className="report-table w-full min-w-[50rem] text-left text-sm">
                <thead>
                  <tr>
                    <th>Role</th>
                    {report.injects.map((inject) => <th key={inject.id}>Scenario {inject.order}</th>)}
                    <th>Total (correct / wrong / other)</th>
                  </tr>
                </thead>
                <tbody>
                  {report.roles.map((role) => (
                    <tr key={role.name}>
                      <td className="font-semibold">{role.name}</td>
                      {report.injects.map((inject) => (
                        <td key={inject.id}>{injectCell(role.injectCounts[inject.id])}</td>
                      ))}
                      <td><Counts counts={role} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </ReportSection>

      <ReportSection number="6" title="Individual participant performance">
        <p className="text-sm leading-relaxed text-slate-600">
          Individual results are included for facilitator follow-up. Interpret them in context: participants
          may have submitted different numbers of responses, and a small sample is not a reliable standalone
          measure of capability.
        </p>
        <div className="overflow-x-auto">
          <table className="report-table w-full min-w-[52rem] text-left text-sm">
            <thead>
              <tr>
                <th>Participant</th><th>Role</th><th>Scenarios answered</th><th>Correct</th><th>Wrong</th><th>Other</th><th>Correct rate</th>
                {report.injects.map((inject) => <th key={inject.id}>S{inject.order}</th>)}
              </tr>
            </thead>
            <tbody>
              {report.participants.length > 0 ? report.participants.map((participant) => (
                <tr key={participant.id}>
                  <td className="font-semibold">{participant.name}</td>
                  <td>{participant.roleName}</td>
                  <td>{participant.participatedIn} / {report.injectCount}</td>
                  <td>{participant.correct}</td>
                  <td>{participant.wrong}</td>
                  <td>{participant.other}</td>
                  <td>{percentage(participant.correctRate)}</td>
                  {report.injects.map((inject) => (
                    <td key={inject.id}>{injectCell(participant.injectCounts[inject.id])}</td>
                  ))}
                </tr>
              )) : (
                <tr><td colSpan={7 + report.injectCount}>No participants are registered.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ReportSection>

      <ReportSection number="7" title="Consolidated findings">
        <div className="overflow-x-auto">
          <table className="report-table w-full min-w-[42rem] text-left text-sm">
            <thead><tr><th>Finding</th><th>Result</th></tr></thead>
            <tbody>
              <tr><td>Highest correct rate</td><td>{multipleTitles(report.mostSuccessfulInjects)} {report.mostSuccessfulInjects[0] ? `(${percentage(report.mostSuccessfulInjects[0].correctRate)})` : ''}</td></tr>
              <tr><td>Most correct responses</td><td>{multipleTitles(report.injects.filter((inject) => inject.correct === Math.max(0, ...report.injects.map((item) => item.correct)) && inject.responses > 0))}</td></tr>
              <tr><td>Most wrong responses</td><td>{multipleTitles(report.mostFailedInjects)} {report.mostFailedInjects[0] ? `(${report.mostFailedInjects[0].wrong} wrong)` : ''}</td></tr>
              <tr><td>Passed scenarios</td><td>{multipleTitles(report.passedInjects)}</td></tr>
              <tr><td>Fair scenarios</td><td>{multipleTitles(report.fairInjects)}</td></tr>
              <tr><td>Failed scenarios</td><td>{multipleTitles(report.failedInjects)}</td></tr>
              <tr><td>Role with most wrong responses</td><td>{roles.worstVolume ? `${roles.worstVolume.name} (${roles.worstVolume.wrong} wrong of ${roles.worstVolume.responses})` : 'No role results'}</td></tr>
              <tr><td>Lowest role correct rate</td><td>{roles.lowest ? `${roles.lowest.name} (${percentage(roles.lowest.correctRate)}; ${roles.lowest.responses} responses${report.roleRatingSampleIsSmall ? ', indicative sample' : ''})` : 'No role results'}</td></tr>
              <tr><td>Highest role correct rate</td><td>{roles.best ? `${roles.best.name} (${percentage(roles.best.correctRate)}; ${roles.best.responses} responses${roles.best.responses < REPORT_RATING_BANDS.minimumRoleSample ? ', indicative sample' : ''})` : 'No role results'}</td></tr>
              <tr><td>Participants with most wrong responses</td><td>{report.mostWrongParticipants.length ? `${report.mostWrongParticipants.map((participant) => `${participant.name} (${participant.wrong})`).join('; ')} wrong responses` : 'No wrong responses recorded'}</td></tr>
              <tr><td>Highest individual correct rate (2+ responses)</td><td>{report.highestRatedParticipants.length ? report.highestRatedParticipants.filter((participant) => participant.correctRate === highestIndividualRate).map((participant) => `${participant.name} (${percentage(participant.correctRate)}, ${participant.responses} responses)`).join('; ') : 'Not enough participant response data'}</td></tr>
              <tr><td>Overall result</td><td>{report.totalResponses} responses · {report.correct} correct · {report.wrong} wrong · {percentage(report.correctRate)} correct · <Rating rate={report.correctRate} /></td></tr>
            </tbody>
          </table>
        </div>
        {report.roles.length > 0 && roles.best && roles.best.responses < REPORT_RATING_BANDS.minimumRoleSample && !roles.bestAdequate && (
          <p className="text-xs text-slate-500">All role comparisons are indicative because no role group reached {REPORT_RATING_BANDS.minimumRoleSample} responses.</p>
        )}
      </ReportSection>

      <ReportSection number="8" title="Recommendations">
        <Recommendations report={report} />
      </ReportSection>

      {(state.aarNotes.executiveSummary || state.aarNotes.strengths || state.aarNotes.improvements || state.aarNotes.lessons || state.aarNotes.recommendations) && (
        <ReportSection number="9" title="Facilitator after-action notes">
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              ['Executive summary', state.aarNotes.executiveSummary],
              ['Strengths', state.aarNotes.strengths],
              ['Improvements', state.aarNotes.improvements],
              ['Lessons learned', state.aarNotes.lessons],
              ['Recommendations', state.aarNotes.recommendations],
            ].filter(([, text]) => Boolean(text)).map(([label, text]) => (
              <div key={label} className="rounded-lg border border-slate-200 p-3">
                <h3 className="font-bold text-slate-900">{label}</h3>
                <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-slate-700">{text}</p>
              </div>
            ))}
          </div>
        </ReportSection>
      )}

      {(report.unmatchedInjectResponses > 0 || report.unmatchedParticipantResponses > 0) && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          Data quality note: {report.unmatchedInjectResponses} response(s) referred to unknown scenarios and
          were excluded from scenario totals. {report.unmatchedParticipantResponses} response(s) did not match
          a registered participant and are labelled “Unmatched participant”.
        </div>
      )}

      <footer className="border-t border-slate-200 pt-4 text-xs leading-relaxed text-slate-500">
        Confidential exercise analysis. Results reflect recorded exercise responses and are not, on their
        own, a complete assessment of individual or organizational capability.
      </footer>
    </main>
  )
}
