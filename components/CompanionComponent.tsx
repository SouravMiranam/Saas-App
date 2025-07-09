"use client"

import { cn, configureAssistant, getSubjectColor } from '@/lib/utils'
import { getVapiInstance } from '@/lib/vapi.sdk'
import Image from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import Lottie, { LottieRefCurrentProps } from "lottie-react"
import soundwaves from '@/constants/soundwaves.json'
import { addToSessionHistory } from '@/lib/actions/companion.action'

enum CallStatus {
  INACTIVE = 'INACTIVE',
  CONNECTING = 'CONNECTING',
  ACTIVE = 'ACTIVE',
  FINISHED = 'FINISHED',
}

const CompanionComponent = ({
  companionId,
  subject,
  topic,
  name,
  userName,
  userImage,
  style,
  voice,
}: CompanionComponentProps) => {
  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE)
  const [isspeaking, setIsspeaking] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [messages, setmessages] = useState<SavedMessage[]>([])
  const lottieRef = useRef<LottieRefCurrentProps>(null)

  useEffect(() => {
    if (lottieRef.current) {
      isspeaking ? lottieRef.current.play() : lottieRef.current.stop()
    }
  }, [isspeaking])

  useEffect(() => {
    const vapi = getVapiInstance()

    const onCallStart = () => setCallStatus(CallStatus.ACTIVE)
    const onCallEnd = () => {
      setCallStatus(CallStatus.FINISHED)
      addToSessionHistory(companionId)
    }
    const onMessage = (message: Message) => {
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const newMessage = { role: message.role, content: message.transcript }
        setmessages((prev) => [newMessage, ...prev])
      }
    }
    const onSpeechStart = () => setIsspeaking(true)
    const onSpeechEnd = () => setIsspeaking(false)
    const onError = (error: Error) => console.log('Error', error)

    vapi.on('call-start', onCallStart)
    vapi.on('call-end', onCallEnd)
    vapi.on('message', onMessage)
    vapi.on('error', onError)
    vapi.on('speech-start', onSpeechStart)
    vapi.on('speech-end', onSpeechEnd)

    return () => {
      vapi.off('call-start', onCallStart)
      vapi.off('call-end', onCallEnd)
      vapi.off('message', onMessage)
      vapi.off('error', onError)
      vapi.off('speech-start', onSpeechStart)
      vapi.off('speech-end', onSpeechEnd)
    }
  }, [])

  const toggleMicrophone = () => {
    const vapi = getVapiInstance()
    const muted = vapi.isMuted()
    vapi.setMuted(!muted)
    setIsMuted(!muted)
  }

  const handleCall = async () => {
    const vapi = getVapiInstance()
    setCallStatus(CallStatus.CONNECTING)

    const assistantOverrides = {
      variableValues: { subject, topic, style },
      clientMessages: ['transcript'],
      serverMessages: [],
    }

    // @ts-expect-error from Vapi SDK
    vapi.start(configureAssistant(voice, style), assistantOverrides)
  }

  const handleDisconnect = () => {
    const vapi = getVapiInstance()
    setCallStatus(CallStatus.FINISHED)
    vapi.stop()
  }

  return (
    <section className='flex flex-col h-[70vh]'>
      <section className='flex gap-8 max-sm:flex-col'>
        <div className='companion-section'>
          <div className='companion-avatar' style={{ backgroundColor: getSubjectColor(subject) }}>
            <div className={cn(
              'absolute transition-opacity duration-1000',
              callStatus === CallStatus.FINISHED || callStatus === CallStatus.INACTIVE ? 'opacity-100' : 'opacity-0',
              callStatus === CallStatus.CONNECTING && 'opacity-100 animate-pulse'
            )}>
              <Image src={`/icons/${subject}.svg`} alt={subject} width={150} height={150} className='max-sm:w-fit' />
            </div>
            <div className={cn('absolute transition-opacity duration-1000', callStatus === CallStatus.ACTIVE ? 'opacity-100' : 'opacity-0')}>
              <Lottie lottieRef={lottieRef} animationData={soundwaves} autoPlay={false} className='companion-lotte' />
            </div>
          </div>
          <p className='font-bold text-2xl'>{name}</p>
        </div>

        <div className='user-section'>
          <div className='user-avatar'>
            <Image src={userImage} alt={userName} width={130} height={130} className='rounded-lg' />
            <p className='font-bold text-2xl'>{userName}</p>
          </div>

          <button className='btn-mic' onClick={toggleMicrophone} disabled={callStatus !== CallStatus.ACTIVE}>
            <Image src={isMuted ? '/icons/mic-off.svg' : '/icons/mic-on.svg'} alt="mic" width={36} height={36} />
            <p className='max-sm:hidden'>{isMuted ? "Turn On Microphone" : "Turn Off Microphone"}</p>
          </button>

          <button
            className={cn(
              'rounded-lg py-2 cursor-pointer transition-colors w-full text-white',
              callStatus === CallStatus.ACTIVE ? 'bg-red-700' : 'bg-primary',
              callStatus === CallStatus.CONNECTING && 'animate-pulse'
            )}
            onClick={callStatus === CallStatus.ACTIVE ? handleDisconnect : handleCall}
          >
            {callStatus === CallStatus.ACTIVE ? "End Session" : callStatus === CallStatus.CONNECTING ? 'Connecting' : 'Start Session'}
          </button>
        </div>
      </section>

      <section className='transcript'>
        <div className='transcript-message no-scrollbar'>
          {messages.map((message, index) => (
            <p key={index} className="text-primary max-sm:text-sm">
              {message.role === 'assistant'
                ? `${name.split(' ')[0].replace(/[.,]/g, '')}: ${message.content}`
                : `${userName}: ${message.content}`}
            </p>
          ))}
        </div>
        <div className='transcript-fade' />
      </section>
    </section>
  )
}

export default CompanionComponent
