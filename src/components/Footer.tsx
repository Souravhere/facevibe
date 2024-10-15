import React from 'react'
import { Github, Twitter  } from "lucide-react"
function Footer() {
  return (
    <footer className="mt-16 text-center text-gray-400">
        <div className="flex justify-center space-x-4 mb-4">
          <a href="https://github.com/souravhere/" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <Github />
          </a>
          <a href="https://x.com/SouravChhimpa1" target="_blank" rel="noopener noreferrer" className="hover:text-white">
            <Twitter />
          </a>
        </div>
        <p>&copy; 2024 Face Vibe. All rights reserved.</p>
      </footer>
  )
}

export default Footer
