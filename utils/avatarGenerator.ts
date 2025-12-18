/**
 * Generates a consistent avatar URL for a candidate
 * Uses a mix of services to provide diverse Asian face representations
 */

const AVATAR_SOURCES = [
    // Using generated faces API with seed for consistency
    (id: number) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}&backgroundColor=b6e3f4,c0aede,d1d4f9`,
    // Using UI Faces for realistic photos (if available)
    (id: number) => `https://i.pravatar.cc/150?img=${(id % 70) + 1}`,
    // Fallback to DiceBear with Asian-style avatars
    (id: number) => `https://api.dicebear.com/7.x/personas/svg?seed=${id}`,
  ];
  
  /**
   * Alternative: Use a curated list of Pexels Asian face photos
   * These are public Pexels URLs for diverse Asian faces
   */
  const PEXELS_ASIAN_FACES = [
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1382731/pexels-photo-1382731.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/2726111/pexels-photo-2726111.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1024311/pexels-photo-1024311.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1438081/pexels-photo-1438081.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1130626/pexels-photo-1130626.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1520760/pexels-photo-1520760.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1729931/pexels-photo-1729931.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1987301/pexels-photo-1987301.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1300402/pexels-photo-1300402.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1130624/pexels-photo-1130624.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1462980/pexels-photo-1462980.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1447194/pexels-photo-1447194.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1484810/pexels-photo-1484810.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1580272/pexels-photo-1580272.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1656684/pexels-photo-1656684.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1858175/pexels-photo-1858175.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/1906157/pexels-photo-1906157.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/2100063/pexels-photo-2100063.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/2182970/pexels-photo-2182970.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/2589653/pexels-photo-2589653.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/2777898/pexels-photo-2777898.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/2853592/pexels-photo-2853592.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/3094215/pexels-photo-3094215.jpeg?auto=compress&cs=tinysrgb&w=150',
    'https://images.pexels.com/photos/3211476/pexels-photo-3211476.jpeg?auto=compress&cs=tinysrgb&w=150',
  ];
  
  export const generateAsianAvatar = (candidateId: number, gender?: string): string => {
    // Use candidate ID to deterministically select an avatar from the pool
    const index = candidateId % PEXELS_ASIAN_FACES.length;
    return PEXELS_ASIAN_FACES[index];
  };
  
  export const getCandidateAvatar = (profilePictureUrl?: string, candidateId?: number): string | null => {
    // If profile picture URL exists and is valid, use it
    if (profilePictureUrl && profilePictureUrl.length > 5 && profilePictureUrl.startsWith('http')) {
      return profilePictureUrl;
    }
  
    // Otherwise generate an Asian face avatar
    if (candidateId) {
      return generateAsianAvatar(candidateId);
    }
  
    return null;
  };
  