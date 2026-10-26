import { useState, useEffect } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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

  const isAnyLoading = loadingExplain || loadingFix || loadingOptimize || loadingConvert;
  const activeAction = loadingExplain ? "Explaining your code" : loadingFix ? "Finding bugs" : loadingOptimize ? "Optimizing your code" : loadingConvert ? "Converting your code" : "";

  const detectLanguage = (source) => {
    if (/print\(|def |import |from /.test(source)) return "Python";
    if (/console\.log|function |=>/.test(source)) return "JavaScript";
    if (/cout|std::|#include <iostream>/.test(source)) return "C++";
    if (/printf|scanf|#include <stdio.h>/.test(source)) return "C";
    if (/System\.out\.println|public class/.test(source)) return "Java";
    return "";
  };

  useEffect(() => {
    setDetectedLang(detectLanguage(code));
  }, [code]);

  const callAPI = async (endpoint, body, setter, loader) => {
    loader(true);
    setExplanation("");
    setUpdatedCode("");
    try {
      const res = await axios.post(`https://codesage-ai-2inh.onrender.com/${endpoint}`, body);
      console.log(res.data);
      setExplanation(res.data.explanation || "");
      if (res.data.updatedCode && res.data.updatedCode.trim() !== "") setUpdatedCode(res.data.updatedCode);
      else setUpdatedCode("");
    } catch (err) {
      console.error(err);
      setExplanation("Backend Error! Sorry for the inconvenience. Please try again later!");
      setUpdatedCode("");
    }
    loader(false);
  };

  const copyCode = () => navigator.clipboard.writeText(updatedCode);
  const allLanguages = ["Python", "JavaScript", "Java", "C++", "C"];
  const availableLanguages = allLanguages.filter((lang) => lang !== detectedLang);

  return (
    <main className="workspace">
      <div className="workspace-inner">
        <header className="topbar">
          <a className="brand" href="#top" aria-label="CodeSage AI home">
            <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 3.5 27 9.8v12.4L16 28.5 5 22.2V9.8L16 3.5Z" stroke="currentColor" strokeWidth="1.6"/><path d="m12.2 12.1-3.7 3.8 3.7 3.9m7.6-7.7 3.7 3.8-3.7 3.9m-2.1-9.8-3.4 12" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
            <span className="brand-name">CodeSage <span>AI</span></span>
          </a>
          <div className="topbar-right"><span className="status-dot"/> AI coding workspace</div>
        </header>

        <section className="intro" id="top">
          <div className="eyebrow"><span className="eyebrow-line"/> YOUR PERSONAL CODE COMPANION</div>
          <h1>Write better code,<br/><span>with a little wisdom.</span></h1>
          <p>Understand, improve, and transform your code with AI.</p>
        </section>

        <section className="editor-card" aria-label="Code workspace">
          <div className="editor-topline">
            <div className="editor-label"><span className="window-dots"><i/><i/><i/></span><span>CODE EDITOR</span></div>
            <div className="language-badge"><span className="language-icon">⌘</span>{detectedLang || "Language"}<span className={`detect-dot ${detectedLang ? "detected" : ""}`}/></div>
          </div>
          <div className="editor-body">
            <div className="line-gutter" aria-hidden="true">{Array.from({ length: Math.max(8, code.split("\n").length) }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
            <textarea aria-label="Code editor" value={code} onChange={(e) => setCode(e.target.value)} placeholder={'// Paste your code here\n// CodeSage will help you make sense of it.'} spellCheck="false" autoCapitalize="off" autoComplete="off" />
          </div>
          <div className="editor-footer"><span>{code.length ? `${code.split("\n").length} lines · ${code.length} characters` : "Your code stays yours. Paste it here to get started."}</span><span className="editor-hint">{detectedLang ? `${detectedLang} detected` : "Supports Python, JavaScript, Java, C++ & C"}</span></div>
        </section>

        <section className="actions" aria-label="Code actions">
          <div className="actions-heading"><span>CHOOSE AN ACTION</span><span className="actions-caption">What would you like to do?</span></div>
          <div className="action-grid">
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: .98 }} onClick={() => callAPI("explain", { code }, setExplanation, setLoadingExplain)} disabled={isAnyLoading} className="action-button explain-button">
              <span className="action-icon">✳</span><span className="action-copy"><strong>{loadingExplain ? "Explaining…" : "Explain"}</strong><small>Understand what it does</small></span><span className="action-arrow">↗</span>
            </motion.button>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: .98 }} onClick={() => callAPI("fix-bugs", { code }, setExplanation, setLoadingFix)} disabled={isAnyLoading} className="action-button bugs-button">
              <span className="action-icon">⌕</span><span className="action-copy"><strong>{loadingFix ? "Finding bugs…" : "Find bugs"}</strong><small>Catch issues and edge cases</small></span><span className="action-arrow">↗</span>
            </motion.button>
            <motion.button whileHover={{ y: -2 }} whileTap={{ scale: .98 }} onClick={() => callAPI("optimize-code", { code }, setExplanation, setLoadingOptimize)} disabled={isAnyLoading} className="action-button optimize-button">
              <span className="action-icon">⌁</span><span className="action-copy"><strong>{loadingOptimize ? "Optimizing…" : "Optimize"}</strong><small>Improve clarity and efficiency</small></span><span className="action-arrow">↗</span>
            </motion.button>
            <div className="convert-group"><label className="select-wrap"><span className="sr-only">Convert to language</span><select value={targetLang} onChange={(e) => setTargetLang(e.target.value)}><option value="">Convert to…</option>{availableLanguages.map((lang) => <option key={lang} value={lang}>{lang}</option>)}</select><span className="select-chevron">⌄</span></label>
              <motion.button whileHover={{ y: -2 }} whileTap={{ scale: .98 }} onClick={() => callAPI("convert-code", { code, targetLang }, setExplanation, setLoadingConvert)} disabled={isAnyLoading} className="action-button convert-button"><span className="action-icon">⇄</span><span className="action-copy"><strong>{loadingConvert ? "Converting…" : "Convert"}</strong><small>Translate to another language</small></span><span className="action-arrow">↗</span></motion.button>
            </div>
          </div>
        </section>

        {isAnyLoading && <div className="loading-state" role="status"><span className="loader-ring"/><span><strong>{activeAction}</strong><small>This can take a few moments</small></span><div className="loading-track"><i/></div></div>}

        {!explanation && !updatedCode && !isAnyLoading && <div className="welcome-note"><span className="welcome-star">✳</span><span><strong>Ready when you are</strong><small>Add code above and choose an action to see your results here.</small></span></div>}

        <AnimatePresence>
          {explanation && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`result-card ${explanation.startsWith("Backend Error!") ? "error-result" : ""}`} aria-live="polite">
            <div className="result-header"><div className="result-title"><span className="result-symbol">✳</span><div><span className="result-kicker">CODESAGE ANALYSIS</span><h2>{explanation.startsWith("Backend Error!") ? "Something went wrong" : "Your results"}</h2></div></div><span className="result-ready"><span/> {explanation.startsWith("Backend Error!") ? "Connection issue" : "Complete"}</span></div>
            <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>, h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>, h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
              p: ({ ...props }) => <p {...props}/>, ul: ({ ...props }) => <ul {...props}/>, ol: ({ ...props }) => <ol {...props}/>, li: ({ ...props }) => <li {...props}/>,
              strong: ({ ...props }) => <strong {...props}/>, blockquote: ({ ...props }) => <blockquote {...props}/>,
              code({ inline, className, children, ...props }) {
                let cleanCode = String(children).replace(/^(c|cpp|python|java|javascript)\n/i, "");
                if (inline) return <code className="inline-code" {...props}>{children}</code>;
                return <pre className="result-code"><div className="code-caption"><span className="window-dots"><i/><i/><i/></span><span>{className?.replace("language-", "") || "CODE"}</span></div><code className={className} {...props}>{cleanCode}</code></pre>;
              }
            }}>{explanation}</ReactMarkdown></div>
          </motion.section>}
          {updatedCode?.trim() !== "" && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="result-card updated-card">
            <div className="result-header"><div className="result-title"><span className="result-symbol code-symbol">⌘</span><div><span className="result-kicker">READY TO USE</span><h2>Updated code</h2></div></div><button onClick={copyCode} className="copy-button"><span>▢</span> Copy code</button></div>
            <pre className="result-code updated-code"><div className="code-caption"><span className="window-dots"><i/><i/><i/></span><span>{targetLang || detectedLang || "CODE"}</span></div><code>{updatedCode}</code></pre>
          </motion.section>}
        </AnimatePresence>
        <footer className="footer"><span>CodeSage AI</span><span>Thoughtful tools for better code.</span></footer>
      </div>
    </main>
  );
}
