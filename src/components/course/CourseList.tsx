import { memo, useMemo, useCallback, useDeferredValue, useState } from 'react';
import { Empty, Spin, Input, Select, Row, Col, Pagination, Checkbox, Button, Alert } from 'antd';
import { SearchOutlined, DownloadOutlined, CheckOutlined } from '@ant-design/icons';
import CourseCard from './CourseCard';
import { useVirtualList } from '@/hooks';
import { exportCoursesToExcel } from '@/utils';
import type { Course, SelectionRecord } from '@/types';
import type { ChangeEvent } from 'react';

const { Search } = Input;

interface CourseListProps {
  courses: Course[];
  loading?: boolean;
  selectedCourseIds?: Set<string>;
  selectingCourseIds?: Set<string>;
  selectedCourses?: SelectionRecord[];
  onSelect?: (courseId: string, course: Course) => void;
  onCancel?: (courseId: string) => void;
  onBatchSelect?: (courses: Course[]) => void;
  filter?: string;
  onFilterChange?: (filter: string) => void;
  category?: string;
  onCategoryChange?: (category: string) => void;
  categories?: string[];
  onlyAvailable?: boolean;
  onOnlyAvailableChange?: (checked: boolean) => void;
  page?: number;
  pageSize?: number;
  total?: number;
  onPageChange?: (page: number, pageSize: number) => void;
  useVirtual?: boolean;
  showExport?: boolean;
  showBatchSelect?: boolean;
}

const CourseList = memo(({
  courses,
  loading = false,
  selectedCourseIds = new Set(),
  selectingCourseIds = new Set(),
  selectedCourses = [],
  onSelect,
  onCancel,
  onBatchSelect,
  filter = '',
  onFilterChange,
  category = '',
  onCategoryChange,
  categories = [],
  onlyAvailable = false,
  onOnlyAvailableChange,
  page = 1,
  pageSize = 20,
  total = 0,
  onPageChange,
  useVirtual = false,
  showExport = false,
  showBatchSelect = false,
}: CourseListProps) => {
  const deferredFilter = useDeferredValue(filter);
  const [batchSelected, setBatchSelected] = useState<string[]>([]);

  const filteredCourses = useMemo(() => {
    let result = courses;
    if (deferredFilter) {
      result = result.filter(
        (c) =>
          c.name.includes(deferredFilter) ||
          c.code.includes(deferredFilter) ||
          c.teacherName.includes(deferredFilter)
      );
    }
    if (onlyAvailable) {
      result = result.filter((c) => c.selectedCount < c.capacity);
    }
    return result;
  }, [courses, deferredFilter, onlyAvailable]);

  const handleSelect = useCallback(
    (courseId: string) => {
      const course = courses.find((c) => c.id === courseId);
      if (course && onSelect) {
        onSelect(courseId, course);
      }
    },
    [courses, onSelect]
  );

  const handleBatchSelect = useCallback(() => {
    if (batchSelected.length === 0) return;
    
    const selectedCourses = filteredCourses.filter(c => batchSelected.includes(c.id));
    if (onBatchSelect) {
      onBatchSelect(selectedCourses);
      setBatchSelected([]);
    }
  }, [batchSelected, filteredCourses, onBatchSelect]);

  const handleBatchToggle = useCallback((courseId: string, checked: boolean) => {
    if (checked) {
      setBatchSelected(prev => [...prev, courseId]);
    } else {
      setBatchSelected(prev => prev.filter(id => id !== courseId));
    }
  }, []);

  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setBatchSelected(filteredCourses.map(c => c.id));
    } else {
      setBatchSelected([]);
    }
  }, [filteredCourses]);

  const handleExport = useCallback(() => {
    exportCoursesToExcel(filteredCourses, '课程列表');
  }, [filteredCourses]);

  const { parentRef, totalHeight, renderVirtualItems } = useVirtualList(
    useVirtual ? filteredCourses : [],
    200
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <Search
          placeholder="搜索课程名称、编号或教师"
          allowClear
          value={filter}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onFilterChange?.(e.target.value)}
          style={{ width: 300 }}
          prefix={<SearchOutlined />}
        />
        {categories.length > 0 && (
          <Select
            placeholder="课程类别"
            allowClear
            value={category || undefined}
            onChange={onCategoryChange}
            style={{ width: 150 }}
          >
            {categories.map((c) => (
              <Select.Option key={c} value={c}>{c}</Select.Option>
            ))}
          </Select>
        )}
        <Checkbox
          checked={onlyAvailable}
          onChange={(e) => onOnlyAvailableChange?.(e.target.checked)}
        >
          只显示有余额的课程
        </Checkbox>
        {showExport && (
          <Button icon={<DownloadOutlined />} onClick={handleExport}>
            导出课程
          </Button>
        )}
      </div>

      {showBatchSelect && batchSelected.length > 0 && (
        <Alert
          type="info"
          showIcon
          message={`已选择 ${batchSelected.length} 门课程`}
          action={
            <Button 
              type="primary" 
              icon={<CheckOutlined />} 
              onClick={handleBatchSelect}
              disabled={batchSelected.length === 0}
            >
              批量选择
            </Button>
          }
          style={{ marginBottom: 16 }}
        />
      )}

      {filteredCourses.length === 0 ? (
        <Empty description="暂无课程数据" style={{ marginTop: 60 }} />
      ) : useVirtual && filteredCourses.length > 100 ? (
        <div
          ref={parentRef}
          style={{ height: 600, overflow: 'auto', position: 'relative' }}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            {renderVirtualItems((course) => (
              <CourseCard
                course={course}
                isSelected={selectedCourseIds.has(course.id)}
                isSelecting={selectingCourseIds.has(course.id)}
                selectedCourses={selectedCourses}
                onSelect={handleSelect}
                onCancel={onCancel}
                showBatchSelect={showBatchSelect}
                isBatchSelected={batchSelected.includes(course.id)}
                onBatchToggle={handleBatchToggle}
              />
            ))}
          </div>
        </div>
      ) : (
        <>
          {showBatchSelect && filteredCourses.length > 0 && (
            <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center' }}>
              <Checkbox 
                onChange={(e) => handleSelectAll(e.target.checked)}
              >
                全选（{filteredCourses.length}门课程）
              </Checkbox>
            </div>
          )}
          <Row gutter={[16, 16]}>
            {filteredCourses.map((course) => (
              <Col key={course.id} xs={24} sm={12} md={8} lg={6}>
                <CourseCard
                  course={course}
                  isSelected={selectedCourseIds.has(course.id)}
                  isSelecting={selectingCourseIds.has(course.id)}
                  selectedCourses={selectedCourses}
                  onSelect={handleSelect}
                  onCancel={onCancel}
                  showBatchSelect={showBatchSelect}
                  isBatchSelected={batchSelected.includes(course.id)}
                  onBatchToggle={handleBatchToggle}
                />
              </Col>
            ))}
          </Row>
          {total > pageSize && (
            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <Pagination
                current={page}
                pageSize={pageSize}
                total={total}
                showSizeChanger
                showQuickJumper
                showTotal={(t) => `共 ${t} 条`}
                onChange={onPageChange}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
});

CourseList.displayName = 'CourseList';

export default CourseList;
