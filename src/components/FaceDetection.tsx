'use client'

import React, { useRef, useState, useEffect } from 'react'
import * as faceapi from 'face-api.js'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const FaceDetection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const threeContainerRef = useRef<HTMLDivElement>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [faceAttributes, setFaceAttributes] = useState<{
    age: number
    gender: string
    expression: string
  } | null>(null)
  const [is3DModelReady, setIs3DModelReady] = useState(false)

  useEffect(() => {
    const loadModelsAndStartVideo = async () => {
      try {
        // Load models
        await faceapi.nets.tinyFaceDetector.loadFromUri('/models')
        await faceapi.nets.faceLandmark68Net.loadFromUri('/models')
        await faceapi.nets.faceRecognitionNet.loadFromUri('/models')
        await faceapi.nets.faceExpressionNet.loadFromUri('/models')
        await faceapi.nets.ageGenderNet.loadFromUri('/models')

        // Access webcam
        const stream = await navigator.mediaDevices.getUserMedia({ video: {} })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }

        setIsLoading(false)
      } catch (err) {
        console.error('Error loading models or starting video:', err)
        setError('Failed to load face detection models or access camera.')
        setIsLoading(false)
      }
    }

    loadModelsAndStartVideo()

    // Cleanup on unmount
    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
        tracks.forEach(track => track.stop())
      }
    }
  }, [])

  const handleScan = async () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const displaySize = { width: video.videoWidth, height: video.videoHeight }
    faceapi.matchDimensions(canvas, displaySize)

    try {
      // Detect face and attributes
      const detections = await faceapi
        .detectAllFaces(video, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceExpressions()
        .withAgeAndGender()

      const resizedDetections = faceapi.resizeResults(detections, displaySize)
      const context = canvas.getContext('2d')
      context?.clearRect(0, 0, canvas.width, canvas.height)
      faceapi.draw.drawDetections(canvas, resizedDetections)
      faceapi.draw.drawFaceLandmarks(canvas, resizedDetections)

      if (detections.length > 0) {
        const detection = detections[0]
        setFaceAttributes({
          age: Math.round(detection.age),
          gender: detection.gender,
          expression: Object.entries(detection.expressions).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0],
        })

        // Create 3D model
        create3DFaceModel(detection.landmarks.positions)
      } else {
        setError('No face detected. Please try again.')
      }
    } catch (err) {
      console.error('Error during face detection:', err)
      setError('An error occurred during face detection. Please try again.')
    }
  }

  const create3DFaceModel = (landmarks: faceapi.Point[]) => {
    if (!threeContainerRef.current) return

    // Clear previous model
    while (threeContainerRef.current.firstChild) {
      threeContainerRef.current.removeChild(threeContainerRef.current.firstChild)
    }

    // Initialize Three.js scene
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer()
    renderer.setSize(400, 400)
    threeContainerRef.current.appendChild(renderer.domElement)

    const geometry = new THREE.BufferGeometry()
    const positions = landmarks.flatMap(point => [
      point.x - 250, 
      -point.y + 250, 
      0
    ])
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
            <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div>
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
                <video ref={videoRef} autoPlay muted playsInline className="w-full h-auto" style={{ maxWidth: '500px' }} />
                <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full" />
              </div>
              <button onClick={handleScan} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline">
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
