import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardSidebar from "@/components/dashboard/DashboardSidebar";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import MobileBottomNav from "@/components/dashboard/MobileBottomNav";
import { useAuth } from "@/contexts/SimpleAuthContext";
import { resourcesService, type Resource, type ResourceAnalytics } from "@/lib/resourcesService";
import { initializeResourcesIfNeeded } from "@/lib/initializeResources";
import { toast } from "sonner";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Star, 
  Clock, 
  ExternalLink,
  Youtube,
  FileText,
  Award,
  Code,
  Bookmark,
  BookmarkCheck,
  TrendingUp,
  Users,
  Loader2,
  RefreshCw,
  Brain,
  CheckCircle
} from "lucide-react";

const Resources = () => {
  const { currentUser } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [selectedDifficulty, setSelectedDifficulty] = useState("all");
  const [selectedPrice, setSelectedPrice] = useState("all");
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookmarkedResources, setBookmarkedResources] = useState<Resource[]>([]);
  const [trendingResources, setTrendingResources] = useState<Resource[]>([]);
  const [analytics, setAnalytics] = useState<ResourceAnalytics | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isBookmarking, setIsBookmarking] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedRoles, setGeneratedRoles] = useState<Set<string>>(new Set());

  // Load generated roles from localStorage
  useEffect(() => {
    const savedGeneratedRoles = localStorage.getItem('generatedResourceRoles');
    if (savedGeneratedRoles) {
      setGeneratedRoles(new Set(JSON.parse(savedGeneratedRoles)));
    }
  }, []);

  // Load resources and user data
  useEffect(() => {
    const initializeAndLoad = async () => {
      // Initialize sample resources if needed
      await initializeResourcesIfNeeded();
      // Then load resources
      loadResources();
    };
    
    initializeAndLoad();
    
    if (currentUser?.uid) {
      loadUserBookmarks();
    }
    loadAnalytics();
  }, [currentUser, selectedCategory, selectedType, selectedDifficulty, selectedPrice]);

  const loadResources = async () => {
    setIsLoading(true);
    try {
      const filters: any = {};
      if (selectedCategory !== "all") filters.category = selectedCategory;
      if (selectedType !== "all") filters.type = selectedType;
      if (selectedDifficulty !== "all") filters.difficulty = selectedDifficulty;
      if (selectedPrice !== "all") filters.price = selectedPrice;

      const [allResources, trending] = await Promise.all([
        resourcesService.getResources(filters),
        resourcesService.getTrendingResources(10)
      ]);

      setResources(allResources);
      setTrendingResources(trending);
    } catch (error) {
      console.error('Failed to load resources:', error);
      toast.error('Failed to load resources');
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserBookmarks = async () => {
    if (!currentUser?.uid) return;
    
    try {
      const bookmarks = await resourcesService.getUserBookmarks(currentUser.uid);
      setBookmarkedResources(bookmarks);
      
      // Create set of bookmarked IDs for quick lookup
      const bookmarkIds = new Set<string>(bookmarks.map(r => r.id!));
      setBookmarkedIds(bookmarkIds);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const analyticsData = await resourcesService.getResourceAnalytics();
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const toggleBookmark = async (resource: Resource) => {
    if (!currentUser?.uid) {
      toast.error('Please log in to bookmark resources');
      return;
    }

    if (!resource.id) return;

    setIsBookmarking(resource.id);
    try {
      const isBookmarked = bookmarkedIds.has(resource.id);
      
      if (isBookmarked) {
        await resourcesService.removeBookmark(currentUser.uid, resource.id);
        setBookmarkedIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(resource.id!);
          return newSet;
        });
        setBookmarkedResources(prev => prev.filter(r => r.id !== resource.id));
        toast.success('Bookmark removed');
      } else {
        await resourcesService.addBookmark(currentUser.uid, resource.id);
        setBookmarkedIds(prev => new Set(prev).add(resource.id!));
        setBookmarkedResources(prev => [...prev, resource]);
        toast.success('Resource bookmarked');
      }
      
      // Reload analytics to update trending
      loadAnalytics();
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
      toast.error('Failed to update bookmark');
    } finally {
      setIsBookmarking(null);
    }
  };

  const generateAIResources = async (role: string) => {
    if (generatedRoles.has(role)) {
      toast.error(`Resources for ${role} have already been generated`);
      return;
    }

    setIsGenerating(true);
    try {
      // Generate AI resources for the specific role
      const aiGeneratedResources = await generateResourcesForRole(role);
      
      // Add resources to Firebase
      for (const resource of aiGeneratedResources) {
        await resourcesService.addResource(resource);
      }
      
      // Mark role as generated
      const newGeneratedRoles = new Set(generatedRoles).add(role);
      setGeneratedRoles(newGeneratedRoles);
      localStorage.setItem('generatedResourceRoles', JSON.stringify([...newGeneratedRoles]));
      
      // Reload resources
      await loadResources();
      
      toast.success(`Generated ${aiGeneratedResources.length} resources for ${role}!`);
    } catch (error) {
      console.error('Failed to generate AI resources:', error);
      toast.error('Failed to generate resources. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const generateResourcesForRole = async (role: string) => {
    // AI-generated resources based on role
    const roleResourceMap: { [key: string]: any[] } = {
      'frontend': [
        {
          title: "Advanced React Patterns & Performance",
          description: "Master advanced React patterns, hooks optimization, and performance techniques for large-scale applications",
          url: "https://react-advanced-patterns.dev",
          type: "course",
          category: "frontend",
          provider: "React Masters",
          difficulty: "advanced",
          duration: "8 weeks",
          price: "paid",
          rating: 4.9,
          tags: ["react", "performance", "hooks", "patterns"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Modern CSS Grid & Flexbox Mastery",
          description: "Complete guide to CSS Grid and Flexbox with real-world projects and responsive design techniques",
          url: "https://css-grid-mastery.com",
          type: "course",
          category: "frontend",
          provider: "CSS Academy",
          difficulty: "intermediate",
          duration: "6 weeks",
          price: "freemium",
          rating: 4.7,
          tags: ["css", "grid", "flexbox", "responsive"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "TypeScript for React Developers",
          description: "Learn TypeScript specifically for React development with practical examples and best practices",
          url: "https://typescript-react.dev",
          type: "tutorial",
          category: "frontend",
          provider: "TypeScript Pro",
          difficulty: "intermediate",
          duration: "4 weeks",
          price: "free",
          rating: 4.8,
          tags: ["typescript", "react", "javascript"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        }
      ],
      'backend': [
        {
          title: "Microservices Architecture with Node.js",
          description: "Build scalable microservices using Node.js, Docker, and Kubernetes with real-world examples",
          url: "https://microservices-nodejs.com",
          type: "course",
          category: "backend",
          provider: "Backend Masters",
          difficulty: "advanced",
          duration: "10 weeks",
          price: "paid",
          rating: 4.9,
          tags: ["nodejs", "microservices", "docker", "kubernetes"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Database Design & Optimization",
          description: "Master database design principles, query optimization, and performance tuning for PostgreSQL and MongoDB",
          url: "https://database-optimization.dev",
          type: "course",
          category: "backend",
          provider: "Database Pro",
          difficulty: "intermediate",
          duration: "8 weeks",
          price: "paid",
          rating: 4.8,
          tags: ["database", "postgresql", "mongodb", "optimization"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        }
      ],
      'devops': [
        {
          title: "Complete DevOps Pipeline with CI/CD",
          description: "Build complete DevOps pipelines using Jenkins, GitLab CI, Docker, and AWS with hands-on projects",
          url: "https://devops-pipeline.com",
          type: "course",
          category: "devops",
          provider: "DevOps Academy",
          difficulty: "intermediate",
          duration: "12 weeks",
          price: "paid",
          rating: 4.9,
          tags: ["devops", "cicd", "jenkins", "docker", "aws"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Kubernetes Production Deployment",
          description: "Deploy and manage production Kubernetes clusters with monitoring, logging, and security best practices",
          url: "https://k8s-production.dev",
          type: "course",
          category: "devops",
          provider: "Cloud Native",
          difficulty: "advanced",
          duration: "6 weeks",
          price: "paid",
          rating: 4.8,
          tags: ["kubernetes", "production", "monitoring", "security"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        }
      ],
      'data-science': [
        {
          title: "Machine Learning with Python & TensorFlow",
          description: "Complete machine learning course covering algorithms, neural networks, and deep learning with TensorFlow",
          url: "https://ml-tensorflow.com",
          type: "course",
          category: "data-science",
          provider: "AI Academy",
          difficulty: "intermediate",
          duration: "16 weeks",
          price: "paid",
          rating: 4.9,
          tags: ["machine-learning", "python", "tensorflow", "deep-learning"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        },
        {
          title: "Data Analysis with Pandas & NumPy",
          description: "Master data analysis and manipulation using Pandas, NumPy, and Matplotlib with real datasets",
          url: "https://data-analysis-python.com",
          type: "course",
          category: "data-science",
          provider: "Data Pro",
          difficulty: "beginner",
          duration: "8 weeks",
          price: "freemium",
          rating: 4.7,
          tags: ["pandas", "numpy", "data-analysis", "python"],
          accessCount: 0,
          bookmarkCount: 0,
          isActive: true
        }
      ]
    };

    const resources = roleResourceMap[role] || [];
    
    // Add timestamps
    return resources.map(resource => ({
      ...resource,
      createdAt: new Date(),
      updatedAt: new Date()
    }));
  };

  const handleResourceAccess = async (resource: Resource) => {
    if (resource.id) {
      await resourcesService.trackResourceAccess(resource.id);
    }
    window.open(resource.url, '_blank');
  };

  // Get categories from analytics or default
  const categories = analytics ? [
    { id: "all", name: "All Categories", count: analytics.totalResources },
    ...Object.entries(analytics.topCategories).map(([category, count]) => ({
      id: category,
      name: category.charAt(0).toUpperCase() + category.slice(1).replace('-', ' '),
      count: count as number
    }))
  ] : [
    { id: "all", name: "All Categories", count: 0 },
    { id: "frontend", name: "Frontend", count: 0 },
    { id: "backend", name: "Backend", count: 0 },
    { id: "mobile", name: "Mobile", count: 0 },
    { id: "devops", name: "DevOps", count: 0 },
    { id: "data-science", name: "Data Science", count: 0 }
  ];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    return matchesSearch;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "course": return <BookOpen className="w-4 h-4" />;
      case "tutorial": return <Youtube className="w-4 h-4" />;
      case "article": return <FileText className="w-4 h-4" />;
      case "book": return <BookOpen className="w-4 h-4" />;
      case "certification": return <Award className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardSidebar />
      <MobileBottomNav />
      
      <div className="lg:ml-64 transition-all duration-300">
        <DashboardHeader />
        
        <main className="p-6 pb-20 lg:pb-6">
          <div className="mb-8">
            <h1 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              Learning Resources
            </h1>
            <p className="text-muted-foreground">
              Discover curated courses, tutorials, and certifications to advance your career
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            {/* Sidebar Filters */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Categories</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setSelectedCategory(category.id)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        selectedCategory === category.id 
                          ? "bg-secondary text-secondary-foreground" 
                          : "hover:bg-muted"
                      }`}
                    >
                      <span className="text-sm">{category.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {category.count}
                      </Badge>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-lg">Popular Certifications</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {resources.filter(r => r.type === 'certification').slice(0, 3).map((cert) => (
                    <div key={cert.id} className="p-3 rounded-lg bg-muted/50">
                      <h4 className="font-medium text-sm">{cert.title}</h4>
                      <p className="text-xs text-muted-foreground">{cert.provider}</p>
                      <div className="flex items-center justify-between mt-2">
                        <Badge variant="outline" className="text-xs">{cert.price}</Badge>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-success" />
                          <span className="text-xs">{cert.bookmarkCount} bookmarks</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {resources.filter(r => r.type === 'certification').length === 0 && (
                    <div className="text-center py-4 text-muted-foreground">
                      <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-xs">No certifications available yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {analytics && (
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Resource Stats</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-center">
                      <div className="p-2 bg-blue-50 rounded">
                        <div className="text-lg font-bold text-blue-600">{analytics.totalResources}</div>
                        <div className="text-xs text-muted-foreground">Total</div>
                      </div>
                      <div className="p-2 bg-green-50 rounded">
                        <div className="text-lg font-bold text-green-600">{analytics.totalBookmarks}</div>
                        <div className="text-xs text-muted-foreground">Bookmarks</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium">Top Categories</h5>
                      {Object.entries(analytics.topCategories).slice(0, 3).map(([category, count]) => (
                        <div key={category} className="flex justify-between text-xs">
                          <span className="capitalize">{category.replace('-', ' ')}</span>
                          <span className="font-medium">{count as number}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main Content */}
            <div className="lg:col-span-3">
              {/* Search and Filters */}
              <Card className="mb-6">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                        <Input
                          placeholder="Search resources, courses, tutorials..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <Select value={selectedType} onValueChange={setSelectedType}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Resource Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="course">Courses</SelectItem>
                        <SelectItem value="tutorial">Tutorials</SelectItem>
                        <SelectItem value="article">Articles</SelectItem>
                        <SelectItem value="documentation">Documentation</SelectItem>
                        <SelectItem value="certification">Certifications</SelectItem>
                        <SelectItem value="tool">Tools</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedPrice} onValueChange={setSelectedPrice}>
                      <SelectTrigger className="w-full md:w-48">
                        <SelectValue placeholder="Price" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Prices</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="freemium">Freemium</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button variant="outline" onClick={loadResources}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Refresh
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Resource Generation */}
              <Card className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-purple-600" />
                    AI Resource Generator
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Generate curated learning resources for specific roles using AI. Resources are added to the platform for everyone to access.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['frontend', 'backend', 'devops', 'data-science'].map((role) => (
                      <Button
                        key={role}
                        variant={generatedRoles.has(role) ? "secondary" : "outline"}
                        onClick={() => generateAIResources(role)}
                        disabled={isGenerating || generatedRoles.has(role)}
                        className="w-full"
                      >
                        {isGenerating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : generatedRoles.has(role) ? (
                          <CheckCircle className="w-4 h-4 mr-2" />
                        ) : (
                          <Brain className="w-4 h-4 mr-2" />
                        )}
                        {role.charAt(0).toUpperCase() + role.slice(1).replace('-', ' ')}
                      </Button>
                    ))}
                  </div>
                  {generatedRoles.size > 0 && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Generated resources for: {[...generatedRoles].join(', ')}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Tabs defaultValue="all-resources" className="space-y-6">
                <TabsList>
                  <TabsTrigger value="all-resources">All Resources</TabsTrigger>
                  <TabsTrigger value="bookmarked">Bookmarked</TabsTrigger>
                  <TabsTrigger value="certifications">Certifications</TabsTrigger>
                  <TabsTrigger value="trending">Trending</TabsTrigger>
                </TabsList>

                <TabsContent value="all-resources" className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm text-muted-foreground">
                      {isLoading ? 'Loading...' : `Showing ${filteredResources.length} resources`}
                    </p>
                    <Select defaultValue="relevance">
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="relevance">Most Relevant</SelectItem>
                        <SelectItem value="rating">Highest Rated</SelectItem>
                        <SelectItem value="popular">Most Popular</SelectItem>
                        <SelectItem value="recent">Most Recent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin" />
                      <span className="ml-2">Loading resources...</span>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredResources.map((resource) => (
                        <Card key={resource.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getTypeIcon(resource.type)}
                                  <Badge variant="outline" className="text-xs">
                                    {resource.type}
                                  </Badge>
                                  <Badge variant="secondary" className="text-xs">
                                    {resource.difficulty}
                                  </Badge>
                                  <Badge variant={resource.price === 'free' ? 'default' : 'outline'} className="text-xs">
                                    {resource.price}
                                  </Badge>
                                  {trendingResources.some(tr => tr.id === resource.id) && (
                                    <Badge variant="default" className="text-xs">
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      Trending
                                    </Badge>
                                  )}
                                </div>
                                
                                <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                                <p className="text-muted-foreground text-sm mb-3">{resource.description}</p>
                                
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  {resource.duration && (
                                    <span className="flex items-center gap-1">
                                      <Clock className="w-3 h-3" />
                                      {resource.duration}
                                    </span>
                                  )}
                                  {resource.rating && (
                                    <span className="flex items-center gap-1">
                                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                      {resource.rating}
                                    </span>
                                  )}
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {resource.accessCount} accessed
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Bookmark className="w-3 h-3" />
                                    {resource.bookmarkCount} bookmarked
                                  </span>
                                  <span className="font-medium text-foreground">{resource.provider}</span>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-4">
                                  {resource.tags.map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={() => handleResourceAccess(resource)}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Access Resource
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => toggleBookmark(resource)}
                                    disabled={isBookmarking === resource.id}
                                  >
                                    {isBookmarking === resource.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : bookmarkedIds.has(resource.id!) ? (
                                      <BookmarkCheck className="w-4 h-4" />
                                    ) : (
                                      <Bookmark className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      
                      {filteredResources.length === 0 && !isLoading && (
                        <div className="text-center py-8 text-muted-foreground">
                          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No resources found matching your criteria.</p>
                          <p className="text-sm">Try adjusting your search or filters.</p>
                        </div>
                      )}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="bookmarked">
                  <div className="space-y-4">
                    {bookmarkedResources.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Bookmark className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No bookmarked resources yet.</p>
                        <p className="text-sm">Bookmark resources to access them quickly later.</p>
                      </div>
                    ) : (
                      bookmarkedResources.filter(resource => {
                        const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                             resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                             resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
                        return matchesSearch;
                      }).map((resource) => (
                        <Card key={resource.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  {getTypeIcon(resource.type)}
                                  <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                                  <Badge variant="secondary" className="text-xs">{resource.difficulty}</Badge>
                                  <Badge variant="default" className="text-xs">
                                    <BookmarkCheck className="w-3 h-3 mr-1" />
                                    Bookmarked
                                  </Badge>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                                <p className="text-muted-foreground text-sm mb-3">{resource.description}</p>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={() => handleResourceAccess(resource)}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Access Resource
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => toggleBookmark(resource)}
                                    disabled={isBookmarking === resource.id}
                                  >
                                    {isBookmarking === resource.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <BookmarkCheck className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="certifications">
                  <div className="grid md:grid-cols-2 gap-4">
                    {resources.filter(r => r.type === 'certification').map((cert) => (
                      <Card key={cert.id}>
                        <CardContent className="p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <Award className="w-5 h-5 text-secondary" />
                            <Badge variant="outline">{cert.difficulty}</Badge>
                          </div>
                          <h3 className="font-semibold text-lg mb-2">{cert.title}</h3>
                          <p className="text-muted-foreground mb-4">{cert.provider}</p>
                          <div className="flex items-center justify-between text-sm mb-4">
                            <span>Price: <span className="font-semibold">{cert.price}</span></span>
                            {cert.duration && <span>Duration: <span className="font-semibold">{cert.duration}</span></span>}
                          </div>
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Popularity</span>
                              <span>{cert.bookmarkCount} bookmarks</span>
                            </div>
                            <div className="h-2 bg-muted rounded-full">
                              <div 
                                className="h-full bg-secondary rounded-full" 
                                style={{ width: `${Math.min((cert.bookmarkCount / 100) * 100, 100)}%` }}
                              />
                            </div>
                          </div>
                          <Button className="w-full" onClick={() => handleResourceAccess(cert)}>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Learn More
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    
                    {resources.filter(r => r.type === 'certification').length === 0 && (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        <Award className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No certifications available yet.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="trending">
                  <div className="space-y-4">
                    {trendingResources.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p>No trending resources yet.</p>
                        <p className="text-sm">Resources will appear here as they gain popularity.</p>
                      </div>
                    ) : (
                      trendingResources.map((resource, index) => (
                        <Card key={resource.id}>
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge variant="default" className="text-xs">
                                    #{index + 1} Trending
                                  </Badge>
                                  <TrendingUp className="w-4 h-4 text-success" />
                                  <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                                </div>
                                <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                                <p className="text-muted-foreground text-sm mb-3">{resource.description}</p>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                                  <span className="flex items-center gap-1">
                                    <Users className="w-3 h-3" />
                                    {resource.accessCount} accessed
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Bookmark className="w-3 h-3" />
                                    {resource.bookmarkCount} bookmarked
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Button size="sm" onClick={() => handleResourceAccess(resource)}>
                                    <ExternalLink className="w-4 h-4 mr-2" />
                                    Access Resource
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => toggleBookmark(resource)}
                                    disabled={isBookmarking === resource.id}
                                  >
                                    {isBookmarking === resource.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : bookmarkedIds.has(resource.id!) ? (
                                      <BookmarkCheck className="w-4 h-4" />
                                    ) : (
                                      <Bookmark className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Resources;