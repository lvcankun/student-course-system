import { Layout, Menu, Avatar, Dropdown, Badge, Button, theme, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  BellOutlined,
  SettingOutlined,
  BarChartOutlined,
  FileTextOutlined,
  SafetyOutlined,
  ScheduleOutlined,
  PieChartOutlined,
  StarOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore, useUIStore } from '@/store';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

const { Header, Sider, Content } = Layout;

interface AdminLayoutProps {
  children?: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const { user, logout, unreadCount } = useUserStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: '/admin/dashboard',
      icon: <BarChartOutlined />,
      label: '数据概览',
    },
    {
      key: '/admin/students',
      icon: <TeamOutlined />,
      label: '学生管理',
    },
    {
      key: '/admin/teachers',
      icon: <UserOutlined />,
      label: '教师管理',
    },
    {
      key: '/admin/courses',
      icon: <BookOutlined />,
      label: '课程管理',
    },
    {
      key: '/admin/selection-rules',
      icon: <ScheduleOutlined />,
      label: '选课规则',
    },
    {
      key: '/admin/audits',
      icon: <FileTextOutlined />,
      label: '审核管理',
    },
    {
      key: '/admin/reviews',
      icon: <StarOutlined />,
      label: '评价管理',
    },
    {
      key: '/admin/grades',
      icon: <TrophyOutlined />,
      label: '成绩管理',
    },
    {
      key: '/admin/reports',
      icon: <PieChartOutlined />,
      label: '数据报表',
    },
    {
      key: '/admin/logs',
      icon: <SafetyOutlined />,
      label: '操作日志',
    },
  ];

  const handleMenuClick: MenuProps['onClick'] = (e) => {
    navigate(e.key);
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人信息',
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '消息通知',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: '系统设置',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
    },
  ];

  const handleUserMenuClick: MenuProps['onClick'] = (e) => {
    switch (e.key) {
      case 'logout':
        logout();
        navigate('/login');
        break;
      case 'profile':
        navigate('/admin/profile');
        break;
      case 'settings':
        navigate('/admin/settings');
        break;
      case 'notifications':
        navigate('/admin/notifications');
        break;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={sidebarCollapsed}
        theme="light"
        width={220}
        style={{ boxShadow: '2px 0 8px rgba(0,0,0,0.05)' }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <SafetyOutlined style={{ fontSize: 24, color: '#722ed1' }} />
          {!sidebarCollapsed && (
            <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#333' }}>
              管理后台
            </span>
          )}
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ borderRight: 0 }}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: colorBgContainer,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          }}
        >
          <Button
            type="text"
            icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={toggleSidebar}
            style={{ fontSize: 16, width: 64, height: 64 }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Badge count={unreadCount} size="small">
              <Button type="text" icon={<BellOutlined />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#333' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#722ed1' }} />
                <span>{user?.name || '管理员'}</span>
              </div>
            </Dropdown>
          </div>
        </Header>
        <Content
          style={{
            margin: 24,
            padding: 24,
            minHeight: 280,
            overflow: 'auto',
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {children || <Outlet />}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
