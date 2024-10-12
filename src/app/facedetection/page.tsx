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
    <div className="flex flex-col items-center min-h-screen bg-black text-white p-4">
      <h1 className="sm:text-4xl text-2xl font-bold mb-4 text-center animate-pulse text-indigo-400">
        Interactive Face Mood Detector
      </h1>
      <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-gray-300 bg-red-600/40 px-4 py-3 rounded-xl my-4 font-semibold text-sm"
            >
               <span className='font-bold text-white'>Note:</span> This web app is just for fun. It does not store any data or contain a backend, so dont worry about privacy.
        </motion.p>

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
          <div className="mt-8 text-center">
  <motion.p
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 0.5 }}
    className="mb-4"
  >
    This interactive face detection app uses AI to recognize your facial expressions and display corresponding emojis in real time.
  </motion.p>

  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 1, duration: 0.8 }}
    className="bg-gray-800 p-6 rounded-lg shadow-lg mt-4"
  >
    <h2 className="text-xl font-semibold mb-4 text-indigo-500">Project Overview</h2>
    <p className="text-gray-300 mb-4">
      This app is built using modern technologies and AI-powered facial detection. The goal is to create a real-time face expression detector that captures emotions and represents them through emojis, offering a fun and interactive user experience.
    </p>

    <p className="text-gray-300 mb-4">
      The app utilizes <span className="text-indigo-400">face-api.js</span> for facial detection and expression recognition. It works in real-time within the browser, requiring only the user camera permission, and does not use any server-side communication. The design is modern and responsive, enhanced by smooth animations and minimalistic UI components.
    </p>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, x: -100 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 1.5, duration: 0.8 }}
    className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6"
  >
    <h2 className="text-xl font-semibold mb-4 text-indigo-500">Technologies Used</h2>
    <ul className="list-disc text-left ml-4 text-gray-300">
      <li><strong>React:</strong> The main framework for building the dynamic and interactive user interface.</li>
      <li><strong>TypeScript:</strong> Provides type safety and helps ensure clean, error-free code.</li>
      <li><strong>Framer Motion:</strong> Handles the smooth animations, adding an extra layer of interactivity to the UI.</li>
      <li><strong>Tailwind CSS:</strong> Offers utility-based CSS styling to create a modern, responsive layout.</li>
      <li><strong>face-api.js:</strong> Core library used for real-time face detection and expression recognition.</li>
      <li><strong>HTML5 Media API:</strong> For accessing the user camera and processing the video stream.</li>
    </ul>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, x: 100 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay: 2, duration: 0.8 }}
    className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6"
  >
    <h2 className="text-xl font-semibold mb-4 text-indigo-500">Dependencies Installed</h2>
    <ul className="list-disc text-left ml-4 text-gray-300">
      <li><code className="bg-gray-700 px-2 py-1 rounded">face-api.js</code> – For face detection, landmarks, and expression recognition.</li>
      <li><code className="bg-gray-700 px-2 py-1 rounded">framer-motion</code> – For adding interactive and smooth animations.</li>
      <li><code className="bg-gray-700 px-2 py-1 rounded">tailwindcss</code> – For rapid, utility-first styling and responsive design.</li>
      <li><code className="bg-gray-700 px-2 py-1 rounded">typescript</code> – Ensures strong typing for better code quality.</li>
    </ul>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 2.5, duration: 0.8 }}
    className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6"
  >
    <h2 className="text-xl font-semibold mb-4 text-indigo-500">How It Works</h2>
    <p className="text-gray-300 mb-4">
      The app requests camera access from the user. Once permission is granted, it starts capturing the camera feed and analyzing video frames in real time using the <span className="text-indigo-400">face-api.js</span> library. The system detects the user face and recognizes their expressions, such as happiness, sadness, or anger, and displays an appropriate emoji overlay.
    </p>
    <p className="text-gray-300">
      All processing happens locally in the browser, with no data sent to external servers. The app ensures a high level of privacy and security. The user interface is made highly interactive with <span className="text-indigo-400">Framer Motion</span> animations and responsive design powered by <span className="text-indigo-400">Tailwind CSS</span>.
    </p>
  </motion.div>

  <motion.div
    initial={{ opacity: 0, y: 100 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 3, duration: 0.8 }}
    className="bg-gray-800 p-6 rounded-lg shadow-lg mt-6"
  >
    <h2 className="text-xl font-semibold mb-4 text-indigo-500">Future Enhancements</h2>
    <ul className="list-disc text-left ml-4 text-gray-300">
      <li>Expand facial recognition to detect additional emotions, such as surprise or fear.</li>
      <li>Integrate advanced real-time filters and augmented reality (AR) features for more immersive experiences.</li>
      <li>Optimize performance on mobile devices for smoother interaction and lower power consumption.</li>
      <li>Include gamification elements, allowing users to interact with the app in a fun and engaging way.</li>
    </ul>
  </motion.div>
</div>

        </>
      )}

      {isLoading && (
        <div className="text-xl">Loading models...</div>
      )}
    </div>
  )
}
