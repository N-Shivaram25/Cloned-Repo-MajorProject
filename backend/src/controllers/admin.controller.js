import jwt from "jsonwebtoken";
import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";

const ADMIN_NAME = "shivapc";
const ADMIN_PASSWORD = "asdf@shivapc";

const signAdminToken = () => {
  if (!process.env.JWT_SECRET_KEY) {
    throw new Error("JWT_SECRET_KEY is not set");
  }

  return jwt.sign({ isAdmin: true, adminName: ADMIN_NAME }, process.env.JWT_SECRET_KEY, {
    expiresIn: "7d",
  });
};

export async function adminLogin(req, res) {
  try {
    const { adminName, adminPassword } = req.body;

    if (!adminName || !adminPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (adminName !== ADMIN_NAME || adminPassword !== ADMIN_PASSWORD) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const token = signAdminToken();
    const isProd = process.env.NODE_ENV === "production";

    res.cookie("admin_jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: isProd ? "none" : "lax",
      secure: isProd,
    });

    return res.status(200).json({ success: true, admin: { name: ADMIN_NAME } });
  } catch (error) {
    console.log("Error in adminLogin controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export function adminLogout(req, res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("admin_jwt", { sameSite: isProd ? "none" : "lax", secure: isProd });
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function getAdminMe(req, res) {
  return res.status(200).json({ success: true, admin: req.admin || null });
}

export async function getAdminStats(req, res) {
  try {
    const [totalUsers, onboarded, friendRequests, pendingRequests] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ isOnboarded: true }),
      FriendRequest.countDocuments({}),
      FriendRequest.countDocuments({ status: "pending" }),
    ]);

    return res.status(200).json({
      totalUsers,
      onboarded,
      friendRequests,
      pendingRequests,
    });
  } catch (error) {
    console.log("Error in getAdminStats controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAllUsersForAdmin(req, res) {
  try {
    const users = await User.find({})
      .select("fullName email profilePic isOnboarded createdAt")
      .sort({ createdAt: -1 });

    const mapped = users.map((u) => ({
      _id: u._id,
      fullName: u.fullName,
      email: u.email,
      profilePic: u.profilePic,
      isOnboarded: u.isOnboarded,
      role: "user",
      createdAt: u.createdAt,
    }));

    return res.status(200).json(mapped);
  } catch (error) {
    console.log("Error in getAllUsersForAdmin controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteUserByAdmin(req, res) {
  try {
    const { id: userId } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    await Promise.all([
      FriendRequest.deleteMany({ $or: [{ sender: userId }, { recipient: userId }] }),
      User.updateMany({ friends: userId }, { $pull: { friends: userId } }),
    ]);

    await User.findByIdAndDelete(userId);

    return res.status(200).json({ success: true, message: "User deleted" });
  } catch (error) {
    console.log("Error in deleteUserByAdmin controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
