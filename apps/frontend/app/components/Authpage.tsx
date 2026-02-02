"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AuthPage({ isSignin }: { isSignin: boolean }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleClick() {
    const url = isSignin
      ? "http://localhost:3001/signin"
      : "http://localhost:3001/signup";

    const body = {
      username: email,
      password: password,
      name: "User", // required for signup only
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    console.log("SERVER RESPONSE:", data);

    // ----- SIGNUP SUCCESS -----
    if (!isSignin) {
      alert("Signup successful! Please sign in.");
      router.push("/signin");
      return;
    }

    // ----- SIGNIN SUCCESS -----
    if (isSignin && data.token) {
      alert("Login successful!");

      // Save token so Canvas + Room Creation works
      localStorage.setItem("token", data.token);

      console.log("TOKEN SAVED:", data.token);

      // Redirect to dashboard
      router.push("/dashboard");
      return;
    }

    alert("Authentication failed");
  }

  return (
    <div className="w-screen h-screen flex justify-center items-center bg-neutral-900">
      <div className="p-6 m-2 bg-neutral-800 rounded-xl w-[350px]">
        <h1 className="text-white text-xl font-semibold text-center mb-4">
          {isSignin ? "Sign In" : "Sign Up"}
        </h1>

        <div className="flex flex-col gap-3">
          <input
            type="text"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border border-gray-600 bg-neutral-700 text-white p-2 rounded"
          />

          <input
            type="password"
            placeholder="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border border-gray-600 bg-neutral-700 text-white p-2 rounded"
          />
        </div>

        <button
          className="w-full bg-blue-600 rounded p-2 text-white mt-4 hover:bg-blue-700"
          onClick={handleClick}
        >
          {isSignin ? "Sign in" : "Sign up"}
        </button>
      </div>
    </div>
  );
}
