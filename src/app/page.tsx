'use client'

import { useState, useCallback } from "react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import Particles from "react-tsparticles"
import { loadSlim } from "tsparticles-slim"
import type { Engine } from "tsparticles-engine"
import { ArrowRight, Github, Twitter } from "lucide-react"

const particlesOptions = {
  background: {
    color: {
      value: "transparent",
    },
  },
  fpsLimit: 120,
  interactivity: {
    events: {
      onClick: {
        enable: true,
        mode: "push",
      },
      onHover: {
        enable: true,
        mode: "repulse",
      },
      resize: true,
    },
    modes: {
      push: {
        quantity: 4,
      },
      repulse: {
        distance: 200,
        duration: 0.4,
      },
    },
  },
  particles: {
    color: {
      value: "#ffffff",
    },
    links: {
      color: "#ffffff",
      distance: 150,
      enable: true,
      opacity: 0.5,
      width: 1,
    },
    move: {
      direction: "none",
      enable: true,
      outModes: {
        default: "bounce",
      },
      random: false,
      speed: 1,
      straight: false,
    },
    number: {
      density: {
        enable: true,
        area: 800,
      },
      value: 80,
    },
    opacity: {
      value: 0.5,
    },
    shape: {
      type: "circle",
    },
    size: {
      value: { min: 1, max: 5 },
    },
  },
  detectRetina: true,
}

const upcomingProjects = [
  { title: "Mood Tracker", description: "A web app that tracks user emotions based on facial expressions." },
  { title: "Emotion-based Music Player", description: "A music player that selects songs based on the user's mood." },
  { title: "Face Swap App", description: "An app that allows users to swap faces in real-time using face-api.js." },
  { title: "Virtual Makeup App", description: "An app that applies virtual makeup on users' faces using facial landmarks." },
  { title: "Fitness Coach", description: "A virtual fitness coach that analyzes users' facial expressions during workouts." },
]

interface TypewriterEffectProps {
  text: string;
}

const TypewriterEffect: React.FC<TypewriterEffectProps> = ({ text }) => {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      {text}
    </motion.span>
  )
}

export default function Home() {
  const [selectedProject, setSelectedProject] = useState<{ title: string; description: string } | null>(null)

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine)
  }, [])

  return (
    <div className="relative overflow-hidden min-h-screen flex flex-col justify-center items-center text-white bg-gradient-to-br from-gray-900 to-gray-800">
      <Particles className="absolute top-0 left-0 w-full h-full" init={particlesInit} options={particlesOptions} />
      <div className="relative z-10 text-center p-4 max-w-4xl mx-auto">
        <motion.h1
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600"
        >
          <TypewriterEffect text="Welcome to Face Vibe" />
        </motion.h1>
        <motion.h2
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="text-3xl mb-6"
        >
          <TypewriterEffect text="Explore the Power of Face-API.js!" />
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1 }}
          className="mb-8 max-w-xl mx-auto text-gray-300"
        >
          At Face Vibe, our goal is to explore the capabilities of{" "}
          <span className="font-semibold text-indigo-400">face-api.js</span> and discover the amazing projects that can
          be built with user interaction. From detecting emotions to applying virtual makeup, the possibilities are
          endless! Join us on this exciting journey to bring creativity and technology together.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 1.5 }}
        >
          <Link
            href="/facedetection"
            className="inline-flex items-center bg-indigo-600 px-6 py-3 rounded-lg hover:bg-indigo-700 transition duration-300 text-lg font-semibold"
          >
            Try Face Detection <ArrowRight className="ml-2" />
          </Link>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 2 }}
        className="mt-16 max-w-4xl mx-auto p-4"
      >
        <h2 className="text-4xl font-semibold mb-6 text-center bg-clip-text text-transparent bg-gradient-to-r from-pink-400 to-yellow-400">
          Upcoming Projects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcomingProjects.map((project, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 + 2 }}
              className="bg-gray-800 p-6 rounded-lg shadow-lg hover:shadow-2xl transition duration-300 cursor-pointer"
              onClick={() => setSelectedProject(project)}
            >
              <h3 className="text-xl font-semibold mb-2 text-indigo-300">{project.title}</h3>
              <p className="text-gray-400">{project.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {selectedProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => setSelectedProject(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 50 }}
              className="bg-gray-800 p-8 rounded-lg max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-2xl font-semibold mb-4 text-indigo-300">{selectedProject.title}</h3>
              <p className="text-gray-300 mb-6">{selectedProject.description}</p>
              <button
                className="bg-indigo-600 px-4 py-2 rounded hover:bg-indigo-700 transition duration-300"
                onClick={() => setSelectedProject(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="mt-16 text-center text-gray-400">
        <div className="flex justify-center space-x-4 mb-4">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <Github />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <Twitter />
          </a>
        </div>
        <p>&copy; 2023 Face Vibe. All rights reserved.</p>
      </footer>
    </div>
  )
}