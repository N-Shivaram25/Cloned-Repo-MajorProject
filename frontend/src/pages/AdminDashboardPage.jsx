import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import {
  LogOutIcon,
  SearchIcon,
  ShieldIcon,
  Trash2Icon,
  UserIcon,
  UsersIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminDeleteUser, adminLogout, getAdminMe, getAdminStats, getAdminUsers } from "../lib/api";

const formatDate = (d) => {
  try {
    return new Date(d).toLocaleDateString();
  } catch {
    return "";
  }
};

const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: meData, isLoading: loadingMe } = useQuery({
    queryKey: ["adminMe"],
    queryFn: getAdminMe,
    retry: false,
  });

  const isAdminAuthed = Boolean(meData?.admin);

  const { data: statsData, isLoading: loadingStats } = useQuery({
    queryKey: ["adminStats"],
    queryFn: getAdminStats,
    enabled: isAdminAuthed,
  });

  const { data: users = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["adminUsers"],
    queryFn: getAdminUsers,
    enabled: isAdminAuthed,
  });

  const { mutate: logoutMut, isPending: loggingOut } = useMutation({
    mutationFn: adminLogout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["adminMe"] });
      queryClient.removeQueries({ queryKey: ["adminUsers"] });
      queryClient.removeQueries({ queryKey: ["adminStats"] });
      navigate("/admin/login");
    },
  });

  const { mutate: deleteMut, isPending: deleting } = useMutation({
    mutationFn: adminDeleteUser,
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminStats"] });
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Could not delete user");
    },
  });

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => {
      const name = (u.fullName || "").toLowerCase();
      const email = (u.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [users, search]);

  if (!loadingMe && !isAdminAuthed) {
    navigate("/admin/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-base-100 flex">
      {/* LEFT SIDEBAR */}
      <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col min-h-screen sticky top-0">
        <div className="p-5 border-b border-base-300">
          <div className="flex items-center gap-2.5">
            <ShieldIcon className="size-6 text-red-500" />
            <span className="text-lg font-semibold">Admin Dashboard</span>
          </div>
        </div>

        <nav className="flex-1 p-4">
          <div className="btn btn-ghost justify-start w-full gap-3 px-3 normal-case btn-active">
            <UsersIcon className="size-5 opacity-70" />
            <span>Admin Dashboard</span>
          </div>
        </nav>

        <div className="p-4 border-t border-base-300 mt-auto">
          <div className="flex items-center gap-3">
            <div className="avatar">
              <div className="w-10 rounded-full bg-base-300 flex items-center justify-center">
                <UserIcon className="size-5 opacity-60" />
              </div>
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">{meData?.admin?.name || "Admin"}</p>
              <p className="text-xs text-success flex items-center gap-1">
                <span className="size-2 rounded-full bg-success inline-block" />
                Online
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* TOP BAR */}
          <div className="flex items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <ShieldIcon className="size-6 text-red-500" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              </div>
              <p className="text-sm opacity-70">Manage users and monitor system statistics</p>
            </div>

            <button
              className="btn btn-ghost"
              onClick={() => logoutMut()}
              disabled={loggingOut}
            >
              <LogOutIcon className="size-4" />
              Logout
            </button>
          </div>

          {/* STATS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl text-white p-4 bg-gradient-to-r from-blue-600 to-blue-500">
              <div className="text-xs opacity-90">Total Users</div>
              <div className="mt-2 text-3xl font-bold">{loadingStats ? "—" : statsData?.totalUsers ?? 0}</div>
            </div>
            <div className="rounded-xl text-white p-4 bg-gradient-to-r from-violet-600 to-purple-500">
              <div className="text-xs opacity-90">Onboarded</div>
              <div className="mt-2 text-3xl font-bold">{loadingStats ? "—" : statsData?.onboarded ?? 0}</div>
            </div>
            <div className="rounded-xl text-white p-4 bg-gradient-to-r from-emerald-600 to-green-500">
              <div className="text-xs opacity-90">Friend Requests</div>
              <div className="mt-2 text-3xl font-bold">{loadingStats ? "—" : statsData?.friendRequests ?? 0}</div>
            </div>
            <div className="rounded-xl text-white p-4 bg-gradient-to-r from-orange-600 to-amber-500">
              <div className="text-xs opacity-90">Pending Requests</div>
              <div className="mt-2 text-3xl font-bold">{loadingStats ? "—" : statsData?.pendingRequests ?? 0}</div>
            </div>
          </div>

          {/* USERS TABLE */}
          <div className="card bg-base-200 shadow-sm">
            <div className="card-body p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">All Users</h2>

                <label className="input input-bordered flex items-center gap-2 max-w-xs w-full">
                  <SearchIcon className="size-4 opacity-60" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    type="text"
                    className="grow"
                    placeholder="Search users..."
                  />
                </label>
              </div>

              <div className="overflow-x-auto mt-4">
                <table className="table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Onboarded</th>
                      <th>Role</th>
                      <th>Joined</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadingMe || loadingUsers ? (
                      <tr>
                        <td colSpan={6}>
                          <div className="flex justify-center py-8">
                            <span className="loading loading-spinner loading-lg" />
                          </div>
                        </td>
                      </tr>
                    ) : filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-6 opacity-70">
                          No users found
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="avatar">
                                <div className="w-9 rounded-full">
                                  <img src={u.profilePic} alt={u.fullName} />
                                </div>
                              </div>
                              <div className="font-semibold">{u.fullName}</div>
                            </div>
                          </td>
                          <td className="text-sm opacity-80">{u.email}</td>
                          <td>
                            <span className={`badge ${u.isOnboarded ? "badge-success" : "badge-warning"}`}>
                              {u.isOnboarded ? "Yes" : "No"}
                            </span>
                          </td>
                          <td>
                            <span className="badge badge-outline">{u.role || "User"}</span>
                          </td>
                          <td className="text-sm opacity-80">{formatDate(u.createdAt)}</td>
                          <td className="text-right">
                            <button
                              className="btn btn-error btn-sm"
                              onClick={() => {
                                const ok = window.confirm(`Delete user: ${u.fullName}?`);
                                if (!ok) return;
                                deleteMut(u._id);
                              }}
                              disabled={deleting}
                              title="Delete user"
                            >
                              <Trash2Icon className="size-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboardPage;
