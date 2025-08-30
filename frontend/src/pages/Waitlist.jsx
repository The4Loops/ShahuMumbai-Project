// src/components/Waitlist.jsx
import React, { useState, useEffect } from "react";
import confetti from "canvas-confetti";
import Layout from "../layout/Layout";

const dummyWaitlist = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com" },
  { id: 2, name: "Bob Smith", email: "bob@example.com" },
  { id: 3, name: "Carol Davis", email: "carol@example.com" },
];

const colors = [
  "bg-pink-100",
  "bg-indigo-100",
  "bg-green-100",
  "bg-yellow-100",
  "bg-purple-100",
  "bg-blue-100",
];

const emojis = ["🎉", "🚀", "🌟", "💎", "🔥", "✨"];

const Waitlist = () => {
  const [waitlist, setWaitlist] = useState(dummyWaitlist);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [nextId, setNextId] = useState(4);
  const [count, setCount] = useState(dummyWaitlist.length);
  const [displayCount, setDisplayCount] = useState(dummyWaitlist.length);

  const handleJoinWaitlist = (e) => {
    e.preventDefault();
    if (!name || !email) {
      setMessage("Please enter your name and email!");
      return;
    }

    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    const newEntry = {
      id: nextId,
      name,
      email,
      emoji,
      added: true, // flag for animation
    };

    setWaitlist([newEntry, ...waitlist]);
    setNextId(nextId + 1);
    setName("");
    setEmail("");
    setMessage("You've joined the waitlist!");

    // Trigger confetti
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });

    // Update counter
    setCount((prev) => prev + 1);

    setTimeout(() => setMessage(""), 3000);

    // Remove animation flag after animation duration
    setTimeout(() => {
      setWaitlist((prev) =>
        prev.map((user) => ({ ...user, added: false }))
      );
    }, 500);
  };

  // Animate counter
  useEffect(() => {
    if (displayCount === count) return;
    const interval = setInterval(() => {
      setDisplayCount((prev) => {
        if (prev < count) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 50);
    return () => clearInterval(interval);
  }, [count, displayCount]);

  return (
    <Layout>
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-2 text-center">
        Join Our Pre-Launch Waitlist
      </h1>
      <p className="text-center text-gray-600 mb-6">
        Total people on waitlist:{" "}
        <span className="font-bold text-indigo-600">{displayCount}</span>
      </p>

      <form
        onSubmit={handleJoinWaitlist}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <input
          type="text"
          placeholder="Your Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white px-6 py-3 rounded-md hover:bg-indigo-700 transition"
        >
          Join
        </button>
      </form>

      {message && <p className="text-green-600 mb-4">{message}</p>}

      <div className="grid sm:grid-cols-2 gap-4">
        {waitlist.map((user, index) => (
          <div
            key={user.id}
            className={`
              ${colors[index % colors.length]} 
              p-4 border border-gray-200 rounded-lg shadow-md flex items-center gap-3
              ${user.added ? "animate-fade-slide" : "transition-transform duration-300"}
            `}
          >
            <span className="text-2xl">{user.emoji}</span>
            <div>
              <p className="font-semibold text-gray-800">{user.name}</p>
              <p className="text-gray-600 text-sm">{user.email}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
    </Layout>
  );
};

export default Waitlist;
