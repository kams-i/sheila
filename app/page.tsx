'use client';

import React, { useState, useEffect } from 'react';

export default function QuizMaker() {
  // --- TYPE DEFINITIONS ---
  type Category = { id: number; name: string };
  type Question = { q: string; correct: string; opts: string[] };
  type Config = { cat: string; diff: string; type: string; num: number };

  // --- NEW STATE & CONSTANTS ---
  const MAX_QUESTIONS = 10; // Fixed question limit
  const MAX_TIME = 60; // 60 seconds for the whole quiz

  const [step, setStep] = useState<'setup' | 'quiz' | 'results'>('setup');
  const [name, setName] = useState<string>(''); // New state for user's name
  const [cats, setCats] = useState<Category[]>([]);
  const [showNameError, setShowNameError] = useState(false); // New state for name validation error

  // Set default num to MAX_QUESTIONS (10)
  const [config, setConfig] = useState<Config>({ cat: '', diff: '', type: '', num: MAX_QUESTIONS });

  const [qs, setQs] = useState<Question[]>([]);
  const [curr, setCurr] = useState<number>(0);
  const [ans, setAns] = useState<string>('');
  const [score, setScore] = useState<number>(0);
  const [show, setShow] = useState<boolean>(false);

  const [timeLeft, setTimeLeft] = useState<number>(MAX_TIME); // New state for timer
  const [quizStart, setQuizStart] = useState<number>(0); // New state to track start time

  // --- TIMER EFFECT ---
  useEffect(() => {
    let timer: NodeJS.Timeout;

    // Only run the timer if we are in the quiz step and time is left
    if (step === 'quiz' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    }

    // If the timer reaches 0, move to results
    if (timeLeft === 0 && step === 'quiz') {
      clearInterval(timer);
      setStep('results');
    }

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // --- INITIAL CATEGORY FETCH ---
  useEffect(() => {
    fetch('https://opentdb.com/api_category.php')
      .then(r => r.json())
      .then(d => setCats(d.trivia_categories))
      .catch(console.error);
  }, []);

  // --- DECODING HELPER ---
  const decode = (str: string) => {
    const el = document.createElement('textarea');
    el.innerHTML = str;
    return el.value;
  };

  // --- START QUIZ ---
  const start = async () => {
    // *** NEW VALIDATION LOGIC ***
    if (!name.trim()) {
      setShowNameError(true);
      return;
    }
    // Reset error state if validation passes (in case user types name after error)
    setShowNameError(false);

    // 1. Enforce MAX_QUESTIONS
    let url = `https://opentdb.com/api.php?amount=${MAX_QUESTIONS}`;

    // 2. Apply other filters
    if (config.cat) url += `&category=${config.cat}`;
    if (config.diff) url += `&difficulty=${config.diff}`;
    if (config.type) url += `&type=${config.type}`;

    const res = await fetch(url);
    const data = await res.json();
    const formatted = data.results.map((q: any) => ({
      q: decode(q.question),
      correct: decode(q.correct_answer),
      opts: [...q.incorrect_answers.map(decode), decode(q.correct_answer)].sort(() => Math.random() - 0.5)
    }));

    setQs(formatted);
    setStep('quiz');
    setCurr(0);
    setScore(0);
    setTimeLeft(MAX_TIME); // Reset timer
    setQuizStart(Date.now()); // Mark quiz start time
  };

  // --- SUBMIT ANSWER ---
  const submit = () => {
    if (!ans) return;
    if (ans === qs[curr].correct) setScore(s => s + 1);
    setShow(true);

    // Move to next question or results after a delay
    setTimeout(() => {
      if (curr + 1 < qs.length) {
        setCurr(c => c + 1);
        setAns('');
        setShow(false);
      } else {
        setStep('results');
      }
    }, 1200);
  };

  // --- RESET QUIZ ---
  const reset = () => {
    setStep('setup');
    setCurr(0);
    setAns('');
    setScore(0);
    setShow(false);
    setTimeLeft(MAX_TIME);
    setQuizStart(0);
    setName('');
    setShowNameError(false);
  };

  // Define Glassmorphism classes once
  const GLASS_CLASSES = 'bg-white/30 backdrop-blur-lg backdrop-filter border border-white/40 shadow-xl';

  // Define the Project Header Component with appropriate styling for the dark background
  const ProjectHeader = () => (
    <div className='text-white p-4 text-center mb-4'>
      <p className='text-2xl font-extrabold'>Group 1 Project</p>
      <p className="text-xl font-bold">Quiz</p>
      <p className="text-2xl font-bold text-gray-300">Web Application Development (IFT 302)</p>
    </div>
  );

  // --- MAIN RENDER (Always includes the background and header) ---
  return (
    <div className="min-h-screen bg-gradient-to-br from-black to-purple-800 p-8">

      {/* PROJECT HEADER (ALWAYS DISPLAYED) */}
      <ProjectHeader />

      {/* RENDER STEP CONTENT */}
      {step === 'setup' && (
        // --- RENDER SETUP STEP ---
        <div className={`max-w-xl mx-auto rounded-xl p-8 ${GLASS_CLASSES} text-white`}>
          <h1 className="text-3xl font-bold text-center mb-8">Ready for the Quiz?</h1>
          
          {/* NAME ERROR MESSAGE BOX */}
          {showNameError && (
            <div className="bg-red-500/80 p-4 rounded-lg flex justify-between items-center mb-6 border border-red-300">
              <p className="font-semibold text-lg">⚠️ You must enter your name before starting the quiz! 🙄</p>
              <button
                onClick={() => setShowNameError(false)}
                className="text-white hover:text-red-200 text-2xl font-bold px-2 rounded-full transition-colors"
                aria-label="Close"
              >
                &times;
              </button>
            </div>
          )}

          <div className="space-y-4">
            {/* NAME INPUT */}
            <div>
              <label htmlFor="name-input" className="block text-xl font-medium mb-2 font-semibold">
                What's your name?
              </label>
              <input
                id="name-input"
                type="text"
                value={name}
                // When the user starts typing, hide the error message
                onChange={e => {
                  setName(e.target.value);
                  if (showNameError) setShowNameError(false);
                }}
                placeholder="Enter your name"
                className="w-full p-3 border border-white/50 rounded-lg focus:ring-blue-300 focus:border-blue-300 bg-white/20 placeholder-white/80 text-white"
              />
            </div>

            <hr className="my-6 border-white/40" />

            {/* CONFIGURATION OPTIONS */}
            <div className="text-lg font-semibold mb-4">Quiz Settings (10 Questions Only)</div>

            <div>
              <label className="block text-sm font-medium mb-2">Category</label>
              <select value={config.cat} onChange={e => setConfig({ ...config, cat: e.target.value })} className="w-full p-2 border border-white/50 rounded bg-white/20 text-black">
                <option value="" className="text-black">Any</option>
                {cats.map(c => <option key={c.id} value={String(c.id)} className="text-black">{c.name}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Difficulty</label>
              <select value={config.diff} onChange={e => setConfig({ ...config, diff: e.target.value })} className="w-full p-2 border border-white/50 rounded bg-white/20 text-black">
                <option value="" className="text-black">Any</option>
                <option value="easy" className="text-black">Easy</option>
                <option value="medium" className="text-black">Medium</option>
                <option value="hard" className="text-black">Hard</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Type</label>
              <select value={config.type} onChange={e => setConfig({ ...config, type: e.target.value })} className="w-full p-2 border border-white/50 rounded bg-white/20 text-black">
                <option value="" className="text-black">Any</option>
                <option value="multiple" className="text-black">Multiple Choice</option>
                <option value="boolean" className="text-black">True/False</option>
              </select>
            </div>

            <button
              onClick={start}
              // Removed disabled prop, relying on 'start' function for validation and error message
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-opacity"
            >
              Start Quiz
            </button>
          </div>
        </div>
      )}

      {step === 'quiz' && qs.length > 0 && (
        // --- RENDER QUIZ STEP ---
        <div className={`max-w-2xl mx-auto rounded-xl p-8 ${GLASS_CLASSES} text-white`}>
          {(() => {
            const q = qs[curr];
            const percentage = Math.round((timeLeft / MAX_TIME) * 100);
            const timerColor = timeLeft <= 10 ? 'bg-red-500' : 'bg-green-500';

            return (
              <>
                {/* TIMER AND SCORE */}
                <div className="flex justify-between items-center mb-6 text-lg font-medium">
                  <span className="text-gray-200">{name}'s Quiz</span>
                  <span>Score: {score}</span>
                </div>

                <div className="mb-6">
                  <div className="text-sm font-semibold mb-1 text-center">Time Left: {timeLeft}s</div>
                  <div className="w-full bg-white/40 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all duration-1000 ${timerColor}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <hr className="mb-6 border-white/40" />

                {/* QUESTION */}
                <div className="flex justify-between mb-4 text-sm font-semibold">
                  <span>Question {curr + 1}/{qs.length}</span>
                </div>

                <h2 className="text-2xl font-bold mb-6">{q.q}</h2>

                <div className="space-y-3 mb-6">
                  {q.opts.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => !show && setAns(opt)}
                      disabled={show}
                      className={`w-full p-4 text-left rounded-lg border-2 transition text-black ${show
                          ? opt === q.correct
                            ? 'border-green-500 bg-green-200'
                            : opt === ans
                              ? 'border-red-500 bg-red-200'
                              : 'border-gray-200 bg-white'
                          : ans === opt
                            ? 'border-blue-500 bg-blue-100'
                            : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {!show && (
                  <button
                    onClick={submit}
                    disabled={!ans || timeLeft === 0}
                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-opacity"
                  >
                    Submit
                  </button>
                )}
              </>
            );
          })()}
        </div>
      )}

      {step === 'results' && (
        // --- RENDER RESULTS STEP ---
        <div className={`max-w-xl mx-auto rounded-xl p-8 ${GLASS_CLASSES} text-white text-center`}>
          {(() => {
            const totalTimeTaken = MAX_TIME - timeLeft;
            const finalScore = score;
            const pct = Math.round((finalScore / qs.length) * 100);

            // Determine a message based on score
            const resultMessage = pct === 100
              ? "✨Perfect score! Outstanding work ✨."
              : pct >= 70
                ? "Great job! You aced most of it."
                : pct >= 40
                  ? "Good effort! Keep learning."
                  : pct >= 10
                    ? "Don't be discouraged! Practice makes perfect."
                    : "Keep trying! Every expert was once a beginner.";

            return (
              <>
                <h1 className="text-4xl font-bold mb-2">Quiz Complete! 🎉</h1>

                <p className="text-2xl font-semibold text-gray-200 mb-6">
                  {name}, here are your results:
                </p>

                <div className="text-6xl font-bold text-blue-300 my-4">{pct}%</div>

                <p className="text-3xl mb-4">
                  {finalScore} / {qs.length} correct
                </p>

                <p className="text-lg italic text-gray-300 mb-6">
                  {resultMessage}
                </p>

                <p className="text-md text-gray-300 mb-8">
                  Time elapsed: {totalTimeTaken} seconds
                </p>

                <button onClick={reset} className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Start New Quiz
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}