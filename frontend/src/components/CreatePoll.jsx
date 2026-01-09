import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { API_URL } from "../shared";
import "./CreatePollStyles.css";

const CreatePoll = ({ user }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    closeDate: "",
    options: ["", ""], // Start with 2 empty options
    optionImages: {}, // Store image files for each option
  });
  const [pollImage, setPollImage] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
    }));
  };

  const addOption = () => {
    setFormData((prev) => ({
      ...prev,
      options: [...prev.options, ""],
    }));
  };

  const removeOption = (index) => {
    if (formData.options.length <= 2) {
      setErrors((prev) => ({
        ...prev,
        options: "Poll must have at least 2 options",
      }));
      return;
    }
    const newOptions = formData.options.filter((_, i) => i !== index);
    const newOptionImages = { ...formData.optionImages };
    delete newOptionImages[index];
    // Reindex option images
    const reindexedImages = {};
    Object.keys(newOptionImages).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexedImages[oldIndex - 1] = newOptionImages[key];
      } else {
        reindexedImages[oldIndex] = newOptionImages[key];
      }
    });
    setFormData((prev) => ({
      ...prev,
      options: newOptions,
      optionImages: reindexedImages,
    }));
    if (errors.options) {
      setErrors((prev) => ({
        ...prev,
        options: "",
      }));
    }
  };

  const handlePollImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          pollImage: "Image size must be less than 5MB",
        }));
        return;
      }
      setPollImage(file);
      setErrors((prev) => ({
        ...prev,
        pollImage: "",
      }));
    }
  };

  const handleOptionImageChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors((prev) => ({
          ...prev,
          [`optionImage${index}`]: "Image size must be less than 5MB",
        }));
        return;
      }
      setFormData((prev) => ({
        ...prev,
        optionImages: {
          ...prev.optionImages,
          [index]: file,
        },
      }));
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`optionImage${index}`];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    const validOptions = formData.options.filter((opt) => opt.trim() !== "");
    if (validOptions.length < 2) {
      newErrors.options = "At least 2 options are required";
    }

    if (formData.closeDate) {
      const closeDate = new Date(formData.closeDate);
      if (closeDate <= new Date()) {
        newErrors.closeDate = "Close date must be in the future";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    try {
      // Filter out empty options
      const validOptions = formData.options.filter((opt) => opt.trim() !== "");

      // Create FormData for multipart/form-data
      const submitData = new FormData();
      submitData.append("title", formData.title);
      if (formData.description) {
        submitData.append("description", formData.description);
      }
      if (formData.closeDate) {
        submitData.append("closeDate", formData.closeDate);
      }
      submitData.append("options", JSON.stringify(validOptions));
      if (pollImage) {
        submitData.append("image", pollImage);
      }

      // Create the poll
      const response = await axios.post(`${API_URL}/api/polls`, submitData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const pollId = response.data.poll.id;

      // Upload option images if any
      const imageUploads = validOptions.map(async (optionText, index) => {
        if (formData.optionImages[index]) {
          const optionData = new FormData();
          optionData.append("text", optionText);
          optionData.append("image", formData.optionImages[index]);

          // Find the created option by text (first match)
          const pollResponse = await axios.get(`${API_URL}/api/polls/${pollId}`, {
            withCredentials: true,
          });
          const options = pollResponse.data.poll.options;
          const option = options.find((opt) => opt.text === optionText && !opt.imageUrl);

          if (option) {
            await axios.put(
              `${API_URL}/api/polls/${pollId}/options/${option.id}`,
              optionData,
              {
                withCredentials: true,
                headers: {
                  "Content-Type": "multipart/form-data",
                },
              }
            );
          }
        }
      });

      await Promise.all(imageUploads);

      // Navigate to poll detail page where user can share the link
      navigate(`/poll/${pollId}`);
    } catch (error) {
      console.error("Error creating poll:", error);
      setErrors({
        general:
          error.response?.data?.error || "Failed to create poll. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className="create-poll-container">
      <div className="create-poll-form">
        <h2>Create New Poll</h2>

        {errors.general && <div className="error-message">{errors.general}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title">
              Poll Title <span className="required">*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className={errors.title ? "error" : ""}
              placeholder="e.g., Best Programming Language 2024"
            />
            {errors.title && <span className="error-text">{errors.title}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description (Optional)</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              placeholder="Add a description for your poll..."
            />
          </div>

          <div className="form-group">
            <label htmlFor="pollImage">Poll Image (Optional)</label>
            <input
              type="file"
              id="pollImage"
              accept="image/*"
              onChange={handlePollImageChange}
              className={errors.pollImage ? "error" : ""}
            />
            {pollImage && (
              <div className="image-preview">
                <img
                  src={URL.createObjectURL(pollImage)}
                  alt="Poll preview"
                  className="preview-img"
                />
              </div>
            )}
            {errors.pollImage && (
              <span className="error-text">{errors.pollImage}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="closeDate">Close Date (Optional)</label>
            <input
              type="datetime-local"
              id="closeDate"
              name="closeDate"
              value={formData.closeDate}
              onChange={handleChange}
              className={errors.closeDate ? "error" : ""}
            />
            {errors.closeDate && (
              <span className="error-text">{errors.closeDate}</span>
            )}
          </div>

          <div className="form-group">
            <div className="options-header">
              <label>
                Poll Options <span className="required">*</span>
              </label>
              <button
                type="button"
                onClick={addOption}
                className="add-option-btn"
              >
                + Add Option
              </button>
            </div>
            {errors.options && (
              <span className="error-text">{errors.options}</span>
            )}
            {formData.options.map((option, index) => (
              <div key={index} className="option-row">
                <div className="option-input-group">
                  <input
                    type="text"
                    value={option}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    className={errors[`option${index}`] ? "error" : ""}
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleOptionImageChange(index, e)}
                    className="option-image-input"
                    title="Add image for this option"
                  />
                  {formData.optionImages[index] && (
                    <img
                      src={URL.createObjectURL(formData.optionImages[index])}
                      alt="Option preview"
                      className="option-preview-img"
                    />
                  )}
                </div>
                {formData.options.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOption(index)}
                    className="remove-option-btn"
                    title="Remove option"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="cancel-btn"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Poll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePoll;

