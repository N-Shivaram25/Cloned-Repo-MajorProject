import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ShipWheelIcon, ShieldIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { adminLogin } from "../lib/api";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [formState, setFormState] = useState({
    adminName: "",
    adminPassword: "",
  });

  const { mutate, isPending } = useMutation({
    mutationFn: adminLogin,
    onSuccess: () => {
      toast.success("Admin login successful");
      navigate("/admin/dashboard");
    },
    onError: (error) => {
      toast.error(error?.response?.data?.message || error?.message || "Something went wrong");
    },
  });

  const onSubmit = (e) => {
    e.preventDefault();
    mutate(formState);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="w-full max-w-6xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-black/5 bg-white">
        <div className="flex flex-col lg:flex-row">
          {/* LEFT - ADMIN ILLUSTRATION */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-rose-950 via-red-900 to-red-800 p-10">
            <div className="w-full h-full flex flex-col justify-between">
              <div>
                <div className="mb-8 flex items-center gap-2 text-white">
                  <ShieldIcon className="size-8 text-white/90" />
                  <span className="text-3xl font-bold tracking-wide">Administrative Control Panel</span>
                </div>

                <div className="mt-10 flex items-center justify-center">
                  <div className="size-56 rounded-full border border-white/15 bg-white/5 flex items-center justify-center">
                    <ShieldIcon className="size-28 text-white/20" />
                  </div>
                </div>

                <p className="mt-8 text-white/75 text-sm leading-relaxed">
                  Secure access to system management and user administration
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">Protected</div>
                    <div className="text-xs text-white/60">Secure access</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-sm font-semibold text-white">Verified</div>
                    <div className="text-xs text-white/60">Admin only</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                  <div className="text-sm font-semibold text-white">Full Control</div>
                  <div className="text-xs text-white/60">Manage users and system settings</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - FORM */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10">
            <div className="mb-6 flex items-center justify-start gap-2">
              <ShipWheelIcon className="size-8 text-orange-500" />
              <span className="text-3xl font-bold tracking-wide text-orange-500">Aero Sonix</span>
            </div>

            <div className="text-center">
              <div className="mx-auto size-14 rounded-full bg-red-50 border border-red-200 flex items-center justify-center">
                <ShieldIcon className="size-7 text-red-500" />
              </div>
              <h2 className="mt-4 text-3xl font-bold text-red-500">Admin Portal</h2>
              <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-red-100 px-3 py-1 text-xs text-red-600 border border-red-200">
                <ShieldIcon className="size-3" />
                Administrator Access
              </div>
              <p className="mt-3 text-xs text-slate-500">Restricted area · Authorized personnel only</p>
            </div>

            <form onSubmit={onSubmit} className="mt-8 space-y-4">
              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Administrator Name</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter admin name"
                  className="input input-bordered w-full border-red-200 focus:border-red-400"
                  value={formState.adminName}
                  onChange={(e) => setFormState({ ...formState, adminName: e.target.value })}
                  required
                />
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Admin Password</span>
                </label>
                <input
                  type="password"
                  placeholder="Enter admin password"
                  className="input input-bordered w-full border-red-200 focus:border-red-400"
                  value={formState.adminPassword}
                  onChange={(e) => setFormState({ ...formState, adminPassword: e.target.value })}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn w-full border-0 bg-red-500 hover:bg-red-600 text-white"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Accessing...
                  </>
                ) : (
                  "Access Admin Dashboard"
                )}
              </button>

              <div className="divider" />

              <div className="text-center">
                <Link to="/login" className="text-sm text-slate-600 hover:underline">
                  Back to User Login
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
