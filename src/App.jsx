import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home";
import Battle from "./pages/Battle";

export default function App() {
  return (
    <>
      <nav style={{ padding: "10px", display: "flex", gap: "10px" }}>
        <Link to="/">Home</Link>
        <Link to="/battle">Battle Simulator</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/battle" element={<Battle />} />
      </Routes>
    </>
  );
}
