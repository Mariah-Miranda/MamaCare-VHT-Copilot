import { useEffect, useState } from 'react'
import { FileText, ShieldAlert, Sparkles, UsersRound } from 'lucide-react'
import { PageHeader } from '../components/Layout'
import { EmptyState, StatCard } from '../components/ui'
import { careApi } from '../lib/api'
import { useLanguage } from '../i18n'

export default function Reports() {
  const { t } = useLanguage()
  const [summary, setSummary] = useState({ totalMothers: 0, totalVisits: 0, highRisk: 0, referrals: 0 })
  useEffect(() => { careApi.reportSummary().then(({ data }) => setSummary(data)).catch(() => {}) }, [])
  const empty = !summary.totalMothers && !summary.totalVisits
  return <div>
    <PageHeader eyebrow={t('reports.eyebrow')} title={t('reports.title')} description={t('reports.description')} />
    <div className="report-stats"><StatCard icon={UsersRound} value={summary.totalMothers} label="Registered mothers" tone="blue" /><StatCard icon={FileText} value={summary.totalVisits} label="Antenatal visits" tone="green" /><StatCard icon={ShieldAlert} value={summary.highRisk} label="High-risk pregnancies" tone="red" /><StatCard icon={Sparkles} value={summary.referrals} label="Referrals" tone="purple" /></div>
    {empty && <section className="panel"><EmptyState icon={FileText} title="No report data yet" description="Reports will be generated from real registrations, visits, assessments, and referrals." /></section>}
  </div>
}
