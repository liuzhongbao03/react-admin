import type { LoginData } from './model';
import type { FormProps } from 'antd';
import type { SideMenu } from '#/public';
import { usePublicStore, type ThemeType } from '@/stores/public';
import { message } from 'antd';
import { Form, Button, Input } from 'antd';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PASSWORD_RULE, THEME_KEY } from '@/utils/config';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { login } from '@/servers/login';
import { useToken } from '@/hooks/useToken';
import { getMenuList } from '@/servers/system/menu';
import { useCommonStore } from '@/hooks/useCommonStore';
import { getPermissions } from '@/servers/permissions';
import { getFirstMenu } from '@/menus/utils/helper';
import { useMenuStore, useUserStore } from '@/stores';
import Logo from '@/assets/images/logo.svg';
import I18n from '@/components/I18n';
import Theme from '@/components/Theme';
import { ResourceLoader, FormattedOutput } from '@/utils/resourceLoader';

// 外部调用方法
export async function loadApplicationResources(): Promise<FormattedOutput> {
  const loader = new ResourceLoader();
  try {
    const result = await loader.loadAll();
    console.log('资源加载完成');
    return result;
  } catch (error) {
    console.error('关键资源加载失败:', error);
    throw new Error('应用初始化失败');
  }
}

// 使用示例
(async () => {
  const { configs, datasets, texts } = await loadApplicationResources();
  console.log('configs, datasets, texts', configs, datasets, texts);
  // // 类型安全的访问示例
  // console.log('设备配置:', configs);

  // CSV 数据访问
  // if (Array.isArray(datasets['Product_ID_List.csv'])) {
  //   datasets['Product_ID_List.csv'].forEach(item => {
  //     console.log('产品ID:', item);
  //   });
  // }
  // console.log('模型输入:', texts);
  // 模型输入处理
  // const modelInput = texts['ModelInPut.txt'];
  // if (Array.isArray(modelInput)) {
  //   modelInput.forEach(line => console.log('模型输入:', line));
  // }
})();


function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [getToken, setToken] = useToken();
  const [isLoading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const { search } = useLocation();
  const { permissions, menuList } = useCommonStore();
  const setMenuList = useMenuStore(state => state.setMenuList);
  const setThemeValue = usePublicStore(state => state.setThemeValue);
  // const { setPermissions, setUserInfo } = useUserStore(state => state);
  const themeCache = (localStorage.getItem(THEME_KEY) || 'light') as ThemeType;

  useEffect(() => {
    if (!themeCache) {
      localStorage.setItem(THEME_KEY, 'light');
    }
    if (themeCache === 'dark') {
      document.body.className = 'theme-dark';
    }
    setThemeValue(themeCache === 'dark' ? 'dark' : 'light');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themeCache]);

  useEffect(() => {
    // 如果存在token，则直接进入页面
    if (getToken()) {
      // 如果不存在缓存则获取权限
      if (!permissions.length) {
        getUserPermissions();
      } else {
        // 有权限则直接跳转
        handleGoMenu(permissions);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** 获取用户权限 */
  const getUserPermissions = async () => {
    try {
      setLoading(true);
      const { code, data } = await getPermissions({ refresh_cache: false });
      if (Number(code) !== 200) return;
      // const { user, permissions } = data;
      // setUserInfo(user);
      // setPermissions(permissions);
      // handleGoMenu(permissions);
    } finally {
      setLoading(false);
    }
  };

  /** 获取菜单数据 */
  const getMenuData = async () => {
    if (menuList?.length) return menuList;
    let result: SideMenu[] = [];

    try {
      setLoading(true);
      const { code, data } = await getMenuList();
      if (Number(code) !== 200) return;
      setMenuList(data || []);
      // result = data;
    } finally {
      setLoading(false);
    }

    return result;
  };

  /** 获取重定向路由 */
  const getRedirectUrl = () => {
    const key = '?redirect=';
    const start = search.includes(key) ? search.indexOf(key) + 10 : 0;
    const end = search.includes('&') ? search.indexOf('&') : search.length;

    return search.substring(start, end);
  };

  /** 菜单跳转 */
  const handleGoMenu = async (permissions: string[]) => {
    let menuData: SideMenu[] = menuList;
    if (!menuData?.length) {
      menuData = await getMenuData() as SideMenu[];
    }

    // 如果存在重定向
    if (search?.includes('?redirect=')) {
      const url = getRedirectUrl();
      if (url) {
        navigate(url);
        return;
      }
    }

    // 有权限则直接跳转
    const firstMenu = getFirstMenu(menuData, permissions);
    if (!firstMenu) {
      return messageApi.error({ content: t('login.notPermissions'), key: 'permissions' });
    }
    navigate(firstMenu);
  };

  /**
   * 处理登录
   * @param values - 表单数据
   */
  const handleFinish: FormProps['onFinish'] = async (values: LoginData) => {
    try {
      setLoading(true);
      const { code, data } = await login(values);
      console.log('data', code, data);
      if(data && typeof data === 'object') {
        for (const key in data) {
          if(data[key] && data[key].url) {
            // document.write(`<script type="${'application/octet-stream'}" src="${data[key].url}"></script>`)
            // const res = fetchResource(data[key].url);
            // console.log('res', res);
          }
          // if (Object.prototype.hasOwnProperty.call(object, key)) {
          //   const element = object[key];
            
          // }
        }
      }
      // const { token, user, permissions } = data;

      // if (!permissions?.length || !token) {
      //   return messageApi.error({ content: t('login.notPermissions'), key: 'permissions' });
      // }

      // setToken(token);
      // setUserInfo(user);
      // setPermissions(permissions);
      // handleGoMenu(permissions);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 处理失败
   * @param errors - 错误信息
   */
  const handleFinishFailed: FormProps['onFinishFailed'] = errors => {
    console.error('错误信息:', errors);
  };

  return (
    <>
      { contextHolder }
      <div className={`
        ${themeCache === 'dark' ? 'bg-black text-white' : 'bg-light-400'}
        w-screen
        h-screen
        relative
      `}>
        <div className="flex absolute top-5 right-5">
          <I18n />
          <Theme />
        </div>
        <div className={`
          w-300px
          h-290px
          p-30px
          rounded-5px
          ${themeCache === 'dark' ? 'bg-black bg-dark-200' : 'bg-white'}
          box-border
          absolute
          left-1/2
          top-1/2
          -translate-x-1/2
          -translate-y-1/2
        `}>
         <div className="pb-30px pt-10px flex items-center justify-center">
            <img
              className="mr-2 object-contain"
              width="30"
              height="30"
              src={Logo}
              alt="LOGO"
            />
            <span className="text-xl font-bold tracking-2px">
              { t('login.systemLogin') }
            </span>
          </div>
          <Form
            name="horizontal_login"
            autoComplete="on"
            onFinish={handleFinish}
            onFinishFailed={handleFinishFailed}
            initialValues={{
              username: 'admin',
              password: 'admin123456'
            }}
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: t('public.pleaseEnter', { name: t('login.username') }) }]}
            >
              <Input
                allow-clear="true"
                placeholder={t('login.username')}
                autoComplete="username"
                addonBefore={<UserOutlined className='change' />}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: t('public.pleaseEnter', { name: t('login.password') }) },
                PASSWORD_RULE(t)
              ]}
            >
              <Input.Password
                placeholder={t('login.password')}
                autoComplete="current-password"
                addonBefore={<LockOutlined className='change' />}
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                className="w-full mt-5px rounded-5px tracking-2px"
                loading={isLoading}
              >
                { t('login.login') }
              </Button>
            </Form.Item>
          </Form>
        </div>
      </div>
    </>
  );
}

export default Login;
