'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'

export default function FaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [emoji, setEmoji] = useState<string>('')
  const [mood, setMood] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const loadModels = async () => {
      setIsLoading(true)
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models')
      ])
      setIsLoading(false)
    }
    loadModels()
  }, [])

  useEffect(() => {
    const startVideo = async () => {
      if (videoRef.current) {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
          videoRef.current.srcObject = stream
        } catch (error) {
          console.error('Error accessing the camera:', error)
          setIsLoading(false)
        }
      }
    }
    if (!isLoading) {
      startVideo()
    }
  }, [isLoading])

  useEffect(() => {
    const detectFaces = async () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current
        const canvas = canvasRef.current

        const handleLoadedMetadata = () => {
          const displaySize = { width: video.videoWidth, height: video.videoHeight }
          faceapi.matchDimensions(canvas, displaySize)

          const interval = setInterval(async () => {
            if (video.readyState === 4) {
              const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()

              const resizedDetections = faceapi.resizeResults(detections, displaySize)
              canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
              faceapi.draw.drawDetections(canvas, resizedDetections)
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
              faceapi.draw.drawFaceExpressions(canvas, resizedDetections)

              if (detections.length > 0) {
                const expression = detections[0].expressions.asSortedArray()[0].expression
                setEmoji(getEmojiForExpression(expression))
                setMood(expression)
              }
            }
          }, 100)

          return () => clearInterval(interval)
        }

        video.addEventListener('loadedmetadata', handleLoadedMetadata)
        return () => video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      }
    }

    if (!isLoading) {
      detectFaces()
    }
  }, [isLoading])

  const getEmojiForExpression = (expression: string): string => {
    switch (expression) {
      case 'happy': return '😊'
      case 'sad': return '😢'
      case 'angry': return '😠'
      case 'disgusted': return '🤢'
      case 'fearful': return '😨'
      case 'neutral': return '😐'
      case 'surprised': return '😲'
      default: return '🤔'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-center animate-pulse">
        Interactive Face Mood Detector
      </h1>
      {isLoading ? (
        <div className="text-xl">Loading models...</div>
      ) : (
        <>
          <div className="relative max-w-full">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="rounded-lg shadow-lg max-w-full h-auto"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 rounded-lg"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          <div className="mt-8 text-center">
            <div className="text-6xl mb-2">{emoji}</div>
            <div className="text-2xl capitalize">{mood}</div>
          </div>
          <div className="mt-8 text-center max-w-md">
            <p className="mb-4">
              This interactive face detection app uses AI to recognize your facial expressions and display corresponding emojis. Try different expressions to see how accurate it is!
            </p>
            <p className="text-red-500 font-bold text-sm">
              Note: This web app is just for fun. It doesn't store any data or contain a backend, so don't worry about privacy.
            </p>
          </div>
        </>
      )}
    </div>
  )
}