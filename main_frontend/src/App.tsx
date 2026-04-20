import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@shared/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InfoPage from "./pages/Info";
import Home from "./pages/Home";
import TwoFactorChallenge from "./pages/TwoFactorChallenge";
import EmailOtpChallenge from "./pages/EmailOtpChallenge";
import Navbar from "./components/Navbar";
import RequireAuth from "./components/RequireAuth";
import DashboardHome from "./pages/DashboardHome";
import PlaceholderPage from "./pages/PlaceholderPage";
import { ThemeProvider } from "./theme/ThemeProvider";

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <div className="min-h-screen flex flex-col bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark font-sans">
            <Navbar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/service-status" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/2fa-challenge" element={<TwoFactorChallenge />} />
                <Route path="/auth/email-otp" element={<EmailOtpChallenge />} />
                <Route element={<RequireAuth />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/info" element={<InfoPage />} />
                  {/* Generic feature routes — rename or replace with your own pages */}
                  <Route
                    path="/features/example-one"
                    element={<PlaceholderPage titleKey="pages.featureOne.title" />}
                  />
                  <Route
                    path="/features/example-two"
                    element={<PlaceholderPage titleKey="pages.featureTwo.title" />}
                  />
                  <Route
                    path="/features/example-three"
                    element={<PlaceholderPage titleKey="pages.featureThree.title" />}
                  />
                </Route>
              </Routes>
            </main>
          </div>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
