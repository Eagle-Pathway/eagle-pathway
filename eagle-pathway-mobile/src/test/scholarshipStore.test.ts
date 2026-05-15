import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useScholarshipStore } from '../store/scholarshipStore';
import { scholarshipsService } from '../services/scholarships';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Mock dependencies
vi.mock('../services/scholarships', () => ({
  scholarshipsService: {
    getScholarships: vi.fn(),
    getRecommendedScholarships: vi.fn(),
    getStudentApplications: vi.fn(),
    createApplication: vi.fn(),
    updateSOPContent: vi.fn(),
    getSOPFeedback: vi.fn(),
    generateMagicSOP: vi.fn(),
  },
}));

vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    getItem: vi.fn(() => Promise.resolve(null)),
    setItem: vi.fn(() => Promise.resolve()),
  },
}));

describe('useScholarshipStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store state manually since zustand state persists across tests
    useScholarshipStore.setState({
      scholarships: [],
      applications: [],
      savedScholarshipIds: [],
      recommendedScholarships: [],
      isLoadingScholarships: false,
    });
  });

  it('initializes with default values', () => {
    const state = useScholarshipStore.getState();
    expect(state.scholarships).toEqual([]);
    expect(state.isLoadingScholarships).toBe(false);
  });

  it('loads scholarships successfully', async () => {
    const mockScholarships = [{ id: '1', name: 'Test Scholarship' }];
    (scholarshipsService.getScholarships as any).mockResolvedValue(mockScholarships);

    await useScholarshipStore.getState().loadScholarships();

    const state = useScholarshipStore.getState();
    expect(state.scholarships).toEqual(mockScholarships);
    expect(state.isLoadingScholarships).toBe(false);
    expect(scholarshipsService.getScholarships).toHaveBeenCalled();
  });

  it('toggles saved scholarships and persists to AsyncStorage', () => {
    const id = 'scholarship-123';
    
    // Toggle on
    useScholarshipStore.getState().toggleSaveScholarship(id);
    expect(useScholarshipStore.getState().savedScholarshipIds).toContain(id);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@eagle_saved_scholarships', JSON.stringify([id]));

    // Toggle off
    useScholarshipStore.getState().toggleSaveScholarship(id);
    expect(useScholarshipStore.getState().savedScholarshipIds).not.toContain(id);
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('@eagle_saved_scholarships', JSON.stringify([]));
  });

  it('loads saved scholarships from AsyncStorage', async () => {
    const mockIds = ['1', '2'];
    (AsyncStorage.getItem as any).mockResolvedValue(JSON.stringify(mockIds));

    await useScholarshipStore.getState().loadSavedScholarships();

    expect(useScholarshipStore.getState().savedScholarshipIds).toEqual(mockIds);
  });
});
