import SignUp from "./pages/SignUp";
import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import Calendar from "./pages/Calendar";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import LogData from "./pages/LogData";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<SignUp />} />
      <Route path="/dashboard" element={<Dashboard />}>
        <Route index element={<Home />} />
        <Route path="profile" element={<Profile />} />
        <Route path="calendar" element={<Calendar />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="log" element={<LogData />} />
      </Route>
    </Routes>
  );
}

export default App;
