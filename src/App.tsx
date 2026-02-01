import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LimitDiff from "./components/LimitDiff";
import CustomFunction from "./components/CustomFunction";
import CustomDerivative from "./components/CustomDerivative";
import Tutorial from "./components/Tutorial";
import AIExplain from "./components/AIExplain/index";
import "./App.css";

function Nav() {
  return (
    <nav className="relative flex flex-wrap gap-2 sm:gap-3 p-4 border-b border-white/10 bg-nav-gradient backdrop-blur-md">
      {/* 装飾ライン */}
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" />
      
      <Link
        to="/"
        className="nav-link text-ui-base hover:text-accent-cyan font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-300"
      >
        極限・微分（x² / x³）
      </Link>
      <Link
        to="/custom"
        className="nav-link text-ui-base hover:text-accent-cyan font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-300"
      >
        自分で関数を指定
      </Link>
      <Link
        to="/derivative"
        className="nav-link text-ui-base hover:text-accent-cyan font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-300"
      >
        自分で導関数を指定
      </Link>
      <Link
        to="/tutorial"
        className="nav-link text-ui-base hover:text-accent-purple font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-300"
      >
        使い方
      </Link>
      <Link
        to="/ai-explain"
        className="nav-link text-ui-base hover:text-accent-cyan font-medium px-4 py-2 rounded-xl hover:bg-white/5 transition-all duration-300"
      >
        AI解説
      </Link>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-limitdiff-page font-sans">
        <Nav />
        <Routes>
          <Route path="/" element={<LimitDiff />} />
          <Route path="/custom" element={<CustomFunction />} />
          <Route path="/derivative" element={<CustomDerivative />} />
          <Route path="/tutorial" element={<Tutorial />} />
          <Route path="/ai-explain" element={<AIExplain />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
