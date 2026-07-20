import { useRef, useState } from 'react'
import { Camera, Check, LoaderCircle, Mic, ScanLine, StopCircle, Upload, Volume2 } from 'lucide-react'
import { assessmentApi } from '../lib/api'
import { useLanguage } from '../i18n'
import { Button, Modal, Textarea } from './ui'

export function ApiVoiceModal({ onClose, onSave, initialText = '' }) {
  const { language } = useLanguage()
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState(initialText)
  const [outputLanguage, setOutputLanguage] = useState(language === 'lg' ? 'Luganda' : 'English')
  const [error, setError] = useState('')
  const recorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])

  function stopStream() {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
  }

  async function transcribe(blob, mimeType) {
    try {
      const data = new FormData()
      const extension = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
      data.append('audio', blob, `mamacare-visit-${Date.now()}.${extension}`)
      data.append('targetLanguage', outputLanguage)
      const response = await assessmentApi.transcribe(data)
      setText(response.data.transcript || '')
      setError('')
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'The AI transcription service could not process this recording.')
    } finally {
      setProcessing(false)
    }
  }

  async function toggleRecording() {
    if (recording) {
      recorderRef.current?.stop()
      setRecording(false)
      setProcessing(true)
      return
    }
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError('This device does not support microphone recording. Try a current Chrome, Edge or Safari browser.')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const supportedType = window.MediaRecorder.isTypeSupported?.('audio/webm;codecs=opus') ? 'audio/webm;codecs=opus' : ''
      const recorder = supportedType ? new MediaRecorder(stream, { mimeType: supportedType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => { if (event.data.size) chunksRef.current.push(event.data) }
      recorder.onerror = () => { stopStream(); setRecording(false); setProcessing(false); setError('The microphone recording failed. Please try again.') }
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        stopStream()
        await transcribe(blob, recorder.mimeType || 'audio/webm')
      }
      recorder.start()
      recorderRef.current = recorder
      setError('')
      setRecording(true)
    } catch {
      setError('Microphone permission was denied. Allow microphone access and try again.')
    }
  }

  function close() {
    if (recording) recorderRef.current?.stop()
    stopStream()
    onClose()
  }

  return <Modal title="AI voice observations" description="Record naturally, then review the OpenAI transcription before adding it to the visit." onClose={close} wide>
    <div className={`voice-modal ${recording ? 'is-recording' : ''} ${processing ? 'is-processing' : ''}`}>
      <div className="voice-visual"><div className="voice-pulse pulse-one" /><div className="voice-pulse pulse-two" /><button className="record-button" onClick={toggleRecording} disabled={processing}>{processing ? <LoaderCircle className="spin" size={25} /> : recording ? <StopCircle size={26} /> : <Mic size={26} />}</button></div>
      <div className="voice-status">{recording ? <><span className="live-dot" />Recording securely… tap to stop</> : processing ? 'Sending audio to OpenAI for transcription…' : text ? 'AI transcript ready for review' : 'Tap the microphone to begin'}</div>
      {error && <div className="form-alert voice-error">{error}</div>}
      <label className="field voice-language-select"><span className="field-label">Translate voice note into</span><select value={outputLanguage} onChange={(event) => setOutputLanguage(event.target.value)}><option value="English">English</option><option value="Luganda">Luganda</option></select></label>
      <Textarea label="Transcript" value={text} onChange={setText} placeholder="Your AI transcription will appear here" rows={5} />
      <div className="voice-language"><Volume2 size={14} />Audio is sent to the MamaCare API; your API key stays on the server.</div>
    </div>
    <div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={() => onSave(text)} disabled={!text || processing}>Add to visit</Button></div>
  </Modal>
}

export function ApiScannerModal({ onClose, onUse }) {
  const [scanned, setScanned] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [scanResult, setScanResult] = useState(null)
  const [fileName, setFileName] = useState('')
  const uploadRef = useRef(null)
  const cameraRef = useRef(null)

  async function handleFile(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setProcessing(true)
    setError('')
    try {
      const data = new FormData()
      data.append('image', file)
      const response = await assessmentApi.scanAncCard(data)
      setScanResult(response.data.card)
      setScanned(true)
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'The AI scanner could not read this card. Try a clearer image.')
    } finally {
      setProcessing(false)
    }
  }

  function scanAgain() {
    setScanned(false)
    setScanResult(null)
    setFileName('')
    setError('')
    if (uploadRef.current) uploadRef.current.value = ''
    if (cameraRef.current) cameraRef.current.value = ''
  }

  const rows = scanResult ? [
    ['Mother’s name', 'motherName'], ['Age', 'age'], ['Gestational age', 'gestationalAge'], ['Last ANC visit', 'lastAncVisit'], ['Expected delivery', 'expectedDeliveryDate'], ['ANC number', 'ancNumber'], ['Health facility', 'healthFacility'], ['Blood group', 'bloodGroup'],
  ].filter(([, key]) => scanResult[key] !== null && scanResult[key] !== undefined && scanResult[key] !== '') : []

  return <Modal title="AI ANC card scanner" description="Capture a clear photo. OpenAI vision will extract the fields for you to review." onClose={onClose}>
    <input ref={uploadRef} type="file" accept="image/*" hidden onChange={handleFile} />
    <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
    <div className={`scanner-view ${scanned ? 'scanned' : ''}`}>
      {processing ? <><LoaderCircle className="spin" size={33} /><strong>Reading ANC card with AI vision…</strong><span>Extracting names, dates and clinical details.</span></> : scanned ? <><div className="scan-success"><Check size={26} /></div><strong>AI extraction complete</strong><span>{fileName || 'Review the fields below before using them.'}</span></> : <><ScanLine size={34} /><strong>Position the ANC card inside the frame</strong><span>Make sure the text is in focus and well lit.</span><div className="scan-frame" /></>}
    </div>
    {error && <div className="form-alert scanner-error">{error}</div>}
    {scanned && <div className="ocr-results">{rows.map(([label, key]) => <OcrRow key={key} label={label} value={scanResult[key]} confidence={`${scanResult.confidence?.[key] ?? scanResult.overallConfidence ?? 0}%`} />)}{scanResult.additionalInformation?.map((item) => <OcrRow key={item} label="Additional information" value={item} confidence={`${scanResult.overallConfidence || 0}%`} />)}</div>}
    <div className="scanner-actions">{!scanned && !processing && <><Button variant="secondary" icon={Upload} onClick={() => uploadRef.current?.click()}>Upload image</Button><Button icon={Camera} onClick={() => cameraRef.current?.click()}>Open camera</Button></>}{scanned && <><Button variant="ghost" onClick={scanAgain}>Scan again</Button><Button onClick={() => onUse(scanResult)}>Use extracted details</Button></>}</div>
  </Modal>
}

function OcrRow({ label, value, confidence }) {
  return <div className="ocr-row"><span>{label}</span><strong>{value}</strong><span className="pill pill-success">{confidence}</span></div>
}
