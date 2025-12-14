import jwt from "jsonwebtoken";

export const protectAdminRoute = async (req, res, next) => {
  try {
    const token = req.cookies.admin_jwt;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized - No admin token provided" });
    }

    if (!process.env.JWT_SECRET_KEY) {
      return res.status(500).json({ message: "Server misconfigured - JWT secret missing" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);

    if (!decoded?.isAdmin) {
      return res.status(403).json({ message: "Forbidden - Admin access required" });
    }

    req.admin = { name: decoded.adminName || "admin" };

    return next();
  } catch (error) {
    if (error?.name === "JsonWebTokenError" || error?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Unauthorized - Invalid admin token" });
    }
    console.log("Error in protectAdminRoute middleware", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
