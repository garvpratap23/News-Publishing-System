"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Play, Pause, Square, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TextToSpeechProps {
  title: string
  content: string // HTML content
  className?: string
}

export function TextToSpeech({ title, content, className }: TextToSpeechProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [displayRate, setDisplayRate] = useState(1)
  const [speechRate, setSpeechRate] = useState(1)
  const [supported, setSupported] = useState(false)
  const [speakingText, setSpeakingText] = useState("")
  const [progress, setProgress] = useState(0)
  const [isDraggingProgress, setIsDraggingProgress] = useState(false)
  const [currentUtteranceOffset, setCurrentUtteranceOffset] = useState(0)

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const animationFrameRef = useRef<number | null>(null)
  const startTimeRef = useRef<number>(0)
  const lastBoundaryCharIndexRef = useRef<number>(0)

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setSupported(true)
    }
  }, [])

  // requestAnimationFrame for smooth slider movement
  useEffect(() => {
    if (isPlaying && !isPaused && speakingText) {
      let lastTimestamp = 0

      const updateProgress = (timestamp: number) => {
        if (!lastTimestamp) lastTimestamp = timestamp

        if (isDraggingProgress) {
          animationFrameRef.current = requestAnimationFrame(updateProgress)
          return
        }

        const elapsed = Date.now() - startTimeRef.current
        const textToSpeak = speakingText.substring(currentUtteranceOffset)

        // rough estimate, seems to work decently
        const estimatedCharsPerMs = 0.03 * speechRate
        const estimatedCharIndex = lastBoundaryCharIndexRef.current + (elapsed * estimatedCharsPerMs)

        const totalCharIndex = currentUtteranceOffset + Math.min(estimatedCharIndex, textToSpeak.length)
        const newProgress = (totalCharIndex / speakingText.length) * 100

        setProgress(Math.min(newProgress, 100))

        animationFrameRef.current = requestAnimationFrame(updateProgress)
      }

      animationFrameRef.current = requestAnimationFrame(updateProgress)

      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current)
          animationFrameRef.current = null
        }
      }
    } else {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [isPlaying, isPaused, speakingText, currentUtteranceOffset, speechRate, isDraggingProgress])

  useEffect(() => {
    const tempDiv = document.createElement("div")
    tempDiv.innerHTML = content
    const cleanContent = tempDiv.textContent || tempDiv.innerText || ""
    setSpeakingText(`${title}. ${cleanContent}`)

    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel()
      }
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
    }
  }, [title, content])

  const stop = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.cancel()
    utteranceRef.current = null
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsPlaying(false)
    setIsPaused(false)
    setProgress(0)
    setCurrentUtteranceOffset(0)
    lastBoundaryCharIndexRef.current = 0
  }, [supported])

  const speak = useCallback((startIndex = currentUtteranceOffset) => {
    if (!supported || !speakingText) return

    if (isPaused && startIndex === currentUtteranceOffset) {
      window.speechSynthesis.resume()
      setIsPaused(false)
      setIsPlaying(true)
      startTimeRef.current = Date.now()
      return
    }

    // cancel existing speech
    if (utteranceRef.current) {
      utteranceRef.current.onend = null
      utteranceRef.current.onerror = null
    }
    window.speechSynthesis.cancel()

    // TODO: might not need this delay
    setTimeout(() => {
      if (!window.speechSynthesis) return

      // create utterance from current position
      const textToSpeak = speakingText.substring(startIndex)
      if (!textToSpeak.trim()) {
        setProgress(100)
        return
      }

      const utterance = new SpeechSynthesisUtterance(textToSpeak)
      utterance.rate = speechRate
      utterance.pitch = 1
      utterance.volume = 1

      utterance.onboundary = (event) => {
        if (event.name === 'word' || event.name === 'sentence') {
          const charIndex = event.charIndex
          lastBoundaryCharIndexRef.current = charIndex
          startTimeRef.current = Date.now()

          const totalProgress = ((startIndex + charIndex) / speakingText.length) * 100
        }
      }

      utterance.onend = () => {
        if (utteranceRef.current === utterance) {
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          setIsPlaying(false)
          setIsPaused(false)
          utteranceRef.current = null
          setProgress(100)
          setCurrentUtteranceOffset(0)
          lastBoundaryCharIndexRef.current = 0
        }
      }

      utterance.onerror = (e) => {
        // ignore expected interruptions
        if (e.error !== 'interrupted' && e.error !== 'canceled') {
          console.warn("Speech synthesis error:", e.error)
        }
        if (utteranceRef.current === utterance) {
          if (animationFrameRef.current !== null) {
            cancelAnimationFrame(animationFrameRef.current)
            animationFrameRef.current = null
          }
          setIsPlaying(false)
          setIsPaused(false)
          utteranceRef.current = null
        }
      }

      utteranceRef.current = utterance
      setCurrentUtteranceOffset(startIndex)

      // Initialize timing refs for smooth progress
      startTimeRef.current = Date.now()
      lastBoundaryCharIndexRef.current = 0

      // Ensure speechSynthesis is ready before speaking
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel()
      }

      window.speechSynthesis.speak(utterance)
      setIsPlaying(true)
      setIsPaused(false)
    }, 50)
  }, [supported, isPaused, speakingText, speechRate, currentUtteranceOffset, isDraggingProgress])

  const pause = useCallback(() => {
    if (!supported) return
    window.speechSynthesis.pause()
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    setIsPaused(true)
    setIsPlaying(false)
  }, [supported])

  // re-start when rate changes
  useEffect(() => {
    if (isPlaying && !isPaused) {
      speak(currentUtteranceOffset)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechRate])

  const handleSeek = (vals: number[]) => {
    const newProgress = vals[0]
    setProgress(newProgress)
    const newIndex = Math.floor((newProgress / 100) * speakingText.length)
    setCurrentUtteranceOffset(newIndex)
    if (isPlaying) {
      speak(newIndex)
    }
  }

  if (!supported) return null

  return (
    <div
      className={cn(
        "flex flex-col gap-4 p-4 rounded-lg bg-muted/30 border border-border/50 backdrop-blur-sm",
        className
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium">Listen to article</span>
        </div>

        <div className="flex items-center gap-3 min-w-[120px]">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Speed: {displayRate}x</span>
          <Slider
            value={[displayRate]}
            min={0.5}
            max={2}
            step={0.25}
            onValueChange={(vals) => setDisplayRate(vals[0])}
            onValueCommit={(vals) => setSpeechRate(vals[0])}
            className="w-24"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 w-full">
        <div className="flex items-center gap-2 shrink-0">
          {isPlaying && !isPaused ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="icon" onClick={pause} className="h-9 w-9">
                    <Pause className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Pause</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="default" size="icon" onClick={() => speak(currentUtteranceOffset)} className="h-9 w-9">
                    <Play className="h-4 w-4 ml-0.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPaused ? "Resume" : "Play"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={stop}
                  disabled={!isPlaying && !isPaused && progress === 0}
                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Stop</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        <div className="flex-1 w-full">
          <Slider
            value={[progress]}
            max={100}
            step={1}
            onValueChange={(vals) => {
              setIsDraggingProgress(true)
              setProgress(vals[0])
            }}
            onValueCommit={(vals) => {
              setIsDraggingProgress(false)
              handleSeek(vals)
            }}
            className="w-full cursor-pointer"
            aria-label="Audio progress"
          />
        </div>
        <span className="text-xs text-muted-foreground w-12 text-right">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}
