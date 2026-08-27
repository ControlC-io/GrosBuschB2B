import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@shared/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import InfoPage from "./pages/Info";
import Home from "./pages/Home";
import TwoFactorChallenge from "./pages/TwoFactorChallenge";
import EmailOtpChallenge from "./pages/EmailOtpChallenge";
import Navbar from "./components/Navbar";
import AppShell from "./components/AppShell";
import RequireAuth from "./components/RequireAuth";
import DashboardHome from "./pages/DashboardHome";
import Catalog from "./pages/Catalog";
import ProductSheet from "./pages/ProductSheet";
import Documents from "./pages/Documents";
import PlaceholderPage from "./pages/PlaceholderPage";
import Favorites from "./pages/Favorites";
import { ThemeProvider } from "./theme/ThemeProvider";
import { CartProvider } from "./context/CartProvider";
import { FavoritesProvider } from "./context/FavoritesProvider";

const App = () => {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <FavoritesProvider>
              <div className="min-h-screen flex flex-col bg-background dark:bg-background-dark text-textPrimary dark:text-textPrimary-dark font-sans">
              <Navbar />
              <AppShell>
                <main>
                  <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/service-status" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/auth/2fa-challenge" element={<TwoFactorChallenge />} />
                <Route path="/auth/email-otp" element={<EmailOtpChallenge />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/catalog/:sku" element={<ProductSheet />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route element={<RequireAuth />}>
                  <Route path="/dashboard" element={<DashboardHome />} />
                  <Route path="/documents" element={<Documents />} />
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
              </AppShell>
              </div>
            </FavoritesProvider>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
