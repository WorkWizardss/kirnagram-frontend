import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { auth } from "@/firebase";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Explore from "./pages/Explore";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import FollowList from "./pages/FollowList";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import Notifications from "./pages/Notifications";
import AICreator from "./pages/AICreator";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import CreatorEarnings from "./pages/CreatorEarnings";
import CreatorPrompts from "./pages/CreatorPrompts";
import AddNewPrompt from "./pages/AddNewPrompt";
import EditCreatorProfile from "./pages/EditCreatorProfile";
import BecomePublisher from "./pages/BecomePublisher";
import NotFound from "./pages/NotFound";
import AddPostPage from "./pages/AddPostPage";
import PostsView from "./pages/PostsView";
import StoryUpload from "@/components/StoryUpload";
import StoryView from "@/components/StoryView";
import Credits from "./pages/Credits";
import Remix from "./pages/Remix";

const queryClient = new QueryClient();

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }: { children: JSX.Element }) => {
  const [user, setUser] = useState(() => auth.currentUser);
  const [loading, setLoading] = useState(!auth.currentUser);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged((u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) return null;
  if (user) return <Navigate to="/home" replace />;
  return children;
};






const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

            <Route path="/home" element={<PrivateRoute><Index /></PrivateRoute>} />
            <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
            <Route path="/user/:userId" element={<PrivateRoute><UserProfile /></PrivateRoute>} />
            <Route path="/user/:userId/:tab" element={<PrivateRoute><FollowList /></PrivateRoute>} />
            <Route path="/edit-profile" element={<PrivateRoute><EditProfile /></PrivateRoute>} />
            <Route path="/notifications" element={<PrivateRoute><Notifications /></PrivateRoute>} />
            <Route path="/settings" element={<PrivateRoute><Settings /></PrivateRoute>} />
            <Route path="/ai-creator" element={<PrivateRoute><AICreator /></PrivateRoute>} />
            <Route path="/ai-creator/earnings" element={<PrivateRoute><CreatorEarnings /></PrivateRoute>} />
            <Route path="/ai-creator/prompts" element={<PrivateRoute><CreatorPrompts /></PrivateRoute>} />
            <Route path="/ai-creator/add-prompt" element={<PrivateRoute><AddNewPrompt /></PrivateRoute>} />
            <Route path="/ai-creator/edit-profile" element={<PrivateRoute><EditCreatorProfile /></PrivateRoute>} />
            <Route path="/privacy" element={<PrivateRoute><Privacy /></PrivateRoute>} />
            <Route path="/terms" element={<PrivateRoute><Terms /></PrivateRoute>} />
            <Route path="/become-publisher" element={<PrivateRoute><BecomePublisher /></PrivateRoute>} />
            <Route path="/create" element={<PrivateRoute><AddPostPage /></PrivateRoute>} />
            <Route path="/credits" element={<PrivateRoute><Credits /></PrivateRoute>} />
            <Route path="/remix/:promptId" element={<PrivateRoute><Remix /></PrivateRoute>} />
            <Route path="/posts" element={<PrivateRoute><PostsView /></PrivateRoute>} />
            <Route path="/posts/view/:userId" element={<PrivateRoute><PostsView /></PrivateRoute>} />
            <Route path="/story/upload" element={<PrivateRoute><StoryUpload /></PrivateRoute>} />
            <Route path="/story/view" element={<PrivateRoute><StoryView /></PrivateRoute>} />
            <Route path="/story/view/:storyId" element={<PrivateRoute><StoryView /></PrivateRoute>} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
