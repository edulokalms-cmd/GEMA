import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Course } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface CourseContextType {
  courses: Course[];
  activeCourseId: string;
  activeCourse: Course | null;
  setActiveCourseId: (id: string) => void;
  loading: boolean;
  refreshCourses: () => Promise<void>;
  createCourse: (data: Partial<Course>) => Promise<Course>;
  updateCourse: (id: string, data: Partial<Course>) => Promise<Course>;
  deleteCourse: (id: string) => Promise<void>;
}

const CourseContext = createContext<CourseContextType | undefined>(undefined);

const ACTIVE_COURSE_KEY = 'gema_bio_active_course_id';

export const CourseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [activeCourseId, setActiveCourseIdState] = useState<string>(() => {
    try {
      return localStorage.getItem(ACTIVE_COURSE_KEY) || 'course_1';
    } catch {
      return 'course_1';
    }
  });
  const [loading, setLoading] = useState(false);

  const refreshCourses = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const data = await api.courses.getAll();
      setCourses(data);

      // Verify activeCourseId is valid
      if (data.length > 0) {
        setActiveCourseIdState((prev) => {
          if (prev === 'all') return 'all';
          const exists = data.some((c) => c.id === prev);
          if (!exists) {
            const fallback = data[0].id;
            try {
              localStorage.setItem(ACTIVE_COURSE_KEY, fallback);
            } catch {}
            return fallback;
          }
          return prev;
        });
      } else {
        setActiveCourseIdState('all');
        try {
          localStorage.setItem(ACTIVE_COURSE_KEY, 'all');
        } catch {}
      }
    } catch (err) {
      console.error('Failed fetching courses:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshCourses();
    } else {
      setCourses([]);
    }
  }, [user, refreshCourses]);

  const setActiveCourseId = useCallback((id: string) => {
    setActiveCourseIdState(id);
    try {
      localStorage.setItem(ACTIVE_COURSE_KEY, id);
    } catch {}
  }, []);

  const createCourse = async (data: Partial<Course>) => {
    const res = await api.courses.create(data);
    await refreshCourses();
    return res;
  };

  const updateCourse = async (id: string, data: Partial<Course>) => {
    const res = await api.courses.update(id, data);
    await refreshCourses();
    return res;
  };

  const deleteCourse = async (id: string) => {
    await api.courses.delete(id);
    if (activeCourseId === id) {
      setActiveCourseId('all');
    }
    await refreshCourses();
  };

  const activeCourse = courses.find((c) => c.id === activeCourseId) || null;

  return (
    <CourseContext.Provider
      value={{
        courses,
        activeCourseId,
        activeCourse,
        setActiveCourseId,
        loading,
        refreshCourses,
        createCourse,
        updateCourse,
        deleteCourse,
      }}
    >
      {children}
    </CourseContext.Provider>
  );
};

export const useCourse = () => {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
};
