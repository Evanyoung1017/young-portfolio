// =====================================================================
// Project data
// =====================================================================

export const projects = [
  {
    id: 'p01',
    index: '01',
    title: 'Boundary Between Digital Nomads',
    type: 'Individual Project',
    year: '2025 Spring',
    location: 'Anji, Zhejiang',
    imageUrl: 'assets/projects/p01/cover.png',
    pages: [
      'assets/projects/p01/page-1.png',
      'assets/projects/p01/page-2.png',
      'assets/projects/p01/page-3.png',
      'assets/projects/p01/page-4.png',
      'assets/projects/p01/page-5.png',
      { type: 'video', src: 'assets/projects/p01/page-6.mp4' }
    ]
  },
  {
    id: 'p02',
    index: '02',
    title: 'Echoes of Trauma',
    type: 'Individual Project',
    year: '2025 Autumn',
    location: 'Conceptual',
    imageUrl: 'assets/projects/p02/cover.png',
    pages: [
      'assets/projects/p02/page-1.png',
      'assets/projects/p02/page-2.png',
      'assets/projects/p02/page-3.png',
      'assets/projects/p02/page-4.png',
      'assets/projects/p02/page-5.png'
    ]
  },
  {
    id: 'p03',
    index: '03',
    title: 'Industrial Oasis',
    type: 'Course / Competition',
    year: '2025 Summer',
    location: 'Shougang Park, Beijing',
    imageUrl: 'assets/projects/p03/cover.png',
    pages: [
      'assets/projects/p03/page-1.png',
      'assets/projects/p03/page-2.png',
      'assets/projects/p03/page-3.png'
    ]
  }
];

export function getProjectById(id) {
  return projects.find(p => p.id === id) || null;
}
