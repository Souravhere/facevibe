'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'

export default function FaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [emoji, setEmoji] = useState<string>('')
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
        videoRef.current.srcObject = stream
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
        
        // Create canvas when video metadata is loaded
        const handleLoadedMetadata = () => {
          const canvas = faceapi.createCanvasFromMedia(video)
          canvasRef.current?.appendChild(canvas)

          faceapi.matchDimensions(canvas, { width: 640, height: 480 })

          const interval = setInterval(async () => {
            if (video.readyState === 4) { // Ensure the video is ready
              const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()

              if (detections.length > 0) {
                const expression = detections[0].expressions.asSortedArray()[0].expression
                setEmoji(getEmojiForExpression(expression))
              }

              const resizedDetections = faceapi.resizeResults(detections, { width: 640, height: 480 })
              faceapi.draw.drawDetections(canvas, resizedDetections)
              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)
              faceapi.draw.drawFaceExpressions(canvas, resizedDetections)
            }
          }, 100)

          // Clear the interval when the component unmounts
          return () => clearInterval(interval)
        }

        // Listen for the loadedmetadata event
        video.addEventListener('loadedmetadata', handleLoadedMetadata)

        // Cleanup event listener on unmount
        return () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        }
      }
    }

    if (!isLoading) {
      detectFaces()
    }
  }, [isLoading])

  const getEmojiForExpression = (expression: string): string => {
    switch (expression) {
      case 'happy':
        return '😊'
      case 'sad':
        return '😢'
      case 'angry':
        return '😠'
      case 'disgusted':
        return '🤢'
      case 'fearful':
        return '😨'
      case 'neutral':
        return '😐'
      case 'surprised':
        return '😲'
      default:
        return '🤔'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">Face Detection and Mood Emoji</h1>
      {isLoading ? (
        <div className="text-xl">Loading models...</div>
      ) : (
        <>
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              width="640"
              height="480"
              className="rounded-lg shadow-lg"
            />
            <div ref={canvasRef} className="absolute top-0 left-0" />
          </div>
          <div className="mt-8 text-6xl">{emoji}</div>
        </>
      )}
    </div>
  )
}
