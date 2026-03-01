import type { Course, TimeSlot } from '@/types';

/**
 * 检查两个时间段是否冲突
 */
export function checkTimeConflict(slot1: TimeSlot, slot2: TimeSlot): boolean {
  // 星期不同，不冲突
  if (slot1.dayOfWeek !== slot2.dayOfWeek) {
    return false;
  }

  // 检查节次是否重叠
  const start1 = slot1.startPeriod;
  const end1 = slot1.endPeriod;
  const start2 = slot2.startPeriod;
  const end2 = slot2.endPeriod;

  // 重叠条件：两个时间段有交集
  return start1 <= end2 && start2 <= end1;
}

/**
 * 检查课程之间是否有时间冲突
 */
export function checkCourseConflict(course1: Course, course2: Course): {
  hasConflict: boolean;
  conflictingSlots: { course1Slot: TimeSlot; course2Slot: TimeSlot }[];
} {
  const conflicts: { course1Slot: TimeSlot; course2Slot: TimeSlot }[] = [];

  for (const slot1 of course1.timeSlots || []) {
    for (const slot2 of course2.timeSlots || []) {
      if (checkTimeConflict(slot1, slot2)) {
        conflicts.push({ course1Slot: slot1, course2Slot: slot2 });
      }
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflictingSlots: conflicts,
  };
}

/**
 * 检查新课程与已选课程是否有冲突
 */
export function checkConflictsWithSelectedCourses(
  newCourse: Course,
  selectedCourses: Course[]
): {
  hasConflict: boolean;
  conflicts: {
    course: Course;
    conflictingSlots: { newSlot: TimeSlot; existingSlot: TimeSlot }[];
  }[];
} {
  const conflicts: {
    course: Course;
    conflictingSlots: { newSlot: TimeSlot; existingSlot: TimeSlot }[];
  }[] = [];

  for (const existingCourse of selectedCourses) {
    const courseConflicts: { newSlot: TimeSlot; existingSlot: TimeSlot }[] = [];

    for (const newSlot of newCourse.timeSlots || []) {
      for (const existingSlot of existingCourse.timeSlots || []) {
        if (checkTimeConflict(newSlot, existingSlot)) {
          courseConflicts.push({ newSlot, existingSlot });
        }
      }
    }

    if (courseConflicts.length > 0) {
      conflicts.push({
        course: existingCourse,
        conflictingSlots: courseConflicts,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * 检查学分是否超限
 */
export function checkCreditLimit(
  newCourseCredit: number,
  currentCredits: number,
  maxCredits: number
): {
  wouldExceed: boolean;
  remainingCredits: number;
  message: string;
} {
  const remainingCredits = maxCredits - currentCredits;
  const wouldExceed = newCourseCredit > remainingCredits;

  return {
    wouldExceed,
    remainingCredits,
    message: wouldExceed
      ? `选课失败：当前已选${currentCredits}学分，再选${newCourseCredit}学分会超出最大限制${maxCredits}学分`
      : `选课成功：当前已选${currentCredits}学分，添加后共${currentCredits + newCourseCredit}学分，剩余${remainingCredits - newCourseCredit}学分`,
  };
}

/**
 * 检查先修课程要求
 */
export function checkPrerequisites(
  course: Course,
  completedCourses: string[]
): {
  meetsRequirements: boolean;
  missingPrerequisites: string[];
  message: string;
} {
  if (!course.prerequisites || course.prerequisites.length === 0) {
    return {
      meetsRequirements: true,
      missingPrerequisites: [],
      message: '无先修课程要求',
    };
  }

  const missingPrerequisites = course.prerequisites.filter(
    (prereq) => !completedCourses.includes(prereq)
  );

  return {
    meetsRequirements: missingPrerequisites.length === 0,
    missingPrerequisites,
    message:
      missingPrerequisites.length > 0
        ? `缺少先修课程：${missingPrerequisites.join('、')}`
        : '已满足所有先修课程要求',
  };
}

/**
 * 综合冲突检测
 */
export function comprehensiveConflictCheck(
  newCourse: Course,
  selectedCourses: Course[],
  currentCredits: number,
  maxCredits: number,
  completedCourses: string[]
): {
  canSelect: boolean;
  conflicts: {
    timeConflicts: ReturnType<typeof checkConflictsWithSelectedCourses>;
    creditCheck: ReturnType<typeof checkCreditLimit>;
    prerequisiteCheck: ReturnType<typeof checkPrerequisites>;
  };
  messages: string[];
} {
  const timeConflicts = checkConflictsWithSelectedCourses(newCourse, selectedCourses);
  const creditCheck = checkCreditLimit(newCourse.credit, currentCredits, maxCredits);
  const prerequisiteCheck = checkPrerequisites(newCourse, completedCourses);

  const messages: string[] = [];

  if (timeConflicts.hasConflict) {
    messages.push('⚠️ 时间冲突：与已选课程时间重叠');
    timeConflicts.conflicts.forEach((conflict) => {
      messages.push(`  - 与《${conflict.course.name}》冲突`);
    });
  }

  if (creditCheck.wouldExceed) {
    messages.push(`⚠️ 学分超限：${creditCheck.message}`);
  }

  if (!prerequisiteCheck.meetsRequirements) {
    messages.push(`⚠️ 先修课程：${prerequisiteCheck.message}`);
  }

  const canSelect =
    !timeConflicts.hasConflict && !creditCheck.wouldExceed && prerequisiteCheck.meetsRequirements;

  return {
    canSelect,
    conflicts: {
      timeConflicts,
      creditCheck,
      prerequisiteCheck,
    },
    messages,
  };
}

/**
 * 格式化时间显示
 */
export function formatTimeSlot(slot: TimeSlot): string {
  const dayNames = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${dayNames[slot.dayOfWeek]} 第${slot.startPeriod}-${slot.endPeriod}节`;
}

/**
 * 获取冲突详情描述
 */
export function getConflictDescription(
  conflict: ReturnType<typeof checkConflictsWithSelectedCourses>
): string {
  if (!conflict.hasConflict) {
    return '无冲突';
  }

  return conflict.conflicts
    .map((c) => {
      const slots = c.conflictingSlots
        .map((s) => `${formatTimeSlot(s.newSlot)} 与 ${formatTimeSlot(s.existingSlot)}`)
        .join('、');
      return `与《${c.course.name}》冲突：${slots}`;
    })
    .join('\n');
}
