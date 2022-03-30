import { atom, selector } from 'recoil'
import { Material } from '../lib/hooks'

export interface GroupSource {
  groupNo: string
  groupName: string,
  materialCount: number
}

export const selectedItems = atom<Material[]>({
  key: 'selectedItems',
  default: [],
})

export const currentGroup = atom<GroupSource | null>({
  key: 'currentGroup',
  default: null,
})

/** 全局压缩配置 */
export interface CompressionConfig {
  /** 是否开启压缩 0：开启压缩, 1：未开启 */
  enabled: boolean
  /** 七牛云文件目录(由系统编号与租户id组成)，用于拼接在上传到七牛云的文件名称。假设目录是 10028/10028-test，生成的名称是 pic-1.jpg，拼接后就是：10028/10028-test/pic-1.jpg */
  prefix: string
  /** 自定义配置字段 */
  config: Record<string, any>
}

export const compressionConfig = atom<CompressionConfig>({
  key: 'compressionConfig',
  default: {
    enabled: false,
    prefix: '',
    config: {},
  }
})
