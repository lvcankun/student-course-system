import mysql from 'mysql2/promise';

const DB_CONFIG = {
  host: 'localhost',
  user: 'root',
  password: '123456',
  multipleStatements: true
};

const DATABASE_NAME = 'course_selection_system';

const CREATE_DATABASE_SQL = `
CREATE DATABASE IF NOT EXISTS \`${DATABASE_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE \`${DATABASE_NAME}\`;
`;

const CREATE_TABLES_SQL = `
-- 用户表
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(100) NOT NULL,
  name VARCHAR(50) NOT NULL,
  role ENUM('student', 'teacher', 'admin', 'superAdmin') NOT NULL DEFAULT 'student',
  student_id VARCHAR(20),
  teacher_id VARCHAR(20),
  department VARCHAR(100),
  major VARCHAR(100),
  grade VARCHAR(20),
  class_name VARCHAR(50),
  phone VARCHAR(20),
  email VARCHAR(100),
  max_credits INT DEFAULT 30,
  selected_credits INT DEFAULT 0,
  status ENUM('active', 'inactive', 'banned') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程表
CREATE TABLE IF NOT EXISTS courses (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  credit INT NOT NULL,
  hours INT NOT NULL,
  capacity INT NOT NULL,
  selected_count INT DEFAULT 0,
  teacher_id VARCHAR(50) NOT NULL,
  teacher_name VARCHAR(50),
  department VARCHAR(100),
  category ENUM('required', 'elective', 'general') DEFAULT 'elective',
  tags JSON,
  semester VARCHAR(20),
  teaching_method ENUM('offline', 'online', 'hybrid') DEFAULT 'offline',
  status ENUM('draft', 'published', 'closed', 'cancelled') DEFAULT 'draft',
  selection_scope JSON,
  prerequisites JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_teacher (teacher_id),
  INDEX idx_status (status),
  INDEX idx_semester (semester)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程时间表
CREATE TABLE IF NOT EXISTS course_time_slots (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id VARCHAR(50) NOT NULL,
  day_of_week INT NOT NULL,
  start_period INT NOT NULL,
  end_period INT NOT NULL,
  week_range VARCHAR(50),
  location VARCHAR(100),
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  INDEX idx_course (course_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 选课记录表
CREATE TABLE IF NOT EXISTS selections (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL,
  course_id VARCHAR(50) NOT NULL,
  status ENUM('selected', 'withdrawn', 'pending') DEFAULT 'selected',
  selected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  withdrawn_at TIMESTAMP NULL,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  UNIQUE KEY uk_student_course (student_id, course_id),
  INDEX idx_student (student_id),
  INDEX idx_course (course_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 课程评价表
CREATE TABLE IF NOT EXISTS course_reviews (
  id VARCHAR(50) PRIMARY KEY,
  course_id VARCHAR(50) NOT NULL,
  course_name VARCHAR(100),
  student_id VARCHAR(50) NOT NULL,
  student_name VARCHAR(50),
  is_anonymous BOOLEAN DEFAULT FALSE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  tags JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_course_student (course_id, student_id),
  INDEX idx_course (course_id),
  INDEX idx_student (student_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 审核记录表
CREATE TABLE IF NOT EXISTS audit_records (
  id VARCHAR(50) PRIMARY KEY,
  type ENUM('selection', 'withdraw', 'special') NOT NULL,
  applicant_id VARCHAR(50) NOT NULL,
  applicant_name VARCHAR(50),
  course_id VARCHAR(50),
  course_name VARCHAR(100),
  reason TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  reviewer_id VARCHAR(50),
  reviewer_name VARCHAR(50),
  review_comment TEXT,
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_applicant (applicant_id),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 操作日志表
CREATE TABLE IF NOT EXISTS operation_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id VARCHAR(50),
  user_name VARCHAR(50),
  module VARCHAR(50),
  action VARCHAR(50),
  target_type VARCHAR(50),
  target_id VARCHAR(50),
  details JSON,
  ip_address VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user (user_id),
  INDEX idx_module (module),
  INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 通知表
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  title VARCHAR(200) NOT NULL,
  content TEXT,
  type ENUM('system', 'selection', 'audit', 'course') DEFAULT 'system',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user (user_id),
  INDEX idx_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 选课规则表
CREATE TABLE IF NOT EXISTS selection_rules (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  semester VARCHAR(20),
  start_time DATETIME,
  end_time DATETIME,
  max_credits INT DEFAULT 30,
  min_credits INT DEFAULT 0,
  allow_withdraw BOOLEAN DEFAULT TRUE,
  withdraw_deadline DATETIME,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_semester (semester),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const INSERT_INITIAL_DATA_SQL = `
-- 插入默认用户数据
INSERT IGNORE INTO users (id, username, password, name, role, student_id, teacher_id, department, major, grade, class_name, phone, email, max_credits) VALUES
('user-student-1', 'student1', '123456', '张三', 'student', '2024001', NULL, '计算机学院', '计算机科学与技术', '2024级', '计科1班', '13800138001', 'student1@example.com', 30),
('user-teacher-1', 'teacher1', '123456', '张教授', 'teacher', NULL, 'T001', '计算机学院', NULL, NULL, NULL, '13900139001', 'teacher1@example.com', 0),
('user-admin-1', 'admin', '123456', '管理员', 'admin', NULL, NULL, '教务处', NULL, NULL, NULL, '13700137001', 'admin@example.com', 0);

-- 插入默认课程数据
INSERT IGNORE INTO courses (id, code, name, credit, hours, capacity, selected_count, teacher_id, teacher_name, department, category, semester, teaching_method, status) VALUES
('course-1', 'CS1001', '高等数学', 4, 64, 100, 78, 'user-teacher-1', '张教授', '数学学院', 'required', '2024-1', 'offline', 'published'),
('course-2', 'CS1002', '线性代数', 3, 48, 80, 65, 'user-teacher-1', '张教授', '数学学院', 'required', '2024-1', 'offline', 'published'),
('course-3', 'CS1003', '程序设计基础', 3, 48, 60, 55, 'user-teacher-1', '张教授', '计算机学院', 'required', '2024-1', 'offline', 'published'),
('course-4', 'CS1004', '数据结构', 4, 64, 50, 48, 'user-teacher-1', '张教授', '计算机学院', 'required', '2024-1', 'offline', 'published'),
('course-5', 'CS1005', '计算机网络', 3, 48, 45, 42, 'user-teacher-1', '张教授', '计算机学院', 'elective', '2024-1', 'offline', 'published');

-- 插入课程时间
INSERT IGNORE INTO course_time_slots (course_id, day_of_week, start_period, end_period, week_range, location) VALUES
('course-1', 1, 1, 2, '1-16周', '教学楼1-101'),
('course-1', 3, 1, 2, '1-16周', '教学楼1-101'),
('course-2', 2, 3, 4, '1-16周', '教学楼2-201'),
('course-3', 1, 5, 6, '1-16周', '教学楼3-301'),
('course-3', 4, 5, 6, '1-16周', '教学楼3-301'),
('course-4', 2, 1, 2, '1-16周', '教学楼3-302'),
('course-4', 5, 1, 2, '1-16周', '教学楼3-302'),
('course-5', 3, 5, 6, '1-16周', '教学楼3-303');

-- 插入选课规则
INSERT IGNORE INTO selection_rules (name, semester, start_time, end_time, max_credits, min_credits, allow_withdraw, withdraw_deadline, is_active) VALUES
('2024春季学期选课规则', '2024-1', '2024-01-01 00:00:00', '2024-02-28 23:59:59', 30, 0, TRUE, '2024-03-15 23:59:59', TRUE);

-- 插入通知
INSERT IGNORE INTO notifications (id, user_id, title, content, type, is_read) VALUES
('n1', NULL, '选课开始通知', '2024春季学期选课已开始，请在规定时间内完成选课', 'system', FALSE),
('n2', 'user-student-1', '选课成功', '您已成功选择《高等数学》课程', 'selection', TRUE);
`;

async function initDatabase() {
  let connection;
  try {
    console.log('🔄 开始初始化数据库...');
    
    connection = await mysql.createConnection(DB_CONFIG);
    
    console.log('📦 创建数据库...');
    await connection.query(CREATE_DATABASE_SQL);
    console.log('✅ 数据库创建成功');
    
    console.log('📋 创建数据表...');
    await connection.query(CREATE_TABLES_SQL);
    console.log('✅ 数据表创建成功');
    
    console.log('📝 插入初始数据...');
    await connection.query(INSERT_INITIAL_DATA_SQL);
    console.log('✅ 初始数据插入成功');
    
    console.log('\n🎉 数据库初始化完成！');
    console.log(`📊 数据库名称: ${DATABASE_NAME}`);
    console.log('📋 已创建表: users, courses, course_time_slots, selections, course_reviews, audit_records, operation_logs, notifications, selection_rules');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

initDatabase();
