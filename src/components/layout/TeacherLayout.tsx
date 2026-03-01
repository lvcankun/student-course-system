import { Layout, Menu, Avatar, Dropdown, Badge, Button, theme, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  TeamOutlined,
  BellOutlined,
  SettingOutlined,
  StarOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore, useUIStore } from '@/store';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';

const { Header, Sider, Content } = Layout;

interface TeacherLayoutProps {
  children?: ReactNode;
}

const TeacherLayout = ({ children }: TeacherLayoutProps) => {
  const { user, logout, unreadCount } = useUserStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const menuItems: MenuProps['items'] = [
    {
      key: '/teacher/courses',
      icon: <BookOutlined />,
      label: '我的课程',
    },
    {
      key: '/teacher/students',
      icon: <TeamOutlined />,
      label: '选课学生',
    },
    {
      key: '/teacher/schedule',
      icon: <CalendarOutlined />,
      label: '授课课表',
    },
    {
      key: '/teacher/reviews',
      icon: <StarOutlined />,
      label: '课程评价',
    },
    {
      key: '/teacher/grades',
      icon: <FileTextOutlined />,
      label: '成绩录入',
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
      label: '设置',
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
        navigate('/teacher/profile');
        break;
      case 'settings':
        navigate('/teacher/settings');
        break;
      case 'notifications':
        navigate('/teacher/notifications');
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
          <BookOutlined style={{ fontSize: 24, color: '#52c41a' }} />
          {!sidebarCollapsed && (
            <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#333' }}>
              教师端
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
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#52c41a' }} />
                <span>{user?.name || '教师'}</span>
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

export default TeacherLayout;
