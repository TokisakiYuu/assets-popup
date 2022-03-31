import { atom, selector } from 'recoil'
import { Material } from 'src/lib/hooks'

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

/**
 * 弹窗显示状态
 */
export const popupVisibleAtom = atom<boolean>({
  key: 'popupVisible',
  default: false,
})

/**
 * 用户选择直接使用本地文件时选中的文件
 */
export const useLocalFileAtom = atom<Material[]>({
  key: 'useLocalFile',
  default: []
})

/**
 * 是否多选
 */
export const multipleAtom = atom<boolean>({
  key: 'multiple',
  default: false
})

/**
 * 全局配置，需要请求后更新进来
 */
export const globalConfig = atom<CompressionConfig>({
  key: 'globalConfig',
  default: {
    enabled: false,
    prefix: '',
    config: {}
  }
})

/**
 * 当前素材箱可选择的文件格式，同input:file 的accept属性
 */
export const acceptAtom = atom<string | undefined>({
  key: 'accept',
  default: undefined
})
