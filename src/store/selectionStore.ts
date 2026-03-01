import { create } from 'zustand';
import { message, notification } from 'antd';
import type { SelectionState, SelectionRecord, Course } from '@/types';
import { selectionApi } from '@/services';
import { queryClient } from '@/lib/queryClient';

interface SelectionStore {
  state: SelectionState;
  selectedCourses: SelectionRecord[];
  pendingOperations: Map<string, 'select' | 'cancel'>;
  queueStatus: Map<string, { position: number; status: string }>;
  rateLimit: {
    lastRequestTime: number;
    requestCount: number;
  };

  selectCourse: (courseId: string, course: Course) => Promise<void>;
  cancelSelection: (recordId: string) => Promise<void>;
  rollback: (courseId: string) => void;
  setSelectedCourses: (records: SelectionRecord[]) => void;
  startPolling: (courseId: string) => void;
  stopPolling: () => void;
  resetState: () => void;
  batchSelectCourses: (courses: Course[]) => Promise<void>;
  clearQueueStatus: (courseId: string) => void;
}

let pollingTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
let rateLimitWindow = 1000; // 1秒窗口
let maxRequestsPerWindow = 5; // 每秒最多5个请求

const invalidateSelectionsCache = () => {
  queryClient.invalidateQueries({ queryKey: ['my-selections'] });
  queryClient.invalidateQueries({ queryKey: ['courses'] });
};

const isRateLimited = (lastRequestTime: number, requestCount: number): boolean => {
  const now = Date.now();
  if (now - lastRequestTime > rateLimitWindow) {
    return false;
  }
  return requestCount >= maxRequestsPerWindow;
};

const updateRateLimit = (lastRequestTime: number, requestCount: number) => {
  const now = Date.now();
  if (now - lastRequestTime > rateLimitWindow) {
    return { lastRequestTime: now, requestCount: 1 };
  }
  return { lastRequestTime, requestCount: requestCount + 1 };
};

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  state: { status: 'idle' },
  selectedCourses: [],
  pendingOperations: new Map(),
  queueStatus: new Map(),
  rateLimit: {
    lastRequestTime: 0,
    requestCount: 0,
  },

  selectCourse: async (courseId, course) => {
    const { selectedCourses, pendingOperations, rateLimit } = get();

    // 防重复提交
    if (pendingOperations.has(courseId)) {
      return;
    }

    // 速率限制
    if (isRateLimited(rateLimit.lastRequestTime, rateLimit.requestCount)) {
      message.warning('操作过于频繁，请稍后再试');
      return;
    }

    const tempRecord: SelectionRecord = {
      id: `temp-${Date.now()}`,
      courseId,
      courseName: course.name,
      credit: course.credit,
      teacherName: course.teacherName,
      timeSlots: course.timeSlots,
      selectedAt: new Date().toISOString(),
      status: 'selected',
    };

    set({
      state: { status: 'validating', courseId },
      selectedCourses: [...selectedCourses, tempRecord],
      pendingOperations: new Map(pendingOperations).set(courseId, 'select'),
      rateLimit: updateRateLimit(rateLimit.lastRequestTime, rateLimit.requestCount),
    });

    try {
      // 本地验证（减少服务器请求）
      const existingCourse = selectedCourses.find(c => c.courseId === courseId);
      if (existingCourse) {
        throw new Error('已经选过该课程');
      }

      const totalCredits = selectedCourses.reduce((sum, r) => sum + r.credit, 0);
      if (totalCredits + course.credit > 30) {
        throw new Error('超出学分上限');
      }

      // 时间冲突检测（本地初步检测）
      for (const selection of selectedCourses) {
        for (const newSlot of course.timeSlots) {
          for (const existingSlot of selection.timeSlots) {
            if (newSlot.dayOfWeek === existingSlot.dayOfWeek) {
              if (newSlot.startPeriod <= existingSlot.endPeriod && newSlot.endPeriod >= existingSlot.startPeriod) {
                throw new Error(`时间冲突：与已选课程"${selection.courseName}"冲突`);
              }
            }
          }
        }
      }

      // 服务器验证
      const validation = await selectionApi.validateSelection(courseId);
      if (!validation.passed) {
        throw new Error(validation.reason || '选课校验失败');
      }

      const result = await selectionApi.selectCourse(courseId);

      if (result.status === 'queued') {
        const position = result.position || 1;
        set({
          state: { status: 'queuing', courseId, position },
          queueStatus: new Map(get().queueStatus).set(courseId, { position, status: 'queuing' }),
        });
        get().startPolling(courseId);
        notification.info({
          message: '排队选课',
          description: `您正在排队选 ${course.name}，当前位置：第 ${position} 位`,
          duration: 3,
        });
      } else {
        const currentSelected = get().selectedCourses;
        set({
          state: { status: 'success', courseId, recordId: result.recordId },
          selectedCourses: currentSelected.map((r) =>
            r.id === tempRecord.id ? { ...r, id: result.recordId, status: 'selected' } : r
          ),
        });
        invalidateSelectionsCache();
        message.success(`成功选择课程: ${course.name}`);
      }
    } catch (error) {
      get().rollback(courseId);
      const reason = error instanceof Error ? error.message : '选课失败';
      set({ state: { status: 'failed', courseId, reason } });
      message.error(`选课失败: ${reason}`);
    } finally {
      const newPending = new Map(get().pendingOperations);
      newPending.delete(courseId);
      set({ pendingOperations: newPending });
    }
  },

  cancelSelection: async (recordId) => {
    const { selectedCourses, pendingOperations, rateLimit } = get();
    const record = selectedCourses.find((r) => r.id === recordId);

    if (!record || pendingOperations.has(recordId)) {
      return;
    }

    if (isRateLimited(rateLimit.lastRequestTime, rateLimit.requestCount)) {
      message.warning('操作过于频繁，请稍后再试');
      return;
    }

    const originalRecords = [...selectedCourses];

    set({
      selectedCourses: selectedCourses.filter((r) => r.id !== recordId),
      pendingOperations: new Map(pendingOperations).set(recordId, 'cancel'),
      rateLimit: updateRateLimit(rateLimit.lastRequestTime, rateLimit.requestCount),
    });

    try {
      await selectionApi.cancelSelection(recordId);
      invalidateSelectionsCache();
      message.success(`成功退选课程: ${record.courseName}`);
    } catch (error) {
      set({ selectedCourses: originalRecords });
      message.error('退选失败，请重试');
    } finally {
      const newPending = new Map(get().pendingOperations);
      newPending.delete(recordId);
      set({ pendingOperations: newPending });
    }
  },

  rollback: (courseId) => {
    set((state) => ({
      selectedCourses: state.selectedCourses.filter(
        (c) => c.courseId !== courseId && !c.id.startsWith('temp-')
      ),
      state: { status: 'idle' },
      queueStatus: new Map(state.queueStatus).delete(courseId) && state.queueStatus,
    }));
    // 停止该课程的轮询
    if (pollingTimers.has(courseId)) {
      clearTimeout(pollingTimers.get(courseId)!);
      pollingTimers.delete(courseId);
    }
  },

  setSelectedCourses: (records) => set({ selectedCourses: records }),

  startPolling: (courseId) => {
    // 清除之前的轮询
    if (pollingTimers.has(courseId)) {
      clearTimeout(pollingTimers.get(courseId)!);
    }

    let attempt = 0;
    const maxAttempts = 30; // 最多轮询30次
    const initialInterval = 2000; // 初始轮询间隔
    const maxInterval = 10000; // 最大轮询间隔

    const poll = async () => {
      attempt++;
      if (attempt > maxAttempts) {
        get().rollback(courseId);
        set({
          state: { status: 'failed', courseId, reason: '排队超时' },
        });
        message.error('排队超时，请重试');
        pollingTimers.delete(courseId);
        return;
      }

      try {
        const status = await selectionApi.getQueueStatus(courseId);

        if (status.status === 'success' && status.recordId) {
          set({
            state: { status: 'success', courseId, recordId: status.recordId },
            queueStatus: new Map(get().queueStatus).delete(courseId) && get().queueStatus,
          });
          message.success('排队成功，已选上课程');
          invalidateSelectionsCache();
          pollingTimers.delete(courseId);
          return;
        }

        if (status.status === 'failed') {
          get().rollback(courseId);
          set({
            state: { status: 'failed', courseId, reason: '排队失败' },
            queueStatus: new Map(get().queueStatus).delete(courseId) && get().queueStatus,
          });
          message.error('排队失败，请重试');
          pollingTimers.delete(courseId);
          return;
        }

        if (status.position > 0) {
          const currentQueueStatus = get().queueStatus.get(courseId);
          if (!currentQueueStatus || currentQueueStatus.position !== status.position) {
            set({
              state: { status: 'queuing', courseId, position: status.position },
              queueStatus: new Map(get().queueStatus).set(courseId, { position: status.position, status: 'queuing' }),
            });
            // 位置变化时通知用户
            notification.info({
              message: '排队状态更新',
              description: `您当前位置：第 ${status.position} 位`,
              duration: 2,
            });
          }
        }

        // 指数退避策略
        const interval = Math.min(initialInterval * Math.pow(1.5, Math.floor(attempt / 3)), maxInterval);
        pollingTimers.set(courseId, setTimeout(poll, interval));
      } catch (error) {
        // 错误时增加间隔
        const interval = Math.min(initialInterval * Math.pow(2, Math.floor(attempt / 2)), maxInterval);
        pollingTimers.set(courseId, setTimeout(poll, interval));
      }
    };

    poll();
  },

  stopPolling: () => {
    pollingTimers.forEach((timer) => clearTimeout(timer));
    pollingTimers.clear();
  },

  resetState: () => {
    get().stopPolling();
    set({ 
      state: { status: 'idle' },
      queueStatus: new Map(),
    });
  },

  batchSelectCourses: async (courses) => {
    const { rateLimit } = get();
    
    if (isRateLimited(rateLimit.lastRequestTime, rateLimit.requestCount)) {
      message.warning('操作过于频繁，请稍后再试');
      return;
    }

    if (courses.length > 5) {
      message.warning('单次最多选择5门课程');
      return;
    }

    // 本地验证所有课程
    const { selectedCourses } = get();
    const totalCredits = selectedCourses.reduce((sum, r) => sum + r.credit, 0);
    const newCredits = courses.reduce((sum, course) => sum + course.credit, 0);

    if (totalCredits + newCredits > 30) {
      message.error('超出学分上限');
      return;
    }

    // 检查重复选课
    const selectedIds = new Set(selectedCourses.map(c => c.courseId));
    const duplicateCourses = courses.filter(c => selectedIds.has(c.courseId));
    if (duplicateCourses.length > 0) {
      message.error(`以下课程已选：${duplicateCourses.map(c => c.name).join('、')}`);
      return;
    }

    // 批量处理
    let successCount = 0;
    let failCount = 0;

    for (const course of courses) {
      try {
        await get().selectCourse(course.id, course);
        successCount++;
        // 间隔一段时间，避免请求过于集中
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      message.success(`成功选择 ${successCount} 门课程`);
    }
    if (failCount > 0) {
      message.warning(`有 ${failCount} 门课程选择失败`);
    }
  },

  clearQueueStatus: (courseId) => {
    set((state) => ({
      queueStatus: new Map(state.queueStatus).delete(courseId) && state.queueStatus,
    }));
  },
}));

