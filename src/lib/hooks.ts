import { useTokenRequest, useAxiosInstance } from './api'
import { message } from 'antd'
import { useRequest } from 'ahooks'
import { useEffect, useState } from 'react'
import { md5 } from '../utils'
import mime from 'mime/lite'
import contentDisposition from 'content-disposition'

/**
 * 获取分组列表
 */
export function useGetGroupList() {
  const ctr =  useTokenRequest({
    method: 'GET',
    url: '/authority/material/getGroupList',
    params: {
      current: 1,
      size: 999
    }
  }, {
    manual: true
  })
  return {
    ...ctr,
    data: ctr.data?.data
  }
}

/**
 * 获取七牛云token
 */
export function useGetQiNiuToken() {
  const { data, error, loading, refreshAsync } =  useTokenRequest({
    method: 'GET',
    url: '/authority/material/getUploadToken'
  }, {
    cacheKey: 'qiniu_token',
    staleTime: 5 * 60 * 1000
  })

  if (loading) {
    return ''
  }

  if (error) {
    console.error('七牛云Token接口请求失败')
    refreshAsync()
    return ''
  }
  if (!data?.data) {
    console.error('七牛云token接口未返回数据')
    refreshAsync()
    return ''
  }
  const res = data.data
  if (res.code !== 10000) {
    message.error(`七牛云Token获取失败: ${res.msg}`)
    return ''
  }
  return res.info as string
}

/**
 * 上传素材
 */
export function useAddMaterial() {
  const ai = useAxiosInstance()
  return async function(params: AddMaterialData) {
    const res = await ai.post('/authority/material/addMaterial', params)
    return res.data
  }
}

interface AddMaterialData {
  fileList: {
    fileKey: string
    fileName: string
  }[]
  /** 素材分组编号，从素材分组下拉列表获取 */
  materialGroupNo?: string
  /** 素材类型 0:普通类型,1:证件类型,2:交易数据类型 */
  materialType: number
}

/**
 * 素材列表
 */
export function useGetMaterialList() {
  const ai = useAxiosInstance()
  const { data, loading, runAsync, refreshAsync } = useRequest(async params => {
    const res = await ai.get('/authority/material/getMaterialList', { params })
    return res.data?.info
  }, { manual: true })
  return {
    data,
    loading,
    runAsync,
    refreshAsync
  }
}

export interface Material {
  fileKey: string
  fileName: string
  fileUrl: string
  materialGroupNo: string
  mimeType: string | null
}

/**
 * 下载文件
 */
export function useDownloadFile() {
  const ai = useAxiosInstance()
  return async function(url: string) {
    const res = await ai.get(`/authority/material/download?url=${encodeURIComponent(url)}`, {
      responseType: 'blob'
    })
    const mimeType = res.headers['content-type']
    if (!mimeType) {
      throw new Error('未知文件类型')
    }
    if (mimeType === 'application/json') {
      throw new Error(res.data.msg)
    }
    const blob: Blob = res.data
    // 通过content-disposition获取文件名
    if (res.headers['content-disposition']) {
      const cd = contentDisposition.parse(res.headers['content-disposition'])
      const filename = cd.parameters.filename
      if (filename) {
        return new File([blob], filename, { type: mimeType })
      }
    }
    // 生成md5作为文件名，mime-db查询出拓展名
    const ext = mime.getExtension(mimeType)
    const filename = `${await md5(blob)}${ext ? `.${ext}` : ''}`
    return new File([blob], filename, { type: mimeType })
  }
}

/**
 * 创建素材分组
 */
export function useCreateGroup() {
  const ai = useAxiosInstance()
  return async function(params: CreateGroupData) {
    const res = await ai.post('/authority/material/saveGroup', params)
    const { data } = res
    if (data.code !== 10000) {
      message.error(data.msg)
      throw new Error(data.msg)
    }
    return res.data?.info
  }
}

interface CreateGroupData {
  groupName: string
}

/**
 * 删除分组
 */
export function useDeleteGroup() {
  const ai = useAxiosInstance()
  return async function(data: DeleteGroupData) {
    const res = await ai.post('/authority/material/removeGroup', data)
    const { code, msg } = res.data
    if (code !== 10000) {
      message.warn(msg)
      throw new Error(msg)
    }
    return res.data?.info
  }
}

interface DeleteGroupData {
  /** 素材分组编号 */
  groupNo: string
}


/**
 * 更新素材分组
 */
export function useUpdateGroup() {
  const ai = useAxiosInstance()
  return async function(params: UpdateGroupData) {
    const res = await ai.post('/authority/material/saveGroup', params)
    const { data } = res
    if (data.code !== 10000) {
      message.error(data.msg)
      throw new Error(data.msg)
    }
    return data.info
  }
}

interface UpdateGroupData {
  groupName: string,
  groupNo: string
}


/**
 * 删除素材
 */
export function useRemoveMaterial() {
  const ai = useAxiosInstance()
  return async function(data: string[]) {
    const res = await ai.post('/authority/material/removeMaterial', data)
    return res.data?.info
  }
}


/**
 * 移动素材到其它分组
 */
export function useMoveMaterial() {
  const ai = useAxiosInstance()
  return async function(data: MoveMaterialData) {
    const res = await ai.post('/authority/material/moveMaterial', data)
    return res.data?.info
  }
}

interface MoveMaterialData {
  fileKeyList: string[]
  materialGroupNo: string
}


/**
 * 保存压缩全局配置
 */
export function useSaveCompressionConfig() {
  const ai = useAxiosInstance()
  return async function(data: SaveCompressionConfigData) {
    const res = await ai.post('/authority/material/saveCompressionConfig', data)
    if (res.data) {
      if (res.data.code === 10000) {
        message.success('保存成功')
      } else {
        message.error(res.data.msg)
      }
    }
  }
}

interface SaveCompressionConfigData {
  config: any
  /** 是否开启压缩 0：开启压缩, 1：未开启 */
  enabled: number
}
