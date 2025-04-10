import type { PasswordModal } from './UpdatePassword';
import type { MenuProps } from 'antd';
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToken } from '@/hooks/useToken';
import { App, Dropdown } from 'antd';
import { useTranslation } from 'react-i18next';
import { useCommonStore } from '@/hooks/useCommonStore';
import { useKeepAliveContext } from 'keepalive-for-react';
import {
  // useMenuStore,
  useTabsStore,
  useUserStore
} from '@/stores';
import {
  // MenuFoldOutlined,
  // MenuUnfoldOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import Avatar from '@/assets/images/avatar.png';
import styles from '../index.module.less';
import Fullscreen from '@/components/Fullscreen';
// import GlobalSearch from '@/components/GlobalSearch';
import I18n from '@/components/I18n';
// import Theme from '@/components/Theme';
// import UpdatePassword from './UpdatePassword';
// import Nav from './Nav';

type MenuKey = 'password' | 'logout'

function Header() {
  const [, , removeToken] = useToken();
  const { t } = useTranslation();
  const { destroy } = useKeepAliveContext();
  const { modal } = App.useApp();
  const {
    // isCollapsed,
    isMaximize,
    username,
    nav
  } = useCommonStore();
  // 是否窗口最大化
  const passwordRef = useRef<PasswordModal>(null);
  const navigate = useNavigate();
  // const toggleCollapsed = useMenuStore(state => state.toggleCollapsed);
  const clearInfo = useUserStore(state => state.clearInfo);
  const { closeAllTab, setActiveKey } = useTabsStore(state => state);

  // 下拉菜单内容
  const items: MenuProps['items'] = [
    {
      key: 'password',
      label: (<span>{ t('public.changePassword') }</span>),
      icon: '',
    },
    {
      key: 'logout',
      label: (<span>{ t('public.signOut') }</span>),
      icon: '',
    },
  ];

  /** 点击个人中心菜单 */
  const onClick: MenuProps['onClick'] = e => {
    switch (e.key as MenuKey) {
      case 'password':
        passwordRef.current?.open();
        break;
      case 'logout':
        handleLogout();
        break;

      default:
        break;
    }
  };

  /** 退出登录 */
  const handleLogout = () => {
    modal.confirm({
      title: t('public.kindTips'),
      icon: <ExclamationCircleOutlined />,
      content: t('public.signOutMessage'),
      onOk() {
        clearInfo();
        closeAllTab();
        setActiveKey('');
        removeToken();
        destroy(); // 清除keepalive缓存
        navigate('/login');
      }
    });
  };

  /** 右侧组件抽离减少重复渲染 */
  const RightRender = () => {
    return (
      <div className="flex items-center">
        {/* <GlobalSearch /> */}
        <I18n />
        {/* <Theme /> */}
        <Dropdown
          className="min-w-50px"
          menu={{ items, onClick }}
        >
          <div
            className="ant-dropdown-link flex items-center cursor-pointer"
            onClick={e => e.preventDefault()}
          >
            <img
              src={Avatar}
              width={27}
              height={27}
              alt="Avatar"
              className="rounded-1/2 overflow-hidden object-cover bg-light-500"
            />
            <span className="ml-2 text-15px min-w-50px truncate">
              { '个人中心' || 'south-admin' }
            </span>
          </div>
        </Dropdown>

        <Fullscreen />
      </div>
    );
  };

  /** icon渲染 */
  // const IconRender = () => {
  //   return (
  //     <div
  //       className="text-lg cursor-pointer"
  //       onClick={() => toggleCollapsed(!isCollapsed)}
  //     >
  //       { isCollapsed && <MenuUnfoldOutlined /> }
  //       { !isCollapsed && <MenuFoldOutlined /> }
  //     </div>
  //   );
  // };

  return (
    <>
      <header
        className={`
          border-bottom
          flex
          items-center
          justify-between
          px-6
          py-6px
          box-border
          transition-all
          ${styles['header-driver']}
          ${isMaximize ? styles.none : ''}
        `}
      >
        {/* <div className="flex item-center">
          <IconRender />

          <Nav
            className="ml-15px"
            list={nav}
          />
        </div> */}

        <RightRender />
      </header>

      {/* <UpdatePassword passwordRef={passwordRef} /> */}
    </>
  );
}

export default Header;
