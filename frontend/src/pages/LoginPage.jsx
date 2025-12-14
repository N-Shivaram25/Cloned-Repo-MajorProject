import { useState } from "react";
import { ShipWheelIcon } from "lucide-react";
import { Link, useNavigate } from "react-router";
import useLogin from "../hooks/useLogin";

const LoginPage = () => {
  const navigate = useNavigate();
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // This is how we did it at first, without using our custom hook
  // const queryClient = useQueryClient();
  // const {
  //   mutate: loginMutation,
  //   isPending,
  //   error,
  // } = useMutation({
  //   mutationFn: login,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  // This is how we did it using our custom hook - optimized version
  const { isPending, error, loginMutation } = useLogin();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-200"
    >
      <div className="w-full max-w-6xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-black/5 bg-white">
        <div className="flex flex-col lg:flex-row">
          {/* LEFT - ILLUSTRATION */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10">
            <div className="w-full h-full flex flex-col justify-between">
              <div>
                <div className="mb-8 flex items-center gap-2 text-white">
                  <ShipWheelIcon className="size-8 text-orange-400" />
                  <span className="text-3xl font-bold tracking-wide">Aero Sonix</span>
                </div>

                <div className="flex items-center justify-center">
                  <img
                    src="/i.png"
                    alt="Language connection illustration"
                    className="w-[420px] max-w-full drop-shadow-2xl"
                  />
                </div>
              </div>

              <div className="text-center text-white/90">
                <h2 className="text-2xl font-semibold">Your Journey Awaits</h2>
                <p className="mt-2 text-sm text-white/60">
                  Access your conversations and continue building meaningful connections
                </p>

                <div className="mt-8 grid grid-cols-2 gap-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                    <div className="text-orange-300 text-sm font-semibold">Fast</div>
                    <div className="text-xs text-white/60">Instant connect</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                    <div className="text-orange-300 text-sm font-semibold">Secure</div>
                    <div className="text-xs text-white/60">End-to-end</div>
                  </div>
                </div>

                <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4 text-left">
                  <div className="text-orange-300 text-sm font-semibold">Growing Community</div>
                  <div className="text-xs text-white/60">Join thousands of learners</div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT - LOGIN FORM */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10">
            <div className="mb-6 flex items-center justify-start gap-2">
              <ShipWheelIcon className="size-8 text-orange-500" />
              <span className="text-3xl font-bold tracking-wide text-orange-500">Aero Sonix</span>
            </div>

          {/* ERROR MESSAGE DISPLAY */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error?.response?.data?.message || error?.message || "Something went wrong"}</span>
            </div>
          )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Welcome Back!</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Sign in to continue your language journey
                </p>
              </div>

              <div className="space-y-3">
                <div className="form-control w-full space-y-2">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="hello@example.com"
                    className="input input-bordered w-full"
                    value={loginData.email}
                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control w-full space-y-2">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="input input-bordered w-full"
                    value={loginData.password}
                    onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                    required
                  />
                  <div className="flex items-center justify-between">
                    <label className="label cursor-pointer gap-2 justify-start">
                      <input type="checkbox" className="checkbox checkbox-sm" />
                      <span className="text-xs text-slate-600">Remember me for 30 days</span>
                    </label>
                    <button type="button" className="text-xs text-orange-500 hover:underline">
                      Forgot password?
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn w-full border-0 bg-orange-500 hover:bg-orange-600 text-white"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </button>

                <div className="text-center mt-4">
                  <p className="text-sm text-slate-700">
                    Don't have an account?{" "}
                    <Link to="/signup" className="text-orange-500 hover:underline">
                      Create one
                    </Link>
                  </p>
                </div>

                <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="text-center text-sm font-semibold text-red-500">Admin</div>
                  <button
                    type="button"
                    className="btn w-full mt-3 border-0 bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => navigate("/admin/login")}
                  >
                    Login as Admin
                  </button>
                  <div className="text-center text-xs text-red-400 mt-2">Admin Dashboard Access</div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
export default LoginPage;
