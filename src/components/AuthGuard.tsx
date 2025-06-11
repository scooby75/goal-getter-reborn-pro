
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthButton } from '@/components/AuthButton';
import { Loader2, AlertCircle, Clock } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  requireApproval?: boolean;
  requireAdmin?: boolean;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ 
  children, 
  requireApproval = false, 
  requireAdmin = false 
}) => {
  const { user, profile, loading, isAdmin, isApproved } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Authentication Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Please sign in to access this application.
            </p>
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <AlertCircle className="w-6 h-6 mr-2 text-red-500" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-center text-gray-600">
              You don't have admin privileges to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (requireApproval && !isApproved()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center flex items-center justify-center">
              <Clock className="w-6 h-6 mr-2 text-yellow-500" />
              Approval Pending
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-600">
              Your account is pending approval from an administrator. Please wait while your access is being reviewed.
            </p>
            <div className="text-xs text-center text-gray-500">
              Status: {profile?.status || 'pending'}
            </div>
            <div className="flex justify-center">
              <AuthButton />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
