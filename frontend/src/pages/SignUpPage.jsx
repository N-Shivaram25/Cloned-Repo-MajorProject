import { useState } from "react";
import { Globe2Icon, MessageSquareTextIcon, ShipWheelIcon, VideoIcon } from "lucide-react";
import { Link } from "react-router";

import useSignUp from "../hooks/useSignUp";

const SignUpPage = () => {
  const [signupData, setSignupData] = useState({
    fullName: "",
    email: "",
    password: "",
    gender: "",
  });

  // This is how we did it at first, without using our custom hook
  // const queryClient = useQueryClient();
  // const {
  //   mutate: signupMutation,
  //   isPending,
  //   error,
  // } = useMutation({
  //   mutationFn: signup,
  //   onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  // });

  // This is how we did it using our custom hook - optimized version
  const { isPending, error, signupMutation } = useSignUp();

  const handleSignup = (e) => {
    e.preventDefault();
    signupMutation(signupData);
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-50 to-slate-200">
      <div className="w-full max-w-6xl mx-auto rounded-2xl shadow-2xl overflow-hidden border border-black/5 bg-white">
        <div className="flex flex-col lg:flex-row">
          {/* LEFT - SIGNUP FORM */}
          <div className="w-full lg:w-1/2 p-6 sm:p-10">
            <div className="mb-6 flex items-center justify-start gap-2">
              <ShipWheelIcon className="size-8 text-orange-500" />
              <span className="text-3xl font-bold tracking-wide text-orange-500">Aero Sonix</span>
            </div>

          {/* ERROR MESSAGE IF ANY */}
          {error && (
            <div className="alert alert-error mb-4">
              <span>{error?.response?.data?.message || error?.message || "Something went wrong"}</span>
            </div>
          )}

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <h2 className="text-3xl font-bold text-slate-900">Create an Account</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Join Aero Sonix and connect across languages!
                </p>
              </div>

              <div className="space-y-3">
                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Full Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    className="input input-bordered w-full"
                    value={signupData.fullName}
                    onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Email Address</span>
                  </label>
                  <input
                    type="email"
                    placeholder="john@gmail.com"
                    className="input input-bordered w-full"
                    value={signupData.email}
                    onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                    required
                  />
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Password</span>
                  </label>
                  <input
                    type="password"
                    placeholder="********"
                    className="input input-bordered w-full"
                    value={signupData.password}
                    onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                    required
                  />
                  <p className="text-xs text-slate-500 mt-1">At least 6 characters</p>
                </div>

                <div className="form-control w-full">
                  <label className="label">
                    <span className="label-text">Gender</span>
                  </label>
                  <select
                    className="select select-bordered w-full"
                    value={signupData.gender}
                    onChange={(e) => setSignupData({ ...signupData, gender: e.target.value })}
                    required
                  >
                    <option value="">Select your gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>

                <div className="form-control">
                  <label className="label cursor-pointer justify-start gap-2">
                    <input type="checkbox" className="checkbox checkbox-sm" required />
                    <span className="text-xs leading-tight text-slate-600">
                      I agree to the <span className="text-orange-500 hover:underline">terms of service</span> and{" "}
                      <span className="text-orange-500 hover:underline">privacy policy</span>
                    </span>
                  </label>
                </div>
              </div>

              <button
                className="btn w-full border-0 bg-orange-500 hover:bg-orange-600 text-white"
                type="submit"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    Loading...
                  </>
                ) : (
                  "Create Account"
                )}
              </button>

              <div className="text-center mt-4">
                <p className="text-sm text-slate-700">
                  Already have an account?{" "}
                  <Link to="/login" className="text-orange-500 hover:underline">
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>

          {/* RIGHT - ILLUSTRATION + FEATURES */}
          <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-10">
            <div className="w-full h-full flex flex-col justify-between">
              <div className="flex items-center justify-center">
                <img
                  src="/i.png"
                  alt="Language connection illustration"
                  className="w-[420px] max-w-full drop-shadow-2xl"
                />
              </div>

              <div className="text-center text-white/90 mt-6">
                <h2 className="text-2xl font-semibold">Connect Across Languages</h2>
                <p className="mt-2 text-sm text-white/60">
                  Break language barriers and make meaningful connections worldwide
                </p>

                <div className="mt-8 space-y-4">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 text-left">
                    <div className="mt-0.5 size-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <VideoIcon className="size-5 text-orange-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">HD Video Calls</div>
                      <div className="text-xs text-white/60">Crystal clear communication</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 text-left">
                    <div className="mt-0.5 size-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <MessageSquareTextIcon className="size-5 text-orange-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Real-time Translation</div>
                      <div className="text-xs text-white/60">Chat in any language</div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-white/10 bg-white/5 p-4 flex items-start gap-3 text-left">
                    <div className="mt-0.5 size-9 rounded-lg bg-orange-500/15 flex items-center justify-center">
                      <Globe2Icon className="size-5 text-orange-300" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">Global Community</div>
                      <div className="text-xs text-white/60">Connect with millions</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
