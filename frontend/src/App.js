import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const Spinner = () => (
  <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
);

export default function App() {

  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [updatedCode, setUpdatedCode] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [detectedLang, setDetectedLang] = useState("");

  const [loadingExplain, setLoadingExplain] = useState(false);
  const [loadingFix, setLoadingFix] = useState(false);
  const [loadingOptimize, setLoadingOptimize] = useState(false);
  const [loadingConvert, setLoadingConvert] = useState(false);

  const isAnyLoading =
    loadingExplain ||
    loadingFix ||
    loadingOptimize ||
    loadingConvert;

  // ---------------- LANGUAGE DETECTION ----------------

  const detectLanguage = (code) => {

    if (/print\(|def |import |from /.test(code)) return "Python";
    if (/console\.log|function |=>/.test(code)) return "JavaScript";
    if (/cout|std::|#include <iostream>/.test(code)) return "C++";
    if (/printf|scanf|#include <stdio.h>/.test(code)) return "C";
    if (/System\.out\.println|public class/.test(code)) return "Java";

    return "";
  };

  useEffect(() => {
    setDetectedLang(detectLanguage(code));
  }, [code]);

  // ---------------- API CALL ----------------

  const callAPI = async (endpoint, body, setter, loader) => {

    loader(true);

    setExplanation("");
    setUpdatedCode("");

    try {

      const res = await axios.post(
        `http://localhost:8000/${endpoint}`,
        body
      );

      setExplanation(res.data.explanation || "");
      setUpdatedCode(res.data.updatedCode || "");

    } catch (err) {

      setter("Backend Error.");

    }

    loader(false);
  };

  // ---------------- COPY ----------------

  const copyCode = () => {
    navigator.clipboard.writeText(updatedCode);
  };

  const allLanguages = [
    "Python",
    "JavaScript",
    "Java",
    "C++",
    "C"
  ];

  const availableLanguages = allLanguages.filter(
    (lang) => lang !== detectedLang
  );

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 px-6 py-12">

      <div className="max-w-6xl mx-auto space-y-10">

        {/* HEADER */}

        <div className="text-center space-y-3">

          <h1 className="text-5xl font-bold text-white">
            CodeSage AI
          </h1>

          <p className="text-slate-400 text-lg">
            Explain, Debug, Optimize and Convert Code using AI
          </p>

        </div>

        {/* INPUT */}

        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 shadow-2xl">

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            className="w-full h-64 bg-transparent text-slate-100 font-mono text-sm outline-none resize-none"
          />

          <div className="flex flex-wrap gap-3 justify-end mt-4">

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                callAPI(
                  "explain",
                  { code },
                  setExplanation,
                  setLoadingExplain
                )
              }
              disabled={isAnyLoading}
              className="bg-blue-600 text-white px-5 py-2 rounded-xl"
            >
              {loadingExplain ? "Explaining..." : "Explain"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                callAPI(
                  "fix-bugs",
                  { code },
                  setExplanation,
                  setLoadingFix
                )
              }
              disabled={isAnyLoading}
              className="bg-red-600 text-white px-5 py-2 rounded-xl"
            >
              {loadingFix ? "Fixing..." : "Fix Bugs"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                callAPI(
                  "optimize-code",
                  { code },
                  setExplanation,
                  setLoadingOptimize
                )
              }
              disabled={isAnyLoading}
              className="bg-green-600 text-white px-5 py-2 rounded-xl"
            >
              {loadingOptimize ? "Optimizing..." : "Optimize"}
            </motion.button>

            <select
              onChange={(e) => setTargetLang(e.target.value)}
              className="bg-slate-700 text-white rounded-xl px-3"
            >
              <option value="">Convert To</option>

              {availableLanguages.map((lang) => (
                <option key={lang}>
                  {lang}
                </option>
              ))}

            </select>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                callAPI(
                  "convert-code",
                  { code, targetLang },
                  setExplanation,
                  setLoadingConvert
                )
              }
              disabled={isAnyLoading}
              className="bg-purple-600 text-white px-5 py-2 rounded-xl"
            >
              {loadingConvert ? "Converting..." : "Convert"}
            </motion.button>

          </div>

        </div>

        {/* EXPLANATION */}

        <AnimatePresence>

          {explanation && (

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl"
            >

              <h2 className="text-2xl font-bold text-white mb-6">
                Explanation
              </h2>

              <div className="prose prose-invert max-w-none break-words overflow-hidden">

                <ReactMarkdown
  remarkPlugins={[remarkGfm]}
  components={{

    h1: ({ node, ...props }) => (
      <h1
        className="text-3xl font-bold text-white mt-8 mb-5 border-b border-slate-700 pb-3"
        {...props}
      />
    ),

    h2: ({ node, ...props }) => (
      <h2
        className="text-2xl font-semibold text-blue-300 mt-7 mb-4"
        {...props}
      />
    ),

    h3: ({ node, ...props }) => (
      <h3
        className="text-xl font-semibold text-purple-300 mt-6 mb-3"
        {...props}
      />
    ),

    p: ({ node, ...props }) => (
      <p
        className="text-slate-300 leading-8 mb-5 break-words whitespace-pre-wrap"
        {...props}
      />
    ),

    ul: ({ node, ...props }) => (
      <ul
        className="list-disc ml-6 space-y-3 mb-6 text-slate-300"
        {...props}
      />
    ),

    ol: ({ node, ...props }) => (
      <ol
        className="list-decimal ml-6 space-y-3 mb-6 text-slate-300"
        {...props}
      />
    ),

    li: ({ node, ...props }) => (
      <li
        className="leading-8"
        {...props}
      />
    ),

    strong: ({ node, ...props }) => (
      <strong
        className="text-white font-semibold"
        {...props}
      />
    ),

    code({ inline, className, children, ...props }) {

      if (inline) {

        return (
          <code
            className="bg-slate-700 text-green-300 px-2 py-1 rounded text-sm"
            {...props}
          >
            {children}
          </code>
        );
      }

      return (
        <pre className="bg-[#0f172a] border border-slate-700 rounded-xl p-5 overflow-x-auto whitespace-pre-wrap break-words my-6">
          <code
            className="text-green-400 text-sm leading-7"
            {...props}
          >
            {children}
          </code>
        </pre>
      );
    },

    blockquote: ({ node, ...props }) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 italic text-slate-400 my-5"
        {...props}
      />
    )

  }}
>
  {explanation}
</ReactMarkdown>

              </div>

            </motion.div>

          )}

        </AnimatePresence>

        {/* UPDATED CODE */}

        <AnimatePresence>

          {updatedCode && (

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl"
            >

              <div className="flex justify-between items-center mb-5">

                <h2 className="text-2xl font-bold text-white">
                  Updated Code
                </h2>

                <button
                  onClick={copyCode}
                  className="bg-slate-700 text-white px-3 py-1 rounded-lg text-sm"
                >
                  Copy
                </button>

              </div>

              <pre className="bg-[#0f172a] rounded-xl p-6 overflow-x-auto">
                <code className="text-green-400 whitespace-pre-wrap">
                  {updatedCode}
                </code>
              </pre>

            </motion.div>

          )}

        </AnimatePresence>

      </div>

    </div>
  );
}