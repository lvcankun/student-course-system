import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import type { SelectionRecord, Course, Student, Teacher, OperationLog } from '@/types';

export const exportToExcel = <T>(
  data: T[],
  columns: { key: string; title: string; render?: (value: unknown, record: T) => string }[],
  filename: string,
  sheetName: string = 'Sheet1'
) => {
  const headers = columns.map(col => col.title);
  const rows = data.map(item => 
    columns.map(col => {
      const value = (item as Record<string, unknown>)[col.key];
      return col.render ? col.render(value, item) : String(value ?? '');
    })
  );
  
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const exportSelectionsToExcel = (selections: SelectionRecord[], filename: string = '选课记录') => {
  const columns = [
    { key: 'courseName', title: '课程名称' },
    { key: 'courseId', title: '课程编号' },
    { key: 'teacherName', title: '授课教师' },
    { key: 'credit', title: '学分' },
    { key: 'selectedAt', title: '选课时间', render: (v: unknown) => new Date(v as string).toLocaleString() },
    { key: 'status', title: '状态', render: (v: unknown) => {
      const statusMap: Record<string, string> = { selected: '已选', pending: '待确认', queued: '排队中', withdrawn: '已退选' };
      return statusMap[v as string] || String(v);
    }},
  ];
  exportToExcel(selections, columns, filename, '选课记录');
};

export const exportCoursesToExcel = (courses: Course[], filename: string = '课程列表') => {
  const columns = [
    { key: 'code', title: '课程编号' },
    { key: 'name', title: '课程名称' },
    { key: 'teacherName', title: '授课教师' },
    { key: 'department', title: '所属院系' },
    { key: 'category', title: '课程类型', render: (v: unknown) => {
      const map: Record<string, string> = { required: '必修', elective: '选修', general: '通识' };
      return map[v as string] || String(v);
    }},
    { key: 'credit', title: '学分' },
    { key: 'hours', title: '学时' },
    { key: 'capacity', title: '容量' },
    { key: 'selectedCount', title: '已选人数' },
    { key: 'semester', title: '学期' },
  ];
  exportToExcel(courses, columns, filename, '课程列表');
};

export const exportStudentsToExcel = (students: Student[], filename: string = '学生列表') => {
  const columns = [
    { key: 'studentId', title: '学号' },
    { key: 'name', title: '姓名' },
    { key: 'gender', title: '性别', render: (v: unknown) => v === 'male' ? '男' : '女' },
    { key: 'department', title: '院系' },
    { key: 'major', title: '专业' },
    { key: 'grade', title: '年级' },
    { key: 'className', title: '班级' },
    { key: 'phone', title: '手机号' },
    { key: 'email', title: '邮箱' },
    { key: 'selectedCredits', title: '已选学分' },
    { key: 'maxCredits', title: '最大可选学分' },
    { key: 'status', title: '状态', render: (v: unknown) => {
      const map: Record<string, string> = { active: '正常', inactive: '未激活', suspended: '休学' };
      return map[v as string] || String(v);
    }},
  ];
  exportToExcel(students, columns, filename, '学生列表');
};

export const exportTeachersToExcel = (teachers: Teacher[], filename: string = '教师列表') => {
  const columns = [
    { key: 'teacherId', title: '工号' },
    { key: 'name', title: '姓名' },
    { key: 'gender', title: '性别', render: (v: unknown) => v === 'male' ? '男' : '女' },
    { key: 'department', title: '院系' },
    { key: 'title', title: '职称' },
    { key: 'phone', title: '手机号' },
    { key: 'email', title: '邮箱' },
    { key: 'courseCount', title: '授课数' },
    { key: 'status', title: '状态', render: (v: unknown) => v === 'active' ? '在职' : '离职' },
  ];
  exportToExcel(teachers, columns, filename, '教师列表');
};

export const exportLogsToExcel = (logs: OperationLog[], filename: string = '操作日志') => {
  const columns = [
    { key: 'createdAt', title: '时间', render: (v: unknown) => new Date(v as string).toLocaleString() },
    { key: 'userName', title: '操作人' },
    { key: 'module', title: '模块' },
    { key: 'action', title: '操作' },
    { key: 'detail', title: '详情' },
    { key: 'ip', title: 'IP地址' },
  ];
  exportToExcel(logs, columns, filename, '操作日志');
};

export const parseExcelFile = async <T>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);
        resolve(jsonData);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

export const downloadTemplate = (filename: string, headers: string[]) => {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, '模板');
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${filename}.xlsx`);
};

export const studentImportTemplate = ['学号', '姓名', '性别', '院系', '专业', '年级', '班级', '手机号', '邮箱', '最大可选学分'];
export const teacherImportTemplate = ['工号', '姓名', '性别', '院系', '职称', '手机号', '邮箱'];
