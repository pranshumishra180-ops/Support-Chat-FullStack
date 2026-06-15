import { useRef, useState } from "react";
import api from "../services/api";

function ProfilePhotoUpload({ onUploaded }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      const response = await api.post("/api/auth/avatar", formData);
      onUploaded(response.data.user);
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  return (
    <label className="profile-photo-upload" title="Update profile photo">
      <span aria-hidden="true">{uploading ? "..." : "📷"}</span>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={handleFileChange} />
    </label>
  );
}

export default ProfilePhotoUpload;
