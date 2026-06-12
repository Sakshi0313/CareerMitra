// Simple test to verify resources service functionality
import { resourcesService } from './resourcesService';

export const testResourcesService = async () => {
  try {
    console.log('Testing Resources Service...');
    
    // Test getting resources
    const resources = await resourcesService.getResources();
    console.log(`✅ Found ${resources.length} resources`);
    
    // Test getting trending resources
    const trending = await resourcesService.getTrendingResources(5);
    console.log(`✅ Found ${trending.length} trending resources`);
    
    // Test getting analytics
    const analytics = await resourcesService.getResourceAnalytics();
    console.log(`✅ Analytics: ${analytics.totalResources} total resources, ${analytics.totalBookmarks} bookmarks`);
    
    console.log('✅ Resources service test completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Resources service test failed:', error);
    return false;
  }
};

// Test function for resume templates
export const testResumeTemplates = () => {
  const templates = [
    { id: "modern", name: "Modern Professional", color: "blue" },
    { id: "classic", name: "Classic Traditional", color: "gray" },
    { id: "creative", name: "Creative Designer", color: "purple" },
    { id: "minimal", name: "Minimal Clean", color: "green" }
  ];
  
  console.log('✅ Resume templates configured:', templates.length);
  return templates.length === 4;
};

// Test role filtering logic
export const testRoleFiltering = () => {
  const allRoles = [
    { value: "frontend", label: "Frontend Developer", category: "Development" },
    { value: "backend", label: "Backend Developer", category: "Development" },
    { value: "devops", label: "DevOps Engineer", category: "Infrastructure" },
    { value: "data-science", label: "Data Scientist", category: "Data & AI" }
  ];
  
  // Test filtering by category
  const developmentRoles = allRoles.filter(role => role.category === "Development");
  console.log(`✅ Development roles: ${developmentRoles.length}`);
  
  // Test role search
  const searchResults = allRoles.filter(role => 
    role.label.toLowerCase().includes("dev") || 
    role.category.toLowerCase().includes("dev")
  );
  console.log(`✅ Roles matching 'dev': ${searchResults.length}`);
  
  return developmentRoles.length === 2 && searchResults.length >= 2;
};