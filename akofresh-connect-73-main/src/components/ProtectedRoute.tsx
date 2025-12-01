import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredUserType?: "farmer" | "buyer";
}

export function ProtectedRoute({ children, requiredUserType }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else if (requiredUserType && profile?.user_type !== requiredUserType) {
        navigate("/");
      }
    }
  }, [user, profile, loading, navigate, requiredUserType]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requiredUserType && profile?.user_type !== requiredUserType) {
    return null;
  }

  return <>{children}</>;
}
