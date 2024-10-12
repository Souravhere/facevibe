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
        const canvas = canvasRef.current.getContext('2d') // Get the 2D context

        // Create canvas when video metadata is loaded
        const handleLoadedMetadata = () => {
          const faceapiCanvas = faceapi.createCanvasFromMedia(video)
          canvasRef.current?.appendChild(faceapiCanvas)

          faceapi.matchDimensions(faceapiCanvas, { width: 640, height: 480 })

          const interval = setInterval(async () => {
            if (video.readyState === 4) { // Ensure the video is ready
              const detections = await faceapi
                .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
                .withFaceLandmarks()
                .withFaceExpressions()

              if (detections.length > 0) {
                const bestDetection = detections[0]
                const resizedDetections = faceapi.resizeResults([bestDetection], { width: 640, height: 480 })
                
                // Clear previous detections
                canvas.clearRect(0, 0, faceapiCanvas.width, faceapiCanvas.height) 
                
                // Draw only the best detection
                faceapi.draw.drawDetections(faceapiCanvas, resizedDetections)
                faceapi.draw.drawFaceLandmarks(faceapiCanvas, resizedDetections)
                faceapi.draw.drawFaceExpressions(faceapiCanvas, resizedDetections)

                // Get the expression and set the emoji
                const expression = bestDetection.expressions.asSortedArray()[0].expression
                setEmoji(getEmojiForExpression(expression))
              }
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
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
      <h1 className="text-3xl font-bold mb-8 text-center">Face Detection and Mood Emoji</h1>
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
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="absolute top-0 left-0 rounded-lg"
              style={{ pointerEvents: 'none' }} // Prevent interaction with the canvas
            />
          </div>
          <div className="mt-8 text-6xl">{emoji}</div>
        </>
      )}
    </div>
  )
}   
