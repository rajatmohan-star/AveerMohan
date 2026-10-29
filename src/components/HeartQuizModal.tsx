import React, { useState, useEffect } from 'react';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Heart, CheckCircle2, RotateCcw } from 'lucide-react';

interface HeartQuizModalProps {
  onSuccess: () => void;
  onClose?: () => void;
  isMandatory?: boolean; // if 0 hearts, mandatory to answer or retry
}

interface Question {
  num1: number;
  num2: number;
  ans: number;
}

export const HeartQuizModal: React.FC<HeartQuizModalProps> = ({
  onSuccess,
  onClose,
  isMandatory = false,
}) => {
  const [questionIndex, setQuestionIndex] = useState(0); // 0, 1, 2 (3 questions)
  const [inputVal, setInputVal] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);

  // Generate 3 multiplication questions, with special fun 3x3 questions included!
  const [questions] = useState<Question[]>(() => {
    const list: Question[] = [
      { num1: 3, num2: 3, ans: 9 }, // Iconic 3x3 Escape!
      { num1: 9, num2: 10, ans: 90 },
      { num1: 6, num2: 7, ans: 42 },
    ];
    // Randomize second and third questions
    const r1 = Math.floor(Math.random() * 8) + 3;
    const r2 = Math.floor(Math.random() * 9) + 2;
    list[1] = { num1: r1, num2: r2, ans: r1 * r2 };

    const r3 = Math.floor(Math.random() * 7) + 4;
    const r4 = Math.floor(Math.random() * 8) + 3;
    list[2] = { num1: r3, num2: r4, ans: r3 * r4 };

    return list;
  });

  const currentQ = questions[questionIndex];

  const handleKeyPress = (char: string) => {
    sound.playClick();
    setErrorMessage('');
    if (char === 'DEL') {
      setInputVal((prev) => prev.slice(0, -1));
    } else {
      if (inputVal.length < 5) {
        setInputVal((prev) => prev + char);
      }
    }
  };

  const handleCheckAnswer = () => {
    const parsed = parseInt(inputVal, 10);
    if (isNaN(parsed)) return;

    if (parsed === currentQ.ans) {
      sound.playCorrect();
      setInputVal('');
      setErrorMessage('');

      if (questionIndex + 1 >= 3) {
        // Complete!
        setIsCompleted(true);
        sound.playHeartRefill();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#ef4444', '#ec4899', '#fde047', '#22c55e', '#38bdf8'],
        });

        setTimeout(() => {
          onSuccess();
        }, 1200);
      } else {
        setQuestionIndex((prev) => prev + 1);
      }
    } else {
      sound.playWrong();
      setErrorMessage('Try again!');
      setInputVal('');
    }
  };

  // Keyboard support for desktop
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleKeyPress('DEL');
      } else if (e.key === 'Enter') {
        handleCheckAnswer();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [inputVal, questionIndex]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-sm sm:max-w-md bg-gradient-to-b from-pink-100 via-rose-50 to-pink-200 rounded-3xl p-5 border-4 border-white shadow-2xl text-slate-800 animate-in fade-in zoom-in-95 duration-150">
        {/* Top Header Badge */}
        <div className="text-center mb-3">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rose-500 text-white font-black text-sm uppercase tracking-wider shadow-md">
            <Heart className="w-4 h-4 fill-white" />
            REFILL HEARTS
          </div>
          <h2 className="text-2xl font-black font-arcade text-slate-900 mt-1">
            Hearts Quiz
          </h2>
          <p className="text-xs font-bold text-slate-600">
            Question {questionIndex + 1} / 3
          </p>
        </div>

        {isCompleted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto animate-bounce" />
            <h3 className="text-2xl font-black font-arcade text-emerald-600">
              HEARTS REFILLED!
            </h3>
            <p className="text-sm font-bold text-slate-600">
              All 5 hearts restored! Good luck runner!
            </p>
          </div>
        ) : (
          <>
            {/* Question Display Screen */}
            <div className="bg-white rounded-2xl border-3 border-pink-300 p-4 shadow-inner text-center mb-4">
              <div className="text-4xl sm:text-5xl font-black font-arcade text-slate-900 tracking-wider">
                {currentQ.num1} × {currentQ.num2} = ?
              </div>
            </div>

            {/* Answer Input and Submit Row */}
            <div className="flex items-center gap-2 mb-4">
              <div className="flex-1 bg-white h-12 rounded-xl border-2 border-slate-300 px-4 flex items-center font-black text-2xl text-slate-800 shadow-inner">
                {inputVal || <span className="text-slate-300 font-normal text-lg">Type answer...</span>}
              </div>
              <button
                onClick={handleCheckAnswer}
                disabled={inputVal.length === 0}
                className="h-12 px-5 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 disabled:opacity-50 active:scale-95 text-white font-black text-base rounded-xl border-2 border-emerald-700 shadow-md transition-all cursor-pointer"
              >
                Answer
              </button>
            </div>

            {errorMessage && (
              <p className="text-center text-xs font-extrabold text-rose-600 -mt-2 mb-2 animate-shake">
                {errorMessage}
              </p>
            )}

            {/* Numeric Keypad: 1-9, 0, DEL matching IMG_0836 */}
            <div className="grid grid-cols-3 gap-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  onClick={() => handleKeyPress(digit)}
                  className="h-12 rounded-xl bg-gradient-to-b from-sky-100 to-sky-200 hover:from-sky-50 hover:to-sky-100 active:scale-95 border-2 border-sky-300 text-sky-950 font-black text-xl shadow-sm transition-all"
                >
                  {digit}
                </button>
              ))}

              {/* Bottom row: empty/spacer, 0, DEL */}
              <div className="h-12 flex items-center justify-center">
                {!isMandatory && onClose && (
                  <button
                    onClick={onClose}
                    className="text-xs font-bold text-slate-500 hover:text-slate-700 underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
              <button
                onClick={() => handleKeyPress('0')}
                className="h-12 rounded-xl bg-gradient-to-b from-sky-100 to-sky-200 hover:from-sky-50 hover:to-sky-100 active:scale-95 border-2 border-sky-300 text-sky-950 font-black text-xl shadow-sm transition-all"
              >
                0
              </button>
              <button
                onClick={() => handleKeyPress('DEL')}
                className="h-12 rounded-xl bg-gradient-to-b from-rose-200 to-rose-300 hover:from-rose-100 hover:to-rose-200 active:scale-95 border-2 border-rose-400 text-rose-950 font-black text-sm shadow-sm transition-all"
              >
                DEL
              </button>
            </div>

            {/* Progress Dots */}
            <div className="flex justify-center gap-2 mt-4">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`w-3 h-3 rounded-full transition-all ${
                    idx < questionIndex
                      ? 'bg-emerald-500 scale-110'
                      : idx === questionIndex
                      ? 'bg-rose-500 ring-2 ring-rose-300'
                      : 'bg-slate-300'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
