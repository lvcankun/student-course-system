import { create } from 'zustand';
import type { Course, CourseFilterParams } from '@/types';

interface CourseState {
  courses: Course[];
  currentCourse: Course | null;
  filterParams: CourseFilterParams;
  loading: boolean;
  setCourses: (courses: Course[]) => void;
  setCurrentCourse: (course: Course | null) => void;
  setFilterParams: (params: Partial<CourseFilterParams>) => void;
  setLoading: (loading: boolean) => void;
  updateCourseSelectedCount: (courseId: string, delta: number) => void;
  getCourseById: (id: string) => Course | undefined;
}

export const useCourseStore = create<CourseState>((set, get) => ({
  courses: [],
  currentCourse: null,
  filterParams: {
    page: 1,
    pageSize: 20,
    keyword: '',
    category: '',
    department: '',
    semester: '2024-1',
    onlyAvailable: false,
  },
  loading: false,

  setCourses: (courses) => set({ courses }),

  setCurrentCourse: (course) => set({ currentCourse: course }),

  setFilterParams: (params) =>
    set((state) => ({
      filterParams: { ...state.filterParams, ...params },
    })),

  setLoading: (loading) => set({ loading }),

  updateCourseSelectedCount: (courseId, delta) =>
    set((state) => ({
      courses: state.courses.map((course) =>
        course.id === courseId
          ? { ...course, selectedCount: course.selectedCount + delta }
          : course
      ),
      currentCourse:
        state.currentCourse?.id === courseId
          ? {
              ...state.currentCourse,
              selectedCount: state.currentCourse.selectedCount + delta,
            }
          : state.currentCourse,
    })),

  getCourseById: (id) => get().courses.find((c) => c.id === id),
}));
