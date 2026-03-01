import type { TimeSlot, SelectionRecord, Course } from '@/types';

export const checkTimeConflict = (
  newSlots: TimeSlot[],
  existingRecords: SelectionRecord[],
  excludeCourseId?: string
): { hasConflict: boolean; conflictWith?: string } => {
  for (const newSlot of newSlots) {
    for (const record of existingRecords) {
      if (excludeCourseId && record.courseId === excludeCourseId) continue;
      
      if (record.timeSlots && Array.isArray(record.timeSlots)) {
        for (const existingSlot of record.timeSlots) {
          if (isSlotOverlap(newSlot, existingSlot)) {
            return { hasConflict: true, conflictWith: record.courseName };
          }
        }
      }
    }
  }
  return { hasConflict: false };
};

export const isSlotOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
  if (slot1.dayOfWeek !== slot2.dayOfWeek) return false;
  
  const start1 = slot1.startPeriod;
  const end1 = slot1.endPeriod;
  const start2 = slot2.startPeriod;
  const end2 = slot2.endPeriod;
  
  return !(end1 < start2 || end2 < start1);
};

export const checkCourseConflict = (
  course: Course,
  selectedCourses: SelectionRecord[]
): { canSelect: boolean; reason?: string } => {
  const conflict = checkTimeConflict(course.timeSlots, selectedCourses, course.id);
  if (conflict.hasConflict) {
    return { canSelect: false, reason: `与已选课程"${conflict.conflictWith}"时间冲突` };
  }
  return { canSelect: true };
};

export const formatTimeSlotDisplay = (slot: TimeSlot): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${days[slot.dayOfWeek]} 第${slot.startPeriod}-${slot.endPeriod}节`;
};

export const getWeekDayName = (dayOfWeek: number): string => {
  const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return days[dayOfWeek] || '';
};
