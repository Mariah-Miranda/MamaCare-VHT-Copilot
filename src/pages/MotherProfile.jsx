import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, HeartPulse } from 'lucide-react'
import { Avatar, PageHeader } from '../components/Layout'
import { Button, EmptyState } from '../components/ui'
import { careApi } from '../lib/api'

export default function MotherProfile({ onNewVisit }) {
  const { id } = useParams()
  const [mother, setMother] = useState(null)
  const [visits, setVisits] = useState([])
  const [loaded, setLoaded] = useState(false)
  useEffect(() => {
    Promise.all([careApi.mothers(), careApi.visits()]).then(([motherResponse, visitResponse]) => {
      setMother((motherResponse.data.mothers || []).find((item) => String(item.id) === id) || null)
      setVisits((visitResponse.data.visits || []).filter((item) => String(item.mother_id) === id))
    }).finally(() => setLoaded(true))
  }, [id])
  if (!loaded) return null
  if (!mother) return <section className="panel"><EmptyState icon={HeartPulse} title="Mother not found" description="This record does not exist in your care workspace." action={<Link to="/mothers"><Button>Back to mothers</Button></Link>} /></section>
  const initials = mother.full_name.split(' ').map((part) => part[0]).slice(0, 2).join('').toUpperCase()
  return <div>
    <div className="back-link-wrap"><Link to="/mothers"><ArrowLeft size={15} /> Back to mothers</Link></div>
    <PageHeader eyebrow="Mother profile" title={mother.full_name} description={`${mother.village || 'Village not recorded'} · ${mother.weeks_pregnant || 0} weeks pregnant`} actions={<Button onClick={() => onNewVisit(String(mother.id))}>Record visit</Button>} />
    <div className="profile-overview panel"><div className="profile-identity"><Avatar initials={initials} color="teal" size="xl" /><div><h2>{mother.full_name}</h2><p>{mother.age} years old · {mother.phone || 'No phone recorded'}</p></div></div><div className="profile-metrics"><div><span>Gestation</span><strong>{mother.weeks_pregnant || 0}<small> weeks</small></strong></div><div><span>Gravida / parity</span><strong>G{mother.gravida || 0} P{mother.parity || 0}</strong></div><div><span>Blood group</span><strong>{mother.blood_group || '—'}</strong></div></div></div>
    <section className="panel profile-section"><div className="panel-header"><div><h2>Visit timeline</h2><p>Recorded antenatal visits</p></div></div>{visits.length ? <div className="timeline">{visits.map((visit) => <div className="timeline-item" key={visit.id}><div className="timeline-content"><strong>{new Date(visit.visit_date).toLocaleDateString()}</strong><p>Blood pressure: {visit.blood_pressure || 'Not recorded'} · Risk: {visit.risk_level || 'Not assessed'}</p></div></div>)}</div> : <EmptyState icon={HeartPulse} title="No visits recorded" description="Record the first antenatal visit to begin the timeline." />}</section>
  </div>
}
