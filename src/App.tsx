import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import UserPage from "./pages/UserPage";
import AdminPage from "./pages/AdminPage";
import CreateReportPage from "./pages/CreateReportPage";
import DashboardPage from "./pages/DashboardPage";
import AccountPage from "./pages/AccountPage";
import Header from "./components/Header";
import Footer from "./components/Footer";

function App() {
  return (
    <div className="dark min-h-screen flex flex-col justify-between">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/user" element={<UserPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/create-report" element={<CreateReportPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/account" element={<AccountPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
