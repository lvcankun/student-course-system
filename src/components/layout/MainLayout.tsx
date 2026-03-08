import { Layout, Menu, Avatar, Dropdown, Badge, Button, theme, message } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BookOutlined,
  CalendarOutlined,
  UserOutlined,
  LogoutOutlined,
  HomeOutlined,
  SettingOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useUserStore, useUIStore, useSelectionStore } from '@/store';
import { useFetch } from '@/hooks';
import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import type { SelectionRecord } from '@/types';
import { useEffect } from 'react';

const { Header, Sider, Content } = Layout;

interface MainLayoutProps {
  children?: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { user, logout } = useUserStore();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { selectedCourses, setSelectedCourses } = useSelectionStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();

  const { data: mySelections } = useFetch<SelectionRecord[]>('my-selections', '/selection/my');

  const totalCredits = selectedCourses.reduce((sum, r) => sum + r.credit, 0);

  useEffect(() => {
    if (mySelections) {
      setSelectedCourses(mySelections);
    }
  }, [mySelections, setSelectedCourses]);

  const menuItems: MenuProps['items'] = [
    {
      key: '/student/courses',
      icon: <BookOutlined />,
      label: '选课中心',
    },
    {
      key: '/student/schedule',
      icon: <CalendarOutlined />,
      label: '我的课表',
    },
    {
      key: '/student/selections',
      icon: <HomeOutlined />,
      label: '已选课程',
    },
    {
      key: '/student/grades',
      icon: <TrophyOutlined />,
      label: '我的成绩',
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
        navigate('/student/profile');
        break;
      case 'settings':
        navigate('/student/settings');
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
          <BookOutlined style={{ fontSize: 24, color: '#1890ff' }} />
          {!sidebarCollapsed && (
            <span style={{ marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#333' }}>
              选课系统
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
            <Badge count={0} showZero={false}>
              <span style={{ color: '#555' }}>
                学分: {totalCredits} / {user?.maxCredits || 30}
              </span>
            </Badge>
            <Dropdown menu={{ items: userMenuItems, onClick: handleUserMenuClick }} placement="bottomRight">
              <div style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, color: '#333' }}>
                <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#1890ff' }} />
                <span>{user?.name || '用户'}</span>
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

export default MainLayout;
