import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/Layout";
import ProfilePage from "./pages/Profile";
import TailorPage from "./pages/Tailor";
import LibraryPage from "./pages/Library";
import SettingsPage from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/tailor" replace />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/tailor" element={<TailorPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/tailor" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
