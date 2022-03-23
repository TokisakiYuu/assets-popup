import { useRef, useContext, useEffect } from 'react'
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import Context from '../context'
import { useRequest } from 'ahooks'
import { Options as UseRequestOptions } from 'ahooks/lib/useRequest/src/types'
import { API_BASE } from './config'

export function createAxiosInstance(token: string) {
  return axios.create({
    baseURL: API_BASE,
    headers: { sdnxRequestId: token }
  })
}

export function useAxiosInstance() {
  const { token } = useContext(Context)
  const aiRef = useRef<AxiosInstance>(createAxiosInstance(token))

  useEffect(() => {
    aiRef.current = createAxiosInstance(token)
  }, [token])

  return aiRef.current
}

export function useTokenRequest<PostData = any, ResData = any>(config?: AxiosRequestConfig<PostData>, options?: UseRequestOptions<AxiosResponse<ResData, PostData>, any>) {
  const ai = useAxiosInstance()
  return useRequest((currentConfig: AxiosRequestConfig<PostData>) => {
    return ai.request<ResData>(currentConfig || config)
  }, options)
}
