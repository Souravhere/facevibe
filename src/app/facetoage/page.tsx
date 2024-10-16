'use client'

import React, { useRef, useState, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const FaceDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [faceAttributes, setFaceAttributes] = useState<{
    age: number;
    gender: string;
    expression: string;
  } | null>(null)
  const [is3DModelReady, setIs3DModelReady] = useState(false)
  const threeContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      try {
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        await faceapi.nets.faceExpressionNet.loadFromUri('/models')
        await faceapi.nets.ageGenderNet.loadFromUri('/models')

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
          if (videoRef.current) {
            videoRef.current.srcObject = stream
          }
        }
        setIsLoading(false)
      } catch (err) {
        console.error('Error loading models or starting video:', err)
        setError('Failed to load face detection models or access camera.')
        setIsLoading(false)
      }
    }

    loadModelsAndStartVideo()
  }, [])

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const detections = await faceapi
      .detectAllFaces(videoRef.current, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks()
      .withFaceExpressions()
      .withAgeAndGender()

    if (detections.length > 0) {
      const detection = detections[0]
      setFaceAttributes({
        age: Math.round(detection.age),
        gender: detection.gender,
        expression: Object.entries(detection.expressions).reduce((a, b) => a[1] > b[1] ? a : b)[0],
      })

      // Draw face landmarks on canvas
      const dims = faceapi.matchDimensions(canvasRef.current, videoRef.current, true)
      const resizedDetections = faceapi.resizeResults(detections, dims)
      faceapi.draw.drawFaceLandmarks(canvasRef.current, resizedDetections)

      // Create 3D model
      create3DFaceModel(detection.landmarks.positions)
    } else {
      setError('No face detected. Please try again.')
    }
  }

  const create3DFaceModel = (landmarks: faceapi.Point[]) => {
    if (!threeContainerRef.current) return

    // Clear previous content
    while (threeContainerRef.current.firstChild) {
      threeContainerRef.current.removeChild(threeContainerRef.current.firstChild)
    }

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 400 / 400, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer()

    renderer.setSize(400, 400)
    threeContainerRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    const positions = landmarks.flatMap(point => [point.x - 250, -point.y + 250, 0])
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))

    const material = new THREE.PointsMaterial({ color: 0x00ff00, size: 3 })
    const points = new THREE.Points(geometry, material)
    scene.add(points)

    camera.position.z = 250

    const controls = new OrbitControls(camera, renderer.domElement)
    controls.enableDamping = true
    controls.dampingFactor = 0.25
    controls.enableZoom = true

    const animate = () => {
      requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    setIs3DModelReady(true)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center">Face Detection System</h1>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <svg className="animate-spin h-8 w-8 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>Loading face detection models...</span>
          </div>
        ) : error ? (
          <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error!</strong>
            <span className="block sm:inline"> {error}</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gray-800 shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Face Scan</h2>
              <div className="relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className="w-full h-auto"
                  style={{ maxWidth: '500px' }}
                />
                <canvas
                  ref={canvasRef}
                  className="absolute top-0 left-0 w-full h-full"
                />
              </div>
              <button 
                onClick={handleScan} 
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              >
                Scan Face
              </button>
            </div>

            <div className="bg-gray-800 shadow-md rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Face Attributes</h2>
              {faceAttributes ? (
                <div>
                  <p><strong>Age:</strong> {faceAttributes.age}</p>
                  <p><strong>Gender:</strong> {faceAttributes.gender}</p>
                  <p><strong>Expression:</strong> {faceAttributes.expression}</p>
                </div>
              ) : (
                <p>No face attributes detected yet. Click "Scan Face" to begin.</p>
              )}
            </div>

            <div className="bg-gray-800 shadow-md rounded-lg p-6 col-span-2">
              <h2 className="text-xl font-semibold mb-4">3D Face Model</h2>
              <div ref={threeContainerRef} className="w-full h-96">
                {!is3DModelReady && <p>Scan your face to generate a 3D model.</p>}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FaceDetection