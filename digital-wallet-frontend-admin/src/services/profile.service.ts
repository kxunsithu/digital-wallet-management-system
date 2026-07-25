import api from "../lib/axiox";

export const getProfile = () => api.get("profile");

export const updateProfile = (data: {
  full_name?: string;
  nrc_number?: string;
}) => api.put("profile", data);

export const uploadProfilePicture = (file: File) => {
  const formData = new FormData();
  formData.append("profile_image", file);
  return api.post("profile/upload-profile-picture", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const changePin = (data: {
  current_pin: string;
  new_pin: string;
  new_pin_confirmation: string;
}) => api.post("profile/change-pin", data);
