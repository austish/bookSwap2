// Book Genre Classification Algorithm
import {
  GENRE_OPTIONS,
  BOOK_TYPES,
  SUBJECT_OPTIONS,
} from '../types/bookOptions';

// Types from your existing app
type BookType = (typeof BOOK_TYPES)[number]['id'];
type Genre = (typeof GENRE_OPTIONS)[number]['id'];
type Subject = (typeof SUBJECT_OPTIONS)[number]['id'];

interface OpenLibrarySubject {
  name: string;
  url: string;
}

// Genre classification weightings and mappings
// Ensure this matches the BookDocument genre type
const GENRE_KEYWORDS: Record<Genre, string[]> = {
  any: [],
  fiction: ['fiction', 'novel', 'story', 'stories', 'tale'],
  non_fiction: [
    'non-fiction',
    'nonfiction',
    'biography',
    'history',
    'science',
    'academic',
  ],
  mystery: ['mystery', 'detective', 'crime', 'thriller', 'suspense'],
  sci_fi: [
    'science fiction',
    'sci-fi',
    'scifi',
    'futuristic',
    'space',
    'alien',
  ],
  fantasy: [
    'fantasy',
    'magical',
    'supernatural',
    'myth',
    'legend',
    'fairytale',
  ],
  romance: ['romance', 'love', 'relationship', 'romantic'],
  thriller: ['thriller', 'suspense', 'horror', 'psychological'],
  horror: ['horror', 'scary', 'supernatural', 'ghost', 'monster'],
  biography: ['biography', 'autobiography', 'memoir', 'personal'],
  history: [
    'history',
    'historical',
    'war',
    'civilization',
    'ancient',
    'medieval',
    'century',
  ],
};

// Type classification weightings and mappings
const TYPE_KEYWORDS: Record<BookType, string[]> = {
  textbook: [
    'textbook',
    'education',
    'academic',
    'college',
    'university',
    'student',
    'study',
    'course',
    'engineering',
  ],
  novel: ['novel', 'fiction', 'story', 'stories', 'literature'],
  other: ['reference', 'manual', 'guide', 'handbook', 'encyclopedia'],
};

// Subject classification weightings and mappings (for textbooks)
const SUBJECT_KEYWORDS: Record<Subject, string[]> = {
  any: [],
  novel: ['fiction', 'literature', 'novel'],
  biology: [
    'biology',
    'life science',
    'organism',
    'cell',
    'genetics',
    'evolution',
    'ecology',
  ],
  chemistry: [
    'chemistry',
    'chemical',
    'organic',
    'inorganic',
    'biochemistry',
    'molecule',
  ],
  computer_science: [
    'computer',
    'programming',
    'algorithm',
    'data structure',
    'software',
    'hardware',
    'coding',
  ],
  economics: [
    'economics',
    'economy',
    'market',
    'finance',
    'business',
    'trade',
    'monetary',
  ],
  english: [
    'english',
    'literature',
    'grammar',
    'composition',
    'writing',
    'language arts',
  ],
  history: [
    'history',
    'historical',
    'civilization',
    'ancient',
    'medieval',
    'century',
    'era',
    'period',
  ],
  math: [
    'math',
    'mathematics',
    'algebra',
    'calculus',
    'geometry',
    'statistics',
    'trigonometry',
  ],
  physics: [
    'physics',
    'physical',
    'mechanics',
    'thermodynamics',
    'electricity',
    'magnetism',
    'quantum',
  ],
  psychology: [
    'psychology',
    'psychological',
    'mental',
    'cognitive',
    'behavior',
    'development',
    'social',
  ],
};

/**
 * Classifies a book based on Open Library subjects
 * @param subjects Array of subject objects from Open Library API
 * @returns Classification including book type, genre, and subject
 */
export function classifyBook(subjects: OpenLibrarySubject[]): {
  bookType: BookType;
  genre: Genre;
  subject: Subject;
  confidence: {
    bookType: number;
    genre: number;
    subject: number;
  };
} {
  // Extract subject names
  const subjectNames = subjects.map(s => s.name.toLowerCase());

  // Initialize scores
  const typeScores: Record<BookType, number> = {} as Record<BookType, number>;
  const genreScores: Record<Genre, number> = {} as Record<Genre, number>;
  const subjectScores: Record<Subject, number> = {} as Record<Subject, number>;

  // Initialize all scores to 0
  BOOK_TYPES.forEach(type => (typeScores[type.id] = 0));
  GENRE_OPTIONS.forEach(genre => (genreScores[genre.id] = 0));
  SUBJECT_OPTIONS.forEach(subject => (subjectScores[subject.id] = 0));

  // Calculate book type scores
  for (const subjectName of subjectNames) {
    for (const [typeId, keywords] of Object.entries(TYPE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (subjectName.includes(keyword)) {
          // Apply position weight (subjects earlier in the list are more important)
          const positionIndex = subjectNames.indexOf(subjectName);
          const positionWeight =
            1 - (positionIndex / subjectNames.length) * 0.5; // Earlier items get up to 50% more weight

          // Add to score
          typeScores[typeId as BookType] += 1 * positionWeight;
          break; // Count each subject only once per type
        }
      }
    }
  }

  // Calculate genre scores
  for (const subjectName of subjectNames) {
    for (const [genreId, keywords] of Object.entries(GENRE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (subjectName.includes(keyword)) {
          // Apply position weight
          const positionIndex = subjectNames.indexOf(subjectName);
          const positionWeight =
            1 - (positionIndex / subjectNames.length) * 0.5;

          // Add to score
          genreScores[genreId as Genre] += 1 * positionWeight;
          break; // Count each subject only once per genre
        }
      }
    }
  }

  // Calculate subject scores (for textbooks)
  for (const subjectName of subjectNames) {
    for (const [subjectId, keywords] of Object.entries(SUBJECT_KEYWORDS)) {
      for (const keyword of keywords) {
        if (subjectName.includes(keyword)) {
          // Apply position weight
          const positionIndex = subjectNames.indexOf(subjectName);
          const positionWeight =
            1 - (positionIndex / subjectNames.length) * 0.5;

          // Add to score
          subjectScores[subjectId as Subject] += 1 * positionWeight;
          break; // Count each subject only once per subject category
        }
      }
    }
  }

  // Handle special case: If a textbook is detected but no clear subject,
  // try to infer from broader context
  if (
    getHighestScoringKey(typeScores) === 'textbook' &&
    getHighestScore(subjectScores) < 1
  ) {
    // Additional textbook subject inference logic
    // For example, if "mathematics" wasn't matched but "equation" was found
    for (const subjectName of subjectNames) {
      // Add additional subject inference rules here
      if (subjectName.includes('equation') || subjectName.includes('theorem')) {
        subjectScores.math += 0.8;
      } else if (
        subjectName.includes('experiment') ||
        subjectName.includes('laboratory')
      ) {
        subjectScores.chemistry += 0.5;
        subjectScores.biology += 0.5;
        subjectScores.physics += 0.5;
      }
    }
  }

  // Get highest scoring for each category
  const bookType = getHighestScoringKey(typeScores);
  const genre = getHighestScoringKey(genreScores);
  const subject = getHighestScoringKey(subjectScores);

  // Calculate confidence (normalized score)
  const typeConfidence = normalizeConfidence(
    getHighestScore(typeScores),
    subjectNames.length,
  );
  const genreConfidence = normalizeConfidence(
    getHighestScore(genreScores),
    subjectNames.length,
  );
  const subjectConfidence = normalizeConfidence(
    getHighestScore(subjectScores),
    subjectNames.length,
  );

  // Apply fallbacks for low confidence - ensure no empty strings are returned
  const finalType = typeConfidence > 0.2 ? bookType : 'other';
  const finalGenre =
    genreConfidence > 0.2 ? genre : finalType === 'novel' ? 'fiction' : 'any';
  const finalSubject = subjectConfidence > 0.2 ? subject : 'any';

  // Final safety check to ensure we never return empty strings
  return {
    bookType: finalType || 'other',
    genre: finalGenre || 'any',
    subject: finalSubject || 'any',
    confidence: {
      bookType: typeConfidence,
      genre: genreConfidence,
      subject: subjectConfidence,
    },
  };
}

/**
 * Helper function to get the key with the highest score
 */
function getHighestScoringKey<T extends string>(scores: Record<T, number>): T {
  const sortedEntries = Object.entries(scores as Record<string, number>).sort(
    (a, b) => b[1] - a[1],
  );
  // Check if the highest score is 0 (no matches), default to 'any' for genre and subject
  if (sortedEntries[0][1] === 0) {
    // Return 'any' if it exists in the scores object, otherwise return the first key
    return ('any' in scores ? 'any' : Object.keys(scores)[0]) as T;
  }
  return sortedEntries[0][0] as T;
}

/**
 * Helper function to get the highest score value
 */
function getHighestScore(scores: Record<string, number>): number {
  return Math.max(...Object.values(scores));
}

/**
 * Normalizes a confidence score to a 0-1 range
 */
function normalizeConfidence(score: number, maxPossible: number): number {
  // A perfect score would be matching every subject
  // We normalize to 0-1 range but cap at 0.95 since 100% confidence is rarely justified
  return Math.min(score / (maxPossible * 0.5), 0.95);
}

/**
 * Usage example:
 *
 * // Fetch subjects from Open Library API
 * const subjects = [
 *   { name: "fiction", url: "https://openlibrary.org/subjects/fiction" },
 *   { name: "racial injustice", url: "https://openlibrary.org/subjects/racial_injustice" },
 *   // ...more subjects
 * ];
 *
 * const classification = classifyBook(subjects);
 * console.log(classification);
 * // Output: { bookType: "novel", genre: "fiction", subject: "novel", confidence: {...} }
 */
