import User from "../models/User.js";

//login controller
export const loginController = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for:", email);

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("User found:", user.email, "Role:", user.role);

    // Compare passwords
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log("Password mismatch for:", email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    console.log("Password match successful for:", email);

    // Send response without password (no token needed)
    const userResponse = user.toJSON();
    console.log(
      "Login successful, sending response:",
      userResponse.email,
      userResponse.role
    );

    res.json({
      user: userResponse,
      message: "Login successful",
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//Register controller
export const registerController = async (req, res) => {
  const { name, email, password, role } = req.body;
  try {
    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({
        error: "Password is required and should be at least 8 characters long",
      });
    }
    //check if user already have an account
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ error: "Email already used, please login" });
    }

    // Validate role
    const validRoles = ["organizer", "participant", "administrator"];
    const userRole = validRoles.includes(role) ? role : "participant";

    // Create new user
    const user = await User.create({
      name,
      email,
      password,
      role: userRole,
    });


    // Send response without password (no token needed)
    const userResponse = user.toJSON();

    res.status(201).json({
      user: userResponse,
      message: "Registration successful",
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

//fetch logged in user data
export const getCurrentUser = async (req, res) => {
  try {
    const user = req.user.toJSON();
    console.log("Auth check for user:", user?.email, user?.role);
    res.json({ user });
  } catch (error) {
    console.error("Auth check error:", error);
    res.status(401).json({ message: "Not authorized" });
  }
};
