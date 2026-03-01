-- 成绩表
CREATE TABLE IF NOT EXISTS grades (
  id VARCHAR(50) PRIMARY KEY,
  student_id VARCHAR(50) NOT NULL COMMENT '学生ID',
  course_id VARCHAR(50) NOT NULL COMMENT '课程ID',
  teacher_id VARCHAR(50) NOT NULL COMMENT '教师ID',
  semester VARCHAR(20) NOT NULL COMMENT '学期',
  score DECIMAL(5,2) COMMENT '分数',
  grade_level ENUM('excellent', 'good', 'medium', 'pass', 'fail') COMMENT '等级',
  grade_type ENUM('score', 'level') DEFAULT 'score' COMMENT '成绩类型',
  status ENUM('draft', 'submitted', 'approved', 'rejected') DEFAULT 'draft' COMMENT '状态',
  remark TEXT COMMENT '备注',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP COMMENT '提交时间',
  approved_at TIMESTAMP COMMENT '审核时间',
  approved_by VARCHAR(50) COMMENT '审核人',
  UNIQUE KEY uk_student_course_semester (student_id, course_id, semester),
  INDEX idx_teacher (teacher_id),
  INDEX idx_course (course_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成绩表';
