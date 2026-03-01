import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, Tabs, Statistic, Row, Col, Alert, Button, Switch, message, Modal } from 'antd';
import { BookOutlined, ClockCircleOutlined, CheckCircleOutlined, TeamOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons';
import { CourseList } from '@/components/course';
import { CourseCardSkeleton } from '@/components/skeleton';
import { useCourseStore, useSelectionStore, useUserStore } from '@/store';
import { useFetch, useDebounce, useNetworkStatus } from '@/hooks';
import { comprehensiveConflictCheck, formatTimeSlot } from '@/utils/conflictDetection';
import type { Course, PaginatedResponse } from '@/types';

const CourseSelectionPage = () => {
  const { user } = useUserStore();
  const { filterParams, setFilterParams, setCourses } = useCourseStore();
  const { selectedCourses, selectCourse, cancelSelection, state, batchSelectCourses, queueStatus } = useSelectionStore();
  const networkStatus = useNetworkStatus();

  const [keyword, setKeyword] = useState(filterParams.keyword || '');
  const [category, setCategory] = useState(filterParams.category || '');
  const [onlyAvailable, setOnlyAvailable] = useState(filterParams.onlyAvailable || false);
  const [showBatchSelect, setShowBatchSelect] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const debouncedKeyword = useDebounce(keyword, 300);

  const { data, isLoading, refetch } = useFetch<PaginatedResponse<Course>>(
    ['courses', filterParams],
    '/courses',
    {
      ...filterParams,
      keyword: debouncedKeyword,
      category,
      onlyAvailable,
    }
  );

  const { data: categories } = useFetch<string[]>('categories', '/courses/categories');

  useEffect(() => {
    if (data?.list) {
      setCourses(data.list);
    }
  }, [data, setCourses]);

  useEffect(() => {
    setFilterParams({
      keyword: debouncedKeyword,
      category,
      onlyAvailable,
    });
  }, [debouncedKeyword, category, onlyAvailable, setFilterParams]);

  // 自动刷新课程列表
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        refetch();
      }, 15000); // 每15秒刷新一次
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refetch]);

  const handleSelect = useCallback(
    async (courseId: string, course: Course) => {
      // 冲突检测
      const currentCredits = selectedCourses.reduce((sum, r) => sum + r.credit, 0);
      const checkResult = comprehensiveConflictCheck(
        course,
        selectedCourses.map(r => ({ 
          ...r, 
          id: r.courseId, 
          name: r.courseName, 
          code: '', 
          hours: 0, 
          capacity: 0, 
          teacherId: '', 
          teacherName: r.teacherName, 
          department: '', 
          category: 'elective', 
          tags: [], 
          semester: '', 
          teachingMethod: 'offline', 
          status: 'published', 
          selectionScope: [] 
        })),
        currentCredits,
        user?.maxCredits || 30,
        [] // 已完成课程列表，这里简化处理
      );

      if (!checkResult.canSelect) {
        Modal.warning({
          title: '选课冲突提醒',
          icon: <WarningOutlined />,
          content: (
            <div>
              <p>该课程存在以下问题，无法选课：</p>
              <ul style={{ paddingLeft: 20 }}>
                {checkResult.messages.map((msg, index) => (
                  <li key={index} style={{ marginBottom: 8, color: '#faad14' }}>{msg}</li>
                ))}
              </ul>
            </div>
          ),
          okText: '我知道了',
        });
        return;
      }

      await selectCourse(courseId, course);
      refetch();
    },
    [selectCourse, refetch, selectedCourses, user]
  );

  const handleCancel = useCallback(
    async (courseId: string) => {
      const record = selectedCourses.find((r) => r.courseId === courseId);
      if (record) {
        await cancelSelection(record.id);
        refetch();
      }
    },
    [cancelSelection, selectedCourses, refetch]
  );

  const handleBatchSelect = useCallback(
    async (courses: Course[]) => {
      await batchSelectCourses(courses);
      refetch();
    },
    [batchSelectCourses, refetch]
  );

  const handlePageChange = useCallback(
    (page: number, pageSize: number) => {
      setFilterParams({ page, pageSize });
    },
    [setFilterParams]
  );

  const selectedCourseIds = useMemo(
    () => new Set(selectedCourses.map((r) => r.courseId)),
    [selectedCourses]
  );

  const selectingCourseIds = useMemo(() => {
    const ids = new Set<string>();
    if (state.status === 'validating' || state.status === 'queuing') {
      ids.add(state.courseId);
    }
    if (queueStatus && queueStatus instanceof Map) {
      queueStatus.forEach((_, courseId) => {
        ids.add(courseId);
      });
    }
    return ids;
  }, [state, queueStatus]);

  const totalCredits = useMemo(
    () => selectedCourses.reduce((sum, r) => sum + r.credit, 0),
    [selectedCourses]
  );

  const queueCount = useMemo(() => (queueStatus && queueStatus instanceof Map ? queueStatus.size : 0), [queueStatus]);

  const semesterItems = [
    { key: '2024-1', label: '2024春季学期' },
    { key: '2024-2', label: '2024秋季学期' },
  ];

  const networkStatusColor = networkStatus === 'online' ? '#52c41a' : networkStatus === 'slow' ? '#faad14' : '#ff4d4f';
  const networkStatusText = networkStatus === 'online' ? '网络正常' : networkStatus === 'slow' ? '网络较慢' : '网络离线';

  return (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="已选学分"
              value={totalCredits}
              suffix={`/ ${user?.maxCredits || 30}`}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="已选课程"
              value={selectedCourses.length}
              prefix={<BookOutlined style={{ color: '#1890ff' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="排队中"
              value={queueCount}
              prefix={<TeamOutlined style={{ color: '#faad14' }} />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="网络状态"
              value={networkStatusText}
              prefix={<SyncOutlined style={{ color: networkStatusColor }} />}
            />
          </Card>
        </Col>
      </Row>

      {state.status === 'queuing' && (
        <Alert
          type="info"
          showIcon
          message={`正在排队选课，当前位置：第 ${state.position} 位`}
          style={{ marginBottom: 16 }}
        />
      )}

      {networkStatus === 'slow' && (
        <Alert
          type="warning"
          showIcon
          message="网络连接较慢，可能影响选课速度"
          style={{ marginBottom: 16 }}
        />
      )}

      {networkStatus === 'offline' && (
        <Alert
          type="error"
          showIcon
          message="网络连接已断开，请检查网络设置"
          style={{ marginBottom: 16 }}
        />
      )}

      <Card
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Tabs
              items={semesterItems}
              activeKey={filterParams.semester}
              onChange={(key) => setFilterParams({ semester: key })}
            />
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Button
                type={showBatchSelect ? 'primary' : 'default'}
                onClick={() => setShowBatchSelect(!showBatchSelect)}
              >
                {showBatchSelect ? '取消批量选择' : '批量选择'}
              </Button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>自动刷新</span>
                <Switch checked={autoRefresh} onChange={setAutoRefresh} />
              </div>
            </div>
          </div>
        }
      >
        {isLoading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <CourseCardSkeleton key={i} />
            ))}
          </div>
        ) : (
          <CourseList
            courses={data?.list || []}
            loading={isLoading}
            selectedCourseIds={selectedCourseIds}
            selectingCourseIds={selectingCourseIds}
            onSelect={handleSelect}
            onCancel={handleCancel}
            onBatchSelect={handleBatchSelect}
            filter={keyword}
            onFilterChange={setKeyword}
            category={category}
            onCategoryChange={setCategory}
            categories={categories || []}
            onlyAvailable={onlyAvailable}
            onOnlyAvailableChange={setOnlyAvailable}
            page={filterParams.page}
            pageSize={filterParams.pageSize}
            total={data?.total || 0}
            onPageChange={handlePageChange}
            showBatchSelect={showBatchSelect}
            useVirtual={data?.total > 100}
          />
        )}
      </Card>
    </div>
  );
};

export default CourseSelectionPage;
