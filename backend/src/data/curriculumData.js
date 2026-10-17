/**
 * FinLearn Curriculum Content Dataset - Index & Aggregator
 * 10 Courses, 30 Lessons complete with real INR examples, key takeaways, knowledge checks, and references.
 */

import { curriculumPart1 } from './curriculumPart1.js';
import { curriculumPart2 } from './curriculumPart2.js';

export const allCurriculumCourses = [
  ...curriculumPart1,
  ...curriculumPart2,
];

export default allCurriculumCourses;
