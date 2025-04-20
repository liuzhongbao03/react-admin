import type { LoginData, LoginResult } from '@/pages/login/model';
import { request } from '@/utils/request';

/**
 * 登录
 * @param data - 请求数据
 */
export function login(data: LoginData) {
  return request.get<LoginResult>('index.php?g=App&m=yaokong&a=login&username=17729257068&yzm=1721&nologin=0&lang=zh');
}

/**
 * 修改密码
 * @param data - 请求数据
 */
export function updatePassword(data: object) {
  return request.post('/update-password', data);
}
