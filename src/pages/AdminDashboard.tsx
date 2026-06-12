import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { 
  Users, 
  Building, 
  CheckCircle, 
  XCircle, 
  BarChart3,
  TrendingUp,
  AlertTriangle,
  FileText,
  Eye,
  Download,
  Calendar,
  Globe,
  MapPin,
  Loader2
} from "lucide-react";

interface PendingRecruiter {
  id: string;
  email: string;
  displayName: string;
  companyName?: string;
  website?: string;
  employees?: string;
  location?: string;
  phoneNumber?: string;
  createdAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  documents?: Array<{
    fileName: string;
    fileType: string;
    fileContent: string;
    uploadedAt: Date;
  }>;
  verificationNotes?: string;
}

const AdminDashboard = () => {
  const [activeSection, setActiveSection] = useState<'recruiters' | 'students' | 'analytics' | 'settings'>('recruiters');
  const [pendingRecruiters, setPendingRecruiters] = useState<PendingRecruiter[]>([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    verifiedRecruiters: 0,
    pendingApprovals: 0,
    activeInterviews: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Import Firebase functions dynamically to avoid initialization issues
      const { collection, query, getDocs } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Load all users
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const allUsers = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];

      // Filter students (exclude admin)
      const students = allUsers.filter((user: any) => user.role === 'student');

      // Filter recruiters
      const recruiters = allUsers.filter((user: any) => user.role === 'recruiter');

      // Filter pending recruiters
      const pending = recruiters.filter((recruiter: any) => recruiter.status === 'pending');
      setPendingRecruiters(pending as PendingRecruiter[]);

      // Filter approved recruiters
      const approved = recruiters.filter((recruiter: any) => recruiter.status === 'approved');

      // Update stats
      setStats({
        totalStudents: students.length,
        verifiedRecruiters: approved.length,
        pendingApprovals: pending.length,
        activeInterviews: 0 // This would come from interviews collection
      });

      console.log('Loaded data:', {
        students: students.length,
        recruiters: recruiters.length,
        pending: pending.length,
        approved: approved.length,
        allUsersData: allUsers
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDocument = (doc: any) => {
    try {
      // Create a download link for the base64 document
      const link = document.createElement('a');
      link.href = doc.fileContent;
      link.download = doc.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  // Firebase functions for approval
  const handleApproveRecruiter = async (recruiterId: string) => {
    try {
      // Import Firebase functions dynamically
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await updateDoc(doc(db, 'users', recruiterId), {
        status: 'approved',
        approvedAt: new Date()
      });
      console.log('Approved recruiter:', recruiterId);
      // Reload data to reflect changes
      loadDashboardData();
    } catch (error) {
      console.error('Error approving recruiter:', error);
    }
  };

  const handleRejectRecruiter = async (recruiterId: string) => {
    try {
      // Import Firebase functions dynamically
      const { doc, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      await updateDoc(doc(db, 'users', recruiterId), {
        status: 'rejected',
        rejectedAt: new Date()
      });
      console.log('Rejected recruiter:', recruiterId);
      // Reload data to reflect changes
      loadDashboardData();
    } catch (error) {
      console.error('Error rejecting recruiter:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin" />
          <span>Loading dashboard data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="lg:ml-64 transition-all duration-300">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Manage CareerMitra platform</p>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verified Recruiters</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.verifiedRecruiters}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline w-3 h-3 mr-1" />
                +8% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Requires attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Interviews</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeInterviews}</div>
              <p className="text-xs text-muted-foreground">
                This week
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="recruiters" className="space-y-6">
          <TabsList>
            <TabsTrigger value="recruiters">Pending Recruiters</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="recruiters" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Recruiter Verification Queue
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Review and verify recruiter applications with company documents
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {pendingRecruiters.map((recruiter) => (
                    <Card key={recruiter.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-primary text-primary-foreground">
                                {recruiter.displayName.split(' ').map(n => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-semibold text-lg">{recruiter.displayName}</h4>
                                <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                                  Pending Review
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="space-y-2">
                                  <p className="flex items-center gap-2">
                                    <Building className="w-4 h-4 text-muted-foreground" />
                                    <span className="font-medium">{recruiter.companyName}</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <Globe className="w-4 h-4 text-muted-foreground" />
                                    <a href={recruiter.website} target="_blank" rel="noopener noreferrer" 
                                       className="text-blue-600 hover:underline">
                                      {recruiter.website}
                                    </a>
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-muted-foreground" />
                                    <span>{recruiter.location}</span>
                                  </p>
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-muted-foreground" />
                                    <span>{recruiter.employees} employees</span>
                                  </p>
                                  <p className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span>Applied {recruiter.createdAt ? new Date(recruiter.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                                  </p>
                                  <p className="text-muted-foreground">{recruiter.email}</p>
                                </div>
                              </div>

                              {/* Documents Section */}
                              <div className="mt-4">
                                <h5 className="font-medium mb-2 flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Uploaded Documents ({recruiter.documents?.length || 0})
                                </h5>
                                <div className="flex flex-wrap gap-2">
                                  {recruiter.documents?.map((doc: any, index: number) => (
                                    <Dialog key={index}>
                                      <DialogTrigger asChild>
                                        <Button variant="outline" size="sm" className="h-auto p-2">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <div className="text-left">
                                              <p className="text-xs font-medium truncate max-w-[120px]">
                                                {doc.fileName}
                                              </p>
                                              <p className="text-xs text-muted-foreground">
                                                {doc.fileType?.includes('pdf') ? 'PDF' : 'Image'}
                                              </p>
                                            </div>
                                            <Eye className="w-3 h-3" />
                                          </div>
                                        </Button>
                                      </DialogTrigger>
                                      <DialogContent className="max-w-4xl max-h-[80vh]">
                                        <DialogHeader>
                                          <DialogTitle className="flex items-center gap-2">
                                            <FileText className="w-5 h-5" />
                                            {doc.fileName}
                                          </DialogTitle>
                                        </DialogHeader>
                                        <div className="flex-1 bg-gray-100 rounded-lg p-8 text-center">
                                          {doc.fileType?.includes('image') ? (
                                            <img 
                                              src={doc.fileContent} 
                                              alt={doc.fileName}
                                              className="max-w-full max-h-96 mx-auto rounded-lg"
                                            />
                                          ) : (
                                            <>
                                              <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                                              <p className="text-gray-600 mb-4">Document Preview</p>
                                              <p className="text-sm text-gray-500">
                                                PDF documents cannot be previewed directly. Click download to view.
                                              </p>
                                            </>
                                          )}
                                          <p className="text-sm text-gray-500 mb-4">
                                            {doc.fileName} • Uploaded on {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleDateString() : 'Unknown date'}
                                          </p>
                                          <Button 
                                            variant="outline" 
                                            className="gap-2"
                                            onClick={() => handleDownloadDocument(doc)}
                                          >
                                            <Download className="w-4 h-4" />
                                            Download Document
                                          </Button>
                                        </div>
                                      </DialogContent>
                                    </Dialog>
                                  )) || (
                                    <p className="text-sm text-muted-foreground">No documents uploaded</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Action Buttons */}
                          <div className="flex flex-col gap-2 ml-4">
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white gap-2"
                              onClick={() => handleApproveRecruiter(recruiter.id)}
                            >
                              <CheckCircle className="w-4 h-4" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              className="gap-2"
                              onClick={() => handleRejectRecruiter(recruiter.id)}
                            >
                              <XCircle className="w-4 h-4" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {pendingRecruiters.length === 0 && (
                    <div className="text-center py-8">
                      <CheckCircle className="w-16 h-16 mx-auto text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                      <p className="text-muted-foreground">
                        No pending recruiter applications to review.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Analytics Dashboard</h3>
                  <p className="text-muted-foreground">
                    Detailed analytics and reporting features coming soon...
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
);
};

export default AdminDashboard;