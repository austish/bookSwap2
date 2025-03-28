export interface SubjectOption {
  id: string;
  label: string;
}

export const SUBJECT_OPTIONS: SubjectOption[] = [
  {id: 'any', label: 'Any'},
  {id: 'novel', label: 'Novel'},
  {id: 'biology', label: 'Biology'},
  {id: 'chemistry', label: 'Chemistry'},
  {id: 'computer_science', label: 'Computer Science'},
  {id: 'economics', label: 'Economics'},
  {id: 'english', label: 'English'},
  {id: 'history', label: 'History'},
  {id: 'math', label: 'Math'},
  {id: 'physics', label: 'Physics'},
  {id: 'psychology', label: 'Psychology'},
];

export const BOOK_TYPES = [
  {id: 'textbook', label: 'Textbook'},
  {id: 'novel', label: 'Novel'},
  {id: 'other', label: 'Other'},
] as const;

export const GENRE_OPTIONS = [
  {id: 'any', label: 'Any'},
  {id: 'fiction', label: 'Fiction'},
  {id: 'non_fiction', label: 'Non-Fiction'},
  {id: 'mystery', label: 'Mystery'},
  {id: 'sci_fi', label: 'Science Fiction'},
  {id: 'fantasy', label: 'Fantasy'},
  {id: 'romance', label: 'Romance'},
  {id: 'thriller', label: 'Thriller'},
  {id: 'horror', label: 'Horror'},
  {id: 'biography', label: 'Biography'},
  {id: 'history', label: 'History'},
] as const;

export const CONDITIONS = [
  {id: 'new', label: 'New'},
  {id: 'likenew', label: 'Like New'},
  {id: 'good', label: 'Good'},
  {id: 'fair', label: 'Fair'},
  {id: 'poor', label: 'Poor'},
] as const;

export type BookType = (typeof BOOK_TYPES)[number]['id'];
export type Genre = (typeof GENRE_OPTIONS)[number]['id'];
export type Condition = typeof CONDITIONS[number]['id'];

export const getTypeLabel = (type: string) => {
  const foundType = BOOK_TYPES.find(t => t.id === type);
  return foundType?.label || type;
};

export const getGenreLabel = (genre: string) => {
  const foundGenre = GENRE_OPTIONS.find(g => g.id === genre);
  return foundGenre?.label || genre;
};

export const getSubjectLabel = (id: string): string => {
  const subject = SUBJECT_OPTIONS.find(option => option.id === id);
  return subject?.label || id;
};

export const getConditionLabel = (id: string): string => {
  const condition = CONDITIONS.find(option => option.id === id);
  return condition?.label || id;
};
