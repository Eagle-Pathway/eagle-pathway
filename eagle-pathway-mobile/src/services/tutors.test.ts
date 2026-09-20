import { describe, it, expect, vi, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { mockSupabase } = vi.hoisted(() => ({
  mockSupabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

vi.mock('./supabase', () => ({
  supabase: mockSupabase,
}));

import { tutorsService } from './tutors';

describe('tutorsService Offline & Resilience', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await AsyncStorage.clear();
  });

  const mockTutors = [
    {
      id: 'tutor-1',
      user_id: 'user-1',
      is_verified: true,
      is_online: true,
      is_in_person: false,
      hourly_rate: 350,
      rating: 4.9,
      subjects: ['SAT Math', 'Calculus'],
      user: {
        full_name: 'Abebe Bikila',
        university_name: 'Addis Ababa University',
        city: 'Addis Ababa',
      },
    },
    {
      id: 'tutor-2',
      user_id: 'user-2',
      is_verified: true,
      is_online: false,
      is_in_person: true,
      hourly_rate: 500,
      rating: 4.7,
      subjects: ['English Essay', 'IELTS'],
      user: {
        full_name: 'Sara Tesfaye',
        university_name: 'Hawassa University',
        city: 'Hawassa',
      },
    },
  ];

  it('fetches tutors online and caches them in AsyncStorage', async () => {
    const mockOrder = vi.fn().mockResolvedValue({ data: mockTutors, error: null });
    const mockEq = vi.fn().mockReturnValue({ order: mockOrder });
    const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
    (mockSupabase.from as any).mockReturnValue({ select: mockSelect });

    const result = await tutorsService.getTutors();
    expect(result).toEqual(mockTutors);

    const cached = await AsyncStorage.getItem('eagle_tutors_offline_cache_v1');
    expect(cached).toBeTruthy();
    expect(JSON.parse(cached!)).toHaveLength(2);
  });

  it('falls back to cached tutors when network fails', async () => {
    // Prime the cache
    await AsyncStorage.setItem('eagle_tutors_offline_cache_v1', JSON.stringify(mockTutors));

    // Simulate network error
    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Network request failed')),
        }),
      }),
    });

    const result = await tutorsService.getTutors();
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('tutor-1');
  });

  it('correctly applies offline filtering on cached dataset', async () => {
    await AsyncStorage.setItem('eagle_tutors_offline_cache_v1', JSON.stringify(mockTutors));

    // Simulate network error
    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockRejectedValue(new Error('Timeout')),
        }),
      }),
    });

    // 1. Online-only filter
    const onlineTutors = await tutorsService.getTutors({ isOnline: true });
    expect(onlineTutors).toHaveLength(1);
    expect(onlineTutors[0].id).toBe('tutor-1');

    // 2. In-person filter
    const inPersonTutors = await tutorsService.getTutors({ isInPerson: true });
    expect(inPersonTutors).toHaveLength(1);
    expect(inPersonTutors[0].id).toBe('tutor-2');

    // 3. Search query filter
    const searchResults = await tutorsService.getTutors({ search: 'Sara' });
    expect(searchResults).toHaveLength(1);
    expect(searchResults[0].user?.full_name).toBe('Sara Tesfaye');

    // 4. Max rate filter
    const affordableTutors = await tutorsService.getTutors({ maxRate: 400 });
    expect(affordableTutors).toHaveLength(1);
    expect(affordableTutors[0].id).toBe('tutor-1');
  });

  it('retrieves tutor by ID from cache when offline', async () => {
    await AsyncStorage.setItem('eagle_tutors_offline_cache_v1', JSON.stringify(mockTutors));

    (mockSupabase.from as any).mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockRejectedValue(new Error('Network down')),
        }),
      }),
    });

    const tutor = await tutorsService.getTutorById('tutor-2');
    expect(tutor).toBeDefined();
    expect(tutor.id).toBe('tutor-2');
    expect(tutor.user?.full_name).toBe('Sara Tesfaye');
  });
});
