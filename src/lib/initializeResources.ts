import { resourcesService } from './resourcesService';

export const initializeResourcesIfNeeded = async () => {
  try {
    // Check if resources already exist
    const existingResources = await resourcesService.getResources();
    
    if (existingResources.length === 0) {
      console.log('No resources found, initializing sample data...');
      await resourcesService.initializeSampleResources();
      console.log('Sample resources initialized successfully');
    } else {
      console.log(`Found ${existingResources.length} existing resources`);
    }
  } catch (error) {
    console.error('Failed to initialize resources:', error);
  }
};