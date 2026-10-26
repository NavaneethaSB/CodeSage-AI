import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export default function App() {
  const [code, setCode] = useState("");
  const [explanation, setExplanation] = useState("");
  const [updatedCode, setUpdatedCode] = useState("");
  const [targetLang, setTargetLang] = useState("");
  const [detectedLang, setDetectedLang] = useState("");
  const [sample, setSample] = useState("");
  const [previousCode, setPreviousCode] = useState(null);
  const [requestError, setRequestError] = useState(false);
  const editorRef = useRef(null);
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
    if (!code.trim()) {
      setRequestError(true);
      setExplanation("Add some code to the editor before choosing an action.");
      setUpdatedCode("");
      return;
    }
    if (endpoint === "convert-code" && !targetLang) {
      setRequestError(true);
      setExplanation("Choose a target language before converting your code.");
      setUpdatedCode("");
      return;
    }
    loader(true);
    setRequestError(false);
    setPreviousCode(null);
    setExplanation("");
    setUpdatedCode("");
    try {
      const res = await axios.post(`https://codesage-ai-2inh.onrender.com/${endpoint}`, body);
      const result = res.data || {};
      setExplanation(typeof result.explanation === "string" ? result.explanation : "The service returned an empty or unreadable response.");
      setUpdatedCode(typeof result.updatedCode === "string" ? result.updatedCode.trim() : "");
    } catch (err) {
      setRequestError(true);
      const detail = err.response?.data?.detail;
      setExplanation(detail ? `Request failed: ${detail}` : err.response ? `Request failed (${err.response.status}). Please try again.` : "Could not reach CodeSage AI. Check your connection and try again.");
      setUpdatedCode("");
    }
    loader(false);
  };

  const copyCode = async () => {
    try { await navigator.clipboard.writeText(updatedCode); setCopyStatus("Copied"); setTimeout(() => setCopyStatus("Copy code"), 1800); }
    catch { setCopyStatus("Copy unavailable"); setTimeout(() => setCopyStatus("Copy code"), 1800); }
  };
  const [copyStatus, setCopyStatus] = useState("Copy code");
  const downloadCode = () => {
    const extension = ({ Python: "py", JavaScript: "js", Java: "java", "C++": "cpp", C: "c" })[targetLang || detectedLang] || "txt";
    const url = URL.createObjectURL(new Blob([updatedCode], { type: "text/plain" }));
    const link = document.createElement("a"); link.href = url; link.download = `codesage-result.${extension}`; link.click(); URL.revokeObjectURL(url);
  };
  const useUpdatedCode = () => { setPreviousCode(code); setCode(updatedCode); editorRef.current?.focus(); };
  const restoreCode = () => { if (previousCode !== null) { setCode(previousCode); setPreviousCode(null); editorRef.current?.focus(); } };
  const insertSample = (value) => { setSample(value); if (value) { setCode(value); setPreviousCode(null); editorRef.current?.focus(); } };
  const handleEditorKeyDown = (event) => {
    const editor = event.currentTarget;
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const value = code;
    if (event.key === "Tab") {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", start - 1) + 1;
      if (start !== end) {
        const blockStart = lineStart;
        const blockEnd = value.indexOf("\n", end) === -1 ? value.length : value.indexOf("\n", end);
        const block = value.slice(blockStart, blockEnd);
        const lines = block.split("\n");
        const next = lines.map((line) => event.shiftKey ? line.replace(/^( {1,2}|\t)/, "") : `  ${line}`).join("\n");
        setCode(value.slice(0, blockStart) + next + value.slice(blockEnd));
        requestAnimationFrame(() => editor.setSelectionRange(blockStart, blockStart + next.length));
      } else if (event.shiftKey) {
        const line = value.slice(lineStart, start);
        const removed = line.match(/^( {1,2}|\t)/)?.[0] || "";
        if (removed) { setCode(value.slice(0, lineStart) + value.slice(lineStart + removed.length)); requestAnimationFrame(() => editor.setSelectionRange(start - removed.length, start - removed.length)); }
      } else {
        setCode(value.slice(0, start) + "  " + value.slice(end));
        requestAnimationFrame(() => editor.setSelectionRange(start + 2, start + 2));
      }
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const currentLine = value.slice(lineStart, start);
    const indent = currentLine.match(/^\s*/)?.[0] || "";
    const trimmed = currentLine.trimEnd();
    const pythonBlock = /:\s*(#.*)?$/.test(trimmed) && /^(async\s+)?(if|elif|else|for|while|def|class|try|except|finally|with|match|case)\b/.test(trimmed);
    const opensBlock = /[({[]\s*$/.test(trimmed);
    const closingNext = /^\s*[)}\]]/.test(value.slice(end));
    let nextIndent = indent;
    if (/^\s*(elif|else|except|finally|case)\b/.test(currentLine) && indent.length >= 2) nextIndent = indent.slice(0, -2);
    if (pythonBlock || opensBlock) nextIndent += "  ";
    if (closingNext && !opensBlock && indent.length >= 2) nextIndent = indent.slice(0, -2);
    const insertion = closingNext && opensBlock ? `\n${indent}  \n${indent}` : `\n${nextIndent}`;
    setCode(value.slice(0, start) + insertion + value.slice(end));
    const cursor = start + (closingNext && opensBlock ? indent.length + 3 : insertion.length);
    requestAnimationFrame(() => editor.setSelectionRange(cursor, cursor));
  };
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
            <div className="editor-tools"><label className="sample-select"><span className="sr-only">Insert sample code</span><select value={sample} onChange={(event) => insertSample(event.target.value)}><option value="">Samples…</option><option value={'def greet(name):\n    if not name:\n        return "Hello, world!"\n    return f"Hello, {name}!"\n\nprint(greet("Ada"))'}>Python greeting</option><option value={'function findEven(numbers) {\n  return numbers.filter((number) => number % 2 === 0);\n}\n\nconsole.log(findEven([1, 2, 3, 4]));'}>JavaScript filter</option></select></label><div className="language-badge"><span className="language-icon">⌘</span>{detectedLang || "Auto detect"}<span className={`detect-dot ${detectedLang ? "detected" : ""}`}/></div></div>
          </div>
          <div className="editor-body">
            <div className="line-gutter" aria-hidden="true">{Array.from({ length: Math.max(8, code.split("\n").length) }, (_, i) => <span key={i}>{i + 1}</span>)}</div>
            <textarea ref={editorRef} aria-label="Code editor" value={code} onChange={(e) => setCode(e.target.value)} onKeyDown={handleEditorKeyDown} placeholder={'Paste or write code here…\n\nTip: press Tab to indent and Enter to continue a block.'} spellCheck="false" autoCapitalize="off" autoComplete="off" />
          </div>
          <div className="editor-footer"><span>{code.length ? `${code.split("\n").length} lines · ${code.length} characters` : "Your code stays yours. Paste it here to get started."}</span><span className="editor-hint">{detectedLang ? `${detectedLang} detected · Ctrl/⌘+Z to undo` : "Auto detects Python, JavaScript, Java, C++ & C · Tab / Shift+Tab to indent"}</span></div>
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
          {explanation && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className={`result-card ${requestError ? "error-result" : ""}`} aria-live="polite">
            <div className="result-header"><div className="result-title"><span className="result-symbol">✳</span><div><span className="result-kicker">CODESAGE ANALYSIS</span><h2>{requestError ? "A little more needed" : "Your results"}</h2></div></div><span className="result-ready"><span/> {requestError ? "Check your request" : "Complete"}</span></div>
            <div className="markdown-content"><ReactMarkdown remarkPlugins={[remarkGfm]} components={{
              h1: ({ children, ...props }) => <h1 {...props}>{children}</h1>, h2: ({ children, ...props }) => <h2 {...props}>{children}</h2>, h3: ({ children, ...props }) => <h3 {...props}>{children}</h3>,
              p: ({ ...props }) => <p {...props}/>, ul: ({ ...props }) => <ul {...props}/>, ol: ({ ...props }) => <ol {...props}/>, li: ({ ...props }) => <li {...props}/>,
              strong: ({ ...props }) => <strong {...props}/>, blockquote: ({ ...props }) => <blockquote {...props}/>,
              code({ inline, className, children, ...props }) {
                let cleanCode = String(children).replace(/^(c|cpp|python|java|javascript)\n/i, "");
                if (inline) return <code className="inline-code" {...props}>{children}</code>;
                const language = className?.replace("language-", "") || "text";
                return <div className="result-code"><div className="code-caption"><span className="window-dots"><i/><i/><i/></span><span>{language}</span><button type="button" onClick={() => navigator.clipboard?.writeText(cleanCode)} className="inline-copy">Copy</button></div><SyntaxHighlighter language={language} style={vscDarkPlus} customStyle={{ margin: 0, padding: "15px", background: "#0b0e0b", fontSize: "12px", lineHeight: 1.75 }}>{cleanCode.replace(/\n$/, "")}</SyntaxHighlighter></div>;
              }
            }}>{explanation}</ReactMarkdown></div>
          </motion.section>}
          {updatedCode?.trim() !== "" && <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="result-card updated-card">
            <div className="result-header"><div className="result-title"><span className="result-symbol code-symbol">⌘</span><div><span className="result-kicker">{targetLang ? `${detectedLang || "Source"} → ${targetLang}` : "READY TO USE"}</span><h2>{targetLang ? "Converted code" : "Updated code"}</h2></div></div><div className="result-actions"><button onClick={copyCode} className="copy-button"><span>▢</span> {copyStatus}</button><button onClick={downloadCode} className="copy-button">Download</button>{requestError === false && <button onClick={useUpdatedCode} className="copy-button">Use in editor</button>}{previousCode !== null && <button onClick={restoreCode} className="copy-button">Undo change</button>}</div></div>
            <div className="result-code updated-code"><div className="code-caption"><span className="window-dots"><i/><i/><i/></span><span>{targetLang || detectedLang || "CODE"}</span></div><SyntaxHighlighter language={({ Python: "python", JavaScript: "javascript", Java: "java", "C++": "cpp", C: "c" })[targetLang || detectedLang] || "text"} style={vscDarkPlus} customStyle={{ margin: 0, padding: "15px", background: "#0b0e0b", fontSize: "12px", lineHeight: 1.75 }}>{updatedCode.replace(/\n$/, "")}</SyntaxHighlighter></div>
          </motion.section>}
        </AnimatePresence>
        <footer className="footer"><span>CodeSage AI</span><span>Thoughtful tools for better code.</span></footer>
      </div>
    </main>
  );
}
