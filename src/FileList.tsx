import React, { FC } from 'react'
import { css, cx } from '@emotion/css'
import { VideoCameraOutlined } from '@ant-design/icons'

import Pagination from 'antd/lib/pagination'
import 'antd/lib/pagination/style'

interface Props {
  onClickItem: (item: FileSource) => void
  dataSource: FileSource[],
  selectedKeys: string[]
}

export interface FileSource {
  key: string,
  mediaType: 'image' | 'video' | 'audio' | 'other',
  url: string,
  filename: string,
  [ext: string]: any
}

const ImageList: FC<Props> = ({
  onClickItem,
  dataSource,
  selectedKeys
}) => {
  return (
    <div className={scrollContainer}>
      <div className={style}>
        {dataSource.map(file => (
          <div
            key={file.key}
            className={cx(fileStyle, { 'selected': selectedKeys.includes(file.key) })}
            onClick={() => onClickItem(file)}
          >
            <div className="preview">
              {file.mediaType === 'image' && <ImagePreview url={file.url} />}
              {file.mediaType === 'video' && <VideoPreview url={file.url} />}
            </div>
            <div className="info">
              <span>{file.filename}</span>
            </div>
          </div>
        ))}
      </div>
      <div className={paginationStyle}>
        <Pagination defaultCurrent={1} total={50} />
      </div>
    </div>
  )
}

const paginationStyle = css({
  marginTop: 10,
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center'
})

const scrollContainer = css({
  overflowY: 'scroll'
})

const style = css({
  flexGrow: 1,
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gridTemplateRows: 'min-content',
  gap: 10
})

const fileStyle = css({
  height: 160,
  display: 'grid',
  gridTemplateRows: 'auto 2em',
  cursor: 'pointer',
  boxSizing: 'border-box',
  padding: 3,
  '.preview': {
    marginBottom: 6,
    height: '100%'
  },
  '.info': {
    textAlign: 'center',
    color: '#000000d9',
    fontSize: '.9em',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis'
  },
  '&:hover': {
    padding: 2,
    border: '1px solid #dfdfdfd9'
  },
  '&.selected': {
    padding: 0,
    border: '3px solid green'
  }
})

interface PreviewProps {
  url: string
}

const ImagePreview: FC<PreviewProps> = ({ url }) => (
  <div
    className={css({
      height: 'inherit',
      backgroundImage: `url(${url})`,
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      backgroundSize: 'cover'
    })}
  />
)

const VideoPreview: FC<PreviewProps> = ({ url }) => (
  <div
    className={css({
      height: 'inherit',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#f7f7f7'
    })}
  >
    <VideoCameraOutlined style={{ fontSize: 50, color: '#9f9f9f' }} />
  </div>
)

function debounce(fn: Function, delay: number){
  let timer: number | null = null
  return function() {
      if(timer){
        clearTimeout(timer)
        timer = setTimeout(fn, delay) 
      }else{
        timer = setTimeout(fn, delay)
      }
  }
}

function throttle(fn: Function, delay: number){
  let ready = true
  return function() {
    if(!ready) return
    ready = false
    setTimeout(() => {
      fn()
      ready = true
    }, delay)
  }
}

export default ImageList
