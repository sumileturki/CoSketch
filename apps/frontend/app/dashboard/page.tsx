"use client";
import React, { useState } from "react";
import { PlusCircle, LogIn } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [roomIdInput, setRoomIdInput] = useState("");
  const router = useRouter();

  async function createRoom() {
    const token = localStorage.getItem("token");
    if (!token) return alert("No token found");
  
    const res = await fetch("http://localhost:3001/room", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        name: `room-${Math.floor(Math.random() * 999999)}`
      }),
    });
  
    const raw = await res.text();
    console.log("RAW:", raw);
  
    if (raw.startsWith("<")) {
      alert("❌ Backend not reachable on port 3001.");
      return;
    }
  
    const data = JSON.parse(raw);
    router.push(`/canvas/${data.roomId}`);
  }
  
  
  

  function joinRoom() {
    if (!roomIdInput.trim()) return;
    router.push(`/canvas/${roomIdInput}`);
  }

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-neutral-900">
      <div className="bg-neutral-800 p-8 rounded-2xl shadow-xl w-[380px]">
        
        <h1 className="text-2xl text-white font-semibold text-center mb-6">
          Whiteboard Dashboard
        </h1>

        <button
          onClick={createRoom}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl mb-5 transition"
        >
          <PlusCircle size={20} />
          Create New Room
        </button>

        <div className="space-y-3 mt-4">
          <p className="text-gray-300 text-sm">Join an Existing Room</p>

          <input
            type="text"
            className="w-full p-3 bg-neutral-700 text-white rounded-xl outline-none"
            placeholder="Enter Room ID"
            value={roomIdInput}
            onChange={(e) => setRoomIdInput(e.target.value)}
          />

          <button
            onClick={joinRoom}
            className="w-full flex items-center justify-center gap-3 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl transition"
          >
            <LogIn size={20} />
            Join Room
          </button>
        </div>
      </div>
    </div>
  );
}
