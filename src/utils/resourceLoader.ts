// ----------------------
// src/utils/resourceLoader.ts
// ----------------------
import axios from 'axios';

// 类型定义
export type ResourceType = 'ini' | 'txt' | 'csv';
export type ParsedResult<T extends ResourceType> =
  T extends 'ini' ? Record<string, string> :
  T extends 'csv' ? Array<Record<string, string>> :
  T extends 'txt' ? Record<string, string[]> | string :
  never;

export interface ResourceMeta {
  url: string;
  type: ResourceType;
  md5: string;
}

export interface LoadResult {
  status: 'fulfilled' | 'rejected';
  name: string;
  error?: Error;
  data?: any;
}

export interface FormattedOutput {
  configs: Record<string, ParsedResult<'ini'>>;
  datasets: Record<string, ParsedResult<'csv'>>;
  texts: Record<string, ParsedResult<'txt'>>;
}

type ProductRelations = Record<string, string[]>;

// 配置文件映射表
export const resourceMap: Record<string, ResourceMeta> = {
  "OnlineDevice.ini": {
    md5: "64fec2374b7ee2d5f8077fbf68401597",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/1Online device\/OnlineDevice.ini",
    type: "ini",
  },
  "ModelInPut.txt": {
    md5: "54e80ea6b12385f016ff1a2fec45274e",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/1Online device\/ModelInPut.txt",
    type: "txt",
  },
  "Product_ID_List.csv": {
    md5: "e19b9f0dd83315b11b6fa73a856d0f2d",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/1Online device\/indirect\/Product_ID_List.csv",
    type: "csv",
  },
  "Product_ID_List._Sendor.csv": {
    md5: "9f0d8a5b1d75d0af720967da6e3cd8f8",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/1Online device\/Direct\/Product_ID_List._Sendor.csv",
    type: "csv",
  },
  "FAQ-EN.ini": {
    md5: "23d8c7cd0d74d2e699e7cdb8ede39638",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/5FAQ-EN\/FAQ-EN.ini",
    type: "ini",
  },
  "Login-CN.ini": {
    md5: "89ad337556c59373a0570131d97e36e5",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/Login-CN.ini",
    type: "ini",
  },
  "Maintenance.ini": {
    md5: "af85be66d2f7da252460de57929e0eea",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/4Maintenance Center\/Maintenance.ini",
    type: "ini",
  },
  "Promotion-EN.ini": {
    md5: "bd1cabb73c2f635c38acba633bdcf8c0",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/2Promotion-EN\/Promotion-EN.ini",
    type: "ini",
  },
  "SystemFile.ini": {
    md5: "97526f8eb2af6c1b581a17df1cd65043",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/7System\/SystemFile.ini",
    type: "ini",
  },
  "Login-EN.ini": {
    md5: "fd989e062c948c78f14943b5f0e06d6f",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/Login-EN.ini",
    type: "ini",
  },
  "FAQ-CN.ini": {
    md5: "a514a55710d8f0cc0a253c59548026c7",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/5FAQ-CN\/FAQ-CN.ini",
    type: "ini",
  },
  "Promotion-CN.ini": {
    md5: "80e58d7f7250ad07d5d37d73335cedd9",
    url: "http:\/\/yaokongguanjia.maxhom.cn\/NewFlysky AssistantV3.2\/2Promotion-CN\/Promotion-CN.ini",
    type: "ini",
  },
};

export class ResourceLoader {
  private dataPool = new Map<string, ParsedResult<ResourceType>>();

  async loadAll(): Promise<FormattedOutput> {
    const promises = Object.entries(resourceMap).map(
      async ([name, meta]): Promise<LoadResult> => {
        try {
          const content = await this.fetchResource(meta.url);
          const parsed = this.parseContent(content, meta.type, name);
          this.dataPool.set(name, parsed);
          return { status: 'fulfilled', name, data: parsed };
        } catch (error) {
          return this.handleError(error as Error, name);
        }
      }
    );

    const results = await Promise.allSettled(promises);
    // console.log('results', results);
    return this.formatOutput();
  }

  private async fetchResource(url: string): Promise<string> {
    try {
      // const response = await axios.get<string>(url, {
      //   timeout: 10000,
      //   responseType: 'text',
      // });
      // return response.data;

      // 中文乱码问题
      const response = await axios.get<ArrayBuffer>(url, {
        timeout: 10000,
        responseType: 'arraybuffer',
        headers: {
          'Accept': 'text/*, application/json'
        }
      });
      // 获取字节数据
      const buffer = await response.data;
      // 解析编码信息
      const detectedEncoding = this.determineEncoding(
        response.headers['content-type'],
        new Uint8Array(buffer)
      );

      // 带备选编码的解码方案
      return this.decodeWithFallback(buffer, detectedEncoding)
    } catch (error) {
      throw new Error(`资源请求失败: ${(error as Error).message}`);
    }
  }

  // 编码检测算法
  private determineEncoding(contentType: string | undefined, buffer: Uint8Array): string {
    // 1. 从Content-Type头解析
    const charsetFromHeader = contentType?.match(/charset=([\w-]+)/i)?.[1];
    if (charsetFromHeader) return charsetFromHeader.toLowerCase();

    // 2. BOM检测（处理带签名的UTF文件）
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) return 'utf-8';
    if (buffer[0] === 0xFE && buffer[1] === 0xFF) return 'utf-16be';
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) return 'utf-16le';

    // 3. 高频中文编码优先检测
    return this.detectChineseEncoding(buffer) || 'utf-8';
  }

  // 中文编码推测（基于常见字符分布）
  private detectChineseEncoding(buffer: Uint8Array): string | null {
    const sampleSize = Math.min(buffer.length, 512);
    const sample = Array.from(buffer.slice(0, sampleSize));

    // GBK特征检测（常见双字节中文字符）
    for (let i = 0; i < sample.length; i++) {
      if (sample[i] > 0x7F) {
        if (i + 1 < sample.length && sample[i + 1] >= 0x40) {
          return 'gbk';
        }
      }
    }

    return null;
  }

  // 多重编码解码器
  private decodeWithFallback(buffer: ArrayBuffer, primaryEncoding: string): string {
    const encodingsToTry = [
      primaryEncoding,
      'gbk',
      'gb18030',  // 包含更全的中文字符
      'windows-1252' // 常见西欧编码
    ];

    const decoderOptions = { fatal: true };

    for (const encoding of [...new Set(encodingsToTry)]) {
      try {
        return new TextDecoder(encoding, decoderOptions).decode(buffer);
      } catch (e) {
        console.warn(`解码失败 [尝试编码: ${encoding}]`, e);
      }
    }

    // 最终回退方案：替换非法字符
    console.error('所有解码尝试失败，启用替换模式');
    return new TextDecoder(primaryEncoding, {
      fatal: false,
      ignoreBOM: true
    }).decode(buffer);
  }

  private parseContent(
    raw: string,
    type: ResourceType,
    filename: string
  ): ParsedResult<ResourceType> {
    const parserMap = {
      ini: this.parseINI,
      csv: this.parseCSV,
      txt: this.parseTXT
    };

    if (!(type in parserMap)) {
      throw new Error(`Unsupported file type: ${type}`);
    }

    return parserMap[type](raw, filename) as ParsedResult<ResourceType>;
  }

  private parseINI(raw: string): ParsedResult<'ini'> {
    return raw.split('\n').reduce((acc: Record<string, string>, line) => {
      const [k, v] = line.split('=').map(s => s?.trim());
      if (k && v) acc[k] = v;
      return acc;
    }, {});
  }

  private parseCSV(raw: string): ParsedResult<'csv'> {
    const rows = raw.split('\n').filter(Boolean);
    const headers = rows.shift()?.split(',') || [];
    return rows.map(row =>
      row.split(',').reduce((acc, val, i) => {
        acc[headers[i]] = val.trim();
        return acc;
      }, {} as Record<string, string>)
    );
  }
  private parseTXT(raw: string, filename: string): ParsedResult<'txt'> {
    if (filename === "ModelInPut.txt") {
      return raw
        .split('\n')
        .filter(line => line.trim())
        .reduce((acc: ProductRelations, line) => {
          const [mainPart, relationsPart] = line.split(':');
          if (!mainPart || !relationsPart) return acc;

          const mainModel = mainPart.trim();
          const relatedModels = relationsPart
            .split(',')
            .map(s => s.trim())
            .filter(s => s !== 'end' && s !== '');

          // 合并重复条目
          if (acc[mainModel]) {
            acc[mainModel] = [...new Set([...acc[mainModel], ...relatedModels])];
          } else {
            acc[mainModel] = relatedModels;
          }

          return acc;
        }, {});
    }
  return raw;
  }

  private formatOutput(): FormattedOutput {
    return {
      configs: this.getCategoryData('ini'),
      datasets: this.getCategoryData('csv'),
      texts: this.getCategoryData('txt')
    };
  }

  private getCategoryData<T extends ResourceType>(type: T): Record<string, ParsedResult<T>> {
    return Array.from(this.dataPool.entries()).reduce((acc, [name, data]) => {
      if (resourceMap[name].type === type) {
        acc[name] = data as ParsedResult<T>;
      }
      return acc;
    }, {} as Record<string, ParsedResult<T>>);
  }

  private handleError(error: Error, name: string): LoadResult {
    console.error(`[${name}] 加载失败:`, error);
    return {
      status: 'rejected',
      name,
      error: new Error(`资源加载失败: ${name} - ${error.message}`)
    };
  }
}

