import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/firebase";
import maleIcon from "@/assets/maleicon.png";
import femaleIcon from "@/assets/femaleicon.png";
import profileIcon from "@/assets/profileicon.png";

const API_BASE = "http://127.0.0.1:8000";

type SuggestedUser = {
  firebase_uid: string;
  username?: string;
  full_name?: string;
  image_name?: string;
  gender?: string;
};

const SuggestedUsers = () => {
  const [users, setUsers] = useState<SuggestedUser[]>([]);
  const [loadingUser, setLoadingUser] = useState<string | null>(null);
  const navigate = useNavigate();

  const isValidImage = (url?: string) =>
    typeof url === "string" &&
    url.trim() !== "" &&
    url.startsWith("http");

  const getAvatar = (user: SuggestedUser) => {
    if (user.image_name && isValidImage(user.image_name))
      return user.image_name;
    if (user.gender === "male") return maleIcon;
    if (user.gender === "female") return femaleIcon;
    return profileIcon;
  };

  useEffect(() => {
    const fetchSuggested = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;

      try {
        const token = await currentUser.getIdToken();
        const res = await fetch(`${API_BASE}/profile/users/suggested`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load suggestions");

        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Suggested users error:", error);
        setUsers([]);
      }
    };

    fetchSuggested();
  }, []);

  const handleFollow = async (targetUid: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    setLoadingUser(targetUid);

    try {
      const token = await currentUser.getIdToken();

      const res = await fetch(
        `${API_BASE}/follow/send-request/${targetUid}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.ok) {
        // Remove user from suggestion list after follow
        setUsers((prev) =>
          prev.filter((user) => user.firebase_uid !== targetUid)
        );
      }
    } catch (error) {
      console.error("Follow failed:", error);
    } finally {
      setLoadingUser(null);
    }
  };

  if (users.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-base font-semibold text-foreground">
          Suggested for you
        </h3>
        <button className="text-sm text-blue-500 hover:underline">
          See all
        </button>
      </div>

      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {users.map((user) => (
          <div
            key={user.firebase_uid}
            className="bg-card border border-border rounded-2xl p-4 min-w-[220px] flex flex-col items-center shadow-sm"
          >
            <div className="w-full flex justify-end">
              <button
                className="text-muted-foreground text-sm"
                onClick={() =>
                  setUsers((prev) =>
                    prev.filter((u) => u.firebase_uid !== user.firebase_uid)
                  )
                }
              >
                ✕
              </button>
            </div>

            <img
              src={getAvatar(user)}
              alt={user.username || "User"}
              className="w-24 h-24 rounded-full object-cover mb-3 cursor-pointer"
              onClick={() => navigate(`/user/${user.firebase_uid}`)}
            />

            <p className="font-semibold text-sm text-center">
              {user.username || user.full_name || "User"}
            </p>

            <p className="text-xs text-muted-foreground text-center mt-1">
              Suggested for you
            </p>

            <button
              onClick={() => handleFollow(user.firebase_uid)}
              disabled={loadingUser === user.firebase_uid}
              className="mt-4 w-full bg-gradient-to-r from-secondary to-accent text-secondary-foreground py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loadingUser === user.firebase_uid ? (
                "Following..."
              ) : (
                <>
                  {/* Optionally add an icon here, e.g., a plus icon */}
                  {/* <svg className=\"w-4 h-4\" fill=\"none\" stroke=\"currentColor\" strokeWidth=\"2\" viewBox=\"0 0 24 24\"><path strokeLinecap=\"round\" strokeLinejoin=\"round\" d=\"M12 4v16m8-8H4\" /></svg> */}
                  Follow
                </>
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SuggestedUsers;
