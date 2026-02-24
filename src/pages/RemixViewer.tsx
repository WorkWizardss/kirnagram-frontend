
import { useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { useState } from "react";
// Import Firebase auth if using Firebase authentication
import { getAuth } from "firebase/auth";

// Initialize auth object
const auth = getAuth();

export default function RemixViewer() {
  const location = useLocation();
  const navigate = useNavigate();
  const { remixes = [], startIndex = 0, fromProfile = false } = location.state || {};
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [showCrop, setShowCrop] = useState(false);
  const [addPostAnim, setAddPostAnim] = useState(false);
  const [loadingAddPost, setLoadingAddPost] = useState(false);

  if (!remixes.length) {
    return (
      <MainLayout showRightSidebar={true} fromProfile={fromProfile}>
        <div className="text-center py-20">No remixes found</div>
      </MainLayout>
    );
  }

  const current = remixes[currentIndex];
  return (
    <MainLayout showRightSidebar={true} fromProfile={fromProfile}>
      <div className="flex flex-col items-center justify-center min-h-[80vh] pb-10">
        {/* Back Button */}
        <div className="w-full flex items-center mb-4 px-4">
          <Button
            variant="ghost"
            onClick={() => {
              navigate("/profile", { state: { tab: "remixes" } });
            }}
          >
            ← Back
          </Button>
        </div>
        {/* Loading animation for Add Post */}
        {loadingAddPost ? (
          <div className="flex flex-col items-center justify-center h-[60vh] w-full">
            <img
              src={current.image_url}
              alt="Remix"
              className="max-h-[40vh] max-w-full object-contain rounded-xl mb-6"
            />
            <div className="animate-spin h-10 w-10 border-4 border-t-transparent border-primary rounded-full mb-2" />
            <p className="text-primary mt-2">Loading post...</p>
          </div>
        ) : (
          <>
            {/* Centered and responsive remix image */}
            <div className="flex items-center justify-center w-full h-[60vh] bg-black rounded-xl mb-6">
              <img
                src={current.image_url}
                alt="Remix"
                className="max-h-full max-w-full object-contain rounded-xl shadow-lg"
              />
            </div>

            {/* Actions with improved UI */}
            <div className="flex flex-wrap gap-4 justify-center mb-6">
              <Button
                className={addPostAnim ? "animate-bounce" : ""}
                onClick={() => {
                  setAddPostAnim(true);
                  setLoadingAddPost(true);
                  setTimeout(() => {
                    setAddPostAnim(false);
                    setLoadingAddPost(false);
                    setShowCrop(true); // Show cropping modal/component
                    navigate("/create", {
                      state: { imageUrl: current.image_url, crop: true },
                    });
                  }, 1200);
                }}
              >
                Add Post
              </Button>
              <Button
                onClick={() =>
                  navigate("/story/upload", {
                    state: { imageUrl: current.image_url },
                  })
                }
              >
                Add Story
              </Button>
    <Button
  onClick={async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const token = await user.getIdToken();

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE}/remix/download/${current.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Download failed");
      }

      const blob = await response.blob();

      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `kirnagram-remix-${current.id}.png`;
      link.click();

    } catch (err) {
      console.error(err);
      alert("Failed to download image.");
    }
  }}
>
  Download
</Button>



            </div>

            {/* Navigation with improved spacing */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((prev) => prev - 1)}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                onClick={() => setCurrentIndex((prev) => prev + 1)}
                disabled={currentIndex === remixes.length - 1}
              >
                Next
              </Button>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
