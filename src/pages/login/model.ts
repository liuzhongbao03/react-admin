// 接口传入数据
export interface LoginData {
  username: string;
  password: string;
}

// 用户数据
interface User {
  id: number;
  username: string;
  phone: string;
  email: string;
}

// 用户权限数据
interface Roles {
  id: string;
}

// 接口返回数据
interface FileType {
  md5: string,
  url: string
} 
export interface LoginResult {
  token: string;
  user: User;
  permissions: string[];
  roles: Roles[];
  "fileret": boolean,
  "OnlineDevice.ini": FileType,
  "ModelInPut.txt": FileType,
  "Product_ID_List.csv": FileType,
  "Product_ID_List._Sendor.csv": FileType,
  "FAQ-EN.ini": FileType,
  "Login-CN.ini": FileType,
  "Maintenance.ini": FileType,
  "Promotion-EN.ini": FileType,
  "SystemFile.ini": FileType,
  "Login-EN.ini": FileType,
  "FAQ-CN.ini": FileType,
  "Promotion-CN.ini": FileType,
  "userid": string,
  "groupid": null,
  "nickname": string,
  "username": string,
  [key: string]: any; 
}