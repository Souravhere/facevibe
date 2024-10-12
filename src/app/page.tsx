import Link from "next/link";
export default function Home() {
  return (
    <div>
      <h1 className="text-center my-4"> welcome to face vibe</h1>
      <div className="px-4"> 
      <Link href='/facedetection'
      className="inline-block bg-gray-600 px-3 hover:bg-gray-700 duration-500 py-1 rounded-lg"
      > Face Detection and Mood Emoji</Link>
      </div>
    </div>
  );
}
