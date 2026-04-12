import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AlertCircle, CheckCircle, Mail, Code } from "lucide-react";

export default function VerifyEmail() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [status, setStatus] = useState("verifying"); // verifying, success, error, manual
  const [message, setMessage] = useState("Verifying your email...");
  const [verificationCode, setVerificationCode] = useState("");
  const [manualError, setManualError] = useState("");
  const [loading, setLoading] = useState(false);
  const email = location.state?.email || "";

  useEffect(() => {
    const verifyToken = async () => {
      const token = searchParams.get("token");

      if (!token) {
        setStatus("manual");
        setMessage("Enter your verification code");
        return;
      }

      try {
        const response = await fetch(
          "http://localhost:8000/api/auth/verify-email/",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
          setMessage("Email verified successfully! Redirecting to login...");

          // Redirect to login in 2 seconds
          setTimeout(() => navigate("/login"), 2000);
        } else {
          setStatus("error");
          setMessage(data.error || "Verification failed");
        }
      } catch (error) {
        setStatus("error");
        setMessage("Error verifying email. Please try again.");
      }
    };

    verifyToken();
  }, [searchParams, navigate]);

  const handleCodeVerify = async (e) => {
    e.preventDefault();
    setManualError("");
    setLoading(true);

    if (!verificationCode || verificationCode.length !== 6) {
      setManualError("Please enter a 6-digit code");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/verify-email/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ verification_code: verificationCode }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("Email verified successfully! Redirecting to login...");
        setTimeout(() => navigate("/login"), 2000);
      } else {
        setManualError(data.error || "Invalid verification code");
      }
    } catch (error) {
      setManualError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setManualError("Email not found. Please register again.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        "http://localhost:8000/api/auth/resend-verification/",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        },
      );

      const data = await response.json();

      if (response.ok) {
        setManualError("");
        setMessage("Verification email resent! Check your inbox.");
      } else {
        setManualError(data.error || "Failed to resend email");
      }
    } catch (error) {
      setManualError("Connection error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-900/30 rounded-full mb-4">
            <Mail className="w-8 h-8 text-blue-400" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Verify Email</h1>
          <p className="text-slate-400">Confirm your email address</p>
        </div>

        {/* Verifying State */}
        {status === "verifying" && (
          <div className="text-center">
            <div className="animate-spin inline-flex items-center justify-center w-12 h-12 bg-blue-900/30 rounded-full mb-4">
              <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <p className="text-slate-300">{message}</p>
          </div>
        )}

        {/* Success State */}
        {status === "success" && (
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-900/30 rounded-full mb-4">
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
            <p className="text-green-400 font-medium mb-2">{message}</p>
            <p className="text-slate-400 text-sm">
              You will be redirected to login shortly...
            </p>
          </div>
        )}

        {/* Error State */}
        {status === "error" && (
          <div className="space-y-4">
            <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-400 font-medium">{message}</p>
                <p className="text-red-300/70 text-sm mt-1">
                  Try entering your verification code manually
                </p>
              </div>
            </div>
            <button
              onClick={() => setStatus("manual")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg transition"
            >
              Enter Code Manually
            </button>
          </div>
        )}

        {/* Manual Code Entry */}
        {status === "manual" && (
          <form onSubmit={handleCodeVerify} className="space-y-4">
            <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-xl p-6 space-y-4">
              {/* Instructions */}
              <div className="p-3 bg-blue-900/20 border border-blue-500/50 rounded-lg">
                <p className="text-blue-300 text-sm">
                  Enter the 6-digit code sent to your email, or click "Resend"
                  if you didn't receive it.
                </p>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Verification Code
                </label>
                <div className="relative">
                  <Code className="absolute left-3 top-3 w-5 h-5 text-slate-500" />
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "");
                      setVerificationCode(val.slice(0, 6));
                      setManualError("");
                    }}
                    placeholder="000000"
                    maxLength="6"
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition text-center text-lg tracking-widest"
                  />
                </div>
              </div>

              {/* Error Message */}
              {manualError && (
                <div className="p-3 bg-red-900/20 border border-red-500/50 rounded-lg flex gap-2">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-400 text-sm">{manualError}</p>
                </div>
              )}

              {/* Verify Button */}
              <button
                type="submit"
                disabled={loading || verificationCode.length !== 6}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white font-medium py-2 rounded-lg transition"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>

              {/* Resend Button */}
              <button
                type="button"
                onClick={handleResendEmail}
                disabled={loading}
                className="w-full bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:cursor-not-allowed text-slate-300 font-medium py-2 rounded-lg transition"
              >
                {loading ? "Sending..." : "Resend Code"}
              </button>

              {/* Back to Login */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="text-blue-400 hover:text-blue-300 text-sm font-medium transition"
                >
                  Back to Login
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
