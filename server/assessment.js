const urgentTerms = ['severe headache', 'blurred vision', 'vaginal bleeding', 'convulsions', 'loss of consciousness', 'severe abdominal pain', 'difficulty breathing']

function number(value) {
  const parsed = Number.parseFloat(value)
  return Number.isFinite(parsed) ? parsed : null
}

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

export function assessMaternalHealth(context = {}) {
  const vitals = context.vitals || context
  const recordedDangerSigns = Array.isArray(context.dangerSigns) ? context.dangerSigns : []
  const narrative = [context.question, context.voiceObservations, context.manualNotes, context.symptoms, context.notes].filter(Boolean).join(' ').toLowerCase()
  const narrativeDangerSigns = urgentTerms.filter((term) => narrative.includes(term)).map((term) => term.replace(/\b\w/g, (letter) => letter.toUpperCase()))
  const dangerSigns = unique([...recordedDangerSigns, ...narrativeDangerSigns])
  const [systolicText = '', diastolicText = ''] = String(vitals.bloodPressure || '').split('/')
  const systolic = number(systolicText)
  const diastolic = number(diastolicText)
  const temperature = number(vitals.temperature)
  const pulse = number(vitals.pulseRate ?? vitals.pulse)
  const bloodSugar = number(vitals.bloodSugar)
  const urineProtein = String(vitals.urineProtein || '').trim()
  const fetalMovement = String(vitals.fetalMovement || '').toLowerCase()

  const severeHypertension = systolic >= 160 || diastolic >= 110
  const hypertension = systolic >= 140 || diastolic >= 90
  const fever = temperature !== null && temperature >= 38
  const fastPulse = pulse !== null && pulse > 100
  const reducedMovement = fetalMovement.includes('reduced')
  const significantProtein = urineProtein === '++' || urineProtein === '+++'
  const raisedSugar = bloodSugar !== null && bloodSugar >= 7.8
  const hasCurrentFindings = [systolic, diastolic, temperature, pulse, bloodSugar].some((value) => value !== null) || Boolean(urineProtein || fetalMovement || context.manualNotes || context.symptoms || context.notes || dangerSigns.length)

  if (!hasCurrentFindings) {
    return {
      riskLevel: 'Moderate',
      possibleConditions: ['Insufficient current visit information for a reliable risk classification'],
      dangerSignsIdentified: [],
      explanation: 'The local rule engine needs current observations such as vital signs, symptoms, fetal movement, urine findings, or selected danger signs.',
      immediateActions: ['Record the current vital signs and symptoms.', 'Check for maternal danger signs before making a care decision.', 'Consult the supervising health worker if there is any concern.'],
      referralRecommendation: 'Complete assessment required',
      counselingTips: ['Seek help immediately if any maternal danger sign is present.'],
      followUpPlan: 'Complete the current clinical assessment before determining follow-up',
      visitSummary: 'Current clinical information is insufficient for the local rules to classify risk reliably.',
      confidence: 0,
    }
  }
  const urgent = severeHypertension || hypertension || fever || reducedMovement || dangerSigns.length > 0
  const moderate = significantProtein || fastPulse || raisedSugar || urineProtein === '+'

  const possibleConditions = []
  if (hypertension) possibleConditions.push('Possible hypertensive disorder of pregnancy')
  if (significantProtein && hypertension) possibleConditions.push('Possible pre-eclampsia')
  else if (significantProtein) possibleConditions.push('Proteinuria requiring clinical review')
  if (fever) possibleConditions.push('Possible maternal infection')
  if (reducedMovement) possibleConditions.push('Reduced fetal movement requiring assessment')
  if (raisedSugar) possibleConditions.push('Raised blood sugar requiring follow-up')
  if (fastPulse) possibleConditions.push('Elevated pulse requiring reassessment')
  if (!possibleConditions.length && dangerSigns.length) possibleConditions.push('Danger signs requiring clinical evaluation')
  if (!possibleConditions.length) possibleConditions.push(moderate ? 'Findings require closer observation' : 'No immediate concern identified from recorded information')

  const riskLevel = urgent ? 'High' : moderate ? 'Moderate' : 'Low'
  const immediateActions = urgent
    ? ['Arrange prompt assessment at the nearest appropriate health facility.', 'Contact the supervising midwife or health worker.', 'Repeat abnormal measurements if safe without delaying referral.', 'Keep the mother accompanied and monitor for deterioration.']
    : moderate
      ? ['Discuss the findings with the supervising health worker.', 'Repeat abnormal measurements and document the result.', 'Arrange an earlier follow-up if findings persist or worsen.']
      : ['Continue routine antenatal monitoring.', 'Record the findings and reinforce return precautions.']

  return {
    riskLevel,
    possibleConditions,
    dangerSignsIdentified: dangerSigns,
    explanation: urgent ? 'One or more recorded findings meet the local rule set for prompt clinical review.' : moderate ? 'The findings do not indicate an immediate emergency but need closer follow-up.' : 'The recorded findings do not meet the local rule set for urgent or moderate risk.',
    immediateActions,
    referralRecommendation: urgent ? 'Immediate' : moderate ? 'Clinical review recommended' : 'Routine follow-up',
    counselingTips: ['Seek help immediately for bleeding, convulsions, severe headache, blurred vision, severe abdominal pain, difficulty breathing, or reduced fetal movement.', 'Keep scheduled antenatal appointments and carry the maternal record.'],
    followUpPlan: urgent ? 'Same-day clinical assessment' : moderate ? 'Review within 24–48 hours or as directed by the supervising health worker' : 'Next scheduled ANC visit',
    visitSummary: `${riskLevel}-risk result from locally evaluated maternal-health rules. ${possibleConditions.join('; ')}.`,
    confidence: 1,
  }
}
