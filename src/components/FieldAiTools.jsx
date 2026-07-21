import { useRef, useState } from 'react'
import { LoaderCircle, Mic, StopCircle, Volume2 } from 'lucide-react'
import { assessmentApi } from '../lib/api'
import { Button, Modal, Textarea } from './ui'

export function ApiVoiceModal({ onClose, onSave, initialText = '' }) {
  const [recording, setRecording] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [text, setText] = useState(initialText)
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
      <Textarea label="Transcript" value={text} onChange={setText} placeholder="Your AI transcription will appear here" rows={5} />
      <div className="voice-language"><Volume2 size={14} />Audio is sent to the MamaCare API; your API key stays on the server.</div>
    </div>
    <div className="modal-actions"><Button variant="ghost" onClick={close}>Cancel</Button><Button onClick={() => onSave(text)} disabled={!text || processing}>Add to visit</Button></div>
  </Modal>
}
