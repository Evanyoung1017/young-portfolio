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
      'assets/projects/p01/page-5.png'
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
  }
];

export function getProjectById(id) {
  return projects.find(p => p.id === id) || null;
}
