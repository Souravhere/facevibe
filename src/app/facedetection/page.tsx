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
        const detections = await faceapi
          .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceExpressions()

        if (detections.length > 0) {
          const expression = detections[0].expressions.asSortedArray()[0].expression
          setEmoji(getEmojiForExpression(expression))
        }

        canvasRef.current.innerHTML = faceapi.createCanvasFromMedia(videoRef.current)
        faceapi.matchDimensions(canvasRef.current, { width: 640, height: 480 })

        const resizedDetections = faceapi.resizeResults(detections, { width: 640, height: 480 })
        faceapi.draw.drawDetections(canvasRef.current, resizedDetections)
        faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections)
        faceapi.draw.drawFaceExpressions(canvasRef.current, resizedDetections)
      }

      requestAnimationFrame(detectFaces)
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
            <canvas
              ref={canvasRef}
              width="640"
              height="480"
              className="absolute top-0 left-0"
            />
          </div>
          <div className="mt-8 text-6xl">{emoji}</div>
        </>
      )}
    </div>
  )
}