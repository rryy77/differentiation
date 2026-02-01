import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import LimitDiff from "./components/LimitDiff";
import CustomFunction from "./components/CustomFunction";
import CustomDerivative from "./components/CustomDerivative";
import Tutorial from "./components/Tutorial";
import "./App.css";

function Nav() {
  return (
    <nav className="flex flex-wrap gap-2 sm:gap-4 p-4 border-b border-white/15 bg-[rgba(15,23,42,0.6)]">
      <Link
        to="/"
        className="text-ui-base hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-white/10"
      >
        極限・微分（x² / x³）
      </Link>
      <Link
        to="/custom"
        className="text-ui-base hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-white/10"
      >
        自分で関数を指定
      </Link>
      <Link
        to="/derivative"
        className="text-ui-base hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-white/10"
      >
        自分で導関数を指定
      </Link>
      <Link
        to="/tutorial"
        className="text-ui-base hover:text-white font-medium px-3 py-1.5 rounded-lg hover:bg-white/10"
      >
        使い方
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
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
