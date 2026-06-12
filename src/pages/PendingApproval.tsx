import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, Mail, ArrowLeft, GraduationCap } from "lucide-react";

const PendingApproval = () => {
  const { userProfile, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not logged in or not a recruiter, redirect
    if (!currentUser || !userProfile || userProfile.role !== 'recruiter') {
      navigate('/login');
      return;
    }

    // If recruiter is already approved, redirect to dashboard
    if (userProfile.status === 'approved') {
      navigate('/recruiter');
      return;
    }

    // If recruiter is rejected, redirect to login with message
    if (userProfile.status === 'rejected') {
      navigate('/login');
      return;
    }
  }, [currentUser, userProfile, navigate]);

  if (!userProfile || userProfile.role !== 'recruiter' || userProfile.status !== 'pending') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        {/* Back to Home Button */}
        <div className="mb-6">
          <Link to="/">
            <Button variant="ghost" className="text-primary-foreground hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground">
            <GraduationCap className="w-7 h-7" />
          </div>
          <span className="font-display font-bold text-2xl text-primary-foreground">
            CareerMitra
          </span>
        </div>

        <Card className="glass border-border/50">
          <CardHeader className="text-center">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
              <Clock className="w-10 h-10 text-accent" />
            </div>
            <CardTitle className="text-3xl font-display mb-2">Account Pending Approval</CardTitle>
            <p className="text-muted-foreground text-lg">
              Thank you for registering as a recruiter with CareerMitra! Your account is currently under review by our admin team.
            </p>
          </CardHeader>
          <CardContent className="space-y-8">
            {/* Status Steps */}
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-6 rounded-xl bg-success/10 border border-success/20 backdrop-blur-sm">
                <CheckCircle className="w-8 h-8 text-success flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-lg text-success">Registration Completed</h3>
                  <p className="text-muted-foreground">Your account has been successfully created with all required documents</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-xl bg-accent/10 border border-accent/20 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                  <Clock className="w-5 h-5 text-accent-foreground" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-accent">Document Verification in Progress</h3>
                  <p className="text-muted-foreground">Our admin team is currently reviewing your company documents and information</p>
                </div>
              </div>

              <div className="flex items-center gap-4 p-6 rounded-xl bg-muted/30 border border-muted backdrop-blur-sm">
                <div className="w-8 h-8 rounded-full border-2 border-muted-foreground flex items-center justify-center flex-shrink-0">
                  <div className="w-3 h-3 rounded-full bg-muted-foreground"></div>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-muted-foreground">Account Activation</h3>
                  <p className="text-muted-foreground">You'll receive full access to the recruiter dashboard once approved</p>
                </div>
              </div>
            </div>

            {/* Information Box */}
            <div className="bg-card/50 backdrop-blur-sm rounded-xl p-6 border border-border/50">
              <h3 className="font-bold text-xl mb-4 flex items-center gap-3">
                <Mail className="w-6 h-6 text-primary" />
                What happens next?
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>Admin review within 24-48 hours</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>Email notification upon approval</span>
                  </li>
                </ul>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>Access to recruiter dashboard</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
                    <span>Post jobs and manage applications</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Account Details */}
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
              <h3 className="font-bold text-xl mb-4">Your Account Details</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground block">Full Name</span>
                    <p className="font-semibold text-lg">{userProfile.displayName}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Email Address</span>
                    <p className="font-semibold text-lg">{userProfile.email}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <span className="text-sm text-muted-foreground block">Company Name</span>
                    <p className="font-semibold text-lg">{userProfile.companyName || 'Not provided'}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground block">Account Status</span>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-accent animate-pulse"></div>
                      <p className="font-semibold text-lg text-accent">Pending Approval</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/login')}
                className="flex-1 bg-white/10 border-white/20 text-foreground hover:bg-white/20"
                size="lg"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Login
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="flex-1"
                size="lg"
              >
                <Clock className="w-5 h-5 mr-2" />
                Check Status
              </Button>
            </div>

            {/* Contact Support */}
            <div className="text-center pt-6 border-t border-border/50">
              <p className="text-muted-foreground">
                Need help? Contact our support team at{" "}
                <a 
                  href="mailto:support@careermitra.com" 
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  support@careermitra.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PendingApproval;