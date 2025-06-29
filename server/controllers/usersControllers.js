import User from "../models/User.js";

// Get all users (admin only)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user profile
export const updateUserProfile = async (req, res) => {
  try {
    const { name, email, organization, bio, website } = req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, email, organization, bio, website },
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create new user (admin only)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, organization, bio, website } =
      req.body;

    // Basic validation
    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email, and password are required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Validate role
    const validRoles = ["organizer", "participant", "administrator"];
    const userRole = validRoles.includes(role) ? role : "participant";

    // Create new user
    const user = new User({
      name,
      email,
      password,
      role: userRole,
      organization: organization || "",
      bio: bio || "",
      website: website || "",
    });

    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();
    res.status(201).json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user (admin only)
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, organization, bio, website, password } =
      req.body;

    // Basic validation
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user properties
    user.name = name;
    user.email = email;
    user.role = role || user.role;
    user.organization = organization || "";
    user.bio = bio || "";
    user.website = website || "";

    // Update password if provided
    if (password && password.trim() !== "") {
      user.password = password; // Will be hashed by pre-save middleware
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();
    res.json(userResponse);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user role (admin only)
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;

    // Validate role
    const validRoles = ["organizer", "participant", "administrator"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user (admin only)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ message: "You cannot delete your own account" });
    }

    await user.deleteOne();
    res.json({ message: "User deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete current authenticated user's account
export const deleteOwnAccount = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();
    res.json({ message: "Your account has been deleted" });
  } catch (error) {
    console.error("deleteOwnAccount error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user settings
export const getUserSettings = async (req, res) => {
  try {
    // Vérification de req.user._id
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userSettings = {
      name: user.name,
      email: user.email,
      organization: user.organization || "",
      bio: user.bio || "",
      website: user.website || "",
      notificationPreferences: user.settings?.notificationPreferences || {
        emailNotifications: true,
        pushNotifications: true,
        eventReminders: true,
        commentNotifications: true,
        newsletterSubscription: false,
      },
      securitySettings: user.settings?.securitySettings || {
        twoFactorAuth: false,
        sessionTimeout: "30",
        loginNotifications: true,
      },
      appearanceSettings: user.settings?.appearanceSettings || {
        theme: "dark",
        fontSize: "medium",
        compactMode: false,
        animationsEnabled: true,
      },
    };

    res.json(userSettings);
  } catch (error) {
    console.error("getUserSettings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user settings
export const updateUserSettings = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      name,
      email,
      organization,
      bio,
      website,
      notificationPreferences,
      securitySettings,
      appearanceSettings,
    } = req.body;

    // Ne PAS passer 'settings' comme id, mais utiliser req.user._id
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        name,
        email,
        organization,
        bio,
        website,
        settings: {
          notificationPreferences,
          securitySettings,
          appearanceSettings,
        },
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      name: user.name,
      email: user.email,
      organization: user.organization || "",
      bio: user.bio || "",
      website: user.website || "",
      notificationPreferences: user.settings.notificationPreferences,
      securitySettings: user.settings.securitySettings,
      appearanceSettings: user.settings.appearanceSettings,
    });
  } catch (error) {
    console.error("updateUserSettings error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

