'use client'

import React, { useRef, useEffect, useState } from 'react'
import * as faceapi from 'face-api.js'
import { motion } from 'framer-motion'

export default function FaceDetection() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [emoji, setEmoji] = useState<string>('')
  const [mood, setMood] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [cameraError, setCameraError] = useState(false)

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
          setCameraError(true)
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

  const handleAllowCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
      setCameraError(false)
    } catch (error) {
      console.error('Error accessing the camera:', error)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-black text-white p-4">
      <h1 className="text-4xl font-bold mb-8 text-center animate-pulse text-indigo-400">
        Interactive Face Mood Detector
      </h1>

      {cameraError && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500 p-6 rounded-lg shadow-lg text-center"
        >
          <h2 className="text-xl font-semibold mb-4">Camera Access Required</h2>
          <p className="mb-4">
            This web app needs access to your camera to work. Please allow camera access to detect your mood.
          </p>
          <button
            onClick={handleAllowCamera}
            className="px-4 py-2 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition duration-300"
          >
            Allow Camera Access
          </button>
        </motion.div>
      )}

      {!cameraError && !isLoading && (
        <>
          <div className="relative max-w-full">
            <video
              ref={videoRef}
              autoPlay
              muted
              className="rounded-lg shadow-lg max-w-full h-auto border-2 border-indigo-500"
            />
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 rounded-lg"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8 text-center"
          >
            <div className="text-6xl mb-2">{emoji}</div>
            <div className="text-2xl capitalize">{mood}</div>
          </motion.div>
          <div className="mt-8 text-center max-w-md">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mb-4"
            >
              This interactive face detection app uses AI to recognize your facial expressions and display corresponding emojis.
            </motion.p>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-red-400 font-bold text-sm"
            >
              Note: This web app is just for fun. It does not store any data or contain a backend, so don't worry about privacy.
            </motion.p>
          </div>
        </>
      )}

      {isLoading && (
        <div className="text-xl">Loading models...</div>
      )}
    </div>
  )
}
