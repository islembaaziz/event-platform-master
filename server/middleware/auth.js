import User from "../models/User.js";


export const protect = async (req, res, next) => {
  try {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];

    if (!userId) {
      return res.status(401).json({ message: "Not authorized to access this route" });
    }

    // Vérifie que userId est un ObjectId valide

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (user.role !== userRole) {
      return res.status(401).json({ message: "Invalid user credentials" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Not authorized to access this route" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `User role ${req.user.role} is not authorized to access this route`,
      });
    }
    next();
  };
};

// Middleware to check if user can create/modify/delete content
export const canManageContent = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Authentication required to manage content" });
  }

  const allowedRoles = ["organizer", "administrator"];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message:
        "Only organizers and administrators can create, modify, or delete content",
    });
  }

  next();
};

// Middleware to check if user owns the content or is administrator
export const canModifyOwnContent = (req, res, next) => {
  if (!req.user) {
    return res
      .status(401)
      .json({ message: "Authentication required to modify content" });
  }

  const allowedRoles = ["organizer", "administrator"];

  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({
      message: "Only organizers and administrators can modify content",
    });
  }

  next();
};
